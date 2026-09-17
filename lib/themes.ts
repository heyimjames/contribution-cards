export type Theme = {
  id: string;
  name: string;
  /** one stop = flat fill, two = 135deg linear gradient */
  bg: [string] | [string, string];
  text: string;
  muted: string;
  levels: [string, string, string, string, string];
  dark: boolean;
};

export const THEMES: Theme[] = [
  {
    id: "snow",
    name: "Snow",
    bg: ["#ffffff"],
    text: "#1f2328",
    muted: "#59636e",
    levels: ["#ebedf0", "#aceebb", "#4ac26b", "#2da44e", "#116329"],
    dark: false,
  },
  {
    id: "carbon",
    name: "Carbon",
    bg: ["#0d1117"],
    text: "#f0f6fc",
    muted: "#9198a1",
    levels: ["#151b23", "#033a16", "#196c2e", "#2ea043", "#56d364"],
    dark: true,
  },
  {
    id: "moss",
    name: "Moss",
    bg: ["#fbfaf5", "#eff0e4"],
    text: "#24291f",
    muted: "#6b7063",
    levels: ["#e4e4d7", "#c9dcb4", "#8fbc72", "#54913f", "#2c5c26"],
    dark: false,
  },
  {
    id: "dusk",
    name: "Dusk",
    bg: ["#14142b", "#241a40"],
    text: "#f4f2ff",
    muted: "#a29dc4",
    levels: ["#241f45", "#3b3a8f", "#5a63d8", "#8b8cff", "#c7c2ff"],
    dark: true,
  },
  {
    id: "ember",
    name: "Ember",
    bg: ["#14100e", "#2a1511"],
    text: "#fff4ec",
    muted: "#b39a8c",
    levels: ["#241b17", "#5c2a12", "#963d12", "#d96a1f", "#ffb057"],
    dark: true,
  },
  {
    id: "tide",
    name: "Tide",
    bg: ["#05192e", "#072f4a"],
    text: "#eaf6ff",
    muted: "#8fb1c9",
    levels: ["#0d2b45", "#0b4f6c", "#0f7f9e", "#2bb3c9", "#7fe3ea"],
    dark: true,
  },
  {
    id: "ink",
    name: "Ink",
    bg: ["#f7f7f5"],
    text: "#111111",
    muted: "#6e6e6e",
    levels: ["#e5e5e2", "#c2c2bd", "#8f8f8a", "#565653", "#111111"],
    dark: false,
  },
  {
    id: "sherbet",
    name: "Sherbet",
    bg: ["#fff1f2", "#ffe6d2"],
    text: "#45161f",
    muted: "#9c6a6a",
    levels: ["#fadde0", "#ffc2c9", "#ff97a6", "#f2617f", "#c02b52"],
    dark: false,
  },
];

export const themeById = (id: string) => THEMES.find((t) => t.id === id) ?? THEMES[0];

export type Format = {
  id: string;
  name: string;
  hint: string;
  width: number;
  /** null = height follows the content */
  height: number | null;
};

export const FORMATS: Format[] = [
  { id: "tight", name: "Tight", hint: "Crops to the graph", width: 1600, height: null },
  { id: "og", name: "Wide", hint: "1200 × 630", width: 1200, height: 630 },
  { id: "x", name: "16:9", hint: "1600 × 900", width: 1600, height: 900 },
  { id: "square", name: "Square", hint: "1080 × 1080", width: 1080, height: 1080 },
  { id: "portrait", name: "Portrait", hint: "1080 × 1350", width: 1080, height: 1350 },
  { id: "story", name: "Story", hint: "1080 × 1920", width: 1080, height: 1920 },
];

export const formatById = (id: string) => FORMATS.find((f) => f.id === id) ?? FORMATS[0];
