"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Preview } from "./preview";
import { canDownload, copyPng, encodePng, saveUrl } from "@/lib/export";
import { useCardImage } from "@/lib/use-card-image";
import { DEFAULT_OPTIONS, measure, type CardOptions, type RenderInput } from "@/lib/render";
import { zoneById, zonesFor } from "@/lib/safe-zones";
import { FORMATS, THEMES, formatById, themeById } from "@/lib/themes";
import type { Profile, YearData } from "@/lib/types";

/* ─────────────────────────────────────────────────────────
 * ENTRANCE STORYBOARD
 *
 *    0ms   card lifts in: opacity 0 → 1, scale 0.985 → 1, y +8 → 0
 *   80ms   panel: year
 *  160ms   panel: theme
 *  240ms   panel: format
 *  320ms   panel: safe area
 *  400ms   panel: include
 *  480ms   panel: cells
 *  560ms   panel: export
 *
 * One integer per group drives the whole sequence through the
 * `--i` custom property; the keyframes live in globals.css.
 * Staggering the panel after the card reads as the controls
 * belonging to it. It runs once, on the first card, and is
 * skipped entirely under prefers-reduced-motion.
 * ───────────────────────────────────────────────────────── */
const TIMING = {
  card: 0,
  groupStep: 80,
  lift: 420,
};

/** Stacking every year of a long-lived account would mean dozens of requests. */
const MAX_STACKED_YEARS = 10;

const TOGGLES: { key: keyof CardOptions; label: string }[] = [
  { key: "showAvatar", label: "Avatar" },
  { key: "showName", label: "Name" },
  { key: "showHandle", label: "Handle" },
  { key: "showHeadline", label: "Total" },
  { key: "showMonths", label: "Months" },
  { key: "showDays", label: "Days" },
  { key: "showLegend", label: "Legend" },
  { key: "showUrl", label: "URL" },
  { key: "transparent", label: "Transparent" },
];

const SHAPES: { key: CardOptions["shape"]; label: string }[] = [
  { key: "rounded", label: "Rounded" },
  { key: "square", label: "Square" },
  { key: "circle", label: "Dots" },
];

const SCALES = [1, 2, 3];

