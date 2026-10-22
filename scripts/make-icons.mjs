// Generate the extension's PNG icons from code so they are reproducible and
// need no binary assets in review. Draws a simple cookie glyph at each size
// required by the manifest. Run with: npm run icons
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SIZES = [16, 32, 48, 128];
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "icons");

const COOKIE = [0xc8, 0x89, 0x4b, 0xff];
const CHIP = [0x5a, 0x37, 0x1b, 0xff];
const EDGE = [0xa5, 0x6a, 0x33, 0xff];

// Chip centers as a fraction of the cookie radius from its center.
const CHIPS = [
  [-0.38, -0.22],
  [0.3, -0.36],
  [0.12, 0.28],
  [-0.28, 0.34],
  [0.42, 0.18],
];

// Coverage of a disc of radius r at distance d, with ~1px anti-aliased edge.
function coverage(d, r) {
  return Math.min(1, Math.max(0, r - d + 0.5));
}

function blend(base, over, alpha) {
  return [
    Math.round(over[0] * alpha + base[0] * (1 - alpha)),
    Math.round(over[1] * alpha + base[1] * (1 - alpha)),
    Math.round(over[2] * alpha + base[2] * (1 - alpha)),
    Math.max(base[3], Math.round(255 * alpha)),
  ];
}

function renderPixels(size) {
  const center = size / 2;
  const bodyR = size * 0.44;
  const chipR = Math.max(1, size * 0.07);
  const pixels = Buffer.alloc(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x + 0.5 - center;
      const dy = y + 0.5 - center;
      const d = Math.hypot(dx, dy);

      let rgba = [0, 0, 0, 0];
      const bodyCov = coverage(d, bodyR);
      if (bodyCov > 0) {
        // Darken a thin rim near the edge for a little depth.
        const base = d > bodyR - size * 0.06 ? EDGE : COOKIE;
        rgba = blend(rgba, base, bodyCov);

        for (const [fx, fy] of CHIPS) {
          const cd = Math.hypot(dx - fx * bodyR, dy - fy * bodyR);
          const chipCov = coverage(cd, chipR);
          if (chipCov > 0) rgba = blend(rgba, CHIP, chipCov);
        }
      }

      const i = (y * size + x) * 4;
      pixels[i] = rgba[0];
      pixels[i + 1] = rgba[1];
      pixels[i + 2] = rgba[2];
      pixels[i + 3] = rgba[3];
    }
  }
  return pixels;
}

// Minimal RGBA PNG encoder (filter 0 per scanline, zlib via node:zlib).
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuf, data]);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePng(size, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  // compression, filter, interlace already zero

  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // filter type None
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync(OUT_DIR, { recursive: true });
for (const size of SIZES) {
  const file = join(OUT_DIR, `icon${size}.png`);
  writeFileSync(file, encodePng(size, renderPixels(size)));
  console.log(`wrote ${file}`);
}
