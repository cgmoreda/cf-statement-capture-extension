import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const root = process.cwd();
const outputDir = path.join(root, "assets", "icons");
const sizes = [16, 32, 48, 128];

fs.mkdirSync(outputDir, { recursive: true });

for (const size of sizes) {
  const pixels = renderIcon(size);
  const png = encodePng(size, size, pixels);
  fs.writeFileSync(path.join(outputDir, `icon-${size}.png`), png);
}

console.log(`Generated ${sizes.length} icons in assets/icons`);

function renderIcon(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const radius = size * 0.22;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const t = (x + y) / (size * 2);
      const base = mix([17, 24, 39], [8, 105, 98], t);
      const inside = roundedRectContains(x + 0.5, y + 0.5, 0, 0, size, size, radius);
      setPixel(pixels, size, x, y, inside ? [...base, 255] : [0, 0, 0, 0]);
    }
  }

  const pad = Math.max(2, Math.round(size * 0.16));
  const pageX = Math.round(size * 0.26);
  const pageY = Math.round(size * 0.17);
  const pageW = Math.round(size * 0.48);
  const pageH = Math.round(size * 0.66);
  fillRounded(pixels, size, pageX, pageY, pageW, pageH, Math.max(1, size * 0.04), [248, 250, 252, 255]);

  const fold = Math.max(2, Math.round(size * 0.15));
  fillTriangle(pixels, size, pageX + pageW - fold, pageY, pageX + pageW, pageY, pageX + pageW, pageY + fold, [203, 213, 225, 255]);

  const barX = pageX + pad;
  const barW = Math.max(1, Math.round(size * 0.08));
  const barGap = Math.max(1, Math.round(size * 0.05));
  const baseY = pageY + pageH - pad;
  const heights = [0.34, 0.48, 0.25].map((value) => Math.max(2, Math.round(size * value)));
  const colors = [
    [239, 68, 68, 255],
    [59, 130, 246, 255],
    [245, 158, 11, 255]
  ];

  for (let index = 0; index < 3; index += 1) {
    fillRect(
      pixels,
      size,
      barX + index * (barW + barGap),
      baseY - heights[index],
      barW,
      heights[index],
      colors[index]
    );
  }

  return pixels;
}

function encodePng(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", createIhdr(width, height)),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

function createIhdr(width, height) {
  const data = Buffer.alloc(13);
  data.writeUInt32BE(width, 0);
  data.writeUInt32BE(height, 4);
  data[8] = 8;
  data[9] = 6;
  data[10] = 0;
  data[11] = 0;
  data[12] = 0;
  return data;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function setPixel(buffer, size, x, y, color) {
  if (x < 0 || y < 0 || x >= size || y >= size) return;
  const index = (y * size + x) * 4;
  buffer[index] = color[0];
  buffer[index + 1] = color[1];
  buffer[index + 2] = color[2];
  buffer[index + 3] = color[3];
}

function fillRect(buffer, size, x, y, width, height, color) {
  for (let yy = y; yy < y + height; yy += 1) {
    for (let xx = x; xx < x + width; xx += 1) {
      setPixel(buffer, size, xx, yy, color);
    }
  }
}

function fillRounded(buffer, size, x, y, width, height, radius, color) {
  for (let yy = y; yy < y + height; yy += 1) {
    for (let xx = x; xx < x + width; xx += 1) {
      if (roundedRectContains(xx + 0.5, yy + 0.5, x, y, width, height, radius)) {
        setPixel(buffer, size, xx, yy, color);
      }
    }
  }
}

function fillTriangle(buffer, size, x1, y1, x2, y2, x3, y3, color) {
  const minX = Math.floor(Math.min(x1, x2, x3));
  const maxX = Math.ceil(Math.max(x1, x2, x3));
  const minY = Math.floor(Math.min(y1, y2, y3));
  const maxY = Math.ceil(Math.max(y1, y2, y3));

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      if (pointInTriangle(x + 0.5, y + 0.5, x1, y1, x2, y2, x3, y3)) {
        setPixel(buffer, size, x, y, color);
      }
    }
  }
}

function roundedRectContains(px, py, x, y, width, height, radius) {
  const cx = Math.max(x + radius, Math.min(px, x + width - radius));
  const cy = Math.max(y + radius, Math.min(py, y + height - radius));
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= radius * radius;
}

function pointInTriangle(px, py, x1, y1, x2, y2, x3, y3) {
  const area = (x2 - x1) * (y3 - y1) - (x3 - x1) * (y2 - y1);
  const s = ((y1 - y3) * (px - x3) + (x3 - x1) * (py - y3)) / area;
  const t = ((y3 - y2) * (px - x3) + (x2 - x3) * (py - y3)) / area;
  const u = 1 - s - t;
  return s >= 0 && t >= 0 && u >= 0;
}

function mix(a, b, t) {
  return a.map((value, index) => Math.round(value + (b[index] - value) * t));
}
