"use client";

import { useEffect, useRef, useState } from "react";
import { encodePng } from "./export";
import type { RenderInput } from "./render";

/** Long enough that dragging through themes does not encode a PNG per step. */
const SETTLE_MS = 320;

export type CardImage = {
  /** Inline data URL, used as the preview image's src. */
  src: string;
  /** Object URL, used by the download button. */
  download: string;
};

/**
 * One encode, two references to it.
 *
 * The preview image is served as a data URL rather than an object URL on
 * purpose. A `blob:` URL is a handle that only means anything inside the page
 * that created it, so when the operating system copies an image it can end up
 * putting that handle on the clipboard, and pasting yields a reference to
 * nothing. A data URL carries the bytes, so whatever the pasteboard chooses to
 * take is still the picture.
 *
 * The download keeps the object URL: it is a file transfer, where a handle is
 * exactly right and a megabyte of base64 in an href is not.
 */
export function useCardImage(input: RenderInput | null, scale: number) {
  const [image, setImage] = useState<CardImage | null>(null);
  const owned = useRef<string | null>(null);

  useEffect(() => {
    setImage(null);
    if (!input) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const blob = await encodePng(input, scale);
        if (cancelled) return;
        const src = await readAsDataUrl(blob);
        if (cancelled) return;
        const download = URL.createObjectURL(blob);
        if (owned.current) URL.revokeObjectURL(owned.current);
        owned.current = download;
        setImage({ src, download });
      } catch {
        /* The canvas preview stands on its own; only saving is affected. */
      }
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

  return image;
}

function readAsDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("Could not read the image."));
    reader.readAsDataURL(blob);
  });
}
