import type { Day, YearData } from "./types";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36";

export class GitHubError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.status = status;
  }
}

/** GitHub logins: 1-39 chars, alphanumeric or single hyphens, no leading/trailing hyphen. */
export function normaliseLogin(raw: string): string {
  const trimmed = raw
    .trim()
    .replace(/^https?:\/\/(www\.)?github\.com\//i, "")
    .replace(/^@/, "")
    .split(/[/?#]/)[0];
  if (!/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(trimmed)) {
    throw new GitHubError("That does not look like a GitHub username.", 400);
  }
  return trimmed;
}

/**
 * The contributions fragment is public HTML with no auth and no rate limit of
 * consequence. Each day is a <td data-date data-level id="contribution-day-component-{row}-{col}">
 * and the count lives in a sibling <tool-tip for="{id}"> as prose.
 */
export async function fetchYear(login: string, year: string): Promise<YearData> {
  const isLast = year === "last";
  const qs = isLast ? "" : `?from=${year}-01-01&to=${year}-12-31`;
  const res = await fetch(
    `https://github.com/users/${encodeURIComponent(login)}/contributions${qs}`,
    {
      headers: { "user-agent": UA, "x-requested-with": "XMLHttpRequest" },
      next: { revalidate: 900 },
    },
  );

  if (res.status === 404) throw new GitHubError(`No GitHub user called ${login}.`, 404);
  if (!res.ok) throw new GitHubError(`GitHub returned ${res.status}.`, 502);

  const html = await res.text();

  const counts = new Map<string, number>();
  const tip = /<tool-tip[^>]*\bfor="(contribution-day-component-[\d-]+)"[^>]*>([^<]*)<\/tool-tip>/g;
  for (const m of html.matchAll(tip)) {
    const text = m[2];
    const n = /^([\d,]+)\s+contribution/.exec(text);
    counts.set(m[1], n ? Number(n[1].replace(/,/g, "")) : 0);
  }

  const days: Day[] = [];
  const cell =
    /<td[^>]*\bdata-date="(\d{4}-\d{2}-\d{2})"[^>]*\bid="(contribution-day-component-(\d+)-(\d+))"[^>]*\bdata-level="(\d)"/g;
  for (const m of html.matchAll(cell)) {
    days.push({
      date: m[1],
      count: counts.get(m[2]) ?? 0,
      level: Number(m[5]) as Day["level"],
      row: Number(m[3]),
      col: Number(m[4]),
    });
  }

  if (days.length === 0) {
    throw new GitHubError("GitHub changed its markup; the calendar could not be read.", 502);
  }

  return {
    key: year,
    label: isLast ? "the last year" : year,
    total: days.reduce((sum, d) => sum + d.count, 0),
    cols: Math.max(...days.map((d) => d.col)) + 1,
    days,
  };
}

/** Display name and join year. Unauthenticated and rate limited, so failure is non-fatal. */
export async function fetchProfile(login: string) {
  try {
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(login)}`, {
      headers: { "user-agent": UA, accept: "application/vnd.github+json" },
      next: { revalidate: 3600 },
    });
    if (res.status === 404) throw new GitHubError(`No GitHub user called ${login}.`, 404);
    if (!res.ok) return { name: null, createdYear: 2008 };
    const json = (await res.json()) as { name?: string | null; created_at?: string };
    return {
      name: json.name ?? null,
      createdYear: json.created_at ? new Date(json.created_at).getUTCFullYear() : 2008,
    };
  } catch (err) {
    if (err instanceof GitHubError) throw err;
    return { name: null, createdYear: 2008 };
  }
}
