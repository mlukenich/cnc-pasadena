'use strict';
const fs = require('fs');
const path = require('path');

function readTga32(filePath) {
  const buf = fs.readFileSync(filePath);
  const w = buf.readUInt16LE(12);
  const h = buf.readUInt16LE(14);
  const bpp = buf[16];
  if (bpp !== 32) throw new Error(`Expected 32-bpp TGA, got ${bpp}-bpp at ${filePath}`);
  const pixels = Buffer.alloc(w * h * 4);
  const dataOffset = 18;
  for (let y = 0; y < h; y++) {
    const srcRow = (h - 1 - y) * w * 4 + dataOffset;
    const dstRow = y * w * 4;
    for (let x = 0; x < w * 4; x += 4) {
      pixels[dstRow + x + 0] = buf[srcRow + x + 0]; // B
      pixels[dstRow + x + 1] = buf[srcRow + x + 1]; // G
      pixels[dstRow + x + 2] = buf[srcRow + x + 2]; // R
      pixels[dstRow + x + 3] = buf[srcRow + x + 3]; // A
    }
  }
  return { w, h, pixels };
}

function writeTga32(filePath, w, h, pixels) {
  const header = Buffer.alloc(18);
  header[2] = 2; // uncompressed true-color
  header.writeUInt16LE(w, 12);
  header.writeUInt16LE(h, 14);
  header[16] = 32; // 32 bpp
  header[17] = 8;  // 8-bit alpha, bottom-to-top

  const data = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    const srcRow = y * w * 4;
    const dstRow = (h - 1 - y) * w * 4;
    for (let x = 0; x < w * 4; x += 4) {
      data[dstRow + x + 0] = pixels[srcRow + x + 0]; // B
      data[dstRow + x + 1] = pixels[srcRow + x + 1]; // G
      data[dstRow + x + 2] = pixels[srcRow + x + 2]; // R
      data[dstRow + x + 3] = pixels[srcRow + x + 3]; // A
    }
  }
  fs.writeFileSync(filePath, Buffer.concat([header, data]));
}

