'use strict';
const fs=require('fs');
const path=require('path');
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=a=>{const l=Math.hypot(...a);return l>1e-12?a.map(v=>v/l):[1,0,0];};
const clamp=v=>Math.min(1,Math.max(0,v));

function smoothNormals({vertices,normals,triangles,groups}) {
  const buckets=new Map(),hoodWeights=new Map();
  triangles.forEach((t,i)=>{
    const g=groups[i];
    // Keep the stamped hood continuous while retaining its hard side walls.
    // Corner-angle weighting avoids diagonal lighting artifacts on the
    // unevenly sized triangles in the stamped transition strips.
    // Explicit surface membership, not a slope cutoff: one top triangle's
    // Z normal was 0.87793 and missed the former 0.88 threshold.
    const hood=g==='hood-top';
    const smooth=/^(tire-.*|stack-pipe|stack-shield|stack-mouth|gun-barrel|gun-jacket|turret-pedestal|turret-ring)$/.test(g)&&!/(tread|lug|rim-hole)/.test(g);
    if(!smooth&&!hood)return;
    for(let corner=0;corner<3;corner++) {
      const index=t[corner];
      const key=g+':'+vertices[index].map(v=>v.toFixed(5)).join(',');
      if(!buckets.has(key))buckets.set(key,new Set());buckets.get(key).add(index);
      if(hood) {
        const a=unit(sub(vertices[t[(corner+1)%3]],vertices[index])),b=unit(sub(vertices[t[(corner+2)%3]],vertices[index]));
        const angle=Math.acos(Math.max(-1,Math.min(1,dot(a,b))));
        hoodWeights.set(index,(hoodWeights.get(index)||0)+angle);
      }
    }
  });
  const old=normals.map(n=>[...n]);
  for(const ids of buckets.values())for(const i of ids) {
    const sum=[0,0,0];
    for(const j of ids)if(dot(old[i],old[j])>.55)for(let k=0;k<3;k++)sum[k]+=old[j][k]*(hoodWeights.get(j)||1);
    normals[i]=unit(sum);
  }
}

function tangentFrame(mesh) {
  const ts=mesh.vertices.map(()=>[0,0,0]),bs=mesh.vertices.map(()=>[0,0,0]);
  for(const t of mesh.triangles) {
    const [a,b,c]=t.map(i=>mesh.vertices[i]),[ua,ub,uc]=t.map(i=>mesh.uvs[i]);
    const e1=sub(b,a),e2=sub(c,a),u1=ub[0]-ua[0],v1=ub[1]-ua[1],u2=uc[0]-ua[0],v2=uc[1]-ua[1];
    const det=u1*v2-u2*v1;
    if(Math.abs(det)<1e-12)throw new Error('Degenerate UV triangle: '+JSON.stringify({t,points:[a,b,c],uv:[ua,ub,uc]}));
    const tangent=e1.map((v,i)=>(v*v2-e2[i]*v1)/det),bitangent=e1.map((v,i)=>(e2[i]*u1-v*u2)/det);
    for(const i of t)for(let k=0;k<3;k++){ts[i][k]+=tangent[k];bs[i][k]+=bitangent[k];}
  }
  const tangents=ts.map((t,i)=>unit(sub(t,mesh.normals[i].map(v=>v*dot(mesh.normals[i],t)))));
  const binormals=tangents.map((t,i)=>{const b=cross(mesh.normals[i],t),sign=dot(b,bs[i])<0?-1:1;return b.map(v=>v*sign);});
  return {tangents,binormals};
}

function writeTga(file,size,rgba) {
  const header=Buffer.alloc(18);header[2]=2;header.writeUInt16LE(size,12);header.writeUInt16LE(size,14);header[16]=32;header[17]=0x28;
  const pixels=Buffer.alloc(rgba.length);
  for(let i=0;i<rgba.length;i+=4){pixels[i]=rgba[i+2];pixels[i+1]=rgba[i+1];pixels[i+2]=rgba[i];pixels[i+3]=rgba[i+3];}
  fs.writeFileSync(file,Buffer.concat([header,pixels]));
}

// These are code-authored technical material fields, not luminance guessed
// from the generated colour art. EA warns against treating colour as height.
function heightAt(cell,u,v) {
  const e=Math.min(u,v,1-u,1-v),rim=Math.exp(-Math.pow((e-.035)/.012,2));
  let h=.5;
  // Hood wear is painted into a continuous sheet, not a raised perimeter
  // frame. The roof seam also needs a much gentler normal-map transition.
  if(cell===10)h-=.02*Math.exp(-Math.pow((e-.035)/.028,2));
  if([9,11,13].includes(cell))h-=.10*rim;
  if(cell===9)for(const x of [.075,.925])for(const y of [.075,.925])h+=.1*Math.exp(-Math.pow(Math.hypot(u-x,v-y)/.023,2));
  if(cell===11)for(const y of [.28,.72])h+=.07*Math.exp(-Math.pow((v-y)/.018,2))*clamp((u-.07)*25)*clamp((.93-u)*25);
  if(cell===12)h+=.055*Math.pow(Math.max(0,Math.cos((u-.045)*Math.PI*14)),8);
  if(cell===13)h-=.035*(Math.exp(-Math.pow((u-.33)/.009,2))+Math.exp(-Math.pow((v-.52)/.009,2)));
  if(cell===14)h+=.025*Math.cos((v-Math.abs(u-.5)*.65)*Math.PI*12);
  if(cell===15)h+=.01*Math.cos(u*Math.PI*28);
  return h;
}

