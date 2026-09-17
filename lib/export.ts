import { paint, type RenderInput } from "./render";

function offscreen(input: RenderInput, scale: number) {
  const canvas = document.createElement("canvas");
  const size = paint(canvas, input, scale);
  return { canvas, size };
}

function toBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode the image."))),
      "image/png",
    );
  });
}

export async function downloadPng(input: RenderInput, scale: number, filename: string) {
  const { canvas } = offscreen(input, scale);
  const blob = await toBlob(canvas);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Safari needs the Blob promise handed straight to ClipboardItem, inside the click. */
export async function copyPng(input: RenderInput, scale: number) {
  const { canvas } = offscreen(input, scale);
  const item = new ClipboardItem({ "image/png": toBlob(canvas) });
  await navigator.clipboard.write([item]);
}
