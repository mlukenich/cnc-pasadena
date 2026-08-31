'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const mesh=require('./generate_pasadena_dually');
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
assert.equal(mesh.vertices.length,mesh.normals.length);
assert.equal(mesh.vertices.length,mesh.uvs.length);
assert(mesh.triangles.length>5000&&mesh.triangles.length<12000,'Exemplar polygon budget exceeded.');
const expected=['ROOTTRANSFORM','Tire01','Tire02','Tire03','Tire04','Turret','B_ Gun','FXWEAPON01','FXWEAPON02','mortortube','B_SPOTLIGHT'];
assert.deepEqual(mesh.pivots.map(p=>p[0]),expected,'Stock attachment names changed.');
mesh.vertices.forEach((v,i)=>{
  assert(v.every(Number.isFinite),`Non-finite vertex ${i}`);
  assert(Math.abs(Math.hypot(...mesh.normals[i])-1)<1e-6,`Non-unit normal ${i}`);
  assert(mesh.uvs[i].every(u=>Number.isFinite(u)&&u>0&&u<1),`Out-of-range UV ${i}`);
});
mesh.triangles.forEach((t,i)=>{
  assert(t.every(v=>Number.isInteger(v)&&v>=0&&v<mesh.vertices.length));
  const [a,b,c]=t.map(v=>mesh.vertices[v]),n=cross(sub(b,a),sub(c,a)),length=Math.hypot(...n);
  assert(length>1e-7,`Degenerate triangle ${i} (${mesh.groups[i]})`);
  for(const index of t)assert(dot(n,mesh.normals[index])/length>.78,`Inverted/mismatched face ${i} (${mesh.groups[i]})`);
  const cells=t.map(index=>{const [u,v]=mesh.uvs[index];return Math.floor(u*4)+4*Math.floor(v*4);});
  assert(cells.every(c=>c===cells[0]),`Triangle ${i} crosses material patches`);
});
// Verify world-space muzzle points are at the modeled barrel tips, not at
// their original blockout positions inside the cab.
function worldPivot(index){const p=mesh.pivots[index],local=p.slice(2);return p[1]<0?local:local.map((v,i)=>v+worldPivot(p[1])[i]);}
const near=(a,b)=>a.every((v,i)=>Math.abs(v-b[i])<1e-6);
assert.equal(mesh.artScale,.66,'Expected reduced F-250 scale; recheck paired-truck proportions if changing it');
assert(near(worldPivot(7),[8.5,2.2,31].map(v=>v*mesh.artScale)));
assert(near(worldPivot(8),[8.5,-2.2,31].map(v=>v*mesh.artScale)));
for(const binding of mesh.wheelBindings)assert(near(binding.offset,worldPivot(binding.bone)),`Wheel offset/pivot drift: ${binding.id}`);
const parts=[[mesh.bodyMesh,0],[mesh.turretMesh,5],[mesh.gunMesh,6],...mesh.wheelMeshes.map(b=>[b.mesh,b.bone])];
assert.equal(parts.reduce((sum,[part])=>sum+part.triangles.length,0),mesh.triangles.length,'Missing/duplicated rigid triangles');
// Reconstruct all rigid parts in world space: scaling only the body or only
// the pivots can compile successfully but detach wheels/weapons in-game.
const key=p=>p.map(v=>v.toFixed(5)).join(',');
const worldVertices=new Set(mesh.vertices.map(key));
for(const [part,pivot] of parts)for(const v of part.vertices)assert(worldVertices.has(key(v.map((q,i)=>q+worldPivot(pivot)[i]))),'Rigid subobject offset does not reconstruct source geometry');

