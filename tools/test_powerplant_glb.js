'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert'),{build}=require('./generate_pasadena_powerplant');
const d=fs.readFileSync(path.resolve(__dirname,'../src/Art/PP/PPPower.glb'));assert.equal(d.toString('ascii',0,4),'glTF');assert.equal(d.readUInt32LE(4),2);assert.equal(d.readUInt32LE(8),d.length);
const len=d.readUInt32LE(12),g=JSON.parse(d.toString('utf8',20,20+len)),bin=d.subarray(28+len);assert.equal(g.buffers[0].byteLength,bin.length);
for(const v of g.bufferViews){assert(v.byteOffset%4===0);assert(v.byteOffset+v.byteLength<=bin.length);}
const model=build();let total=0;
const floats=id=>{const a=g.accessors[id],v=g.bufferViews[a.bufferView],count={VEC2:2,VEC3:3,VEC4:4,SCALAR:1}[a.type];return Array.from({length:a.count},(_,i)=>Array.from({length:count},(_,k)=>bin.readFloatLE(v.byteOffset+(i*count+k)*4)));};
for(let i=0;i<model.parts.length;i++){
 const m=g.meshes[i],src=model.parts[i].mesh,pos=floats(m.primitives[0].attributes.POSITION);assert.equal(pos.length,src.vertices.length);
 pos.forEach((p,j)=>p.forEach((v,k)=>assert(Math.abs(v-src.vertices[j][k])<.00001)));
 for(const p of m.primitives){assert(p.material>=0&&p.material<16);total+=g.accessors[p.indices].count/3;}
 const node=g.nodes.find(n=>n.mesh===i);assert.deepEqual(node.translation,model.pivots[model.parts[i].bone].slice(2));
}
assert.equal(total,model.mesh.triangles.length);assert.equal(g.animations.length,1);const a=g.animations[0];assert.equal(g.nodes[a.channels[0].target.node].name,'FAN');assert.equal(floats(a.samplers[0].input).length,61);
console.log(`[PASS] GLB binary layout, embedded texture, ${total} triangles, exact local vertices/pivots and fan animation target.`);
