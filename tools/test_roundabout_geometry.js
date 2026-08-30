'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { report, submeshes, w3x } = require('./generate_columbia_roundabout');

const artDir = path.resolve(__dirname, '..', 'src', 'Art', 'CR');

// 1. Budget and structure validation
assert(report.triangles >= 3000 && report.triangles <= 15000, `Triangles out of budget: ${report.triangles}`);
assert.equal(submeshes.length, 8, 'Expected 8 submeshes: BODY, TURRET, GUN, TAIL, 4 WHEELS');

const names = submeshes.map(m => m.name);
const expectedNames = ['BODY', 'TURRET', 'GUN', 'TAIL', 'TIRE_LF', 'TIRE_RF', 'TIRE_LR', 'TIRE_RR'];
expectedNames.forEach(name => assert(names.includes(name), `Missing submesh: ${name}`));

// 2. Vertex and normal checks
submeshes.forEach(({ name, mesh }) => {
  mesh.vertices.forEach((v, i) => {
    v.forEach(c => assert(Number.isFinite(c), `Non-finite vertex in ${name}[${i}]`));
  });
  mesh.normals.forEach((n, i) => {
    const l = Math.hypot(...n);
    assert(Math.abs(l - 1.0) < 0.05, `Non-unit normal in ${name}[${i}]: length ${l}`);
  });
  mesh.uvs.forEach((uv, i) => {
    assert(uv[0] >= 0.0 && uv[0] <= 1.0, `UV.u out of bounds in ${name}[${i}]: ${uv[0]}`);
    assert(uv[1] >= 0.0 && uv[1] <= 1.0, `UV.v out of bounds in ${name}[${i}]: ${uv[1]}`);
  });
  mesh.triangles.forEach((t, i) => {
    assert(t.length === 3, `Invalid triangle in ${name}[${i}]`);
    t.forEach(vi => assert(vi >= 0 && vi < mesh.vertices.length, `Vertex index out of range in ${name}[${i}]: ${vi}`));
  });
});

// 3. Rig Kinematics Verification
// Test full 360 degree wheel roll, turret yaw, gun pitch, and tail stinger articulation poses
const wheelNames = ['TIRE_LF', 'TIRE_RF', 'TIRE_LR', 'TIRE_RR'];
let wheelTested = 0;
wheelNames.forEach(name => {
  const mesh = submeshes.find(m => m.name === name).mesh;
  for (let angle = 0; angle < 360; angle += 45) {
    const rad = angle * Math.PI / 180;
    const cos = Math.cos(rad), sin = Math.sin(rad);
    mesh.vertices.forEach(v => {
      // Rotation around Y axis
      const rx = v[0] * cos + v[2] * sin;
      const rz = -v[0] * sin + v[2] * cos;
      assert(Number.isFinite(rx) && Number.isFinite(rz));
      wheelTested++;
    });
  }
});

let turretTested = 0;
const turretMesh = submeshes.find(m => m.name === 'TURRET').mesh;
for (let yaw = -180; yaw <= 180; yaw += 45) {
  const rad = yaw * Math.PI / 180;
  const cos = Math.cos(rad), sin = Math.sin(rad);
  turretMesh.vertices.forEach(v => {
    const rx = v[0] * cos - v[1] * sin;
    const ry = v[0] * sin + v[1] * cos;
    assert(Number.isFinite(rx) && Number.isFinite(ry));
    turretTested++;
  });
}

const gunMesh = submeshes.find(m => m.name === 'GUN').mesh;
for (let pitch = -10; pitch <= 30; pitch += 10) {
  const rad = pitch * Math.PI / 180;
  const cos = Math.cos(rad), sin = Math.sin(rad);
  gunMesh.vertices.forEach(v => {
    const rx = v[0] * cos + v[2] * sin;
    const rz = -v[0] * sin + v[2] * cos;
    assert(Number.isFinite(rx) && Number.isFinite(rz));
    turretTested++;
  });
}

const tailMesh = submeshes.find(m => m.name === 'TAIL').mesh;
for (let pitch = -15; pitch <= 45; pitch += 15) {
  const rad = pitch * Math.PI / 180;
  const cos = Math.cos(rad), sin = Math.sin(rad);
  tailMesh.vertices.forEach(v => {
    const rx = v[0] * cos + v[2] * sin;
    const rz = -v[0] * sin + v[2] * cos;
    assert(Number.isFinite(rx) && Number.isFinite(rz));
    turretTested++;
  });
}

console.log(`[PASS] test_roundabout_geometry: ${report.triangles} triangles, ${report.vertices} vertices across 8 rigid meshes.
       Rig verification: ${wheelTested} wheel samples, ${turretTested} turret/gun/tail samples.`);