// Offline rig audit, not an engine animation test: sample steering/spinning
// wheels and nested turret yaw/gun elevation against actual modeled parts.
const add=(a,b)=>a.map((v,i)=>v+b[i]);
const rotateZ=(p,a)=>[p[0]*Math.cos(a)-p[1]*Math.sin(a),p[0]*Math.sin(a)+p[1]*Math.cos(a),p[2]];
const rotateY=(p,a)=>[p[0]*Math.cos(a)+p[2]*Math.sin(a),p[1],-p[0]*Math.sin(a)+p[2]*Math.cos(a)];
let wheelSamples=0;
for(const binding of mesh.wheelMeshes) {
  // At rest, every wheel mesh must surround its own axle, not the root.
  const x=binding.mesh.vertices.map(p=>p[0]),z=binding.mesh.vertices.map(p=>p[2]);
  assert(Math.abs(Math.max(...x)+Math.min(...x))<.2,'Wheel spin pivot off-center in X');
  assert(Math.abs(Math.max(...z)+Math.min(...z))<.2,'Wheel spin pivot off-center in Z');
  for(const steering of binding.bone<=2?[-35,0,35]:[0])for(let degrees=0;degrees<360;degrees+=30) {
    const turn=steering*Math.PI/180,spin=degrees*Math.PI/180;
    const axis=rotateZ([0,1,0],turn);
    for(const p of binding.mesh.vertices) {
      const moved=add(binding.offset,rotateZ(rotateY(p,spin),turn));
      const relative=sub(moved,worldPivot(binding.bone));
      const axial=dot(relative,axis);
      const radial=sub(relative,axis.map(v=>v*axial));
      assert(Math.abs(axial-p[1])<1e-6,'Wheel detached along its axle');
      assert(Math.abs(Math.hypot(...radial)-Math.hypot(p[0],p[2]))<1e-6,'Wheel orbits its axle');
      wheelSamples++;
    }
  }
}
// The muzzle bones must stay centered in the modeled muzzle rings after
// both yaw and pitch, and the firing axis must follow the barrel axis.
let muzzleSamples=0;
for(const index of [7,8]) {
  const rest=worldPivot(index);
  const tipVertices=new Map();
  mesh.triangles.forEach((t,i)=>{
    if(mesh.groups[i]!=='gun-muzzle')return;
    for(const j of t) {
      const p=mesh.vertices[j];
      if(Math.abs(p[0]-rest[0])<1e-6&&Math.abs(p[1]-rest[1])<mesh.artScale)tipVertices.set(key(p),p);
    }
  });
  assert.equal(tipVertices.size,20,'Expected inner and outer ten-sided muzzle rings');
  const ringCenter=[0,1,2].map(k=>[...tipVertices.values()].reduce((sum,p)=>sum+p[k],0)/tipVertices.size);
  assert(near(ringCenter,rest),'Muzzle attachment is not at the barrel opening');
  const yawPivot=worldPivot(5),gunLocal=mesh.pivots[6].slice(2),muzzleLocal=mesh.pivots[index].slice(2);
  for(let degrees=0;degrees<360;degrees+=30)for(const elevation of [-5,0,15,30,60]) {
    const yaw=degrees*Math.PI/180,pitch=-elevation*Math.PI/180;
    const boneTip=add(yawPivot,rotateZ(add(gunLocal,rotateY(muzzleLocal,pitch)),yaw));
    const movedRing=[...tipVertices.values()].map(p=>add(yawPivot,rotateZ(add(gunLocal,rotateY(sub(p,worldPivot(6)),pitch)),yaw)));
    const center=[0,1,2].map(k=>movedRing.reduce((sum,p)=>sum+p[k],0)/movedRing.length);
    assert(near(center,boneTip),'Animated muzzle drifts off the barrel opening');
    const axis=rotateZ(rotateY([1,0,0],pitch),yaw);
    for(const p of movedRing)assert(Math.abs(dot(sub(p,boneTip),axis))<1e-6,'Muzzle ring not perpendicular to firing direction');
    muzzleSamples++;
  }
}
console.log(`[PASS] Offline rig math: ${wheelSamples} wheel vertex poses; ${muzzleSamples} muzzle yaw/elevation poses. Runtime motion still requires a game test.`);
const hoodTop=mesh.triangles.map((t,i)=>({t,i})).filter(({t,i})=>mesh.groups[i]==='hood-top');
assert.equal(hoodTop.length,50,'Every stamped hood triangle must be explicitly identified');
for(const {t} of hoodTop)assert(mesh.normals[t[0]][2]>.65,'Hood top faces down');
assert(mesh.groups.includes('hood-cowl-louver'),'Visible cowl louvers missing');
assert(mesh.groups.includes('turret-trunnion'),'Gun elevation bearings missing');
for(const prefix of ['tire-front-left','tire-front-right','tire-rear-left-outer','tire-rear-right-outer'])assert(mesh.groups.includes(prefix+'-spoke'),'Open steel wheel spokes missing');
for(const binding of mesh.wheelBindings)assert(mesh.groups.some(g=>g.startsWith(binding.prefix)),`Missing ${binding.id}`);
const art=path.resolve(__dirname,'../src/Art/PV');
assert(fs.readFileSync(path.join(art,'PVDually_Model.obj'),'utf8').includes('usemtl PVDuallyAtlas'));
const w3x=fs.readFileSync(path.join(art,'PVDually_Model.w3x'),'utf8');
assert.equal((w3x.match(/ShaderName="ObjectsGDI.fx"/g)||[]).length,7);
assert(!fs.existsSync(path.resolve(__dirname,'../ModSDK/Shaders/ObjectsGDI.fx')),'Do not package the preview-specific SDK shader.');
const bodyUvSection=w3x.match(/<TexCoords>([\s\S]*?)<\/TexCoords>/)[1];
const exportedUvs=[...bodyUvSection.matchAll(/<T X="([^"]+)" Y="([^"]+)"/g)].map(m=>[+m[1],+m[2]]);
exportedUvs.forEach((uv,i)=>{
  assert(Math.abs(uv[0]-mesh.bodyMesh.uvs[i][0])<.000001);
  assert(Math.abs(1-uv[1]-mesh.bodyMesh.uvs[i][1])<.000001,'W3X must use bottom-origin V; the SDK flips it during compilation.');
});
const {tangents,binormals}=require('./dually_surface_pipeline').tangentFrame(mesh);
tangents.forEach((t,i)=>{
  assert(Math.abs(dot(t,mesh.normals[i]))<1e-5,'Non-orthogonal tangent');
  assert(Math.abs(dot(binormals[i],mesh.normals[i]))<1e-5,'Non-orthogonal binormal');
  assert(Math.abs(Math.hypot(...t)-1)<1e-5&&Math.abs(Math.hypot(...binormals[i])-1)<1e-5,'Unnormalized tangent frame');
});
console.log(`[PASS] ${mesh.triangles.length} triangles: finite geometry, unit normals, consistent winding, bounded UV islands, skeleton and muzzle attachments.`);
const {materialResponses,responseAt}=require('./dually_surface_pipeline');
for(let cell=0;cell<16;cell++)for(let y=0;y<=16;y++)for(let x=0;x<=16;x++) {
  const response=responseAt(cell,x/16,y/16),limit=materialResponses[cell];
  assert(Number.isInteger(response.specular)&&response.specular>=0&&response.specular<=limit.specular,'Highlight mask exceeds material limit');
  assert(Number.isInteger(response.reflection)&&response.reflection>=0&&response.reflection<=limit.reflection,'Reflection mask exceeds material limit');
  if([0,1,8,9,10,11,13].includes(cell))assert(response.specular<=60&&response.reflection===0,'Paint glare regression');
  if([2,5,14].includes(cell))assert(response.specular<=5&&response.reflection===0,'Matte surface regression');
}
assert(responseAt(9,.5,.9).specular<=6,'Door grime is too shiny');
assert(responseAt(4,.5,.5).reflection>0&&responseAt(4,.5,.5).reflection<=40,'Glass reflections must remain restrained');
console.log('[PASS] 4,624 material-mask samples respect the low-glare limits.');

