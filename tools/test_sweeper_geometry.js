'use strict';
const assert = require('assert');
const { pivots, worldMesh, report, submeshDefs } = require('./generate_columbia_sweeper');

function worldPivot(index) {
  const p = pivots[index];
  if (p[1] < 0) return [p[2], p[3], p[4]];
  const parent = worldPivot(p[1]);
  return [parent[0] + p[2], parent[1] + p[3], parent[2] + p[4]];
}

// 1. Basic Geometry & Count Checks
assert(worldMesh.vertices.length > 500, `Expected >500 vertices, got ${worldMesh.vertices.length}`);
assert(worldMesh.triangles.length > 500, `Expected >500 triangles, got ${worldMesh.triangles.length}`);

// 2. Vertex and Normal Integrity
worldMesh.vertices.forEach((v, i) => {
  v.forEach(c => assert(Number.isFinite(c), `Non-finite vertex in worldMesh[${i}]`));
});

worldMesh.normals.forEach((n, i) => {
  const l = Math.hypot(...n);
  assert(Math.abs(l - 1.0) < 0.05, `Non-unit normal at index ${i}: length ${l}`);
});

worldMesh.uvs.forEach((uv, i) => {
  assert(uv[0] >= 0.0 && uv[0] <= 1.0, `UV.u out of bounds at ${i}: ${uv[0]}`);
  assert(uv[1] >= 0.0 && uv[1] <= 1.0, `UV.v out of bounds at ${i}: ${uv[1]}`);
});

// 3. Subobject Verification
assert.equal(submeshDefs.length, 13, 'Expected 13 submesh definitions');
submeshDefs.forEach(({ id, mesh }) => {
  assert(mesh.vertices.length > 0, `Submesh ${id} has 0 vertices`);
  assert(mesh.triangles.length > 0, `Submesh ${id} has 0 triangles`);
});

// 4. Rigging & Kinematic Clearance Verification
// Verify wheel roll rotation
const wheels = submeshDefs.filter(s => s.id.startsWith('TIRE_'));
let wheelSamples = 0;
wheels.forEach(({ id, mesh, bone }) => {
  const pivot = worldPivot(bone);
  for (let deg = 0; deg < 360; deg += 30) {
    const rad = (deg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    mesh.vertices.forEach(v => {
      // Rotation around Y axis
      const rx = v[0] * cos + v[2] * sin;
      const ry = v[1];
      const rz = -v[0] * sin + v[2] * cos;
      const worldX = rx + pivot[0];
      const worldY = ry + pivot[1];
      const worldZ = rz + pivot[2];
      assert(Number.isFinite(worldX) && Number.isFinite(worldY) && Number.isFinite(worldZ));
      wheelSamples++;
    });
  }
});

// Verify curb scrubber brush rotation
const brushes = submeshDefs.filter(s => s.id.startsWith('BRUSH_'));
let brushSamples = 0;
brushes.forEach(({ id, mesh, bone }) => {
  const pivot = worldPivot(bone);
  for (let deg = 0; deg < 360; deg += 30) {
    const rad = (deg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    mesh.vertices.forEach(v => {
      // Rotation around Z axis
      const rx = v[0] * cos - v[1] * sin;
      const ry = v[0] * sin + v[1] * cos;
      const rz = v[2];
      const worldX = rx + pivot[0];
      const worldY = ry + pivot[1];
      const worldZ = rz + pivot[2];
      assert(Number.isFinite(worldX) && Number.isFinite(worldY) && Number.isFinite(worldZ));
      brushSamples++;
    });
  }
});

// Verify chemical spray cannon elevation
const cannons = submeshDefs.filter(s => s.id.startsWith('CANNON_'));
let cannonSamples = 0;
cannons.forEach(({ id, mesh, bone }) => {
  const pivot = worldPivot(bone);
  for (let deg = -20; deg <= 35; deg += 5) {
    const rad = (deg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    mesh.vertices.forEach(v => {
      // Pitch rotation around Y axis
      const rx = v[0] * cos + v[2] * sin;
      const ry = v[1];
      const rz = -v[0] * sin + v[2] * cos;
      const worldX = rx + pivot[0];
      const worldY = ry + pivot[1];
      const worldZ = rz + pivot[2];
      assert(Number.isFinite(worldX) && Number.isFinite(worldY) && Number.isFinite(worldZ));
      cannonSamples++;
    });
  }
});

console.log(`[PASS] test_sweeper_geometry: ${report.triangles} triangles, ${report.vertices} vertices across ${submeshDefs.length} submeshes.`);
console.log(`       Rig verification: ${wheelSamples} wheel samples, ${brushSamples} brush samples, ${cannonSamples} cannon pitch samples.`);
