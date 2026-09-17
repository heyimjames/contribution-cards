import { GitHubError, normaliseLogin } from "@/lib/github";

export const revalidate = 3600;

/**
 * Proxied so the canvas stays same-origin and untainted: a cross-origin avatar
 * drawn straight from avatars.githubusercontent.com would block toBlob().
 */
export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("user");
  try {
    if (!raw) throw new GitHubError("Add a GitHub username.", 400);
    const login = normaliseLogin(raw);
    const res = await fetch(`https://github.com/${login}.png?size=280`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return new Response(null, { status: 404 });
    return new Response(res.body, {
      headers: {
        "content-type": res.headers.get("content-type") ?? "image/png",
        "cache-control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch {
    return new Response(null, { status: 400 });
  }
}
