// Genera los íconos PWA sin dependencias externas (no hay rasterizador en el
// sistema). Dibuja un cuadrado redondeado con gradiente de marca + una "F"
// blanca y codifica un PNG RGBA a mano. Ejecutar: node scripts/generate-icons.mjs
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dir, "..", "public", "icons");
mkdirSync(OUT, { recursive: true });

const A = [0x6a, 0xa6, 0xff]; // #6aa6ff
const B = [0x7c, 0x83, 0xff]; // #7c83ff

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function roundedInside(x, y, S, r) {
  // ¿pixel dentro de un cuadrado redondeado de lado S y radio r?
  const cx = Math.min(Math.max(x, r), S - r);
  const cy = Math.min(Math.max(y, r), S - r);
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

function isF(x, y, S) {
  const u = x / S;
  const v = y / S;
  const stem = u >= 0.36 && u <= 0.46 && v >= 0.3 && v <= 0.72;
  const top = u >= 0.36 && u <= 0.66 && v >= 0.3 && v <= 0.4;
  const mid = u >= 0.36 && u <= 0.6 && v >= 0.48 && v <= 0.57;
  return stem || top || mid;
}

function render(S) {
  const r = Math.round(S * 0.22);
  const raw = Buffer.alloc(S * (S * 4 + 1));
  let p = 0;
  for (let y = 0; y < S; y++) {
    raw[p++] = 0; // filtro de scanline = 0
    for (let x = 0; x < S; x++) {
      const inside = roundedInside(x, y, S, r);
      if (!inside) {
        raw[p++] = 0;
        raw[p++] = 0;
        raw[p++] = 0;
        raw[p++] = 0; // transparente fuera del cuadrado
        continue;
      }
      if (isF(x, y, S)) {
        raw[p++] = 255;
        raw[p++] = 255;
        raw[p++] = 255;
        raw[p++] = 255;
      } else {
        const t = y / S;
        raw[p++] = lerp(A[0], B[0], t);
        raw[p++] = lerp(A[1], B[1], t);
        raw[p++] = lerp(A[2], B[2], t);
        raw[p++] = 255;
      }
    }
  }
  return raw;
}

// ---- Codificador PNG mínimo ----
const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}
function png(S, raw) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(S, 0);
  ihdr.writeUInt32BE(S, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

for (const S of [192, 512]) {
  const buf = png(S, render(S));
  writeFileSync(join(OUT, `icon-${S}.png`), buf);
  console.log(`icon-${S}.png (${buf.length} bytes)`);
}
