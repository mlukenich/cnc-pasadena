'use strict';
const fs = require('fs');
const path = require('path');

const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
const sub = (a, b) => a.map((v, i) => v - b[i]);
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const unit = a => {
  const l = Math.hypot(...a);
  return l > 1e-12 ? a.map(v => v / l) : [1, 0, 0];
};
const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));

function smoothNormals({ vertices, normals, triangles, groups }) {
  const buckets = new Map();
  const surfaceWeights = new Map();

  triangles.forEach((t, i) => {
    const g = groups[i];
    const smoothGroup = /^(hood-top|roof-surface|windshield|rear-glass|wheel-.*|turret-dome|laser-barrel.*|laser-heatsink.*|laser-focus.*|emp-dish.*|emp-emitter.*)$/.test(g);
    if (!smoothGroup) return;

    for (let corner = 0; corner < 3; corner++) {
      const index = t[corner];
      const key = g + ':' + vertices[index].map(v => v.toFixed(5)).join(',');
      if (!buckets.has(key)) buckets.set(key, new Set());
      buckets.get(key).add(index);

      const a = unit(sub(vertices[t[(corner + 1) % 3]], vertices[index]));
      const b = unit(sub(vertices[t[(corner + 2) % 3]], vertices[index]));
      const angle = Math.acos(Math.max(-1, Math.min(1, dot(a, b))));
      surfaceWeights.set(index, (surfaceWeights.get(index) || 0) + angle);
    }
  });

  const old = normals.map(n => [...n]);
  for (const ids of buckets.values()) {
    for (const i of ids) {
      const sum = [0, 0, 0];
      for (const j of ids) {
        if (dot(old[i], old[j]) > 0.65) {
          for (let k = 0; k < 3; k++) sum[k] += old[j][k] * (surfaceWeights.get(j) || 1);
        }
      }
      normals[i] = unit(sum);
    }
  }
}

function tangentFrame(mesh) {
  const ts = mesh.vertices.map(() => [0, 0, 0]);
  const bs = mesh.vertices.map(() => [0, 0, 0]);

  for (const t of mesh.triangles) {
    const [a, b, c] = t.map(i => mesh.vertices[i]);
    const [ua, ub, uc] = t.map(i => mesh.uvs[i]);
    const e1 = sub(b, a), e2 = sub(c, a);
    const u1 = ub[0] - ua[0], v1 = ub[1] - ua[1];
    const u2 = uc[0] - ua[0], v2 = uc[1] - ua[1];
    const det = u1 * v2 - u2 * v1;
    if (Math.abs(det) < 1e-12) {
      throw new Error('Degenerate UV triangle: ' + JSON.stringify({ t, points: [a, b, c], uv: [ua, ub, uc] }));
    }
    const tangent = e1.map((v, i) => (v * v2 - e2[i] * v1) / det);
    const bitangent = e1.map((v, i) => (e2[i] * u1 - v * u2) / det);
    for (const i of t) {
      for (let k = 0; k < 3; k++) {
        ts[i][k] += tangent[k];
        bs[i][k] += bitangent[k];
      }
    }
  }

  const tangents = ts.map((t, i) => unit(sub(t, mesh.normals[i].map(v => v * dot(mesh.normals[i], t)))));
  const binormals = tangents.map((t, i) => {
    const b = cross(mesh.normals[i], t);
    const sign = dot(b, bs[i]) < 0 ? -1 : 1;
    return b.map(v => v * sign);
  });

  return { tangents, binormals };
}

function writeTga(file, size, rgba) {
  const header = Buffer.alloc(18);
  header[2] = 2; // uncompressed true-color
  header.writeUInt16LE(size, 12);
  header.writeUInt16LE(size, 14);
  header[16] = 32; // 32 bits per pixel
  header[17] = 0x28; // top-origin, 8-bit alpha

  const pixels = Buffer.alloc(rgba.length);
  for (let i = 0; i < rgba.length; i += 4) {
    pixels[i] = rgba[i + 2];     // B
    pixels[i + 1] = rgba[i + 1]; // G
    pixels[i + 2] = rgba[i];     // R
    pixels[i + 3] = rgba[i + 3]; // A
  }
  fs.writeFileSync(file, Buffer.concat([header, pixels]));
}

