'use strict';
// Actual geometry, one scene/camera/scale. Technical texture packing only.
const fs=require('fs'),path=require('path');
const dually=require('./generate_pasadena_dually'),monster=require('./generate_pasadena_mudtank').worldMesh;
const root=path.resolve(__dirname,'..'),out=path.resolve(process.argv[2]||'build/truck-size-review'),tex=path.join(out,'maps');fs.mkdirSync(tex,{recursive:true});
for(const map of ['Atlas','Normal','Spec','House']){
 const a=fs.readFileSync(path.join(root,'src/Art/PV/PVDually'+map+'.tga')),b=fs.readFileSync(path.join(root,'src/Art/PM/PVMudTank'+map+'.tga'));
 const w=a.readUInt16LE(12),h=a.readUInt16LE(14);if(b.readUInt16LE(12)!==w||b.readUInt16LE(14)!==h)throw Error('Atlas dimensions differ');
 const header=Buffer.from(a.subarray(0,18));header.writeUInt16LE(w*2,12);const data=Buffer.alloc(w*2*h*4);
 for(let y=0;y<h;y++){a.copy(data,y*w*8,18+y*w*4,18+(y+1)*w*4);b.copy(data,y*w*8+w*4,18+y*w*4,18+(y+1)*w*4);}
 fs.writeFileSync(path.join(tex,'TruckCompare'+map+'.tga'),Buffer.concat([header,data]));
}
const scene={vertices:[],normals:[],uvs:[],triangles:[],groups:[]};
for(const [m,i,x] of [[dually,0,-36],[monster,1,36]]){
 const offset=scene.vertices.length;scene.vertices.push(...m.vertices.map(p=>[p[0]+x,p[1],p[2]]));scene.normals.push(...m.normals);scene.uvs.push(...m.uvs.map(uv=>[(uv[0]+i)/2,uv[1]]));scene.triangles.push(...m.triangles.map(t=>t.map(v=>v+offset)));scene.groups.push(...m.groups);
}
require('./render_dually_preview')(scene,tex,{texturePrefix:'TruckCompare',namePrefix:'truck-size-fixed',outputDirectory:out,target:[0,0,13],scale:6.6});
