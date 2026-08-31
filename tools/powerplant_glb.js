'use strict';
// Portable editable glTF alongside the engine-native W3X. PBR is approximate;
// the W3X and four TGA maps remain authoritative for ObjectsGDI appearance.
const fs=require('fs'),path=require('path');
function exportGlb(model,out){
 const gltf={asset:{version:'2.0',generator:'Pasadena editable hard-surface pipeline'},scene:0,scenes:[{nodes:[0]}],nodes:[{name:'Pasadena Straight-Pipe Diesel Generator',rotation:[-Math.SQRT1_2,0,0,Math.SQRT1_2],children:[]}],meshes:[],materials:[],textures:[{sampler:0,source:0}],images:[],samplers:[{magFilter:9729,minFilter:9987,wrapS:33071,wrapT:33071}],accessors:[],bufferViews:[],buffers:[],animations:[]},chunks=[];let length=0;
 const view=(buf,target)=>{const pad=(4-length%4)%4;if(pad){chunks.push(Buffer.alloc(pad));length+=pad;}const id=gltf.bufferViews.length;gltf.bufferViews.push({buffer:0,byteOffset:length,byteLength:buf.length,...(target?{target}:{})});chunks.push(buf);length+=buf.length;return id;};
 const access=(arrays,type,component=5126,target)=>{const flat=arrays.flat(),buf=Buffer.alloc(flat.length*4);flat.forEach((v,i)=>component===5126?buf.writeFloatLE(v,i*4):buf.writeUInt32LE(v,i*4));const a={bufferView:view(buf,target),componentType:component,count:arrays.length,type};if(type==='VEC3'){a.min=[0,1,2].map(k=>Math.min(...arrays.map(v=>v[k])));a.max=[0,1,2].map(k=>Math.max(...arrays.map(v=>v[k])));}if(type==='SCALAR'){a.min=[Math.min(...flat)];a.max=[Math.max(...flat)];}gltf.accessors.push(a);return gltf.accessors.length-1;};
 const {names,response}=require('./powerplant_materials');
 for(let i=0;i<16;i++)gltf.materials.push({name:names[i],pbrMetallicRoughness:{baseColorTexture:{index:0},metallicFactor:[2,4,11].includes(i)?.55:0,roughnessFactor:i===4?.4:i===8?.3:.83},doubleSided:false});
 gltf.images.push({bufferView:view(fs.readFileSync(path.resolve(__dirname,'../src/Art/PP/Textures/powerplant-atlas-source.png'))),mimeType:'image/png'});
 for(const part of model.parts){
  const m=part.mesh,attrs={POSITION:access(m.vertices,'VEC3'),NORMAL:access(m.normals,'VEC3'),TEXCOORD_0:access(m.uvs,'VEC2')},primitives=[];
  for(let mat=0;mat<16;mat++){
   const indices=m.triangles.filter(t=>{const uv=m.uvs[t[0]];return Math.floor(uv[0]*4)+4*Math.floor(uv[1]*4)===mat;}).flat();
   if(indices.length)primitives.push({attributes:attrs,indices:access(indices.map(i=>[i]),'SCALAR',5125,34963),material:mat});
  }
  const nodeIndex=gltf.nodes.length;gltf.nodes[0].children.push(nodeIndex);gltf.nodes.push({name:part.id,mesh:gltf.meshes.length,translation:model.pivots[part.bone].slice(2)});gltf.meshes.push({name:part.id,primitives});
  if(part.id==='FAN'){
   const time=access(Array.from({length:61},(_,i)=>[i/30]),'SCALAR',5126,undefined),rotation=access(Array.from({length:61},(_,i)=>[Math.sin(i*Math.PI/60),0,0,Math.cos(i*Math.PI/60)]),'VEC4',5126,undefined);
   gltf.animations.push({name:'Radiator fan idle',samplers:[{input:time,output:rotation,interpolation:'LINEAR'}],channels:[{sampler:0,target:{node:nodeIndex,path:'rotation'}}]});
  }
 }
 const pad=(4-length%4)%4;if(pad){chunks.push(Buffer.alloc(pad));length+=pad;}gltf.buffers.push({byteLength:length});
 let json=Buffer.from(JSON.stringify(gltf));json=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,32)]);
 const bin=Buffer.concat(chunks),head=Buffer.alloc(12),jh=Buffer.alloc(8),bh=Buffer.alloc(8);head.write('glTF');head.writeUInt32LE(2,4);head.writeUInt32LE(12+8+json.length+8+bin.length,8);jh.writeUInt32LE(json.length);jh.write('JSON',4);bh.writeUInt32LE(bin.length);bh.write('BIN\0',4);
 fs.writeFileSync(out,Buffer.concat([head,jh,json,bh,bin]));return gltf;
}
if(require.main===module){const model=require('./generate_pasadena_powerplant').build();exportGlb(model,path.resolve(__dirname,'../src/Art/PP/PPPower.glb'));console.log('Exported portable GLB with 16 material responses and fan animation.');}
module.exports={exportGlb};
