import { paint, type RenderInput } from "./render";

/* ─────────────────────────────────────────────────────────
 * EXPORT
 *
 * One PNG serves three jobs: the image shown over the preview
 * (so a press and hold can save it), the file the download
 * button writes, and the bitmap the clipboard takes. Encoding
 * it once means the download never has to re-render, and the
 * object URL has a single owner, so nothing gets revoked out
 * from under a transfer that is still running.
 * ───────────────────────────────────────────────────────── */

export function encodePng(input: RenderInput, scale: number): Promise<Blob> {
  const canvas = document.createElement("canvas");
  paint(canvas, input, scale);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      /* Release the backing store: a 3x story card holds tens of megabytes. */
      canvas.width = 0;
      canvas.height = 0;
      if (blob) resolve(blob);
      else reject(new Error("Could not encode the image."));
    }, "image/png");
  });
}

/**
 * Firefox ignores a click on an anchor that is not in the document, and Safari
 * treats a detached one inconsistently: often navigating to the blob instead of
 * saving it, which throws the whole page away. Putting it in the document, then
 * taking it out again, is what makes this reliable everywhere.
 */
export function saveUrl(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export const canDownload = () =>
  typeof document !== "undefined" && "download" in document.createElement("a");

export async function copyPng(input: RenderInput, scale: number) {
  /* Safari needs the Blob promise handed straight to ClipboardItem. */
  const item = new ClipboardItem({ "image/png": encodePng(input, scale) });
  await navigator.clipboard.write([item]);
}
