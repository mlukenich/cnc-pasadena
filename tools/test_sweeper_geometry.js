'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { tangentFrame } = require('./sweeper_surface_pipeline');
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
assert.equal(submeshDefs.length, 14, 'Expected body, yaw mount, two pitched banks, brushes, wheels, and four tread-state definitions');
submeshDefs.forEach(({ id, mesh }) => {
  assert(mesh.vertices.length > 0, `Submesh ${id} has 0 vertices`);
  assert(mesh.triangles.length > 0, `Submesh ${id} has 0 triangles`);
});

// 4. Legacy finite-arithmetic smoke samples. These do not establish collision
// clearance, supported animation, or actual TankDraw behavior.
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

// 5. Independent exterior directions and UV/tangent validation.
const sub=(a,b)=>a.map((v,k)=>v-b[k]);
const dot=(a,b)=>a.reduce((s,v,k)=>s+v*b[k],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=a=>a.map(v=>v/Math.hypot(...a));
assert(report.triangles<=18000,'Review budget exceeded');
let exteriorChecks=0;
worldMesh.triangles.forEach((t,i)=>{
  const g=worldMesh.groups[i],p=t.map(v=>worldMesh.vertices[v]);
  const cr=cross(sub(p[1],p[0]),sub(p[2],p[0]));
  assert(Math.hypot(...cr)>1e-8,'Zero-area geometry: '+g);
  const n=unit(cr),c=[0,1,2].map(k=>p.reduce((s,v)=>s+v[k],0)/3);
  t.forEach(v=>assert(dot(n,worldMesh.normals[v])>.7,'Opposed normal: '+g));
  const uv=t.map(v=>worldMesh.uvs[v]),mat=worldMesh.materials[i];
  const det=(uv[1][0]-uv[0][0])*(uv[2][1]-uv[0][1])-(uv[2][0]-uv[0][0])*(uv[1][1]-uv[0][1]);
  assert(Math.abs(det)>1e-12,'Collapsed UV: '+g);
  for(const u of uv) assert(Math.floor(u[0]*4)+Math.floor(u[1]*4)*4===mat,'UV leaks into another atlas cell: '+g);
  let expected;
  if(g.startsWith('cab-windshield')) expected=[1,0,0];
  if(/^cab-side-window|^sanitizer-decal-panel|^sight-glass-face/.test(g)) expected=[0,Math.sign(c[1]),0];
  if(g==='tank-cylinder-body') expected=[0,c[1],c[2]-13];
  if(g==='tank-rear-dome') expected=[-1,0,0];
  if(g==='tank-front-dome') expected=[1,0,0];
  if(/^wheel-.*-tread$/.test(g)) expected=[c[0]-(g.includes('front')?14:-12),0,c[2]-5.5];
  if(/^wheel-.*-(rim|sidewall)$/.test(g)) expected=[0,g.includes('left')?1:-1,0];
  if(/^fender-.*-outer$/.test(g)) expected=[c[0]-(g.includes('front')?14:-12),0,c[2]-5.5];
  if(g.startsWith('brush-core')) {expected=[c[0]-20,c[1]-(g.includes('left')?14.5:-14.5),0];assert(n[2]>.1,'Brush cone normal must face upward/outward');}
  if(expected) {assert(dot(n,expected)>0,'Inward exterior: '+g);exteriorChecks++;}
});
const {tangents,binormals}=tangentFrame(worldMesh);
worldMesh.normals.forEach((n,i)=>{
  assert(Math.abs(Math.hypot(...tangents[i])-1)<1e-5 && Math.abs(Math.hypot(...binormals[i])-1)<1e-5,'Invalid tangent length');
  assert(Math.abs(dot(n,tangents[i]))<1e-5 && Math.abs(dot(n,binormals[i]))<1e-5 && Math.abs(dot(tangents[i],binormals[i]))<1e-5,'Non-orthogonal tangent frame');
});

// 6. Exact rigid reconstruction; tread-state duplication is deliberate.
const key=p=>p.map(v=>v.toFixed(4)).join(',');
const sourcePoints=new Set(worldMesh.vertices.map(key));
const unique=submeshDefs.filter(s=>!['TreadsMove','TreadsTurnLeft','TreadsTurnRight'].includes(s.id));
assert.equal(unique.reduce((s,m)=>s+m.mesh.triangles.length,0),worldMesh.triangles.length,'Dropped or duplicated unique geometry');
for(const {id,mesh,bone} of submeshDefs) {
  const o=worldPivot(bone);
  mesh.vertices.forEach(v=>assert(sourcePoints.has(key(v.map((x,k)=>x+o[k]))),'Incorrect local pivot: '+id));
  for(const g of mesh.groups) {
    if(g.startsWith('scrubber-')||g.startsWith('supply-')) assert.equal(id,'BODY','Static arm/hose rotates with brush or cannon: '+g);
    if(g.startsWith('fender-')) assert.equal(id,'BODY','Fender rotates with wheel');
  }
}
for(const {mesh,bone} of [...wheels,...brushes]) {
  const o=worldPivot(bone),isBrush=bone===4||bone===5;
  if(isBrush) for(const v of mesh.vertices) {
    const r=Math.hypot(v[0],v[1]);
    assert(Math.abs(o[0])+r<25 && Math.abs(o[1])+r<19,'Full 360-degree brush envelope exceeds simulation box');
  }
  for(const a of [0,.5,1.3,2.8,4.6]) for(const v of mesh.vertices) {
    const axis=isBrush?2:1,k=isBrush?1:2;
    const q=[...v];q[0]=v[0]*Math.cos(a)-v[k]*Math.sin(a);q[k]=v[0]*Math.sin(a)+v[k]*Math.cos(a);
    assert(Math.abs(q[axis]-v[axis])<1e-8 && Math.abs(Math.hypot(q[0],q[k])-Math.hypot(v[0],v[k]))<1e-8,'Rotation axis drifts');
    if(isBrush) {const world=q.map((x,k)=>x+o[k]);assert(Math.abs(world[0])<25&&Math.abs(world[1])<19&&world[2]>=.19,'Rotating brush exceeds simulation box/ground');}
  }
}
const points=filter=>worldMesh.triangles.flatMap((t,i)=>filter(worldMesh.groups[i])?t.map(v=>worldMesh.vertices[v]):[]);
const tire=points(g=>/^wheel-/.test(g));
for(const p of tire) {
  const cx=p[0]>0?14:-12;
  // The 16-segment fender opening is an inscribed polygon, not a perfect arc.
  assert(Math.hypot(p[0]-cx,p[2]-5.5)<5.55*Math.cos(Math.PI/32)-.15,'Wheel intersects fender opening');
}
const bumper=points(g=>g==='front-bumper-beam');
assert(Math.min(...bumper.map(p=>p[0]))>Math.max(...tire.map(p=>p[0]))+.25,'Bumper intersects front tire');
for(const p of points(g=>/^scrubber-(arm|actuator|feed-hose)/.test(g))) assert(p[0]>19.4,'Scrubber linkage crosses the front wheel envelope');
const cannon=points(g=>/^cannon-/.test(g));
const obstacles=points(g=>!/^cannon-|^mount-yaw/.test(g));
const bodyTop=Math.max(...obstacles.map(p=>p[2]));
// A vertical separation proof covers every yaw angle, including the rear tank,
// roof lamps, glass and wheels. Sweep the supported 0..90 degree elevation.
let clearance=Infinity;
for(let degree=0;degree<=90;degree++) {
  const a=degree*Math.PI/180;
  for(const p of cannon) {
    const z=23+(p[0]-7.5)*Math.sin(a)+(p[2]-23)*Math.cos(a);
    clearance=Math.min(clearance,z-bodyTop);
    assert(z>bodyTop+.4,'Elevated spray bank strikes cab/tank/roof light at pitch '+degree);
    assert(Math.abs(p[1])>=1.3-1e-8 && Math.abs(p[1])<=3.9+1e-8,'Pitch bank hits central drive or outer fork');
  }
}
assert.equal(pivots[16][0],'GunPitch');
assert.equal(pivots[16][1],1);
for(const [bone,side] of [[2,1],[3,-1]]) {
  const expected=[19.25,side*2.6,23];
  assert(Math.hypot(...sub(worldPivot(bone),expected))<1e-6,'Spray FX origin is not at nozzle mouth');
  assert.equal(pivots[bone][1],16,'FX must follow pitch beneath yaw');
  const part=submeshDefs.find(m=>m.bone===bone);
  assert(part.mesh.groups.some(g=>g.startsWith('cannon-nozzle-')),'Nozzle disconnected from FX parent');
}
const obj=fs.readFileSync(path.resolve(__dirname,'../src/Art/CS/CSSweeper.obj'),'utf8').split(/\r?\n/);
const ov=obj.filter(l=>l.startsWith('v ')).map(l=>l.split(/\s+/).slice(1).map(Number));
const ot=obj.filter(l=>l.startsWith('vt ')).map(l=>l.split(/\s+/).slice(1).map(Number));
assert.equal(ov.length,report.vertices);
let offset=0;
for(const {mesh,bone} of submeshDefs) {
  const o=worldPivot(bone);
  mesh.vertices.forEach((v,i)=>{
    assert(Math.hypot(...sub(ov[offset+i],v.map((x,k)=>x+o[k])))<2e-6,'OBJ lost rigid world placement');
    assert(Math.abs(ot[offset+i][0]-mesh.uvs[i][0])<1e-6 && Math.abs(ot[offset+i][1]-(1-mesh.uvs[i][1]))<1e-6,'OBJ/W3X UV convention mismatch');
  });offset+=mesh.vertices.length;
}
console.log(`[PASS] Sweeper: ${report.triangles} exported triangles, ${exteriorChecks} exterior checks; UV area/cell containment; tangent frames; rigid/OBJ reconstruction; axle/brush invariants; brush bounds; neutral fender, bumper, linkage, cannon clearances; nozzle FX placement.`);
const {w3x}=require('./generate_columbia_sweeper');
assert(w3x.includes('W3DAnimation id="CSSWEEPER_SCRUB"'));
for(const bone of [4,5]) assert(w3x.includes('ChannelQuaternion Pivot="'+bone+'"'));
console.log(`Full yaw / 0..90 elevation clears body and lights by at least ${clearance.toFixed(3)} units. Brush clip and TruckDraw bindings require live verification.`);
