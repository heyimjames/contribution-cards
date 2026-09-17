import type { Levels, Theme } from "./themes";
import type { SafeZone } from "./safe-zones";
import type { YearData } from "./types";

/* ─────────────────────────────────────────────────────────
 * CARD LAYOUT
 *
 * One renderer paints both the on-screen preview and the
 * exported file, so the preview is the artwork, not an
 * approximation of it.
 *
 *   ┌ inset ──────────────────────────────────┐
 *   │ header      avatar · name · @handle     │
 *   │ headline    "6,073 contributions in..." │
 *   │ year block  [year] · months · grid      │
 *   │             (repeats when stacked)      │
 *   │ footer      github.com/login · legend   │
 *   └─────────────────────────────────────────┘
 *
 * The inset is the card's own padding, or a platform's safe
 * area when one is chosen, whichever is larger. Sizes derive
 * from the content box width; if the block would overflow a
 * fixed-height format, one scale factor shrinks all of it and
 * it re-centres. Proportions therefore hold at any aspect
 * ratio, from a tight banner to a 9:16 story.
 *
 * Colour is OKLCH throughout. When the canvas context is
 * display-p3, themes that carry a wider palette use it.
 * ───────────────────────────────────────────────────────── */

const FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const WEEKDAYS = ["", "Mon", "", "Wed", "", "Fri", ""];
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export type CardOptions = {
  showAvatar: boolean;
  showName: boolean;
  showHandle: boolean;
  showHeadline: boolean;
  showMonths: boolean;
  showDays: boolean;
  showLegend: boolean;
  showUrl: boolean;
  transparent: boolean;
  shape: "rounded" | "square" | "circle";
};

export const DEFAULT_OPTIONS: CardOptions = {
  showAvatar: true,
  showName: true,
  showHandle: true,
  showHeadline: true,
  showMonths: true,
  showDays: true,
  showLegend: true,
  showUrl: true,
  transparent: false,
  shape: "rounded",
};

export type RenderInput = {
  years: YearData[];
  login: string;
  name: string | null;
  avatar: HTMLImageElement | null;
  theme: Theme;
  options: CardOptions;
  width: number;
  /** null = height follows the content */
  height: number | null;
  safe: SafeZone | null;
  /** set by paint() from the real context colour space */
  p3?: boolean;
};

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);
const nf = new Intl.NumberFormat("en-GB");
const plural = (n: number) => (n === 1 ? "contribution" : "contributions");

const levelsOf = (theme: Theme, p3: boolean | undefined): Levels =>
  p3 && theme.levelsP3 ? theme.levelsP3 : theme.levels;

const bgOf = (theme: Theme, p3: boolean | undefined) =>
  p3 && theme.bgP3 ? theme.bgP3 : theme.bg;

/**
 * The content box: the card's own padding, widened to a platform safe area
 * where one is set. A transparent card with no fixed height bleeds to the edge,
 * so it drops onto any background as just the graph.
 */
function contentBox(input: RenderInput) {
  const { width: W, height: H, options: o, safe } = input;
  const bleed = o.transparent && H === null;
  const pad = bleed ? 0 : clamp(W * 0.058, 24, 88);

  const top = safe && H ? Math.max(pad, safe.top * H) : pad;
  const bottom = safe && H ? Math.max(pad, safe.bottom * H) : pad;
  const left = safe ? Math.max(pad, safe.left * W) : pad;
  const right = safe ? Math.max(pad, safe.right * W) : pad;

  return { top, bottom, left, right, w: W - left - right, h: H === null ? null : H - top - bottom };
}

