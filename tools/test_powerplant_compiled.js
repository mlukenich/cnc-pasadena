'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const {build}=require('./generate_pasadena_powerplant'),{tangentFrame}=require('./powerplant_materials'),{ddsPixel}=require('./powerplant_dds');
const root=path.resolve(__dirname,'..'),base=path.join(root,'build/pasadena-power-art'),dir=path.join(base,'mods/powerplantart/data/mod/assets'),files=fs.readdirSync(dir),model=build();
// The compiler omits cache hits from its log. Its exported hash table identifies
// assets reliably across both clean and incremental builds.
const hashes=Object.fromEntries([...fs.readFileSync(path.join(base,'StringHashes.xml'),'utf8').matchAll(/<StringAndHash Hash="(\d+)" Text="([^"]+)"/g)].map(m=>[m[2],Number(m[1]).toString(16).padStart(8,'0')]));
function asset(type,name){
 assert(hashes[type]&&hashes[name],'Missing compiled asset identity '+name);
 const ff=files.filter(f=>f.split('.')[0]===hashes[type]&&f.split('.')[2]===hashes[name]);assert.equal(ff.length,1,'Asset ambiguity '+name);return fs.readFileSync(path.join(dir,ff[0]));
}
for(const n of ['Atlas','Normal','Spec','House']){
 const src=fs.readFileSync(path.join(root,'src/Art/PP/PPPower'+n+'.tga')),d=asset('Texture','PPPower'+n),dds=d.indexOf('DDS ');assert(dds>=0);assert.equal(d.readUInt32LE(dds+16),2048);assert.equal(d.readUInt32LE(dds+12),2048);
 for(let cell=0;cell<16;cell++)for(const u of [.17,.5,.83])for(const v of [.17,.5,.83]){
  const x=Math.floor((cell%4+u)*512),y=Math.floor((Math.floor(cell/4)+v)*512),p=18+(y*2048+x)*4,a=ddsPixel(d,x,y),e=[src[p+2],src[p+1],src[p],src[p+3]];
  for(let k=0;k<4;k++)assert(Math.abs(a[k]-e[k])<=(k===3?18:32),`${n} channel ${k} pixel ${x},${y}: ${a[k]} vs ${e[k]}`);
 }
}
let checked=0;
for(const part of model.parts){
 const d=asset('W3DMesh','PPPOWER_SKIN.'+part.id),m=part.mesh,tf=tangentFrame(m),marker=Buffer.alloc(12);m.vertices[0].forEach((v,k)=>marker.writeFloatLE(Number(v.toFixed(6)),k*4));
 const offset=d.indexOf(marker);assert(offset>=0,'No vertex stream '+part.id);assert(offset+m.vertices.length*60<=d.length);
 m.vertices.forEach((v,i)=>{
  assert.equal(d.readUInt32LE(offset+i*60+24),0xffffffff,'Unexpected vertex tint');
  const expected=[...v,...m.normals[i],null,...tf.tangents[i],...tf.binormals[i],m.uvs[i][0],m.uvs[i][1]];
  expected.forEach((e,k)=>{if(e!==null)assert(Math.abs(d.readFloatLE(offset+i*60+k*4)-e)<.00002,`Compiled ${part.id} ${i} ${k} mismatch`);});
 });checked+=m.vertices.length;assert(d.includes(Buffer.from('ObjectsGDI.fx')));
}
assert(asset('W3DAnimation','PPPOWER_IDLE').length>64);
const hierarchy=asset('W3DHierarchy','PPPOWER_SKL');for(const p of model.pivots)assert(hierarchy.includes(Buffer.from(p[0])),'Compiled pivot missing '+p[0]);
for(const suffix of ['', '_L'])for(const ext of ['manifest','bin','imp','relo'])assert(fs.existsSync(path.join(base,'mods/powerplantart/data/mod'+suffix+'.'+ext)),'Missing stream output '+suffix+ext);
console.log(`[PASS] Both art streams exist; four identified DDS maps/576 RGBA samples; ${checked} compiled vertices, UV orientation, tangent frames, shader, skeleton names and fan clip asset. Not a live game test.`);
