import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function crc32(buf) {
  let table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    table[n] = c;
  }
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ (-1)) >>> 0;
}

function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function generatePNG(width, height, isMaskable = false) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // 8-bit depth
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Generate image pixels
  const rowBytes = width * 4 + 1; // 1 filter byte per row
  const rawData = Buffer.alloc(rowBytes * height);

  const cx = width / 2;
  const cy = height / 2;
  const outerR = (width * 0.46);
  const innerR = (width * 0.38);
  const centerR = (width * 0.16);

  for (let y = 0; y < height; y++) {
    const rowStart = y * rowBytes;
    rawData[rowStart] = 0; // Filter None

    for (let x = 0; x < width; x++) {
      const idx = rowStart + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Background color: slate-950 (#0f172a)
      let r = 15;
      let g = 23;
      let b = 42;
      let a = 255;

      if (!isMaskable) {
        // Rounded corners for non-maskable
        const cornerR = width * 0.22;
        const inCornerX = x < cornerR ? cornerR - x : x > width - cornerR ? x - (width - cornerR) : 0;
        const inCornerY = y < cornerR ? cornerR - y : y > height - cornerR ? y - (height - cornerR) : 0;
        if (inCornerX > 0 && inCornerY > 0) {
          const cornerDist = Math.sqrt(inCornerX * inCornerX + inCornerY * inCornerY);
          if (cornerDist > cornerR) {
            a = 0;
          }
        }
      }

      if (a > 0) {
        // Emerald / Amber gradient ring
        if (dist <= outerR && dist >= innerR) {
          // Angle-based tint
          const angle = Math.atan2(dy, dx);
          if (angle < 0) {
            // Top/right = emerald (#10b981)
            r = 16;
            g = 185;
            b = 129;
          } else {
            // Bottom/left = amber (#f59e0b)
            r = 245;
            g = 158;
            b = 11;
          }
        } else if (dist < innerR && dist > centerR) {
          // Inner badge area
          const vertDist = Math.abs(dx);
          if (vertDist < width * 0.08 && Math.abs(dy) < height * 0.2) {
            // Fuel nozzle bar (gold #fbbf24)
            r = 251;
            g = 191;
            b = 36;
          } else if (dy > 0 && Math.abs(dx) < width * 0.25) {
            // Emerald wood log pattern
            r = 5;
            g = 150;
            b = 105;
          }
        } else if (dist <= centerR) {
          // Center gold/emerald core
          r = 16;
          g = 185;
          b = 129;
          if (Math.abs(dx) < centerR * 0.25 || Math.abs(dy) < centerR * 0.25) {
            // Highlight cross
            r = 255;
            g = 255;
            b = 255;
          }
        }
      }

      rawData[idx] = r;
      rawData[idx + 1] = g;
      rawData[idx + 2] = b;
      rawData[idx + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), generatePNG(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), generatePNG(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), generatePNG(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generatePNG(180, 180, false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), generatePNG(64, 64, false));

console.log('✅ PWA Icons generated successfully in public/');
