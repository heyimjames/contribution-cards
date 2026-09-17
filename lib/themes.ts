/* ─────────────────────────────────────────────────────────
 * THEMES
 *
 * Colour is authored in OKLCH, and the card canvas is
 * requested in display-p3. Where a theme is our own design,
 * a second palette raises chroma past the sRGB gamut so the
 * exported PNG carries the wider colour; the browser maps it
 * back down on an sRGB display. The two palettes that copy
 * GitHub's own greens are deliberately left at their exact
 * sRGB values, because matching GitHub is the point of them.
 * ───────────────────────────────────────────────────────── */

export type Levels = [string, string, string, string, string];

export type Theme = {
  id: string;
  name: string;
  /** one stop = flat fill, two = 135deg linear gradient */
  bg: [string] | [string, string];
  text: string;
  muted: string;
  levels: Levels;
  /** used when the canvas is display-p3; omit to keep sRGB values */
  levelsP3?: Levels;
  bgP3?: [string] | [string, string];
  dark: boolean;
};

export const THEMES: Theme[] = [
  {
    id: "snow",
    name: "Snow",
    bg: ["oklch(1 0 0)"],
    text: "oklch(0.2542 0.0111 254.04)",
    muted: "oklch(0.4951 0.0215 250.78)",
    levels: [
      "oklch(0.9454 0.0046 258.32)",
      "oklch(0.8915 0.0964 151.11)",
      "oklch(0.7257 0.1643 149.45)",
      "oklch(0.6343 0.1620 148.39)",
      "oklch(0.4391 0.1179 148.07)",
    ],
    dark: false,
  },
  {
    id: "carbon",
    name: "Carbon",
    bg: ["oklch(0.1763 0.0140 258.36)"],
    text: "oklch(0.9703 0.0103 247.93)",
    muted: "oklch(0.6769 0.0155 254.64)",
    levels: [
      "oklch(0.2198 0.0182 255.71)",
      "oklch(0.3054 0.0826 149.34)",
      "oklch(0.4681 0.1231 147.60)",
      "oklch(0.6222 0.1661 146.22)",
      "oklch(0.7717 0.1880 145.48)",
    ],
    dark: true,
  },
  {
    id: "moss",
    name: "Moss",
    bg: ["oklch(0.9845 0.0067 97.35)", "oklch(0.9511 0.0159 110.56)"],
    text: "oklch(0.2725 0.0193 129.28)",
    muted: "oklch(0.5369 0.0207 124.27)",
    levels: [
      "oklch(0.9153 0.0174 106.74)",
      "oklch(0.8698 0.0575 128.27)",
      "oklch(0.7450 0.1119 133.94)",
      "oklch(0.5960 0.1318 138.36)",
      "oklch(0.4271 0.0989 141.53)",
    ],
    levelsP3: [
      "oklch(0.9153 0.0174 106.74)",
      "oklch(0.8698 0.0730 128.27)",
      "oklch(0.7450 0.1420 133.94)",
      "oklch(0.5960 0.1670 138.36)",
      "oklch(0.4271 0.1250 141.53)",
    ],
    dark: false,
  },
  {
    id: "dusk",
    name: "Dusk",
    bg: ["oklch(0.2049 0.0451 281.67)", "oklch(0.2522 0.0695 292.86)"],
    bgP3: ["oklch(0.2049 0.0530 281.67)", "oklch(0.2522 0.0820 292.86)"],
    text: "oklch(0.9664 0.0174 293.14)",
    muted: "oklch(0.7136 0.0565 290.77)",
    levels: [
      "oklch(0.2669 0.0688 286.80)",
      "oklch(0.4009 0.1369 278.78)",
      "oklch(0.5556 0.1768 275.72)",
      "oklch(0.6912 0.1660 280.76)",
      "oklch(0.8390 0.0848 288.18)",
    ],
    levelsP3: [
      "oklch(0.2669 0.0810 286.80)",
      "oklch(0.4009 0.1680 278.78)",
      "oklch(0.5556 0.2180 275.72)",
      "oklch(0.6912 0.2020 280.76)",
      "oklch(0.8390 0.1040 288.18)",
    ],
    dark: true,
  },
  {
    id: "ember",
    name: "Ember",
    bg: ["oklch(0.1772 0.0079 48.26)", "oklch(0.2241 0.0356 31.59)"],
    bgP3: ["oklch(0.1772 0.0092 48.26)", "oklch(0.2241 0.0420 31.59)"],
    text: "oklch(0.9736 0.0160 58.64)",
    muted: "oklch(0.7046 0.0359 51.06)",
    levels: [
      "oklch(0.2316 0.0162 45.23)",
      "oklch(0.3492 0.0814 44.35)",
      "oklch(0.4753 0.1307 42.49)",
      "oklch(0.6460 0.1608 48.96)",
      "oklch(0.8169 0.1391 66.78)",
    ],
    levelsP3: [
      "oklch(0.2316 0.0190 45.23)",
      "oklch(0.3492 0.0990 44.35)",
      "oklch(0.4753 0.1610 42.49)",
      "oklch(0.6460 0.1990 48.96)",
      "oklch(0.8169 0.1730 66.78)",
    ],
    dark: true,
  },
  {
    id: "tide",
    name: "Tide",
    bg: ["oklch(0.2099 0.0495 251.40)", "oklch(0.2938 0.0650 243.72)"],
    bgP3: ["oklch(0.2099 0.0580 251.40)", "oklch(0.2938 0.0770 243.72)"],
    text: "oklch(0.9668 0.0176 239.99)",
    muted: "oklch(0.7435 0.0508 239.12)",
    levels: [
      "oklch(0.2813 0.0597 248.00)",
      "oklch(0.4032 0.0787 233.20)",
      "oklch(0.5548 0.1006 223.53)",
      "oklch(0.7069 0.1138 211.40)",
      "oklch(0.8575 0.0944 201.45)",
    ],
    levelsP3: [
      "oklch(0.2813 0.0700 248.00)",
      "oklch(0.4032 0.0960 233.20)",
      "oklch(0.5548 0.1250 223.53)",
      "oklch(0.7069 0.1420 211.40)",
      "oklch(0.8575 0.1180 201.45)",
    ],
    dark: true,
  },
  {
    id: "ink",
    name: "Ink",
    bg: ["oklch(0.9756 0.0026 106.45)"],
    text: "oklch(0.1776 0 0)",
    muted: "oklch(0.5382 0 0)",
    levels: [
      "oklch(0.9211 0.0040 106.48)",
      "oklch(0.8126 0.0069 106.55)",
      "oklch(0.6485 0.0073 106.60)",
      "oklch(0.4522 0.0048 106.59)",
      "oklch(0.1776 0 0)",
    ],
    dark: false,
  },
  {
    id: "sherbet",
    name: "Sherbet",
    bg: ["oklch(0.9694 0.0152 12.42)", "oklch(0.9400 0.0382 61.00)"],
    bgP3: ["oklch(0.9694 0.0180 12.42)", "oklch(0.9400 0.0460 61.00)"],
    text: "oklch(0.2778 0.0726 11.48)",
    muted: "oklch(0.5766 0.0644 19.22)",
    levels: [
      "oklch(0.9222 0.0323 10.64)",
      "oklch(0.8708 0.0705 10.96)",
      "oklch(0.7884 0.1254 11.07)",
      "oklch(0.6843 0.1791 10.51)",
      "oklch(0.5372 0.1845 11.37)",
    ],
    levelsP3: [
      "oklch(0.9222 0.0390 10.64)",
      "oklch(0.8708 0.0870 10.96)",
      "oklch(0.7884 0.1560 11.07)",
      "oklch(0.6843 0.2240 10.51)",
      "oklch(0.5372 0.2310 11.37)",
    ],
    dark: false,
  },
];

export const themeById = (id: string) => THEMES.find((t) => t.id === id) ?? THEMES[0];

/** Which safe-zone bucket a format's aspect ratio belongs to. */
export type Aspect = "square" | "portrait" | "story" | "landscape" | "wide" | "free";

export type Format = {
  id: string;
  name: string;
  hint: string;
  width: number;
  /** null = height follows the content */
  height: number | null;
  aspect: Aspect;
};

export const FORMATS: Format[] = [
  { id: "tight", name: "Tight", hint: "Crops to the graph", width: 1600, height: null, aspect: "free" },
  { id: "og", name: "Wide", hint: "1200 × 630", width: 1200, height: 630, aspect: "wide" },
  { id: "x", name: "16:9", hint: "1600 × 900", width: 1600, height: 900, aspect: "landscape" },
  { id: "square", name: "Square", hint: "1080 × 1080", width: 1080, height: 1080, aspect: "square" },
  { id: "portrait", name: "Portrait", hint: "1080 × 1350", width: 1080, height: 1350, aspect: "portrait" },
  { id: "story", name: "Story", hint: "1080 × 1920", width: 1080, height: 1920, aspect: "story" },
];

export const formatById = (id: string) => FORMATS.find((f) => f.id === id) ?? FORMATS[0];