function sizes(input: RenderInput, s: number, boxW: number) {
  const { width: W, options: o, years } = input;
  const multi = years.length > 1;
  const cols = Math.max(...years.map((y) => y.cols));

  const small = clamp(W * 0.0195, 9.5, 20) * s;
  const nameSize = clamp(W * 0.027, 13, 30) * s;
  const handleSize = nameSize * 0.85;
  const headline = clamp(W * 0.046, 21, 56) * s;
  const yearLabel = clamp(W * 0.03, 14, 34) * s;
  const avatar = o.showAvatar ? nameSize * 2.4 : 0;
  const rhythm = clamp(W * 0.058, 24, 88) * s;

  const dayLabelW = o.showDays ? small * 2.6 : 0;
  const blockW = boxW * s;
  const gridW = blockW - dayLabelW;
  const cellTotal = gridW / cols;
  const cell = cellTotal * 0.845;
  const gap = cellTotal - cell;

  return {
    s, multi, cols, small, nameSize, handleSize, headline, yearLabel, avatar,
    dayLabelW, gridW, cellTotal, cell, gap, blockW,
    headerH: o.showAvatar || o.showName ? Math.max(avatar, nameSize * 1.24 + handleSize * 1.3) : 0,
    headlineH: o.showHeadline ? headline * 1.1 : 0,
    monthsH: o.showMonths ? small * 1.85 : 0,
    yearLabelH: multi ? yearLabel * 1.35 : 0,
    gridH: cell * 7 + gap * 6,
    footerH: o.showLegend || o.showUrl ? small * 1.4 : 0,
    gapHeader: rhythm * 0.46,
    gapHeadline: rhythm * 0.62,
    gapYears: rhythm * 0.62,
    gapFooter: rhythm * 0.58,
  };
}

type Sizes = ReturnType<typeof sizes>;

function contentHeight(z: Sizes, years: number) {
  let h = 0;
  if (z.headerH) h += z.headerH + z.gapHeader;
  if (z.headlineH) h += z.headlineH + z.gapHeadline;
  for (let i = 0; i < years; i++) {
    if (i > 0) h += z.gapYears;
    h += z.yearLabelH;
    if (i === 0) h += z.monthsH;
    h += z.gridH;
  }
  if (z.footerH) h += z.gapFooter + z.footerH;
  return h;
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  if (r <= 0.3) ctx.rect(x, y, w, h);
  else ctx.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2));
}

