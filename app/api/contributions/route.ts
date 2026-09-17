import { NextResponse } from "next/server";
import { GitHubError, fetchProfile, fetchYear, normaliseLogin } from "@/lib/github";

export const revalidate = 900;

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const raw = params.get("user");
  const year = params.get("year") ?? "last";

  try {
    if (!raw) throw new GitHubError("Add a GitHub username.", 400);
    if (year !== "last" && !/^\d{4}$/.test(year)) {
      throw new GitHubError("Year must be four digits.", 400);
    }
    const login = normaliseLogin(raw);
    const [profile, data] = await Promise.all([fetchProfile(login), fetchYear(login, year)]);

    const now = new Date().getUTCFullYear();
    const years: string[] = ["last"];
    for (let y = now; y >= Math.min(profile.createdYear, now); y--) years.push(String(y));

    return NextResponse.json({
      profile: { login, name: profile.name, years },
      year: data,
    });
  } catch (err) {
    const status = err instanceof GitHubError ? err.status : 502;
    const message =
      err instanceof GitHubError ? err.message : "Could not reach GitHub. Try again.";
    return NextResponse.json({ error: message }, { status });
  }
}