function readTga(file) {
  if (!fs.existsSync(file)) return null;
  const buf = fs.readFileSync(file);
  const width = buf.readUInt16LE(12);
  const height = buf.readUInt16LE(14);
  const bpp = buf[16];
  const raw = buf.slice(18);
  // Convert BGRA to RGBA buffer
  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0; i < rgba.length; i += 4) {
    rgba[i] = raw[i + 2];     // R
    rgba[i + 1] = raw[i + 1]; // G
    rgba[i + 2] = raw[i];     // B
    rgba[i + 3] = bpp === 32 ? raw[i + 3] : 255;
  }
  return { width, height, rgba };
}

function heightAt(cell, u, v) {
  const edge = Math.min(u, v, 1 - u, 1 - v);
  let h = 0.5;

  // Seams & bevels
  if (cell === 8) { // Hood
    h += 0.05 * Math.sin(u * Math.PI * 4) * Math.cos(v * Math.PI * 2);
  }
  if (cell === 9) { // Door
    h -= 0.08 * Math.exp(-Math.pow((edge - 0.02) / 0.015, 2));
    if (u > 0.65 && u < 0.85 && v > 0.18 && v < 0.28) h -= 0.12; // handle recess
  }
  if (cell === 10) { // Solar Roof
    const gx = Math.abs(Math.sin(u * Math.PI * 16));
    const gy = Math.abs(Math.sin(v * Math.PI * 24));
    if (gx > 0.9 || gy > 0.9) h += 0.04;
  }
  if (cell === 14) { // Tire Tread
    h += 0.08 * Math.cos(u * Math.PI * 18) * Math.sin(v * Math.PI * 6);
  }
  if (cell === 15) { // Laser Face
    const rL = Math.hypot(u - 0.3, v - 0.5);
    const rR = Math.hypot(u - 0.7, v - 0.5);
    if (rL < 0.15 || rR < 0.15) h -= 0.2;
  }
  return h;
}

const materialResponses = [
  { name: 'pearl white paint', specular: 14, reflection: 0 },
  { name: 'columbia cyan', specular: 14, reflection: 0 },
  { name: 'eco tire rubber', specular: 2, reflection: 0 },
  { name: 'aero alloy/chrome', specular: 95, reflection: 20 },
  { name: 'solar blue glass', specular: 85, reflection: 35 },
  { name: 'carbon fiber', specular: 4, reflection: 0 },
  { name: 'strobe optics', specular: 90, reflection: 15 },
  { name: 'gunmetal alloy', specular: 50, reflection: 4 },
  { name: 'hood panel', specular: 14, reflection: 0 },
  { name: 'door panel', specular: 14, reflection: 0 },
  { name: 'solar roof matrix', specular: 70, reflection: 25 },
  { name: 'rear hatch/spoiler', specular: 14, reflection: 0 },
  { name: 'front led fascia', specular: 50, reflection: 8 },
  { name: 'team badge strip', specular: 14, reflection: 0 },
  { name: 'tire tread', specular: 2, reflection: 0 },
  { name: 'laser emitter face', specular: 65, reflection: 10 },
];