function setFont(ctx: CanvasRenderingContext2D, weight: number, size: number, tracking = 0) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  if ("letterSpacing" in ctx) {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${tracking}px`;
  }
}

/** Month labels sit at the column where a new month's first cell appears. */
function monthTicks(year: YearData) {
  const firstOfCol = new Map<number, string>();
  for (const d of year.days) {
    const cur = firstOfCol.get(d.col);
    if (!cur || d.date < cur) firstOfCol.set(d.col, d.date);
  }
  const ticks: { col: number; name: string }[] = [];
  let lastMonth = -1;
  let lastCol = -99;
  for (let c = 0; c < year.cols; c++) {
    const date = firstOfCol.get(c);
    if (!date) continue;
    const month = Number(date.slice(5, 7)) - 1;
    if (month !== lastMonth) {
      if (c - lastCol >= 3) {
        ticks.push({ col: c, name: MONTHS[month] });
        lastCol = c;
      }
      lastMonth = month;
    }
  }
  return ticks;
}

export function measure(input: RenderInput) {
  const box = contentBox(input);
  let z = sizes(input, 1, box.w);
  let total = contentHeight(z, input.years.length);

  if (box.h !== null && total > box.h) {
    const k = box.h / total;
    z = sizes(input, k, box.w);
    total = contentHeight(z, input.years.length);
    if (total > box.h) {
      z = sizes(input, k * 0.97, box.w);
      total = contentHeight(z, input.years.length);
    }
  }

  const height = input.height ?? Math.round(total + box.top + box.bottom);
  return { z, box, total, height };
}

export function draw(ctx: CanvasRenderingContext2D, input: RenderInput) {
  const { z, box, total, height } = measure(input);
  const { theme: t, options: o, width: W, p3 } = input;
  const levels = levelsOf(t, p3);

  ctx.clearRect(0, 0, W, height);

  if (!o.transparent) {
    const stops = bgOf(t, p3);
    if (stops.length === 2) {
      const g = ctx.createLinearGradient(0, 0, W, height);
      g.addColorStop(0, stops[0]);
      g.addColorStop(1, stops[1]);
      ctx.fillStyle = g;
    } else {
      ctx.fillStyle = stops[0];
    }
    ctx.fillRect(0, 0, W, height);
  }

  const x0 = box.left + (box.w - z.blockW) / 2;
  const boxH = box.h ?? total;
  let y = box.top + Math.max(0, (boxH - total) / 2);
  const gridX = x0 + z.dayLabelW;
  const gridRight = gridX + z.gridW;
  const hairline = t.dark ? "oklch(1 0 0 / 0.12)" : "oklch(0 0 0 / 0.1)";

  ctx.textBaseline = "top";

  /* header — avatar, name, handle */
  if (z.headerH) {
    let tx = x0;
    if (o.showAvatar && input.avatar) {
      const a = z.avatar;
      const cy = y + (z.headerH - a) / 2;
      ctx.save();
      ctx.beginPath();
      ctx.arc(tx + a / 2, cy + a / 2, a / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(input.avatar, tx, cy, a, a);
      ctx.restore();
      ctx.beginPath();
      ctx.arc(tx + a / 2, cy + a / 2, a / 2 - 0.5 * z.s, 0, Math.PI * 2);
      ctx.strokeStyle = hairline;
      ctx.lineWidth = Math.max(1, z.s);
      ctx.stroke();
      tx += a + z.nameSize * 0.62;
    }
    if (o.showName) {
      const display = input.name?.trim() || input.login;
      const twoLine = o.showHandle && display.toLowerCase() !== input.login.toLowerCase();
      const blockH = twoLine ? z.nameSize * 1.22 + z.handleSize * 1.28 : z.nameSize * 1.22;
      let ty = y + (z.headerH - blockH) / 2;
      setFont(ctx, 600, z.nameSize, z.nameSize * -0.008);
      ctx.fillStyle = t.text;
      ctx.fillText(display, tx, ty);
      if (twoLine) {
        ty += z.nameSize * 1.22;
        setFont(ctx, 400, z.handleSize);
        ctx.fillStyle = t.muted;
        ctx.fillText(`@${input.login}`, tx, ty);
      }
    }
    y += z.headerH + z.gapHeader;
  }

  /* headline */
  if (z.headlineH) {
    const sum = input.years.reduce((n, yr) => n + yr.total, 0);
    const earliest = input.years[input.years.length - 1].label;
    const label = z.multi
      ? `${nf.format(sum)} ${plural(sum)} since ${earliest}`
      : `${nf.format(input.years[0].total)} ${plural(input.years[0].total)} in ${input.years[0].label}`;
    setFont(ctx, 600, z.headline, z.headline * -0.018);
    ctx.fillStyle = t.text;
    ctx.fillText(label, x0, y);
    y += z.headlineH + z.gapHeadline;
  }

  /* year blocks */
  input.years.forEach((year, index) => {
    if (index > 0) y += z.gapYears;

    if (z.multi) {
      setFont(ctx, 600, z.yearLabel, z.yearLabel * -0.012);
      ctx.fillStyle = t.text;
      ctx.fillText(year.label, x0, y + (z.yearLabelH - z.yearLabel * 1.2) / 2);
      setFont(ctx, 400, z.small);
      ctx.fillStyle = t.muted;
      ctx.textAlign = "right";
      ctx.fillText(
        `${nf.format(year.total)} ${plural(year.total)}`,
        gridRight,
        y + (z.yearLabelH - z.small * 1.15) / 2,
      );
      ctx.textAlign = "left";
      y += z.yearLabelH;
    }

    if (index === 0 && z.monthsH) {
      setFont(ctx, 400, z.small);
      ctx.fillStyle = t.muted;
      for (const tick of monthTicks(year)) {
        ctx.fillText(tick.name, gridX + tick.col * z.cellTotal, y);
      }
      y += z.monthsH;
    }

    if (o.showDays) {
      setFont(ctx, 400, z.small);
      ctx.fillStyle = t.muted;
      ctx.textAlign = "right";
      for (let r = 0; r < 7; r++) {
        if (!WEEKDAYS[r]) continue;
        ctx.fillText(
          WEEKDAYS[r],
          gridX - z.gap * 1.6,
          y + r * z.cellTotal + (z.cell - z.small * 1.05) / 2,
        );
      }
      ctx.textAlign = "left";
    }

    const radius =
      o.shape === "square" ? 0 : o.shape === "circle" ? z.cell / 2 : Math.max(1, z.cell * 0.235);
    for (const d of year.days) {
      ctx.beginPath();
      roundedRect(ctx, gridX + d.col * z.cellTotal, y + d.row * z.cellTotal, z.cell, z.cell, radius);
      ctx.fillStyle = levels[d.level];
      ctx.fill();
      if (d.level === 0 && !t.dark) {
        ctx.strokeStyle = "oklch(0 0 0 / 0.035)";
        ctx.lineWidth = Math.max(0.5, z.s * 0.6);
        ctx.stroke();
      }
    }
    y += z.gridH;
  });

  /* footer — url on the left, legend on the right */
  if (z.footerH) {
    y += z.gapFooter;
    const mid = y + z.footerH / 2;
    ctx.textBaseline = "middle";
    if (o.showUrl) {
      setFont(ctx, 400, z.small);
      ctx.fillStyle = t.muted;
      ctx.fillText(`github.com/${input.login}`, x0, mid);
    }
    if (o.showLegend) {
      const c = z.small * 0.92;
      const g = c * 0.42;
      const radius = o.shape === "square" ? 0 : o.shape === "circle" ? c / 2 : Math.max(1, c * 0.235);
      setFont(ctx, 400, z.small);
      ctx.fillStyle = t.muted;
      ctx.textAlign = "right";
      let lx = gridRight;
      ctx.fillText("More", lx, mid);
      lx -= ctx.measureText("More").width + g * 1.8;
      for (let i = 4; i >= 0; i--) {
        ctx.beginPath();
        roundedRect(ctx, lx - c, mid - c / 2, c, c, radius);
        ctx.fillStyle = levels[i];
        ctx.fill();
        lx -= c + g;
      }
      lx -= g * 0.8;
      ctx.fillStyle = t.muted;
      ctx.fillText("Less", lx, mid);
      ctx.textAlign = "left";
    }
    ctx.textBaseline = "top";
  }

  return { width: W, height };
}

/**
 * The safe-area guide. Drawn on its own canvas above the card in the preview,
 * never into the export: it is a instruction to the designer, not part of the art.
 */
export function drawGuides(
  ctx: CanvasRenderingContext2D,
  zone: SafeZone,
  width: number,
  height: number,
  scale: number,
  onDark: boolean,
) {
  const top = zone.top * height;
  const bottom = zone.bottom * height;
  const left = zone.left * width;
  const right = zone.right * width;

  ctx.clearRect(0, 0, width, height);
  /* A neutral scrim dims what the platform will cover, without staining the
   * artwork a colour it does not have. The boundary carries the warning. */
  ctx.fillStyle = onDark ? "oklch(1 0 0 / 0.14)" : "oklch(0 0 0 / 0.14)";
  ctx.fillRect(0, 0, width, top);
  ctx.fillRect(0, height - bottom, width, bottom);
  ctx.fillRect(0, top, left, height - top - bottom);
  ctx.fillRect(width - right, top, right, height - top - bottom);

  if (zone.notch) {
    const nw = zone.notch.width * width;
    const ny = zone.notch.top * height;
    const nx = zone.notch.side === "right" ? width - right - nw : left;
    ctx.fillRect(nx, ny, nw, height - bottom - ny);
    ctx.save();
    ctx.setLineDash([6 / scale, 5 / scale]);
    ctx.strokeStyle = "oklch(0.62 0.24 18 / 0.8)";
    ctx.lineWidth = Math.max(1, 1.5 / scale);
    ctx.strokeRect(nx, ny, nw, height - bottom - ny);
    ctx.restore();
  }

  ctx.setLineDash([7 / scale, 5 / scale]);
  ctx.strokeStyle = "oklch(0.62 0.24 18 / 0.9)";
  ctx.lineWidth = Math.max(1, 1.5 / scale);
  ctx.strokeRect(left, top, width - left - right, height - top - bottom);
  ctx.setLineDash([]);
}

/** Paints into a canvas at `scale` device pixels per CSS pixel. */
export function paint(canvas: HTMLCanvasElement, input: RenderInput, scale: number) {
  const { height } = measure(input);
  canvas.width = Math.max(1, Math.round(input.width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));

  let ctx = canvas.getContext("2d", {
    colorSpace: "display-p3",
  } as CanvasRenderingContext2DSettings);
  if (!ctx) ctx = canvas.getContext("2d");
  if (!ctx) return { width: input.width, height, p3: false };

  const p3 = ctx.getContextAttributes?.().colorSpace === "display-p3";
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  draw(ctx, { ...input, p3 });
  return { width: input.width, height, p3 };
}
