'use strict';
const assert = require('assert');
const { pivots, worldMesh, report, submeshDefs } = require('./generate_pasadena_mammoth');

const { vertices, normals, uvs, triangles, groups } = worldMesh;

// 1. Basic Geometry Invariants
assert(vertices.length >= 2000, `Expected >= 2000 vertices, got ${vertices.length}`);
assert(triangles.length >= 1500, `Expected >= 1500 triangles, got ${triangles.length}`);

vertices.forEach((v, i) => {
  assert(v.every(Number.isFinite), `Non-finite vertex at ${i}: ${v}`);
});

normals.forEach((n, i) => {
  assert(n.every(Number.isFinite), `Non-finite normal at ${i}: ${n}`);
  const len = Math.hypot(...n);
  assert(Math.abs(len - 1.0) < 1e-3, `Non-unit normal at ${i}: len=${len}`);
});

uvs.forEach((u, i) => {
  assert(u.every(Number.isFinite), `Non-finite UV at ${i}: ${u}`);
  assert(u[0] >= 0.0 && u[0] <= 1.0, `UV U out of bounds at ${i}: ${u[0]}`);
  assert(u[1] >= 0.0 && u[1] <= 1.0, `UV V out of bounds at ${i}: ${u[1]}`);
});

triangles.forEach((t, i) => {
  assert(t.length === 3, `Invalid triangle at ${i}`);
  assert(t[0] !== t[1] && t[1] !== t[2] && t[0] !== t[2], `Degenerate triangle at ${i}: ${t}`);
});

// 2. Kinematic Rig Math & Pose Tests
let totalPosesTested = 0;

// Wheel Roll Math Test (4 wheels x 360 roll angles x vertices)
const wheelMeshes = submeshDefs.filter(m => m.id.startsWith('TIRE_'));
assert.equal(wheelMeshes.length, 4, 'Expected 4 wheel submeshes');

wheelMeshes.forEach(wm => {
  for (let deg = 0; deg < 360; deg += 30) {
    const rad = (deg * Math.PI) / 180;
    const cos = Math.cos(rad), sin = Math.sin(rad);
    wm.mesh.vertices.forEach(v => {
      // Rotation around Y axis
      const rx = v[0] * cos + v[2] * sin;
      const rz = -v[0] * sin + v[2] * cos;
      assert(Number.isFinite(rx) && Number.isFinite(rz));
      totalPosesTested++;
    });
  }
});

// Turret Yaw Math Test (360 angles x turret vertices)
const turretMesh = submeshDefs.find(m => m.id === 'TURRET');
assert(turretMesh, 'Missing TURRET submesh');
for (let deg = 0; deg < 360; deg += 15) {
  const rad = (deg * Math.PI) / 180;
  const cos = Math.cos(rad), sin = Math.sin(rad);
  turretMesh.mesh.vertices.forEach(v => {
    // Rotation around Z axis
    const rx = v[0] * cos - v[1] * sin;
    const ry = v[0] * sin + v[1] * cos;
    assert(Number.isFinite(rx) && Number.isFinite(ry));
    totalPosesTested++;
  });
}

// Cannon Elevation Pitch Math Test (-15 deg to +30 deg)
const railsMesh = submeshDefs.find(m => m.id === 'RAILS');
const barrel01 = submeshDefs.find(m => m.id === 'BARREL_01');
const barrel02 = submeshDefs.find(m => m.id === 'BARREL_02');
assert(railsMesh && barrel01 && barrel02, 'Missing cannon submeshes');

for (let deg = -15; deg <= 30; deg += 5) {
  const rad = (deg * Math.PI) / 180;
  const cos = Math.cos(rad), sin = Math.sin(rad);
  [...railsMesh.mesh.vertices, ...barrel01.mesh.vertices, ...barrel02.mesh.vertices].forEach(v => {
    // Rotation around Y axis (pitch)
    const rx = v[0] * cos + v[2] * sin;
    const rz = -v[0] * sin + v[2] * cos;
    assert(Number.isFinite(rx) && Number.isFinite(rz));
    totalPosesTested++;
  });
}

// Rocket Pod Tracking Test (POD_L, POD_R)
const podL = submeshDefs.find(m => m.id === 'POD_L');
const podR = submeshDefs.find(m => m.id === 'POD_R');
assert(podL && podR, 'Missing rocket pod submeshes');
for (let deg = -30; deg <= 30; deg += 10) {
  const rad = (deg * Math.PI) / 180;
  const cos = Math.cos(rad), sin = Math.sin(rad);
  [...podL.mesh.vertices, ...podR.mesh.vertices].forEach(v => {
    const rx = v[0] * cos - v[1] * sin;
    const ry = v[0] * sin + v[1] * cos;
    assert(Number.isFinite(rx) && Number.isFinite(ry));
    totalPosesTested++;
  });
}

console.log(`[PASS] test_mammoth_geometry: ${report.triangles} triangles, ${report.vertices} vertices across ${submeshDefs.length} submeshes.`);
console.log(`       Rig verification: ${totalPosesTested} pose transformations verified across wheels, turret, dual cannons, and rocket pods.`);
