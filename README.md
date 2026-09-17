# Contribution Cards

Turn a GitHub contribution graph into a clean image you can post.

**[contribution-cards.vercel.app](https://contribution-cards.vercel.app)**

![The app, showing a contribution card and the panel of themes, crops and toggles](docs/screenshot.png)

Type a username, pick a year, pick a look, download a PNG. No account, no API key,
no tracking, no cookies. Nothing is stored.

## What it does

- **Any year.** Every year the account has existed, plus a rolling "last year".
- **All years stacked.** One poster of a whole GitHub history. Silent early years
  are dropped so the active ones stay large.
- **Eight themes**, from GitHub's own palettes to gradients that look nothing like
  GitHub.
- **Six crops**: tight banner, wide, 16:9, square, portrait and 9:16 story, plus a
  transparent background option that bleeds edge to edge on the tight crop.
- **Platform safe areas.** Pick Instagram, Reels, TikTok, Shorts, Snapchat, Meta,
  LinkedIn, X or Reddit and the card is held inside that platform's reserved
  margins, with the reserve dimmed in the preview and left out of the export.
- **Display P3 colour.** Every palette is authored in OKLCH, and the themes we
  designed carry a wider second palette used when the canvas supports it.
- **Download or copy** at 1×, 2× or 3×. The pixel size is shown before you export.

## Run it locally

```sh
pnpm install
pnpm dev          # http://localhost:3000
```

Next.js 16, React 19 and TypeScript. No UI library, no CSS framework, no motion
library, no API token.

## How it works

`app/api/contributions` reads the public contributions fragment GitHub serves at
`/users/<login>/contributions`. It is plain HTML that needs no token and carries a
`data-level` and a tooltip count for every day. Avatars are proxied through
`app/api/avatar` so the canvas stays same-origin and can still be exported: a
cross-origin image taints the canvas and silently breaks `toBlob`.

Safe-area figures come from the AdKit set dated 10 September 2026 and are stored
as fractions of the card, so a guide published at 1080 × 1920 still holds on a
1600-wide card. Where a platform publishes the reserve it is marked as official;
the rest are estimates. The action column TikTok and Reels place over the lower
right is drawn on the guide but not subtracted from the layout, because the card
is one centred block and cannot flow around a gap.

`lib/render.ts` paints the card. The preview on screen and the exported file come
from that one function, so the preview is the artwork rather than an approximation
of it. Every size derives from the card width, then the whole block is scaled by a
single factor if it would overflow a fixed-height format, which keeps proportions
honest at every aspect ratio.

## Two things worth knowing

- It depends on GitHub's calendar markup. If GitHub changes it, `lib/github.ts` is
  the one file to fix.
- Display names and join years come from the unauthenticated GitHub API, which is
  rate limited by IP. If that call fails the card still renders, falling back to the
  username and a wider list of years.

## Licence

MIT. See [LICENSE](LICENSE).
