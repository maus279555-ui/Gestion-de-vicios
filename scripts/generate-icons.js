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

  function generateLeafPNG(width, height, isMaskable = false) {
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

    for (let y = 0; y < height; y++) {
      const rowStart = y * rowBytes;
      rawData[rowStart] = 0; // Filter None

      for (let x = 0; x < width; x++) {
        const idx = rowStart + 1 + x * 4;

        // Normalized coordinates [-1, 1]
        const nx = (x - width / 2) / (width / 2);
        const ny = (y - height / 2) / (height / 2);
        const distFromCenter = Math.sqrt(nx * nx + ny * ny);

        // Background: Deep forest / obsidian emerald gradient
        // Darker at corners (#04100c), slightly lighter ambient center (#0d3024)
        const bgGrad = Math.max(0, 1 - distFromCenter * 0.7);
        let r = Math.round(5 + bgGrad * 10);
        let g = Math.round(18 + bgGrad * 28);
        let b = Math.round(14 + bgGrad * 18);
        let a = 255;

        // Squircle rounded corners for non-maskable icons
        if (!isMaskable) {
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
              // Ambient soft emerald halo behind the leaf
              if (distFromCenter < 0.72) {
                const haloIntensity = Math.pow(1 - distFromCenter / 0.72, 1.8) * 0.35;
                r = Math.round(r + 16 * haloIntensity);
                g = Math.round(g + 185 * haloIntensity);
                b = Math.round(b + 129 * haloIntensity);
              }

              // Leaf geometry: tilted slightly (-12 deg) for organic feel
              const angleRad = -0.18; // approx -10.3 degrees
              const cosA = Math.cos(angleRad);
              const sinA = Math.sin(angleRad);
              const lx = nx * cosA - (ny + 0.04) * sinA;
              const ly = nx * sinA + (ny + 0.04) * cosA;

              // Leaf vertical span: from tip at ly = -0.62 to base at ly = 0.52
              const tipY = -0.62;
              const baseY = 0.52;
              const leafLen = baseY - tipY;
              const u = (ly - tipY) / leafLen; // 0 at tip, 1 at base

              // Stem stalk below base (u between 0.98 and 1.25)
              if (u >= 0.98 && u <= 1.22) {
                const stemCurve = Math.sin((u - 0.98) * 3) * 0.05;
                const stemDist = Math.abs(lx - stemCurve);
                if (stemDist <= 0.035) {
                  // Stem color: deep organic stalk green
                  r = 5;
                  g = 150;
                  b = 105;
                }
                }

                // Inside the leaf blade
                if (u > 0.01 && u < 0.99) {
                  // Natural coca leaf width envelope W(u)
                  // Asymmetric bezier-like bell: reaches peak width ~0.42 at u = 0.56
                  const widthEnv = 3.8 * Math.pow(u, 0.9) * Math.pow(1 - u, 1.2) * 0.44;

                  if (Math.abs(lx) <= widthEnv) {
                    const isRightSide = lx > 0;
                    const distFromEdge = widthEnv - Math.abs(lx);
                    const edgeFade = Math.min(1, distFromEdge * 35); // smooth antialiasing edge

                    // Base leaf blade color
                    let leafR, leafG, leafB;

                    if (isRightSide) {
                      // Right side: sunlit vibrant emerald & lime
                      // #34d399 (52, 211, 153) to #10b981 (16, 185, 129)
                      const t = lx / widthEnv;
                      leafR = Math.round(28 + (1 - t) * 24);
                      leafG = Math.round(195 + (1 - t) * 25);
                      leafB = Math.round(135 + (1 - t) * 30);
                    } else {
                      // Left side: richer, deeper emerald shade
                      // #059669 (5, 150, 105) to #047857 (4, 120, 87)
                      const t = Math.abs(lx) / widthEnv;
                      leafR = Math.round(8 + (1 - t) * 12);
                      leafG = Math.round(135 + (1 - t) * 35);
                      leafB = Math.round(95 + (1 - t) * 20);
                    }

                    // Central main vein (along lx ≈ 0)
                    const veinDist = Math.abs(lx);
                    if (veinDist < 0.02) {
                      const veinT = 1 - veinDist / 0.02;
                      // Mint glowing vein (#a7f3d0 / #ecfdf5)
                      leafR = Math.round(leafR + (167 - leafR) * veinT * 0.85);
                      leafG = Math.round(leafG + (243 - leafG) * veinT * 0.85);
                      leafB = Math.round(leafB + (208 - leafB) * veinT * 0.85);
                    }

                    // Lateral secondary veins branching at 45 degrees
                    const veinPattern = (u * 8 - Math.abs(lx) * 5) % 1.0;
                    if (veinPattern > 0.88 && veinDist > 0.02 && veinDist < widthEnv * 0.85) {
                      const veinFade = (veinPattern - 0.88) / 0.12;
                      leafR = Math.min(255, Math.round(leafR + 40 * veinFade));
                      leafG = Math.min(255, Math.round(leafG + 55 * veinFade));
                      leafB = Math.min(255, Math.round(leafB + 45 * veinFade));
                    }

                    // Morning Dewdrop on the left blade (ly ~ 0.15, lx ~ -0.15)
                    const dropDx = lx - (-0.14);
                    const dropDy = ly - 0.12;
                    const dropDist = Math.sqrt(dropDx * dropDx * 1.5 + dropDy * dropDy);
                    if (dropDist < 0.045) {
                      // Dewdrop body: glassy translucent mint
                      const dropT = 1 - dropDist / 0.045;
                      leafR = Math.round(leafR + (236 - leafR) * dropT * 0.9);
                      leafG = Math.round(leafG + (253 - leafG) * dropT * 0.9);
                      leafB = Math.round(leafB + (245 - leafB) * dropT * 0.9);
                      // Dewdrop white glint specular highlight
                      if (Math.abs(dropDx + 0.01) < 0.015 && Math.abs(dropDy + 0.01) < 0.015) {
                        leafR = 255;
                        leafG = 255;
                        leafB = 255;
                      }
                    }

                    // Blend leaf with background using edge antialiasing
                    r = Math.round(r * (1 - edgeFade) + leafR * edgeFade);
                    g = Math.round(g * (1 - edgeFade) + leafG * edgeFade);
                    b = Math.round(b * (1 - edgeFade) + leafB * edgeFade);
                  }
                }
              }

              rawData[idx] = Math.min(255, Math.max(0, r));
              rawData[idx + 1] = Math.min(255, Math.max(0, g));
              rawData[idx + 2] = Math.min(255, Math.max(0, b));
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

        fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), generateLeafPNG(192, 192, false));
        fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), generateLeafPNG(512, 512, false));
        fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), generateLeafPNG(512, 512, true));
        fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), generateLeafPNG(180, 180, false));
        fs.writeFileSync(path.join(publicDir, 'favicon.ico'), generateLeafPNG(64, 64, false));

        console.log('🍃 Hoja PWA Icons generated successfully in public/');
