"use client";

import { useEffect, useRef, useState } from "react";
import { encodePng } from "./export";
import type { RenderInput } from "./render";

/** Long enough that dragging through themes does not encode a PNG per step. */
const SETTLE_MS = 320;

/**
 * Encodes the card to a PNG once the controls settle, and hands back an object
 * URL that both the preview image and the download button use. Returns null
 * while it is out of date, so a stale picture is never shown over a fresh card.
 */
export function useCardImage(input: RenderInput | null, scale: number) {
  const [url, setUrl] = useState<string | null>(null);
  const owned = useRef<string | null>(null);

  useEffect(() => {
    setUrl(null);
    if (!input) return;

    let cancelled = false;
    const timer = setTimeout(() => {
      encodePng(input, scale)
        .then((blob) => {
          if (cancelled) return;
          const next = URL.createObjectURL(blob);
          if (owned.current) URL.revokeObjectURL(owned.current);
          owned.current = next;
          setUrl(next);
        })
        .catch(() => {
          /* The canvas preview stands on its own; only saving is affected. */
        });
    }, SETTLE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [input, scale]);

  useEffect(
    () => () => {
      if (owned.current) URL.revokeObjectURL(owned.current);
    },
    [],
  );

  return url;
}
