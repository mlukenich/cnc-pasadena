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
    const smoothGroup = /^(hood-top|roof-surface|windshield|rear-glass|side-glass|fender-flare.*|front-bumper-curve|rear-bumper-curve|wheel-rim.*|wheel-tire.*|turret-dome|laser-barrel.*|emp-dish.*)$/.test(g);
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
        if (dot(old[i], old[j]) > 0.45) {
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

// Technical height function for generating tangent normal map
function heightAt(cell, u, v) {
  let h = 0.5;

  // Solar cells pattern on roof (Cell 10)
  if (cell === 10) {
    const gridX = Math.abs(Math.sin(u * Math.PI * 16));
    const gridY = Math.abs(Math.sin(v * Math.PI * 24));
    h += (gridX > 0.95 || gridY > 0.95) ? -0.04 : 0.02;
  }
  // Hood styling grooves (Cell 8)
  if (cell === 8) {
    const groove1 = Math.exp(-Math.pow((Math.abs(u - 0.5) - 0.28) / 0.02, 2));
    const groove2 = Math.exp(-Math.pow((Math.abs(u - 0.5) - 0.42) / 0.015, 2));
    h -= 0.05 * (groove1 + groove2);
  }
  // Door panel enforcement emblem contour (Cell 9)
  if (cell === 9) {
    const r = Math.hypot(u - 0.5, v - 0.5);
    if (r < 0.32 && r > 0.28) h += 0.06; // circular seal border
    if (r < 0.28 && r > 0.26) h += 0.04;
  }
  // Tire tread grooves (Cell 14)
  if (cell === 14) {
    const treadPattern = Math.sin(v * Math.PI * 32) * Math.sin(u * Math.PI * 8);
    h += 0.08 * (treadPattern > 0.2 ? 1 : -1);
  }
  // Front LED grille ribs (Cell 12)
  if (cell === 12) {
    h += 0.05 * Math.sin(v * Math.PI * 20);
  }
  // Laser emitter muzzle grooves (Cell 15)
  if (cell === 15) {
    const rL = Math.hypot(u - 0.3, v - 0.5);
    const rR = Math.hypot(u - 0.7, v - 0.5);
    if (rL < 0.15 || rR < 0.15) h -= 0.12; // aperture bore
  }

  return h;
}

// Shader response and material definitions
// Pearl white & cyan paint ceilings strictly <= 14 to prevent sun wash-out in ObjectsGDI.fx
const materialResponses = [
  { name: 'pearl paint', specular: 12, reflection: 0 },
  { name: 'cyan trim', specular: 14, reflection: 0 },
  { name: 'matte rubber', specular: 2, reflection: 0 },
  { name: 'chrome trim', specular: 95, reflection: 25 },
  { name: 'solar glass', specular: 85, reflection: 35 },
  { name: 'carbon fiber', specular: 4, reflection: 0 },
  { name: 'citation strobe', specular: 90, reflection: 20 },
  { name: 'gunmetal alloy', specular: 45, reflection: 5 },
  { name: 'hood panel', specular: 12, reflection: 0 },
  { name: 'door emblem panel', specular: 12, reflection: 0 },
  { name: 'solar roof matrix', specular: 70, reflection: 25 },
  { name: 'rear hatch/spoiler', specular: 12, reflection: 0 },
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

  // Palette base definitions
  const colors = [
    [236, 240, 245], // 0: Pearl White body
    [0, 168, 204],   // 1: Columbia Cyan
    [25, 26, 28],    // 2: Eco Rubber
    [220, 225, 230], // 3: Chrome
    [16, 32, 54],    // 4: Solar Blue Glass
    [32, 34, 36],    // 5: Carbon Fiber
    [255, 60, 40],   // 6: Strobe Amber/Red
    [48, 50, 56],    // 7: Gunmetal
    [232, 236, 242], // 8: Hood
    [235, 239, 244], // 9: Door
    [18, 38, 62],    // 10: Solar Roof
    [232, 236, 242], // 11: Rear Hatch
    [30, 32, 36],    // 12: Front Fascia / LED
    [220, 225, 230], // 13: Team Badge
    [22, 23, 25],    // 14: Tire Tread
    [40, 42, 48],    // 15: Laser Face
  ];

  for (let y = 0; y < size; y++) {
    const row = Math.floor(y / cellSize);
    const localY = (y % cellSize) / cellSize;

    for (let x = 0; x < size; x++) {
      const col = Math.floor(x / cellSize);
      const localX = (x % cellSize) / cellSize;
      const cell = row * 4 + col;
      const offset = (y * size + x) * 4;

      const baseColor = [...colors[cell]];
      const mat = materialResponses[cell];

      // Procedural detailing per cell
      let isTeamColor = (cell === 1 || cell === 13);
      let teamAlpha = isTeamColor ? 255 : 0;

      // Carbon fiber micro-weave
      if (cell === 5) {
        const weave = ((Math.floor(x / 2) + Math.floor(y / 2)) % 2 === 0) ? 12 : -12;
        baseColor[0] = clamp(baseColor[0] + weave, 0, 255);
        baseColor[1] = clamp(baseColor[1] + weave, 0, 255);
        baseColor[2] = clamp(baseColor[2] + weave, 0, 255);
      }

      // Solar Roof Matrix (Cell 10)
      if (cell === 10) {
        const gridX = Math.abs(Math.sin(localX * Math.PI * 16));
        const gridY = Math.abs(Math.sin(localY * Math.PI * 24));
        if (gridX > 0.95 || gridY > 0.95) {
          baseColor[0] = 70; baseColor[1] = 90; baseColor[2] = 120; // grid wire
        }
      }

      // Door Enforcement Emblem (Cell 9)
      if (cell === 9) {
        const r = Math.hypot(localX - 0.5, localY - 0.5);
        if (r < 0.32 && r > 0.28) {
          baseColor[0] = 0; baseColor[1] = 168; baseColor[2] = 204; // cyan badge ring
        } else if (r <= 0.28 && r > 0.05) {
          baseColor[0] = 245; baseColor[1] = 248; baseColor[2] = 252;
          // Star/shield in center
          if (r < 0.15 && Math.abs(localX - 0.5) < 0.08) {
            baseColor[0] = 0; baseColor[1] = 168; baseColor[2] = 204;
          }
        }
      }

      // Front Fascia LED strips (Cell 12)
      if (cell === 12) {
        if (localY > 0.35 && localY < 0.45) {
          baseColor[0] = 220; baseColor[1] = 245; baseColor[2] = 255; // White LED beam
        }
      }

      // Strobe Lightbar (Cell 6)
      if (cell === 6) {
        if (localX < 0.48) {
          baseColor[0] = 240; baseColor[1] = 20; baseColor[2] = 30; // Red strobe
        } else if (localX > 0.52) {
          baseColor[0] = 20; baseColor[1] = 100; baseColor[2] = 255; // Blue strobe
        } else {
          baseColor[0] = 255; baseColor[1] = 180; baseColor[2] = 0; // Amber center
        }
      }

      // Laser Emitter Face (Cell 15)
      if (cell === 15) {
        const rL = Math.hypot(localX - 0.3, localY - 0.5);
        const rR = Math.hypot(localX - 0.7, localY - 0.5);
        if (rL < 0.12 || rR < 0.12) {
          baseColor[0] = 10; baseColor[1] = 15; baseColor[2] = 25; // bore hole
        } else if (rL < 0.18 || rR < 0.18) {
          baseColor[0] = 0; baseColor[1] = 180; baseColor[2] = 220; // cyan diode lens
        }
      }

      // Team Badge Trim (Cell 13)
      if (cell === 13) {
        teamAlpha = 255;
        baseColor[0] = 180; baseColor[1] = 180; baseColor[2] = 180;
      }

      // 1. Diffuse (RGBA)
      diffuseRgba[offset] = baseColor[0];
      diffuseRgba[offset + 1] = baseColor[1];
      diffuseRgba[offset + 2] = baseColor[2];
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
      specRgba[offset + 2] = (cell === 6 || (cell === 12 && localY > 0.35 && localY < 0.45)) ? 180 : 0; // glow for strobe/LED
      specRgba[offset + 3] = 255;

      // 4. RecolorTexture: Grayscale luminance in RGB, team color mask in Alpha
      const lum = Math.round(0.299 * baseColor[0] + 0.587 * baseColor[1] + 0.114 * baseColor[2]);
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
  const size = 128;
  const rgba = Buffer.alloc(size * size * 4);

  // Stylized Columbia Prius UI Portrait
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const offset = (y * size + x) * 4;
      const u = x / size, v = y / size;

      // Clean high-tech gradient background
      let r = Math.round(15 + v * 25 + (1 - u) * 20);
      let g = Math.round(35 + v * 40 + (1 - u) * 35);
      let b = Math.round(55 + v * 60 + (1 - u) * 45);

      // Prius silhouette / front three-quarter outline
      const carDx = (u - 0.5) * 1.4;
      const carDy = (v - 0.58) * 1.8;
      const inBody = (Math.abs(carDx) < 0.45 && carDy > -0.25 && carDy < 0.35 && (carDy > -0.05 || Math.abs(carDx) < 0.32));
      const inRoof = (carDy >= -0.28 && carDy <= -0.05 && Math.abs(carDx) < 0.28 - (carDy + 0.05) * 0.4);
      const inStrobe = (carDy >= -0.34 && carDy < -0.28 && Math.abs(carDx) < 0.18);

      if (inBody || inRoof) {
        // High-gloss Pearl White with Cyan accents
        r = 230 + Math.round((1 - carDy) * 20);
        g = 238 + Math.round((1 - carDy) * 15);
        b = 245;
        if (Math.abs(carDx) > 0.35 || carDy > 0.25) {
          // Cyan lower rocker / bumper trim
          r = 0; g = 168; b = 204;
        }
        if (inRoof && carDy < -0.1) {
          // Solar glass
          r = 20; g = 45; b = 75;
        }
        if (carDy > 0.15 && carDy < 0.22 && Math.abs(carDx) < 0.35 && Math.abs(carDx) > 0.15) {
          // LED Headlights
          r = 240; g = 250; b = 255;
        }
      } else if (inStrobe) {
        // Flashing citation lightbar
        if (carDx < 0) { r = 240; g = 30; b = 40; }
        else { r = 30; g = 120; b = 255; }
      }

      // Border framing
      if (x < 2 || x >= size - 2 || y < 2 || y >= size - 2) {
        r = 0; g = 168; b = 204; // Columbia Cyan frame
      }

      rgba[offset] = clamp(r, 0, 255);
      rgba[offset + 1] = clamp(g, 0, 255);
      rgba[offset + 2] = clamp(b, 0, 255);
      rgba[offset + 3] = 255;
    }
  }

  writeTga(path.join(outputDir, 'CVPriusPortrait.tga'), size, rgba);
}

module.exports = {
  smoothNormals,
  tangentFrame,
  writeTga,
  heightAt,
  materialResponses,
  writeMaterialMaps,
  writePortraitTga,
};