function writeMaterialMaps(outputDir) {
  const size = 1024;
  const cellSize = size / 4;

  const diffuseRgba = Buffer.alloc(size * size * 4);
  const normalRgba = Buffer.alloc(size * size * 4);
  const specRgba = Buffer.alloc(size * size * 4);
  const houseRgba = Buffer.alloc(size * size * 4);

  // Check if high-resolution source atlas exists
  const sourceAtlasPath = path.join(outputDir, 'Textures', 'prius-panels-v1.tga');
  const sourceAtlas = readTga(sourceAtlasPath);

  // Fallback palette
  const colors = [
    [236, 240, 245], [0, 168, 204], [25, 26, 28], [220, 225, 230],
    [16, 32, 54],    [32, 34, 36],  [255, 60, 40], [48, 50, 56],
    [232, 236, 242], [235, 239, 244], [18, 38, 62], [232, 236, 242],
    [30, 32, 36],    [220, 225, 230], [22, 23, 25],  [40, 42, 48],
  ];

  for (let y = 0; y < size; y++) {
    const row = Math.floor(y / cellSize);
    const localY = (y % cellSize) / cellSize;

    for (let x = 0; x < size; x++) {
      const col = Math.floor(x / cellSize);
      const localX = (x % cellSize) / cellSize;
      const cell = row * 4 + col;
      const offset = (y * size + x) * 4;

      let r, g, b;
      if (sourceAtlas && sourceAtlas.width === size && sourceAtlas.height === size) {
        r = sourceAtlas.rgba[offset];
        g = sourceAtlas.rgba[offset + 1];
        b = sourceAtlas.rgba[offset + 2];
      } else {
        [r, g, b] = colors[cell];
      }

      const mat = materialResponses[cell];

      // Recolor mask: Team color on Cell 1 (cyan trim), Cell 9 (door cyan stripe), and Cell 13 (badge)
      let teamAlpha = 0;
      if (cell === 1 || cell === 13) {
        teamAlpha = 255;
      } else if (cell === 9 && localY > 0.38 && localY < 0.62) {
        teamAlpha = 255; // horizontal cyan stripe on door
      }

      // 1. Diffuse (RGBA)
      diffuseRgba[offset] = r;
      diffuseRgba[offset + 1] = g;
      diffuseRgba[offset + 2] = b;
      diffuseRgba[offset + 3] = 255;

      // 2. Normal Map (Sobel from height)
      const du = 1.0 / cellSize;
      const dv = 1.0 / cellSize;
      const hL = heightAt(cell, clamp(localX - du), localY);
      const hR = heightAt(cell, clamp(localX + du), localY);
      const hD = heightAt(cell, localX, clamp(localY - dv));
      const hU = heightAt(cell, localX, clamp(localY + dv));

      const norm = unit([-(hR - hL) * 2.0, -(hU - hD) * 2.0, 1.0]);
      normalRgba[offset] = Math.round(clamp((norm[0] * 0.5 + 0.5) * 255, 0, 255));
      normalRgba[offset + 1] = Math.round(clamp((norm[1] * 0.5 + 0.5) * 255, 0, 255));
      normalRgba[offset + 2] = Math.round(clamp((norm[2] * 0.5 + 0.5) * 255, 0, 255));
      normalRgba[offset + 3] = 255;

      // 3. SpecMap: R = Specular Highlight, G = Reflection, B = Glow
      specRgba[offset] = mat.specular;
      specRgba[offset + 1] = mat.reflection;
      specRgba[offset + 2] = (cell === 6 || (cell === 12 && localY > 0.35 && localY < 0.45)) ? 180 : 0;
      specRgba[offset + 3] = 255;

      // 4. RecolorTexture: Grayscale luminance in RGB, team color mask in Alpha
      const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      houseRgba[offset] = lum;
      houseRgba[offset + 1] = lum;
      houseRgba[offset + 2] = lum;
      houseRgba[offset + 3] = teamAlpha;
    }
  }

  writeTga(path.join(outputDir, 'CVPriusAtlas.tga'), size, diffuseRgba);
  writeTga(path.join(outputDir, 'CVPriusNormal.tga'), size, normalRgba);
  writeTga(path.join(outputDir, 'CVPriusSpec.tga'), size, specRgba);
  writeTga(path.join(outputDir, 'CVPriusHouse.tga'), size, houseRgba);
}

function writePortraitTga(outputDir) {
  const targetPath = path.join(outputDir, 'CVPriusPortrait.tga');
  // If the converted high-res portrait already exists, preserve it!
  if (fs.existsSync(targetPath) && fs.statSync(targetPath).size > 1000) {
    return;
  }
}

module.exports = {
  smoothNormals,
  tangentFrame,
  writeTga,
  readTga,
  heightAt,
  materialResponses,
  writeMaterialMaps,
  writePortraitTga,
};