// The stamped hood is one smooth sheet: all coincident top-surface vertices
// must agree on their shading normal, without flattening the actual contour.
const hoodNormals=new Map();
mesh.triangles.forEach((t,i)=>{
  if(mesh.groups[i]!=='hood-top')return;
  for(const index of t) {
    const id=key(mesh.vertices[index]);
    if(hoodNormals.has(id))assert(dot(hoodNormals.get(id),mesh.normals[index])>.99999,'Hard shading seam across the hood');
    hoodNormals.set(id,mesh.normals[index]);
  }
});
assert(hoodNormals.size>=30,'Missing smoothed hood vertices');
assert([...hoodNormals.values()].some(n=>Math.abs(n[1])>.1),'Hood contours were flattened');
// This exact corner previously escaped both the smoothing and its test.
const formerlyMissed=hoodTop.find(({t})=>t.every(i=>{const p=mesh.vertices[i].map(v=>v/mesh.artScale);return p[0]>=29.49&&p[0]<=32.51&&p[1]>=-5.31&&p[1]<=-4.09;}));
assert(formerlyMissed,'Regression triangle no longer identifiable');
assert(!formerlyMissed.t.every(i=>dot(mesh.normals[i],mesh.normals[formerlyMissed.t[0]])>.99999),'Front-left hood triangle is still flat shaded');
const {heightAt}=require('./dually_surface_pipeline');
for(let y=0;y<=32;y++)for(let x=0;x<=32;x++)assert.equal(heightAt(8,x/32,y/32),.5,'Raised rectangular hood border returned');
assert(responseAt(0,.5,.95).specular<responseAt(0,.5,.4).specular,'Lower-panel grime must stay matte');
assert(responseAt(7,.5,.5).specular<responseAt(7,.08,.5).specular,'Oily hardware recesses must be duller than rubbed edges');
console.log('[PASS] Continuous hood normals, no embossed hood frame, localized matte grime and hardware recesses.');
const {shaderResponse}=require('./dually_surface_pipeline');
assert.equal(shaderResponse.specularGain,3);
assert.equal(shaderResponse.specularExponent,50);
for(const cell of [0,1,8,9,10,11,13])assert(materialResponses[cell].specular*shaderResponse.specularGain<=48,'Paint peak contribution exceeds runtime-calibrated limit');
assert.equal(materialResponses[3].specular,95,'Exposed steel response should remain unchanged');
assert.equal(materialResponses[4].reflection,35,'Glass response should remain unchanged');
console.log('[PASS] Paint peak white contribution <=48/255 before sun/cloud modulation; glass and steel retained.');
