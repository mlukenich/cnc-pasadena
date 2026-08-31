'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { report, submeshes, w3x, worldMesh, pivots } = require('./generate_columbia_roundabout');

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

// 3. Legacy finite-arithmetic smoke tests, NOT collision or runtime verification.
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

// 4. Exterior winding. These expectations come from the vehicle exterior,
// independently of authored normals (the old inward triangles passed those).
const sub=(a,b)=>a.map((v,k)=>v-b[k]);
const dot=(a,b)=>a.reduce((s,v,k)=>s+v*b[k],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=a=>a.map(v=>v/Math.hypot(...a));
let exteriorChecks=0;
worldMesh.triangles.forEach((t,i)=>{
  const g=worldMesh.groups[i], p=t.map(v=>worldMesh.vertices[v]);
  const geometric=cross(sub(p[1],p[0]),sub(p[2],p[0]));
  assert(Math.hypot(...geometric)>1e-8,'Zero area geometry: '+g);
  const n=unit(geometric), c=[0,1,2].map(k=>p.reduce((s,v)=>s+v[k],0)/3/report.artScale);
  for(const vi of t) assert(dot(n,worldMesh.normals[vi])>.75,'Opposed shading normal: '+g);
  const uv=t.map(v=>worldMesh.uvs[v]);
  const det=(uv[1][0]-uv[0][0])*(uv[2][1]-uv[0][1])-(uv[2][0]-uv[0][0])*(uv[1][1]-uv[0][1]);
  assert(Math.abs(det)>1e-12,'Zero area UV: '+g);
  for(const v of uv) assert((v[1]*4)%1<.93,'Atlas caption sampled: '+g);
  let expected;
  if(/^wedge-glacis|^hull-deck-center|^rear-engine-deck|^hull-fairing-roof/.test(g)) expected=[0,0,1];
  if(/^skirt-armor|^skirt-enforcer-badge/.test(g)) expected=[0,Math.sign(c[1]),0];
  if(g==='hull-front-closeout'||g==='hull-front-sensor-face') expected=[1,0,0];
  if(g.includes('tire-tread')) expected=[c[0]-(g.includes('front')?13:-13),0,c[2]-4.8];
  if(/wheel-.*(tire-sidewall|planetary-rim)/.test(g)) expected=[0,Math.sign(c[1]),0];
  if(g.startsWith('gun-plasma-coil')) expected=[0,c[1]-(g.includes('coil--1-')?-2.4:2.4),c[2]-10.2];
  if(expected) { assert(dot(n,expected)>0,'Inward exterior: '+g); exteriorChecks++; }
});

// 5. Rigid partition, neutral reconstruction and world-space OBJ placement.
const pivot=i=>pivots[i].slice(2).map((v,k)=>v+(pivots[i][1]<0?0:pivot(pivots[i][1])[k]));
const key=p=>p.map(v=>v.toFixed(4)).join(',');
const worldPoints=new Set(worldMesh.vertices.map(key));
assert.equal(submeshes.reduce((s,m)=>s+m.mesh.triangles.length,0),worldMesh.triangles.length);
for(const {name,bone,mesh} of submeshes) {
  const o=pivot(bone);
  mesh.vertices.forEach(v=>assert(worldPoints.has(key(v.map((x,k)=>x+o[k]))),'Incorrect pivot: '+name));
  for(const g of mesh.groups) {
    if(g.startsWith('turret-')) assert.equal(name,'TURRET',g+' detached from yaw');
    if(g.startsWith('gun-')||g.startsWith('barrel-')) assert.equal(name,'GUN',g+' detached from pitch');
  }
  if(name.startsWith('TIRE_')) for(const angle of [0,.4,1.8,4.6]) for(const v of mesh.vertices) {
    const x=v[0]*Math.cos(angle)+v[2]*Math.sin(angle),z=-v[0]*Math.sin(angle)+v[2]*Math.cos(angle);
    assert(Math.abs(Math.hypot(x,z)-Math.hypot(v[0],v[2]))<1e-8,'Off-axis wheel roll');
  }
}
// Inspect the actual OBJ, not only the in-memory partition.
const objLines=fs.readFileSync(path.join(artDir,'CRRoundabout.obj'),'utf8').split(/\r?\n/);
const objVertices=objLines.filter(l=>l.startsWith('v ')).map(l=>l.split(/\s+/).slice(1).map(Number));
const objUvs=objLines.filter(l=>l.startsWith('vt ')).map(l=>l.split(/\s+/).slice(1).map(Number));
assert.equal(objVertices.length,report.vertices);
let offset=0;
for(const {bone,mesh} of submeshes) {
  const o=pivot(bone);
  mesh.vertices.forEach((v,i)=>{
    assert(Math.hypot(...sub(objVertices[offset+i],v.map((x,k)=>x+o[k])))<2e-6,'OBJ rigid part stacked at origin');
    assert(Math.abs(objUvs[offset+i][0]-mesh.uvs[i][0])<1e-6 && Math.abs(objUvs[offset+i][1]-(1-mesh.uvs[i][1]))<1e-6,'OBJ V convention differs from W3X');
  });
  offset+=mesh.vertices.length;
}
// Actual exported gun and primary FX share both pitch and yaw. The stock slot
// fires one weapon; choose the right-hand lens, rather than empty air between guns.
const muzzle=pivot(4), pitchOrigin=pivot(2);
const target=[25.9,-2.4,10.2].map(v=>v*report.artScale);
assert(Math.hypot(...sub(muzzle,target))<1e-6,'Primary FX is not on the lens');
assert.deepEqual(pivot(5),muzzle,'Flash and projectile origin differ');
for(const pitch of [-20,0,30]) for(const yaw of [-180,-90,0,90,180]) {
  const transform=p=>{
    const d=sub(p,pitchOrigin), a=pitch*Math.PI/180,b=yaw*Math.PI/180;
    const q=[d[0]*Math.cos(a)-d[2]*Math.sin(a)+pitchOrigin[0],p[1],d[0]*Math.sin(a)+d[2]*Math.cos(a)+pitchOrigin[2]];
    return [q[0]*Math.cos(b)-q[1]*Math.sin(b),q[0]*Math.sin(b)+q[1]*Math.cos(b),q[2]];
  };
  assert(Math.hypot(...sub(transform(muzzle),transform(target)))<1e-6,'FX separates from pitched/yawed lens');
}
// Neutral pose lightbar clearance, and analytic wheel crown versus fairing roof.
const points=g=>worldMesh.triangles.flatMap((t,i)=>g(worldMesh.groups[i])?t.map(v=>worldMesh.vertices[v].map(x=>x/report.artScale)):[]);
const light=points(g=>g==='turret-lightbar-frame'||g.startsWith('turret-strobe-lens'));
const mantlet=points(g=>g==='barrel-mantlet-housing');
assert(Math.max(...light.map(p=>p[0]))<Math.min(...mantlet.map(p=>p[0])),'Lightbar intersects neutral mantlet');
const tread=points(g=>g.includes('tire-tread'));
for(const p of tread) {
  assert(p[0]>-18 && p[0]<18,'Wheel extends into tapered fairing end');
  const roof=9.65-(Math.abs(p[1])-8.8)*.4/3.5;
  assert(roof-p[2]>.1,'Tire crown cuts through shoulder roof');
}
console.log(`[PASS] ${report.triangles} triangles, ${report.vertices} vertices; ${exteriorChecks} exterior winding checks; UV area/caption exclusion; rigid reconstruction; wheel axis; primary muzzle alignment; neutral lightbar and wheel-roof clearance.
Finite-arithmetic smoke samples: ${wheelTested+turretTested}. Full aim collision and live TankDraw motion are NOT established by these checks.`);
