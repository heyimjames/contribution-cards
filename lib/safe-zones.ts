import type { Aspect } from "./themes";

/* ─────────────────────────────────────────────────────────
 * SAFE ZONES
 *
 * From the AdKit safe-zone set dated 10 September 2026. Each
 * platform publishes its reserves in pixels at one canvas
 * size, so every inset here is stored as a fraction: left and
 * right of the card width, top and bottom of its height. That
 * way a 1080 × 1920 guide still holds on a 1600-wide card.
 *
 * Insets are rectangular. The action column that TikTok and
 * Reels place over the lower right is a notch: it is drawn on
 * the guide but not subtracted from the layout, because the
 * card is one centred block and an L-shaped content box would
 * mean pretending it could flow around the gap.
 *
 * Statuses are the publishers' own. "Official" means the
 * platform published the measurement; "buffer" means AdKit
 * estimated it. Always check a real ad preview before paying
 * for placement.
 * ───────────────────────────────────────────────────────── */

export type Notch = {
  side: "left" | "right";
  /** fraction of card width */
  width: number;
  /** fraction of card height where the notch starts */
  top: number;
};

export type SafeZone = {
  id: string;
  name: string;
  aspect: Aspect;
  top: number;
  bottom: number;
  left: number;
  right: number;
  notch?: Notch;
  official: boolean;
  note?: string;
};

export const SAFE_ZONES: SafeZone[] = [
  /* 1:1 — 1080 × 1080 */
  { id: "sq-universal", name: "Universal", aspect: "square", top: 0.1, bottom: 0.1, left: 0.1, right: 0.1, official: false, note: "Meta, LinkedIn, X and Reddit feeds combined." },
  { id: "sq-meta", name: "Meta", aspect: "square", top: 0.1, bottom: 0.1, left: 0.1, right: 0.1, official: false },
  { id: "sq-linkedin", name: "LinkedIn", aspect: "square", top: 0.074074, bottom: 0.074074, left: 0.074074, right: 0.074074, official: false },
  { id: "sq-x", name: "X", aspect: "square", top: 0.074074, bottom: 0.074074, left: 0.074074, right: 0.074074, official: false },
  { id: "sq-reddit", name: "Reddit", aspect: "square", top: 0.074074, bottom: 0.074074, left: 0.074074, right: 0.074074, official: false },

  /* 4:5 — 1080 × 1350 */
  { id: "pt-universal", name: "Universal", aspect: "portrait", top: 0.1, bottom: 0.1, left: 0.1, right: 0.1, official: false, note: "Meta, LinkedIn, X and Reddit feeds combined." },
  { id: "pt-meta", name: "Meta", aspect: "portrait", top: 0.1, bottom: 0.1, left: 0.1, right: 0.1, official: false },
  { id: "pt-linkedin", name: "LinkedIn", aspect: "portrait", top: 0.059259, bottom: 0.059259, left: 0.074074, right: 0.074074, official: false },
  { id: "pt-x", name: "X", aspect: "portrait", top: 0.059259, bottom: 0.059259, left: 0.074074, right: 0.074074, official: false },
  { id: "pt-reddit", name: "Reddit", aspect: "portrait", top: 0.059259, bottom: 0.059259, left: 0.074074, right: 0.074074, official: false },

  /* 16:9 — 1080 × 608 */
  { id: "ls-universal", name: "Universal", aspect: "landscape", top: 0.100707, bottom: 0.100707, left: 0.074074, right: 0.074074, official: false, note: "Meta, LinkedIn, X and Reddit feeds combined." },
  { id: "ls-meta", name: "Meta", aspect: "landscape", top: 0.100707, bottom: 0.100707, left: 0.074074, right: 0.074074, official: false },
  { id: "ls-linkedin", name: "LinkedIn", aspect: "landscape", top: 0.065789, bottom: 0.065789, left: 0.041667, right: 0.041667, official: false },
  { id: "ls-x", name: "X", aspect: "landscape", top: 0.065789, bottom: 0.065789, left: 0.041667, right: 0.041667, official: false },
  { id: "ls-reddit", name: "Reddit", aspect: "landscape", top: 0.065789, bottom: 0.065789, left: 0.041667, right: 0.041667, official: false },

  /* 1.91:1 — 1080 × 565 */
  { id: "wd-linkedin", name: "LinkedIn", aspect: "wide", top: 0.079646, bottom: 0.079646, left: 0.041667, right: 0.041667, official: false },

  /* 9:16 — 1080 × 1920 */
  { id: "st-universal", name: "Universal", aspect: "story", top: 0.15, bottom: 0.528125, left: 0.111111, right: 0.177778, official: false, note: "Every vertical guide below, overlapped. Safe everywhere, and very tight." },
  { id: "st-ig-story", name: "IG / FB Stories", aspect: "story", top: 0.14, bottom: 0.35, left: 0.06, right: 0.06, official: true, note: "Image placements. Facebook Stories video reserves less at the bottom." },
  { id: "st-reels", name: "Reels", aspect: "story", top: 0.14, bottom: 0.35, left: 0.06, right: 0.06, notch: { side: "right", width: 0.21, top: 0.6 }, official: true, note: "Keep the whole lower 40% clear for disclaimers." },
  { id: "st-tiktok", name: "TikTok", aspect: "story", top: 0.125, bottom: 0.34375, left: 0.111111, right: 0.111111, notch: { side: "right", width: 0.277778, top: 0.4375 }, official: true, note: "Standard in-feed, left to right. The anchor template reserves far more." },
  { id: "st-tiktok-anchor", name: "TikTok anchor", aspect: "story", top: 0.13125, bottom: 0.528125, left: 0.111111, right: 0.111111, notch: { side: "right", width: 0.222222, top: 0.1875 }, official: true, note: "Up to four caption lines." },
  { id: "st-shorts", name: "YouTube Shorts", aspect: "story", top: 0.15, bottom: 0.35, left: 0.044444, right: 0.177778, official: true },
  { id: "st-snapchat", name: "Snapchat", aspect: "story", top: 0.078125, bottom: 0.171875, left: 0.055556, right: 0.055556, official: true, note: "Snap publishes the top and bottom; the sides are an estimate." },
  { id: "st-linkedin", name: "LinkedIn", aspect: "story", top: 0.041667, bottom: 0.041667, left: 0.074074, right: 0.074074, official: false },
  { id: "st-x", name: "X", aspect: "story", top: 0.041667, bottom: 0.234375, left: 0.074074, right: 0.074074, official: false },
];

export const zonesFor = (aspect: Aspect) =>
  aspect === "free" ? [] : SAFE_ZONES.filter((z) => z.aspect === aspect);

export const zoneById = (id: string | null) =>
  id ? SAFE_ZONES.find((z) => z.id === id) ?? null : null;
