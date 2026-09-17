# Contribution Cards

Turn a GitHub contribution graph into a clean image you can post.

Type a username, pick a year, pick a look, download a PNG. No account, no key, no
tracking. Everything renders in the browser.

```sh
pnpm install
pnpm dev          # http://localhost:3000
```

## What it does

- **Any year.** Every year the account has existed, plus a rolling "last year".
- **All years stacked.** One poster of a whole GitHub history. Silent early years
  are dropped so the active ones stay large.
- **Eight themes**, from GitHub's own palettes to gradients that do not look like
  GitHub at all.
- **Six crops**, from a tight banner to a 9:16 story, plus a transparent option.
- **Download or copy** at 1×, 2× or 3×. The pixel size is shown before you export.

## How it works

`app/api/contributions` reads the public contributions fragment GitHub serves at
`/users/<login>/contributions`. It is plain HTML, needs no token, and carries a
`data-level` and a tooltip count for every day. Avatars are proxied through
`app/api/avatar` so the canvas stays same-origin and can still be exported.

`lib/render.ts` paints the card. The preview on screen and the exported file come
from that one function, so the preview is the artwork rather than an approximation
of it. Sizes derive from the card width, then the whole block is scaled by a single
factor if it would overflow a fixed-height format, which keeps proportions honest
at every aspect ratio.
