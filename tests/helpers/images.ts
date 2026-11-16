/** A tiny valid PNG (1×1) and helpers for file-input tests. */
export const PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "base64",
);

export const pngFile = (name = "HW3-Sandip-test.png") => ({ name, mimeType: "image/png", buffer: PNG_1X1 });

/** A "PNG" bigger than the 3 MB limit (content doesn't matter; the size check runs first). */
export const bigPngFile = () => ({ name: "too-big.png", mimeType: "image/png", buffer: Buffer.alloc(3 * 1024 * 1024 + 1) });

export const textFile = () => ({ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("not an image") });
