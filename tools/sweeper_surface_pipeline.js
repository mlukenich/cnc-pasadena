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
    const shell = /^(cab-.*|tank-.*|fender-.*|roof-.*|hopper-.*|hood-.*|skirt-.*)$/.test(g);
    const smoothGroup = shell || /^(wheel-.*|brush-.*|cannon-.*|barrel-.*|fan-.*|hose-.*|tank-cylinder.*)$/.test(g);
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
    let tangent, bitangent;
    if (Math.abs(det) < 1e-12) {
      const fn = unit(cross(e1, e2));
      const arb = Math.abs(fn[2]) < 0.8 ? [0, 0, 1] : [0, 1, 0];
      tangent = unit(cross(fn, arb));
      bitangent = unit(cross(fn, tangent));
    } else {
      const f = 1.0 / det;
      tangent = unit([
        f * (v2 * e1[0] - v1 * e2[0]),
        f * (v2 * e1[1] - v1 * e2[1]),
        f * (v2 * e1[2] - v1 * e2[2]),
      ]);
      bitangent = unit([
        f * (-u2 * e1[0] + u1 * e2[0]),
        f * (-u2 * e1[1] + u1 * e2[1]),
        f * (-u2 * e1[2] + u1 * e2[2]),
      ]);
    }
    t.forEach(i => {
      for (let k = 0; k < 3; k++) {
        ts[i][k] += tangent[k];
        bs[i][k] += bitangent[k];
      }
    });
  }

  const tangents = mesh.normals.map((n, i) => {
    const t = ts[i];
    const ortho = sub(t, n.map(v => v * dot(n, t)));
    const len = Math.hypot(...ortho);
    if (len < 1e-6) {
      const arb = Math.abs(n[2]) < 0.8 ? [0, 0, 1] : [0, 1, 0];
      return unit(cross(n, arb));
    }
    return ortho.map(v => v / len);
  });

  const binormals = mesh.normals.map((n, i) => {
    const b = bs[i];
    const t = tangents[i];
    const ortho = sub(b, n.map(v => v * dot(n, b)));
    const dotT = dot(ortho, t);
    const corrected = sub(ortho, t.map(v => v * dotT));
    const len = Math.hypot(...corrected);
    if (len < 1e-6) {
      return unit(cross(n, t));
    }
    return corrected.map(v => v / len);
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
  if (cell === 3) {
    // Stainless steel central weld bead
    const du = Math.abs(u - 0.5);
    h = du < 0.05 ? 0.85 : 0.5;
  } else if (cell === 5) {
    // Steel wire bristles
    const su = (u * 32) % 1.0;
    h = Math.sin(su * Math.PI * 2) * 0.3 + 0.5;
  } else if (cell === 7) {
    // Perforated gunmetal heat shield holes
    const su = (u * 8) % 1.0;
    const sv = (v * 8) % 1.0;
    const d = Math.hypot(su - 0.5, sv - 0.5);
    h = d < 0.3 ? 0.1 : 0.8;
  } else if (cell === 11) {
    // Diamond plate pattern
    const su = (u * 12) % 1.0;
    const sv = (v * 12) % 1.0;
    const diag1 = Math.abs(su - sv);
    const diag2 = Math.abs(su + sv - 1.0);
    h = (diag1 < 0.15 || diag2 < 0.15) ? 0.9 : 0.4;
  } else if (cell === 12) {
    // Circular blower fan intake grill
    const d = Math.hypot(u - 0.5, v - 0.5);
    h = Math.sin(d * Math.PI * 16) > 0 ? 0.75 : 0.35;
  }
  return h;
}

const materialResponses = [
  { name: 'pearl white enamel paint', specular: 14, reflection: 0 },
  { name: 'columbia cyan metallic trim', specular: 35, reflection: 4 },
  { name: 'black rubber tire tread & skirt', specular: 2, reflection: 0 },
  { name: 'brushed stainless steel tank', specular: 75, reflection: 20 },
  { name: 'dark tinted safety glass', specular: 85, reflection: 35 },
  { name: 'steel wire scrubber bristles', specular: 18, reflection: 2 },
  { name: 'amber & cyan strobe lens', specular: 95, reflection: 15 },
  { name: 'perforated heat shield alloy', specular: 50, reflection: 6 },
  { name: 'commercial front grille & lights', specular: 45, reflection: 8 },
  { name: 'side sanitizer panel & chevrons', specular: 14, reflection: 0 },
  { name: 'hazardous bleach placard', specular: 14, reflection: 0 },
  { name: 'diamond plate aluminum step', specular: 80, reflection: 20 },
  { name: 'rear blower fan intake grill', specular: 35, reflection: 4 },
  { name: 'fluid pressure gauge & valves', specular: 65, reflection: 10 },
  { name: 'cyan fluid sight glass tube', specular: 90, reflection: 30 },
  { name: 'utility wheel rim & chrome lugs', specular: 90, reflection: 25 },
];

function writeMaterialMaps(outputDir) {
  const size = 1024;
  const cellSize = size / 4;

  const diffuseRgba = Buffer.alloc(size * size * 4);
  const normalRgba = Buffer.alloc(size * size * 4);
  const specRgba = Buffer.alloc(size * size * 4);
  const houseRgba = Buffer.alloc(size * size * 4);

  // Check if high-resolution source atlas exists
  const sourceAtlasPath = path.join(outputDir, 'Textures', 'sweeper-panels-v1.tga');
  const sourceAtlas = readTga(sourceAtlasPath);

  // Fallback palette
  const colors = [
    [242, 246, 250], [0, 180, 216],  [24, 26, 28],   [210, 215, 220],
    [16, 28, 45],    [120, 125, 130], [255, 160, 20], [55, 58, 62],
    [40, 44, 48],    [238, 242, 246], [250, 250, 250], [200, 205, 210],
    [50, 54, 58],    [180, 185, 190], [0, 220, 255],  [195, 200, 205],
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

      // Safe diffuse clipping
      if (mat.specular <= 14) {
        r = Math.min(r, 242);
        g = Math.min(g, 244);
        b = Math.min(b, 246);
      }

      diffuseRgba[offset + 0] = r;
      diffuseRgba[offset + 1] = g;
      diffuseRgba[offset + 2] = b;
      diffuseRgba[offset + 3] = 255;

      // Normal map from procedural height derivative
      const step = 0.005;
      const hC = heightAt(cell, localX, localY);
      const hR = heightAt(cell, Math.min(1.0, localX + step), localY);
      const hU = heightAt(cell, localX, Math.min(1.0, localY + step));

      const dx = (hR - hC) * 2.5;
      const dy = (hU - hC) * 2.5;
      const n = unit([-dx, -dy, 1.0]);

      normalRgba[offset + 0] = Math.round(clamp((n[0] * 0.5 + 0.5) * 255, 0, 255));
      normalRgba[offset + 1] = Math.round(clamp((n[1] * 0.5 + 0.5) * 255, 0, 255));
      normalRgba[offset + 2] = Math.round(clamp((n[2] * 0.5 + 0.5) * 255, 0, 255));
      normalRgba[offset + 3] = 255;

      // Specular map
      specRgba[offset + 0] = mat.specular;
      specRgba[offset + 1] = mat.specular;
      specRgba[offset + 2] = mat.specular;
      specRgba[offset + 3] = mat.reflection;

      // House color team recolor mask
      let houseMask = 0;
      if (cell === 1) {
        // Columbia cyan metallic trim
        houseMask = 255;
      } else if (cell === 9 && (localY > 0.65 || (localX > 0.45 && localY > 0.35))) {
        // Safety chevrons and HOA accent on side panel
        houseMask = 255;
      } else if (cell === 6 && (localX > 0.35 && localX < 0.65)) {
        // Cyan strobe lens
        houseMask = 200;
      }

      houseRgba[offset + 0] = houseMask;
      houseRgba[offset + 1] = houseMask;
      houseRgba[offset + 2] = houseMask;
      houseRgba[offset + 3] = 0;
    }
  }

  writeTga(path.join(outputDir, 'CSSweeperAtlas.tga'), size, diffuseRgba);
  writeTga(path.join(outputDir, 'CSSweeperNormal.tga'), size, normalRgba);
  writeTga(path.join(outputDir, 'CSSweeperSpec.tga'), size, specRgba);
  writeTga(path.join(outputDir, 'CSSweeperHouse.tga'), size, houseRgba);

  console.log(`[OK] Generated 4 ObjectsGDI texture maps in ${outputDir}:
     - CSSweeperAtlas.tga
     - CSSweeperNormal.tga
     - CSSweeperSpec.tga
     - CSSweeperHouse.tga`);
}

module.exports = {
  smoothNormals,
  tangentFrame,
  writeMaterialMaps,
  materialResponses,
};
