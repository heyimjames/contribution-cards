"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cardRadius, drawGuides, measure, paint, type RenderInput } from "@/lib/render";

/* ─────────────────────────────────────────────────────────
 * PREVIEW SIZING
 *
 * The stage is a fixed box, so the preview never jumps when
 * the format changes. The card is fitted inside it the way
 * `object-fit: contain` would: scaled down to whichever of
 * width or height runs out first, and never scaled up past
 * its true size.
 *
 * The backing store is then painted at exactly the pixels the
 * screen will use, display size times device pixel ratio, so
 * a 1080 × 1920 story costs the same memory on screen as a
 * banner instead of thirty megabytes of it.
 * ───────────────────────────────────────────────────────── */

type Size = { w: number; h: number };

/** Contain: shrink to whichever of width or height runs out first, never grow. */
const fitOf = (box: Size, cardW: number, cardH: number) =>
  box.w > 0 && box.h > 0 ? Math.min(box.w / cardW, box.h / cardH, 1) : 0;

export function Preview({
  input,
  imageUrl,
}: {
  input: RenderInput;
  /** The encoded card, once ready. An <img> is what a press and hold can save. */
  imageUrl: string | null;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLCanvasElement>(null);
  const guideRef = useRef<HTMLCanvasElement>(null);
  const [box, setBox] = useState<Size>({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setBox((prev) =>
        Math.abs(prev.w - width) < 0.5 && Math.abs(prev.h - height) < 0.5
          ? prev
          : { w: width, h: height },
      );
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const cardHeight = measure(input).height;
  /* The preview shows the real corners, at the scale the card is displayed. */
  const radius = cardRadius(input) * fitOf(box, input.width, cardHeight);
  const fit = fitOf(box, input.width, cardHeight);
  const displayW = input.width * fit;
  const displayH = cardHeight * fit;

  useEffect(() => {
    const canvas = cardRef.current;
    if (!canvas || fit <= 0) return;
    const dpr = window.devicePixelRatio || 1;
    paint(canvas, input, fit * dpr);
    canvas.style.width = `${displayW}px`;
    canvas.style.height = `${displayH}px`;

    const guide = guideRef.current;
    if (!guide) return;
    guide.width = Math.max(1, Math.round(displayW * dpr));
    guide.height = Math.max(1, Math.round(displayH * dpr));
    guide.style.width = `${displayW}px`;
    guide.style.height = `${displayH}px`;
    const ctx = guide.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (input.safe)
      drawGuides(ctx, input.safe, displayW, displayH, dpr, input.theme.dark, radius);
    else ctx.clearRect(0, 0, displayW, displayH);
  }, [input, fit, displayW, displayH, radius]);

  return (
    <div className="fitter" ref={boxRef}>
      <div
        className="frame"
        data-flat={input.options.transparent}
        role="img"
        aria-label={`Contribution card for ${input.login}`}
        style={
          fit > 0
            ? { width: displayW, height: displayH, borderRadius: `${radius}px` }
            : undefined
        }
      >
        <canvas ref={cardRef} aria-hidden="true" />
        {imageUrl ? <img className="saveable" src={imageUrl} alt="" /> : null}
        <canvas ref={guideRef} className="guide" aria-hidden="true" />
      </div>
    </div>
  );
}
