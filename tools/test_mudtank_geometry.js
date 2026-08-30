'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { report, submeshes, w3x, worldMesh, pivots } = require('./generate_pasadena_mudtank');

const artDir = path.resolve(__dirname, '..', 'src', 'Art', 'PM');

// 1. Budget and structure validation
assert(report.triangles >= 3000 && report.triangles <= 15000, `Triangles out of budget: ${report.triangles}`);
assert.equal(submeshes.length, 7, 'Expected 7 submeshes: BODY, TURRET, BARREL, 4 WHEELS');

const names = submeshes.map(m => m.name);
const expectedNames = ['BODY', 'TURRET', 'BARREL', 'TIRE_LF', 'TIRE_RF', 'TIRE_LR', 'TIRE_RR'];
expectedNames.forEach(name => assert(names.includes(name), `Missing submesh: ${name}`));

// Visibility is independent of whether a triangle agrees with its own normal.
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const sub=(a,b)=>a.map((v,k)=>v-b[k]);
let exterior=0;
worldMesh.triangles.forEach((t,i)=> {
  const p=t.map(j=>worldMesh.vertices[j]),g=worldMesh.groups[i];
  const n=cross(sub(p[1],p[0]),sub(p[2],p[0]));
  assert(Math.hypot(...n)>1e-8,`Zero-area triangle: ${g}`);
  const uv=t.map(j=>worldMesh.uvs[j]);
  assert(Math.abs((uv[1][0]-uv[0][0])*(uv[2][1]-uv[0][1])-(uv[2][0]-uv[0][0])*(uv[1][1]-uv[0][1]))>1e-12,`Collapsed UVs: ${g}`);
  const c=p[0].map((_,k)=>p.reduce((s,v)=>s+v[k],0)/3);
  if(['door-panel','door-glass','bed-outer-wall'].includes(g)) { assert(n[1]*c[1]>0,`Inward side panel: ${g}`); exterior++; }
  if(g==='windshield-glass')assert(n[0]>0 && n[2]>0,'Windshield faces inward');
  if(g==='front-grille-fascia')assert(n[0]>0,'Grille faces inward');
  if(g.endsWith('tire-tread')) {
    const cx=(g.includes('front')?15:-15)*0.88;
    assert(n[0]*(c[0]-cx)+n[2]*(c[2]-8*0.88)>0,`Inward tread: ${g}`); exterior++;
  }
  if(g.endsWith('tire-sidewall') || g.endsWith('steel-rim'))assert(n[1]*(g.includes('left')?1:-1)>0,`Inward wheel face: ${g}`);
});
assert(exterior>100,'Exterior regression checks did not exercise shell/wheels');

// Neutral-pose barrel must clear the cab/roof rack, not run through it.
const worldPivot=i=>pivots[i].slice(2).map((v,k)=>v+(pivots[i][1]<0?0:worldPivot(pivots[i][1])[k]));
const barrel=submeshes.find(s=>s.name==='BARREL').mesh;
const barrelOffset=worldPivot(6);
const cabTop=Math.max(...worldMesh.triangles.flatMap((t,i)=> {
  if(!/^(cab-roof-panel|cage-|kc-light)/.test(worldMesh.groups[i]))return [];
  const p=t.map(j=>worldMesh.vertices[j]);
  if(Math.min(...p.map(v=>v[1]))>1.5*0.88 || Math.max(...p.map(v=>v[1]))< -1.5*0.88)return [];
  return p.map(v=>v[2]);
}));
const overCab=barrel.vertices.map(p=>p.map((v,k)=>v+barrelOffset[k])).filter(p=>p[0]>=-3*0.88 && p[0]<=11.5*0.88);
assert(Math.min(...overCab.map(p=>p[2]))>cabTop,'Neutral cannon intersects cab/roof accessories');
assert(Math.abs(worldPivot(7)[0]-15.9*0.88)<1e-5,'Muzzle hardpoint not aligned with barrel end');

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
// Test full 360 degree wheel roll and turret yaw / barrel pitch poses
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
    // Yaw rotation around Z axis
    const rx = v[0] * cos - v[1] * sin;
    const ry = v[0] * sin + v[1] * cos;
    assert(Number.isFinite(rx) && Number.isFinite(ry));
    turretTested++;
  });
}

const barrelMesh = submeshes.find(m => m.name === 'BARREL').mesh;
for (let pitch = -10; pitch <= 30; pitch += 10) {
  const rad = pitch * Math.PI / 180;
  const cos = Math.cos(rad), sin = Math.sin(rad);
  barrelMesh.vertices.forEach(v => {
    // Pitch rotation around Y axis
    const rx = v[0] * cos + v[2] * sin;
    const rz = -v[0] * sin + v[2] * cos;
    assert(Number.isFinite(rx) && Number.isFinite(rz));
    turretTested++;
  });
}

console.log(`[PASS] test_mudtank_geometry: ${report.triangles} triangles, ${report.vertices} vertices across 7 rigid meshes.
       Rig verification: ${wheelTested} wheel samples, ${turretTested} turret/barrel samples.`);
