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
    const shell = /^(cab-.*|hood-.*|fender-.*|roof-.*|door-.*|bed-.*|tailgate-.*)$/.test(g);
    const smoothGroup = shell || /^(wheel-.*|barrel-.*|muzzle-.*|turret-dome.*|airtank-.*)$/.test(g);
    if (!smoothGroup) return;

    for (let corner = 0; corner < 3; corner++) {
      const index = t[corner];
      const key = (shell ? 'shell' : g) + ':' + vertices[index].map(v => v.toFixed(5)).join(',');
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
        if (dot(old[i], old[j]) > 0.8) {
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

function writeTga(filepath, size, rgba) {
  const header = Buffer.alloc(18);
  header[2] = 2; // uncompressed true-color
  header.writeUInt16LE(size, 12);
  header.writeUInt16LE(size, 14);
  header[16] = 32; // 32 bpp
  header[17] = 0x28; // top-origin, 8-bit alpha

  const out = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    out[i * 4 + 0] = rgba[i * 4 + 2]; // B
    out[i * 4 + 1] = rgba[i * 4 + 1]; // G
    out[i * 4 + 2] = rgba[i * 4 + 0]; // R
    out[i * 4 + 3] = rgba[i * 4 + 3]; // A
  }

  fs.writeFileSync(filepath, Buffer.concat([header, out]));
}

function readTga(filepath) {
  if (!fs.existsSync(filepath)) return null;
  const data = fs.readFileSync(filepath);
  const width = data.readUInt16LE(12);
  const height = data.readUInt16LE(14);
  const bpp = data[16];
  if (bpp !== 32) return null;

  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    rgba[i * 4 + 0] = data[18 + i * 4 + 2]; // R
    rgba[i * 4 + 1] = data[18 + i * 4 + 1]; // G
    rgba[i * 4 + 2] = data[18 + i * 4 + 0]; // B
    rgba[i * 4 + 3] = data[18 + i * 4 + 3]; // A
  }
  return { width, height, rgba };
}

function heightAt(cell, u, v) {
  let h = 0.5;
  if (cell === 5) {
    // Diamond plate pattern
    const su = (u * 16) % 1.0;
    const sv = (v * 16) % 1.0;
    const d = Math.hypot(su - 0.5, sv - 0.5);
    h = d < 0.35 ? 0.75 : 0.45;
  } else if (cell === 14) {
    // Chevron tractor tire tread pattern
    const chevron = Math.abs((u * 8) % 1.0 - 0.5) * 2.0;
    const tv = (v * 12 + chevron * 0.4) % 1.0;
    h = tv < 0.45 ? 0.9 : 0.2;
  } else if (cell === 15) {
    // Ribbed cannon muzzle brake
    const ring = Math.sin(v * Math.PI * 16);
    h = ring > 0 ? 0.75 : 0.35;
  }
  return h;
}

const materialResponses = [
  { name: 'pasadena burgundy paint', specular: 14, reflection: 0 },
  { name: 'matte black fender', specular: 6, reflection: 0 },
  { name: 'muddy tractor tire rubber', specular: 2, reflection: 0 },
  { name: 'rusty steel wheel rim', specular: 45, reflection: 4 },
  { name: 'cast-iron turret shell', specular: 18, reflection: 0 },
  { name: 'diamond plate steel', specular: 60, reflection: 8 },
  { name: 'tinted glass', specular: 80, reflection: 25 },
  { name: 'supercharger chrome', specular: 110, reflection: 20 },
  { name: 'hood panel', specular: 14, reflection: 0 },
  { name: 'door panel', specular: 14, reflection: 0 },
  { name: 'cab roof panel', specular: 14, reflection: 0 },
  { name: 'tailgate panel', specular: 14, reflection: 0 },
  { name: 'front chevy grille', specular: 50, reflection: 8 },
  { name: 'old bay crate decal', specular: 10, reflection: 0 },
  { name: 'tractor tire tread', specular: 2, reflection: 0 },
  { name: 'cannon muzzle faceplate', specular: 35, reflection: 2 },
];

function writeMaterialMaps(outputDir) {
  const size = 1024;
  const cellSize = size / 4;

  const diffuseRgba = Buffer.alloc(size * size * 4);
  const normalRgba = Buffer.alloc(size * size * 4);
  const specRgba = Buffer.alloc(size * size * 4);
  const houseRgba = Buffer.alloc(size * size * 4);

  // Check if high-resolution source atlas exists
  const sourceAtlasPath = path.join(outputDir, 'Textures', 'mudtank-panels-v1.tga');
  const sourceAtlas = readTga(sourceAtlasPath);

  // Fallback palette
  const colors = [
    [136, 32, 42],  [30, 30, 32],   [24, 24, 26],   [90, 85, 80],
    [55, 52, 50],   [160, 165, 170], [30, 42, 50],  [210, 215, 220],
    [130, 30, 40],  [132, 31, 41],  [128, 28, 38],  [125, 26, 36],
    [40, 40, 44],   [220, 180, 40], [20, 20, 22],   [70, 68, 65],
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

      // Recolor mask: Team color on Cell 9 (Maryland flag badge), Cell 13 (Old Bay box trim)
      let teamAlpha = 0;
      if (cell === 9 && localX > 0.35 && localX < 0.65 && localY > 0.55 && localY < 0.85) {
        teamAlpha = 255; // badge area
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
      specRgba[offset + 2] = 0;
      specRgba[offset + 3] = 255;

      // 4. RecolorTexture: Grayscale luminance in RGB, team color mask in Alpha
      const lum = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
      houseRgba[offset] = lum;
      houseRgba[offset + 1] = lum;
      houseRgba[offset + 2] = lum;
      houseRgba[offset + 3] = teamAlpha;
    }
  }

  writeTga(path.join(outputDir, 'PVMudTankAtlas.tga'), size, diffuseRgba);
  writeTga(path.join(outputDir, 'PVMudTankNormal.tga'), size, normalRgba);
  writeTga(path.join(outputDir, 'PVMudTankSpec.tga'), size, specRgba);
  writeTga(path.join(outputDir, 'PVMudTankHouse.tga'), size, houseRgba);
}

module.exports = {
  smoothNormals,
  tangentFrame,
  writeTga,
  readTga,
  heightAt,
  materialResponses,
  writeMaterialMaps,
};
