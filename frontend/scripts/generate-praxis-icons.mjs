import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const publicFile = (name) => fileURLToPath(new URL(`public/${name}`, root));

// Use the actual P from the Praxis wordmark. A full-width wordmark becomes
// illegible in a 16px browser tab, while this keeps its original metal/green art.
const letter = await sharp(publicFile("images/praxis_new_logo.png"))
  .extract({ left: 0, top: 180, width: 450, height: 500 })
  .composite([{
    input: Buffer.from('<svg width="450" height="500"><path fill="white" d="M0 0H402V62L429 100 417 220 402 256 351 280 250 290 223 500H0Z"/></svg>'),
    blend: "dest-in",
  }])
  .png()
  .toBuffer();

const cropped = await sharp(letter).trim().resize(438, 458, { fit: "inside" }).png().toBuffer();
const badge = await sharp({ create: { width: 512, height: 512, channels: 4, background: "#030807" } })
  .composite([{ input: cropped, gravity: "centre" }])
  .png()
  .toBuffer();

const sizes = [16, 32, 48, 64, 180, 192, 256, 512];
const images = new Map();
for (const size of sizes) {
  const png = await sharp(badge).resize(size, size).sharpen({ sigma: 0.5 }).png().toBuffer();
  images.set(size, png);
  if ([16, 32, 192, 512].includes(size)) await writeFile(publicFile(`praxis-icon-v4-${size}.png`), png);
}
await writeFile(publicFile("praxis-apple-v4.png"), images.get(180));
await writeFile(publicFile("praxis-icon.png"), images.get(256));

// Modern ICO files can embed PNG images. Include every common tab resolution.
const icoSizes = [16, 32, 48, 64];
const directory = Buffer.alloc(6 + 16 * icoSizes.length);
directory.writeUInt16LE(1, 2);
directory.writeUInt16LE(icoSizes.length, 4);
let offset = directory.length;
icoSizes.forEach((size, index) => {
  const entry = 6 + index * 16;
  const png = images.get(size);
  directory[entry] = size;
  directory[entry + 1] = size;
  directory.writeUInt16LE(1, entry + 4);
  directory.writeUInt16LE(32, entry + 6);
  directory.writeUInt32LE(png.length, entry + 8);
  directory.writeUInt32LE(offset, entry + 12);
  offset += png.length;
});
const ico = Buffer.concat([directory, ...icoSizes.map((size) => images.get(size))]);
await writeFile(fileURLToPath(new URL("app/favicon.ico", root)), ico);
await writeFile(publicFile("favicon.ico"), ico);
await writeFile(publicFile("favicon.svg"), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><image width="256" height="256" href="data:image/png;base64,${images.get(256).toString("base64")}"/></svg>\n`);
console.log("Generated Praxis tab icons (16–64px), touch icon (180px), and app icons (192/512px).");
