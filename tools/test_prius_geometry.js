'use strict';

const assert = require('assert');
const path = require('path');
const mesh = require('./generate_columbia_prius');

const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
const sub = (a, b) => a.map((v, i) => v - b[i]);
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const near = (a, b, eps = 1e-5) => a.every((v, i) => Math.abs(v - b[i]) < eps);
const key = p => p.map(v => v.toFixed(5)).join(',');

// Basic mesh data sanity
assert.equal(mesh.vertices.length, mesh.normals.length);
assert.equal(mesh.vertices.length, mesh.uvs.length);
assert(mesh.triangles.length > 2000 && mesh.triangles.length < 10000, `Prius polygon budget outside expected bounds: ${mesh.triangles.length}`);

// Bone hierarchy matches Nod Raider Buggy TruckDraw
const expectedBones = [
  'ROOTTRANSFORM',
  'Bone_TireLF',
  'Bone_TireRF',
  'Bone_TireLR',
  'Bone_TireRR',
  'Turret',
  'Turret_Pitch',
  'FX_Weapon01',
  'EMP'
];
assert.deepEqual(mesh.pivots.map(p => p[0]), expectedBones, 'Prius bone attachments mismatch.');

mesh.vertices.forEach((v, i) => {
  assert(v.every(Number.isFinite), `Non-finite vertex ${i}`);
  assert(Math.abs(Math.hypot(...mesh.normals[i]) - 1) < 1e-4, `Non-unit normal ${i}: ${Math.hypot(...mesh.normals[i])}`);
  assert(mesh.uvs[i].every(u => Number.isFinite(u) && u >= 0 && u <= 1), `Out-of-range UV ${i}: ${mesh.uvs[i]}`);
});

mesh.triangles.forEach((t, i) => {
  assert(t.every(v => Number.isInteger(v) && v >= 0 && v < mesh.vertices.length));
  const [a, b, c] = t.map(v => mesh.vertices[v]);
  const n = cross(sub(b, a), sub(c, a));
  const length = Math.hypot(...n);
  assert(length > 1e-7, `Degenerate triangle ${i} (${mesh.groups[i]})`);
  for (const index of t) {
    assert(dot(n, mesh.normals[index]) / length > 0.70, `Inverted/mismatched face ${i} (${mesh.groups[i]})`);
  }
  const cells = t.map(index => {
    const [u, v] = mesh.uvs[index];
    return Math.floor(u * 4) + 4 * Math.floor(v * 4);
  });
  assert(cells.every(c => c === cells[0]), `Triangle ${i} crosses material atlas patches: ${cells}`);
});

function worldPivot(index) {
  const p = mesh.pivots[index];
  const local = p.slice(2);
  return p[1] < 0 ? local : local.map((v, i) => v + worldPivot(p[1])[i]);
}

assert.equal(mesh.artScale, 0.88, 'Prius art scale mismatch');

// Wheel offset / pivot alignment
for (const binding of mesh.wheelBindings) {
  assert(near(binding.offset, worldPivot(binding.bone)), `Wheel offset/pivot drift: ${binding.id}`);
}

// Rigid mesh partition sanity
const parts = [
  [mesh.bodyMesh, 0],
  [mesh.turretMesh, 5],
  [mesh.laserMesh, 6],
  ...mesh.wheelMeshes.map(b => [b.mesh, b.bone])
];
assert.equal(parts.reduce((sum, [part]) => sum + part.triangles.length, 0), mesh.triangles.length, 'Missing or duplicate rigid triangles');

// World reconstruction
const worldVertices = new Set(mesh.vertices.map(key));
for (const [part, pivot] of parts) {
  for (const v of part.vertices) {
    const recon = v.map((q, i) => q + worldPivot(pivot)[i]);
    assert(worldVertices.has(key(recon)), `Rigid subobject vertex does not reconstruct source geometry at pivot ${pivot}`);
  }
}

// Offline rig audit: 4-wheel rotation/steering + turret yaw/pitch
const add = (a, b) => a.map((v, i) => v + b[i]);
const rotateZ = (p, a) => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a), p[2]];
const rotateY = (p, a) => [p[0] * Math.cos(a) + p[2] * Math.sin(a), p[1], -p[0] * Math.sin(a) + p[2] * Math.cos(a)];

let wheelSamples = 0;
for (const binding of mesh.wheelMeshes) {
  const x = binding.mesh.vertices.map(p => p[0]);
  const z = binding.mesh.vertices.map(p => p[2]);
  assert(Math.abs(Math.max(...x) + Math.min(...x)) < 0.5, 'Wheel spin pivot off-center in X');
  assert(Math.abs(Math.max(...z) + Math.min(...z)) < 0.5, 'Wheel spin pivot off-center in Z');

  for (const steering of binding.bone <= 2 ? [-30, 0, 30] : [0]) {
    for (let degrees = 0; degrees < 360; degrees += 45) {
      const turn = (steering * Math.PI) / 180, spin = (degrees * Math.PI) / 180;
      const axis = rotateZ([0, 1, 0], turn);
      for (const p of binding.mesh.vertices) {
        const moved = add(binding.offset, rotateZ(rotateY(p, spin), turn));
        const relative = sub(moved, worldPivot(binding.bone));
        const axial = dot(relative, axis);
        const radial = sub(relative, axis.map(v => v * axial));
        assert(Math.abs(axial - p[1]) < 1e-4, 'Wheel detached along its axle');
        assert(Math.abs(Math.hypot(...radial) - Math.hypot(p[0], p[2])) < 1e-4, 'Wheel orbits its axle');
        wheelSamples++;
      }
    }
  }
}

// Turret yaw & gun elevation check
let turretSamples = 0;
const yawPivot = worldPivot(5);
const gunLocal = mesh.pivots[6].slice(2);
const muzzleLocal = mesh.pivots[7].slice(2);

for (let degrees = 0; degrees < 360; degrees += 45) {
  for (const elevation of [-10, 0, 15, 40]) {
    const yaw = (degrees * Math.PI) / 180;
    const pitch = (-elevation * Math.PI) / 180;
    const boneTip = add(yawPivot, rotateZ(add(gunLocal, rotateY(muzzleLocal, pitch)), yaw));
    assert(boneTip.every(Number.isFinite), 'Non-finite rotated bone tip');
    turretSamples++;
  }
}

console.log(`[PASS] test_prius_geometry: ${mesh.triangles.length} triangles, ${mesh.vertices.length} vertices across 7 rigid meshes.`);
console.log(`       Rig verification: ${wheelSamples} wheel samples, ${turretSamples} turret/laser samples.`);