function generateMaterialMaps(sourceAtlasPath) {
  const atlas = readTga32(sourceAtlasPath);
  const { w, h, pixels: src } = atlas;

  const normalPix = Buffer.alloc(w * h * 4);
  const specPix = Buffer.alloc(w * h * 4);
  const housePix = Buffer.alloc(w * h * 4);

  const getLum = (x, y) => {
    const cx = Math.max(0, Math.min(w - 1, x));
    const cy = Math.max(0, Math.min(h - 1, y));
    const idx = (cy * w + cx) * 4;
    return 0.299 * src[idx + 2] + 0.587 * src[idx + 1] + 0.114 * src[idx + 0];
  };

  for (let y = 0; y < h; y++) {
    const cellY = Math.floor((y / h) * 4);
    for (let x = 0; x < w; x++) {
      const cellX = Math.floor((x / w) * 4);
      const idx = (y * w + x) * 4;

      const r = src[idx + 2];
      const g = src[idx + 1];
      const b = src[idx + 0];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      // Sobel gradient for Normal Map
      const dx = (getLum(x + 1, y - 1) + 2 * getLum(x + 1, y) + getLum(x + 1, y + 1)) -
                 (getLum(x - 1, y - 1) + 2 * getLum(x - 1, y) + getLum(x - 1, y + 1));
      const dy = (getLum(x - 1, y + 1) + 2 * getLum(x, y + 1) + getLum(x + 1, y + 1)) -
                 (getLum(x - 1, y - 1) + 2 * getLum(x, y - 1) + getLum(x + 1, y - 1));

      let bumpScale = 0.15;
      if (cellX === 1 && cellY === 0) bumpScale = 0.35; // hex camo grid
      if (cellX === 2 && cellY === 0) bumpScale = 0.25; // carbon weave
      if (cellX === 1 && cellY === 1) bumpScale = 0.40; // tire tread
      if (cellX === 3 && cellY === 1) bumpScale = 0.30; // cooling vent

      let nx = -dx * bumpScale;
      let ny = -dy * bumpScale;
      let nz = 128.0;
      const len = Math.hypot(nx, ny, nz) || 1.0;
      nx /= len; ny /= len; nz /= len;

      normalPix[idx + 0] = Math.round((nz * 0.5 + 0.5) * 255); // B (Z)
      normalPix[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255); // G (Y)
      normalPix[idx + 2] = Math.round((nx * 0.5 + 0.5) * 255); // R (X)
      normalPix[idx + 3] = 255;

      // Specular Map (R=highlight, G=env reflection, B=glow)
      let specR = 10, specG = 8, specB = 0;

      if (cellX === 0 && cellY === 0) {
        // Pearl White Paint: strict low-glare limit <= 14
        specR = Math.min(14, Math.round(lum * 0.07));
        specG = 12;
      } else if (cellX === 1 && cellY === 0) {
        // Glowing Cyan Hex Camo Matrix: Cyan glow in Blue channel
        specR = 20;
        specG = 40;
        specB = b > 120 ? Math.min(255, b + 50) : 0;
      } else if (cellX === 2 && cellY === 0) {
        // Dark Carbon Fiber: matte <= 2
        specR = 2;
        specG = 2;
      } else if (cellX === 3 && cellY === 0) {
        // Anodized Cyan Aluminum: >= 60
        specR = Math.max(65, Math.min(240, Math.round(lum * 0.95)));
        specG = Math.max(65, Math.min(240, Math.round(lum * 0.90)));
      } else if (cellX === 0 && cellY === 1) {
        // Dark Solar Glass
        specR = 40;
        specG = 45;
      } else if (cellX === 1 && cellY === 1) {
        // EV Tire Tread: matte <= 2
        specR = 1;
        specG = 1;
      } else if (cellX === 2 && cellY === 1) {
        // Pop-up Rocket Pod Faceplate
        specR = 25;
        specG = 20;
      } else if (cellX === 3 && cellY === 1) {
        // Vent with Cyan LED ring
        specR = 15;
        specG = 20;
        specB = b > 120 ? 200 : 0;
      } else if (cellX === 0 && cellY === 2) {
        // Front Fascia & LiDAR bar
        specR = 25;
        specG = 30;
      } else if (cellX === 1 && cellY === 2) {
        // Door Seal
        specR = 12;
        specG = 10;
      } else if (cellX === 2 && cellY === 2) {
        // HOA Crest Placard
        specR = 12;
        specG = 10;
      } else if (cellX === 3 && cellY === 2) {
        // Rear Printer & Taillight
        specR = 25;
        specG = 20;
      } else if (cellX === 0 && cellY === 3) {
        // LiDAR Periscope Dome Lens: >= 60
        specR = 70;
        specG = 75;
      } else if (cellX === 1 && cellY === 3) {
        // Diffuser Plate
        specR = 18;
        specG = 15;
      } else if (cellX === 2 && cellY === 3) {
        // Console Scanner
        specR = 30;
        specG = 35;
      } else if (cellX === 3 && cellY === 3) {
        // Aero-Disc Wheel Cover: Carbon center, cyan ring
        specR = 20;
        specG = 25;
        specB = b > 120 ? 180 : 0;
      }

      specPix[idx + 0] = specB;
      specPix[idx + 1] = specG;
      specPix[idx + 2] = specR;
      specPix[idx + 3] = 255;

      // House Color Map (Team Recolor)
      let houseRecolor = 0;
      if (cellX === 0 && cellY === 0) {
        // Base Pearl White gets team recolor
        houseRecolor = Math.round(lum);
      } else if (cellX === 1 && cellY === 2) {
        // Door seal badge accent
        if (x % (w / 4) > 200 && y % (h / 4) > 200) houseRecolor = Math.round(lum);
      }

      housePix[idx + 0] = houseRecolor;
      housePix[idx + 1] = houseRecolor;
      housePix[idx + 2] = houseRecolor;
      housePix[idx + 3] = houseRecolor > 0 ? 255 : 0;
    }
  }

  return { atlas, normalPix, specPix, housePix };
}

function writeMaterialMaps(outputDir) {
  const texDir = path.join(outputDir, 'Textures');
  const sourceAtlas = path.join(texDir, 'stealth-panels-v1.tga');
  const { atlas, normalPix, specPix, housePix } = generateMaterialMaps(sourceAtlas);

  writeTga32(path.join(outputDir, 'CTStealthAtlas.tga'), atlas.w, atlas.h, atlas.pixels);
  writeTga32(path.join(outputDir, 'CTStealthNormal.tga'), atlas.w, atlas.h, normalPix);
  writeTga32(path.join(outputDir, 'CTStealthSpec.tga'), atlas.w, atlas.h, specPix);
  writeTga32(path.join(outputDir, 'CTStealthHouse.tga'), atlas.w, atlas.h, housePix);
  console.log(`[OK] Generated 4 ObjectsGDI texture maps in ${outputDir}:
     - CTStealthAtlas.tga
     - CTStealthNormal.tga
     - CTStealthSpec.tga
     - CTStealthHouse.tga`);
}