export function Studio() {
  const [query, setQuery] = useState("");
  const [login, setLogin] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [cache, setCache] = useState<Record<string, YearData>>({});
  const [selected, setSelected] = useState("last");
  const [avatar, setAvatar] = useState<HTMLImageElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [themeId, setThemeId] = useState("snow");
  const [formatId, setFormatId] = useState("tight");
  const [safeId, setSafeId] = useState<string | null>(null);
  const [scale, setScale] = useState(2);
  const [options, setOptions] = useState<CardOptions>(DEFAULT_OPTIONS);
  const [size, setSize] = useState({ width: 0, height: 0, p3: false });

  const request = useRef(0);

  const fetchYear = useCallback(async (user: string, year: string): Promise<YearData> => {
    const res = await fetch(`/api/contributions?user=${encodeURIComponent(user)}&year=${year}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Could not reach GitHub.");
    setProfile(json.profile as Profile);
    const data = json.year as YearData;
    setCache((prev) => ({ ...prev, [`${json.profile.login}:${year}`]: data }));
    return data;
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const user = query.trim();
    if (!user || busy) return;
    const ticket = ++request.current;
    setBusy(true);
    setError(null);
    try {
      const data = await fetchYear(user, "last");
      if (ticket !== request.current) return;
      const clean = user.replace(/^https?:\/\/(www\.)?github\.com\//i, "").replace(/^@/, "");
      setLogin(clean);
      setSelected("last");
      setCache((prev) => ({ ...prev, [`${clean}:last`]: data }));
      loadAvatar(clean);
    } catch (err) {
      if (ticket === request.current) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
        setLogin(null);
      }
    } finally {
      if (ticket === request.current) setBusy(false);
    }
  }

  function loadAvatar(user: string) {
    setAvatar(null);
    const img = new Image();
    img.src = `/api/avatar?user=${encodeURIComponent(user)}`;
    img.decode().then(() => setAvatar(img)).catch(() => setAvatar(null));
  }

  const stackedKeys = useMemo(
    () => (profile?.years ?? []).filter((y) => y !== "last").slice(0, MAX_STACKED_YEARS),
    [profile],
  );

  async function choose(key: string) {
    if (!login) return;
    setSelected(key);
    const wanted = key === "all" ? stackedKeys : [key];
    const missing = wanted.filter((y) => !cache[`${login}:${y}`]);
    if (missing.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      await Promise.all(missing.map((y) => fetchYear(login, y)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const years = useMemo(() => {
    if (!login) return [];
    const keys = selected === "all" ? stackedKeys : [selected];
    const loaded = keys.map((k) => cache[`${login}:${k}`]).filter(Boolean) as YearData[];
    /* A stack of empty grids from dormant early years shrinks every other year
     * to nothing, so silent years are dropped once past the recent three. */
    return selected === "all" ? loaded.filter((year, i) => i < 3 || year.total > 0) : loaded;
  }, [login, selected, stackedKeys, cache]);

  const format = formatById(formatId);
  const zones = useMemo(() => zonesFor(format.aspect), [format.aspect]);
  const name = profile?.name ?? null;

  /* A zone belongs to one aspect ratio, so changing format drops a stale one. */
  useEffect(() => {
    if (safeId && !zones.some((z) => z.id === safeId)) setSafeId(null);
  }, [safeId, zones]);

  const safe = useMemo(
    () => (safeId && zones.some((z) => z.id === safeId) ? zoneById(safeId) : null),
    [safeId, zones],
  );

  /* Memoised: Preview repaints on identity change, so a fresh object every
   * render would repaint (and re-measure) in a loop. */
  const input: RenderInput | null = useMemo(
    () =>
      login && years.length
        ? {
            years,
            login,
            name,
            avatar,
            theme: themeById(themeId),
            options,
            width: format.width,
            height: format.height,
            safe,
          }
        : null,
    [login, years, name, avatar, themeId, options, format.width, format.height, safe],
  );

  /* Bail out when the measurement is unchanged, so the repaint cycle ends. */
  const handleSize = useCallback((next: { width: number; height: number; p3: boolean }) => {
    setSize((prev) =>
      prev.width === next.width && prev.height === next.height && prev.p3 === next.p3
        ? prev
        : next,
    );
  }, []);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(id);
  }, [copied]);

  /* Measured, not reported back from the canvas, so the stage takes the right
   * shape on the first frame instead of flashing the previous format's. */
  const aspect = input ? `${input.width} / ${measure(input).height}` : undefined;

  /* The same PNG the download writes, so a press and hold saves the real file. */
  const imageUrl = useCardImage(input, scale);

  const filename = `${login ?? "github"}-${selected}-${themeId}.png`;

  async function onDownload() {
    if (!input) return;
    try {
      /* Reuse the encoded card when it is ready; only encode again if it is not. */
      if (imageUrl) {
        saveUrl(imageUrl, filename);
        return;
      }
      const blob = await encodePng(input, scale);
      const url = URL.createObjectURL(blob);
      saveUrl(url, filename);
      /* Long enough for the transfer to start; revoking at once aborts it. */
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      setError("Could not build the image. Press and hold the preview to save it.");
    }
  }

  async function onCopy() {
    if (!input) return;
    try {
      await copyPng(input, scale);
      setCopied(true);
    } catch {
      setError("This browser would not take the image. Download it instead.");
    }
  }

  const toggle = (key: keyof CardOptions) =>
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <main className="wrap" id="main">
      <header className="masthead">
        <h1>Contribution Cards</h1>
        <p>A GitHub year, cropped and ready to post.</p>
      </header>

      <form className="search" onSubmit={submit}>
        <div className="field">
          <span aria-hidden="true">github.com/</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="username"
            aria-label="GitHub username"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="go"
          />
        </div>
        <button className="btn btn-primary" type="submit" disabled={busy || !query.trim()}>
          {busy ? <Spinner /> : <BoltIcon />}
          {busy ? "Reading" : "Make card"}
        </button>
      </form>

      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid">
        <section
          className="stage"
          data-checker={options.transparent}
          data-empty={!input}
          key={login ?? "empty"}
          style={aspect ? { ["--card-aspect" as string]: aspect } : undefined}
        >
          {input ? (
            <div className="enter" style={{ ["--i" as string]: TIMING.card }}>
              <Preview input={input} imageUrl={imageUrl} onSize={handleSize} />
            </div>
          ) : (
            <div className="empty">
              <strong>Nothing loaded yet</strong>
              <span>
                Type a GitHub username above. Every year that account has been active becomes a
                card you can style and save.
              </span>
            </div>
          )}
        </section>

        {input ? (
          <div className="panel">
            <Group title="Year" index={1}>
              <div className="chips">
                {(profile?.years ?? []).map((year) => (
                  <button
                    key={year}
                    className="chip"
                    type="button"
                    aria-pressed={selected === year}
                    onClick={() => choose(year)}
                  >
                    {year === "last" ? "Last year" : year}
                  </button>
                ))}
                {stackedKeys.length > 1 ? (
                  <button
                    className="chip"
                    type="button"
                    aria-pressed={selected === "all"}
                    onClick={() => choose("all")}
                  >
                    All years
                  </button>
                ) : null}
              </div>
            </Group>

            <Group title="Theme" index={2}>
              <div className="swatches">
                {THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    className="swatch"
                    type="button"
                    aria-pressed={themeId === theme.id}
                    onClick={() => setThemeId(theme.id)}
                    title={theme.name}
                  >
                    <div className="swatch-bar" style={{ background: theme.bg[theme.bg.length - 1] }}>
                      {theme.levels.slice(1).map((level) => (
                        <i key={level} style={{ background: level }} />
                      ))}
                    </div>
                    <span>{theme.name}</span>
                  </button>
                ))}
              </div>
            </Group>

            <Group title="Format" index={3}>
              <div className="chips">
                {FORMATS.map((f) => (
                  <button
                    key={f.id}
                    className="chip"
                    type="button"
                    aria-pressed={formatId === f.id}
                    onClick={() => setFormatId(f.id)}
                    title={f.hint}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </Group>

            <Group title="Safe area" index={4}>
              {zones.length ? (
                <>
                  <div className="chips">
                    <button
                      className="chip"
                      type="button"
                      aria-pressed={safeId === null}
                      onClick={() => setSafeId(null)}
                    >
                      Off
                    </button>
                    {zones.map((zone) => (
                      <button
                        key={zone.id}
                        className="chip"
                        type="button"
                        aria-pressed={safeId === zone.id}
                        onClick={() => setSafeId(zone.id)}
                      >
                        {zone.name}
                      </button>
                    ))}
                  </div>
                  <p className="note">
                    {safe
                      ? `${safe.note ?? "Content is held inside the guide."} ${
                          safe.official ? "Published by the platform." : "An estimated buffer."
                        }${safe.notch ? " The hatched column is drawn, not avoided." : ""}`
                      : "Keeps captions and buttons from covering the card."}
                  </p>
                </>
              ) : (
                <p className="note">Pick a fixed format to use a platform safe area.</p>
              )}
            </Group>

            <Group title="Include" index={5}>
              <div className="chips">
                {TOGGLES.map((t) => (
                  <button
                    key={t.key}
                    className="chip"
                    type="button"
                    aria-pressed={Boolean(options[t.key])}
                    onClick={() => toggle(t.key)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </Group>

            <Group title="Cells" index={6}>
              <div className="chips">
                {SHAPES.map((s) => (
                  <button
                    key={s.key}
                    className="chip"
                    type="button"
                    aria-pressed={options.shape === s.key}
                    onClick={() => setOptions((prev) => ({ ...prev, shape: s.key }))}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </Group>

            <Group title="Corners" index={7}>
              <div className="slider">
                <input
                  type="range"
                  min={0}
                  max={160}
                  step={4}
                  value={options.cornerRadius}
                  onChange={(e) =>
                    setOptions((prev) => ({ ...prev, cornerRadius: Number(e.target.value) }))
                  }
                  aria-label="Corner radius"
                />
                <output>
                  {options.cornerRadius
                    ? `${Math.round(options.cornerRadius * scale)} px`
                    : "Square"}
                </output>
              </div>
              <p className="note">
                Rounded corners are cut into the file, so it sits on any background.
              </p>
            </Group>

            <Group title="Export" index={8} className="export">
              <div className="chips">
                {SCALES.map((s) => (
                  <button
                    key={s}
                    className="chip"
                    type="button"
                    aria-pressed={scale === s}
                    onClick={() => setScale(s)}
                  >
                    {s}&times;
                  </button>
                ))}
              </div>
              <div className="actions">
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={onDownload}
                  disabled={!canDownload()}
                >
                  <DownloadIcon />
                  Download PNG
                </button>
                <button className="btn" type="button" onClick={onCopy}>
                  {copied ? <CheckIcon /> : <CopyIcon />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="note">
                {size.width
                  ? `${Math.round(size.width * scale)} × ${Math.round(size.height * scale)} px${
                      size.p3 ? " · Display P3" : ""
                    }`
                  : " "}
              </p>
              <p className="note hold-hint">
                Or press and hold the preview to save it.
              </p>
            </Group>
          </div>
        ) : null}
      </div>
    </main>
  );
}

function Group({
  title,
  index,
  className,
  children,
}: {
  title: string;
  index: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`group enter${className ? ` ${className}` : ""}`}
      style={{ ["--i" as string]: index }}
    >
      <h2>{title}</h2>
      {children}
    </section>
  );
}

/* Icons: one stroke weight, currentColor, 1.75px beside 500-weight labels. */
const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const BoltIcon = () => (
  <svg {...iconProps}>
    <path d="M13 2 4.5 13.5H11l-.5 8.5L19 10.5h-6.5z" />
  </svg>
);

const DownloadIcon = () => (
  <svg {...iconProps}>
    <path d="M12 3v12m0 0 4.5-4.5M12 15l-4.5-4.5M3.5 17v2a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-2" />
  </svg>
);

const CopyIcon = () => (
  <svg {...iconProps}>
    <rect x="9" y="9" width="12" height="12" rx="2.5" />
    <path d="M15 5.5A2.5 2.5 0 0 0 12.5 3h-7A2.5 2.5 0 0 0 3 5.5v7A2.5 2.5 0 0 0 5.5 15" />
  </svg>
);

const CheckIcon = () => (
  <svg {...iconProps}>
    <path d="m4.5 12.5 5 5 10-11" />
  </svg>
);

const Spinner = () => (
  <svg {...iconProps} className="spin">
    <path d="M12 3a9 9 0 1 0 9 9" />
  </svg>
);
