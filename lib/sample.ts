import type { Day, YearData } from "./types";

/* ─────────────────────────────────────────────────────────
 * SAMPLE CARD
 *
 * The empty state is a real card, not a paragraph telling you
 * what one would look like. It is built from the same shape of
 * data and drawn by the same renderer, so the skeleton matches
 * the thing it stands in for, and typing a username changes
 * the card's contents rather than replacing one kind of
 * content with another.
 *
 * Seeded, so it is the same card on every visit. It is clearly
 * labelled an example and carries no real person's name.
 * ───────────────────────────────────────────────────────── */

export const SAMPLE_LOGIN = "your-username";

/** Deterministic, so the example never flickers between reloads. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function sampleYear(year = new Date().getUTCFullYear()): YearData {
  const random = mulberry32(20260918);
  const days: Day[] = [];
  /* 52 whole weeks from the first Sunday of January: real dates, running January
   * to December, so the month labels read the way a real year's do. */
  const cols = 52;
  const start = new Date(Date.UTC(year, 0, 1));
  start.setUTCDate(start.getUTCDate() + ((7 - start.getUTCDay()) % 7));

  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < 7; row++) {
      /* Busier through the middle of the year, quieter at the weekend: a shape
       * a developer recognises, rather than even static. */
      const season = 0.35 + 0.65 * Math.sin((col / cols) * Math.PI);
      const weekday = row === 0 || row === 6 ? 0.4 : 1;
      const roll = random() * season * weekday;
      const level = roll > 0.62 ? 4 : roll > 0.46 ? 3 : roll > 0.3 ? 2 : roll > 0.14 ? 1 : 0;
      const date = new Date(start);
      date.setUTCDate(start.getUTCDate() + col * 7 + row);
      days.push({
        date: date.toISOString().slice(0, 10),
        count: level === 0 ? 0 : level * 3 + Math.floor(random() * 5),
        level: level as Day["level"],
        col,
        row,
      });
    }
  }

  return {
    key: "sample",
    label: String(year),
    total: days.reduce((sum, d) => sum + d.count, 0),
    cols,
    days,
  };
}