function smoothNormals({ vertices, normals, triangles, groups }) {
  const vertexNormals = vertices.map(() => [0, 0, 0]);
  triangles.forEach((tri, triIdx) => {
    const [i0, i1, i2] = tri;
    const v0 = vertices[i0], v1 = vertices[i1], v2 = vertices[i2];
    const ax = v1[0] - v0[0], ay = v1[1] - v0[1], az = v1[2] - v0[2];
    const bx = v2[0] - v0[0], by = v2[1] - v0[1], bz = v2[2] - v0[2];
    const nx = ay * bz - az * by;
    const ny = az * bx - ax * bz;
    const nz = ax * by - ay * bx;
    const len = Math.hypot(nx, ny, nz);
    if (len > 1e-12) {
      const fnx = nx / len, fny = ny / len, fnz = nz / len;
      for (const idx of tri) {
        vertexNormals[idx][0] += fnx;
        vertexNormals[idx][1] += fny;
        vertexNormals[idx][2] += fnz;
      }
    }
  });

  for (let i = 0; i < vertices.length; i++) {
    const vn = vertexNormals[i];
    const len = Math.hypot(vn[0], vn[1], vn[2]);
    if (len > 1e-12) {
      normals[i] = [vn[0] / len, vn[1] / len, vn[2] / len];
    }
  }
}

function tangentFrame(mesh) {
  const tangents = mesh.vertices.map(() => [0, 0, 0]);
  const binormals = mesh.vertices.map(() => [0, 0, 0]);

  mesh.triangles.forEach(tri => {
    const [i0, i1, i2] = tri;
    const p0 = mesh.vertices[i0], p1 = mesh.vertices[i1], p2 = mesh.vertices[i2];
    const uv0 = mesh.uvs[i0], uv1 = mesh.uvs[i1], uv2 = mesh.uvs[i2];

    const e1 = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]];
    const e2 = [p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]];
    const du1 = uv1[0] - uv0[0], dv1 = uv1[1] - uv0[1];
    const du2 = uv2[0] - uv0[0], dv2 = uv2[1] - uv0[1];

    const det = du1 * dv2 - du2 * dv1;
    if (Math.abs(det) > 1e-12) {
      const inv = 1.0 / det;
      const tx = inv * (dv2 * e1[0] - dv1 * e2[0]);
      const ty = inv * (dv2 * e1[1] - dv1 * e2[1]);
      const tz = inv * (dv2 * e1[2] - dv1 * e2[2]);
      const bx = inv * (-du2 * e1[0] + du1 * e2[0]);
      const by = inv * (-du2 * e1[1] + du1 * e2[1]);
      const bz = inv * (-du2 * e1[2] + du1 * e2[2]);

      for (const idx of tri) {
        tangents[idx][0] += tx; tangents[idx][1] += ty; tangents[idx][2] += tz;
        binormals[idx][0] += bx; binormals[idx][1] += by; binormals[idx][2] += bz;
      }
    }
  });

  for (let i = 0; i < mesh.vertices.length; i++) {
    const n = mesh.normals[i];
    let t = tangents[i];
    const tDotN = t[0] * n[0] + t[1] * n[1] + t[2] * n[2];
    t = [t[0] - tDotN * n[0], t[1] - tDotN * n[1], t[2] - tDotN * n[2]];
    const tLen = Math.hypot(t[0], t[1], t[2]);
    tangents[i] = tLen > 1e-12 ? [t[0] / tLen, t[1] / tLen, t[2] / tLen] : [1, 0, 0];

    const b = binormals[i];
    const bLen = Math.hypot(b[0], b[1], b[2]);
    binormals[i] = bLen > 1e-12 ? [b[0] / bLen, b[1] / bLen, b[2] / bLen] : [0, 1, 0];
  }

  return { tangents, binormals };
}

module.exports = {
  readTga32,
  writeTga32,
  generateMaterialMaps,
  writeMaterialMaps,
  smoothNormals,
  tangentFrame,
};