// Art pass 3.4: installed ObjectsGDI shader disassembly confirms a 3x
// specular gain with exponent 50 (see build/render-diagnostics). Old paint
// R=55 could add 165/255 at the lobe peak, before sun/cloud modulation.
// Preserve the diffuse artwork; constrain paint's peak white contribution.
const shaderResponse={specularGain:3,specularExponent:50,normalXYScale:1.5};
const materialResponses = [
  {name:'red paint', specular:14, reflection:0},
  {name:'ivory paint', specular:10, reflection:0},
  {name:'rubber', specular:2, reflection:0},
  {name:'bare steel', specular:95, reflection:15},
  {name:'glass', specular:80, reflection:35},
  {name:'rust', specular:5, reflection:0},
  {name:'amber lens', specular:80, reflection:10},
  {name:'gunmetal', specular:50, reflection:3},
  {name:'hood panel', specular:12, reflection:0},
  {name:'door panel', specular:10, reflection:0},
  {name:'roof panel', specular:10, reflection:0},
  {name:'tailgate panel', specular:14, reflection:0},
  {name:'bed floor', specular:35, reflection:2},
  {name:'armor panel', specular:16, reflection:0},
  {name:'tire tread', specular:2, reflection:0},
  {name:'headlamp', specular:110, reflection:30},
];

function responseAt(cell,u,v) {
  const edge=Math.min(u,v,1-u,1-v);
  let wear=cell>=8?(.3+.7*clamp(edge*12)):1;
  if(cell===9)wear*=1-.93*clamp((v-.57)/.35); // existing lower-door grime stays matte
  if(cell===0)wear*=1-.75*clamp((v-.65)/.3); // lower body and wheel-arch dirt
  if([7,12].includes(cell)) {
    const center=clamp(Math.min(u,1-u)*3)*clamp(Math.min(v,1-v)*3);
    wear*=1-.35*center; // oily recesses; preserve subtle rubbed metal edges
  }
  if([8,10,11,13].includes(cell)) {
    // Suppress highlights where the dedicated art already has corner dirt.
    const corners=(1-clamp(Math.min(u,1-u)*5))*(1-clamp(Math.min(v,1-v)*5));
    wear*=1-.7*corners;
  }
  const response=materialResponses[cell];
  return {specular:Math.round(response.specular*wear),reflection:Math.round(response.reflection*wear)};
}

function writeMaterialMaps(artDir) {
  const size=1024,cellSize=256,normal=Buffer.alloc(size*size*4),spec=Buffer.alloc(normal.length),house=Buffer.alloc(normal.length),height=Buffer.alloc(normal.length);
  // R=specular intensity, G=environment reflection, B=house-color glow.
  // No gloss/roughness packing: these are the legacy C&C3 channel semantics.
  for(let y=0;y<size;y++)for(let x=0;x<size;x++) {
    const cell=Math.floor(x/cellSize)+4*Math.floor(y/cellSize),u=(x%cellSize+.5)/cellSize,v=(y%cellSize+.5)/cellSize,index=(y*size+x)*4;
    const delta=1/cellSize,h=heightAt(cell,u,v);
    const dx=(heightAt(cell,u+delta,v)-heightAt(cell,u-delta,v))*6,dy=(heightAt(cell,u,v+delta)-heightAt(cell,u,v-delta))*6;
    const n=unit([-dx,-dy,1]);
    for(let k=0;k<3;k++){normal[index+k]=Math.round((n[k]*.5+.5)*255);height[index+k]=Math.round(h*255);}
    normal[index+3]=255;height[index+3]=255;
    const response=responseAt(cell,u,v);
    spec[index]=response.specular;spec[index+1]=response.reflection;spec[index+3]=255;
    const stripe=cell===13&&u>.13&&u<.87&&v>.16&&v<.23;
    house[index]=house[index+1]=house[index+2]=155;house[index+3]=stripe?255:0;
    spec[index+2]=stripe?65:0;
  }
  writeTga(path.join(artDir,'PVDuallyNormal.tga'),size,normal);
  writeTga(path.join(artDir,'PVDuallySpec.tga'),size,spec);
  writeTga(path.join(artDir,'PVDuallyHouse.tga'),size,house);
  writeTga(path.join(artDir,'Textures','dually-height-v3.tga'),size,height);
}
module.exports={smoothNormals,tangentFrame,writeMaterialMaps,writeTga,heightAt,materialResponses,responseAt,shaderResponse};
