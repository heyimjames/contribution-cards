"use client";

import { useEffect, useRef } from "react";
import { paint, type RenderInput } from "@/lib/render";

/** Preview and export share one renderer, so this canvas is the artwork itself. */
export function Preview({
  input,
  onSize,
}: {
  input: RenderInput;
  onSize: (size: { width: number; height: number }) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const size = paint(canvas, input, 2);
    canvas.style.width = `${size.width}px`;
    onSize(size);
  }, [input, onSize]);

  return (
    <canvas
      ref={ref}
      role="img"
      aria-label={`Contribution card for ${input.login}`}
      style={{ maxWidth: "100%", height: "auto" }}
    />
  );
}
