# CLAUDE.md

Guidance for Claude Code working in this repository.

## What this is

Contribution Cards: a small single-page tool that turns a GitHub contribution
graph into an exportable image. No database, no auth, no analytics, no cookies,
no third-party scripts. Two route handlers and a canvas renderer.

## Commands

```sh
pnpm install
pnpm dev            # http://localhost:3000
pnpm build          # production build; also runs the TypeScript check
pnpm typecheck      # tsc --noEmit
```

There is no test suite and no linter. Rely on `typecheck`, `build`, and visual
verification with the `agent-browser` CLI against a running dev server.

## Architecture

**Next.js 16 App Router, React 19, TypeScript. No UI library, no CSS framework,
no motion library.** The whole interface is one stylesheet of OKLCH tokens and
one client component.

- `lib/github.ts` — scrapes the public contributions fragment. Each day is a
  `<td data-date data-level id="contribution-day-component-{row}-{col}">`, where
  row is the weekday (0 = Sunday) and col is the week. Counts come from the
  sibling `<tool-tip>` prose, so totals are summed rather than read from a header.
  If GitHub changes this markup, that is the one file to fix.
- `lib/render.ts` — the canvas renderer, and the only place card pixels are
  decided. Carries a layout storyboard comment at the top. Every size derives
  from the card width; a single uniform scale factor handles fixed-height
  formats, so proportions hold from a tight banner to a 9:16 story.
- `lib/themes.ts` — themes and crop presets, as data. Add to the arrays. Colour is
  OKLCH; a theme may carry `levelsP3` and `bgP3` used only when the canvas context
  really is display-p3. The two GitHub palettes deliberately have no P3 variant,
  because matching GitHub exactly is the point of them.
- `lib/safe-zones.ts` — platform safe areas from the AdKit set dated 10 September
  2026, stored as fractions of the card so they hold at any size. Each is tagged
  with the aspect ratio it belongs to; changing format drops a zone from another.
- `lib/export.ts` — offscreen render, `toBlob`, download or clipboard.
- `components/studio.tsx` — all state. `components/preview.tsx` — the canvas.

## Constraints that shape every edit

- **One renderer.** The preview and the export must come from `draw()` in
  `lib/render.ts`. Never add a second drawing path such as DOM-to-image, or the
  preview stops being the artwork and starts lying about it.
- **The preview image is a data URL, the download is a blob URL.** A `blob:`
  handle means nothing outside the page that made it, so an operating-system
  copy of the image can put that handle on the clipboard and paste a reference
  to nothing. The displayed image therefore carries its bytes inline. Do not
  "optimise" it back to an object URL.
- **The avatar must stay same-origin.** It is proxied through `/api/avatar`
  because a cross-origin image taints the canvas and silently breaks `toBlob`.
  Never draw an image straight from `avatars.githubusercontent.com`.
- **The preview shows the real corners.** `cardRadius()` is the single source
  for both the exported clip and the preview frame's CSS radius. Never give the
  frame a decorative radius the file does not have.
- **The empty state is a real card.** `lib/sample.ts` feeds the same renderer, so
  the first real card changes an object that is already on screen instead of
  replacing a paragraph. Do not put the card behind a conditional that unmounts
  it; a torn-down and re-entered card reads as the page reloading.
- **Guides are never exported.** The safe-area overlay is painted on a second
  canvas above the card in the preview. It must not enter `draw()`.
- **Safe-area insets are rectangular.** A notch is drawn, not subtracted. Do not
  try to flow the card around one; it is a single centred block.
- **Memoise the render input.** `Preview` repaints on identity change, so a
  fresh input object every render loops forever. The size callback bails out on
  unchanged values for the same reason.
- **No token, no key, no storage.** Everything needed is public. Keep it that way.
- **System fonts only.** Canvas text and page text use the same stack, so
  exports match the preview without loading a font.
- **British English**, sentence case, no exclamation marks. "1 contribution",
  not "1 contributions".
- **Quality bar**: no horizontal overflow at 320px, text contrast at least
  4.5:1 in both colour schemes, keyboard-complete, motion behind
  `prefers-reduced-motion`. Measure contrast in the browser rather than judging
  it by eye; computed colours come back as `oklch()`, so convert through a
  canvas pixel before calculating a ratio.
