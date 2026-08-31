'use strict';
// Dependency-free geometry preview, not a mockup. Uses the exported mesh,
// UVs, TGA and geometric normals. Highlight gain/exponent and normal strength
// now use the installed ObjectsGDI shader's measured constants. Lighting,
// shadows, environment and tone mapping still approximate the game.
const fs=require('fs');
const path=require('path');
const zlib=require('zlib');
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const unit=a=>a.map(v=>v/Math.hypot(...a));
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
function pngChunk(type,data) {
  const name=Buffer.from(type),bytes=Buffer.concat([name,data]);
  let crc=0xffffffff;
  for(const byte of bytes){crc^=byte;for(let k=0;k<8;k++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
  const out=Buffer.alloc(data.length+12);out.writeUInt32BE(data.length,0);bytes.copy(out,4);out.writeUInt32BE((crc^0xffffffff)>>>0,out.length-4);return out;
}
function savePng(file,width,height,rgb) {
  const header=Buffer.alloc(13);header.writeUInt32BE(width,0);header.writeUInt32BE(height,4);header[8]=8;header[9]=2;
  const rows=Buffer.alloc(height*(width*3+1));
  for(let y=0;y<height;y++)rgb.copy(rows,y*(width*3+1)+1,y*width*3,(y+1)*width*3);
  fs.writeFileSync(file,Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),pngChunk('IHDR',header),pngChunk('IDAT',zlib.deflateSync(rows)),pngChunk('IEND',Buffer.alloc(0))]));
}
module.exports=function render(mesh,artDir,options={}) {
  const prefix=options.texturePrefix||'PVDually';
  const atlas=fs.readFileSync(path.join(artDir,prefix+'Atlas.tga'));
  const normalMap=fs.readFileSync(path.join(artDir,prefix+'Normal.tga'));
  const specMap=fs.readFileSync(path.join(artDir,prefix+'Spec.tga'));
  const houseMap=fs.readFileSync(path.join(artDir,prefix+'House.tga'));
  const {tangentFrame,shaderResponse}=require('./dually_surface_pipeline');
  const {tangents,binormals}=tangentFrame(mesh);
  const tw=atlas.readUInt16LE(12),th=atlas.readUInt16LE(14);
  const size=2,width=(options.width||1100)*size,height=(options.height||760)*size;
  const outDir=options.outputDirectory||path.join(artDir,'Preview');fs.mkdirSync(outDir,{recursive:true});
  for(const [name,eye] of [['front',[1.05,-1.3,.95]],['rear',[-1.15,1.4,1.05]],['side',[.02,-1,.38]],['sun-check',[1.05,-1.3,.95]]]) {
    // A reflected sun direction deliberately puts the roof near the peak
    // highlight. This is a stress test, not a claimed copy of a game map.
    const light=unit(name==='sun-check'?[-1.05,1.3,.95]:[-.35,-.5,1]);
    const forward=unit(eye),right=unit(cross([0,0,1],forward)),up=cross(forward,right),target=options.target||[0,0,14];
    const half=unit(light.map((v,i)=>v+forward[i])),fillDirection=unit([.5,.5,.25]);
    const scale=(options.scale||11)*size;
    const screen=p=>{const d=sub(p,target);return [width*.5+dot(d,right)*scale,height*.53-dot(d,up)*scale,dot(d,forward)];};
    const projected=mesh.vertices.map(screen),depth=new Float32Array(width*height).fill(-1e10),rgb=Buffer.alloc(width*height*3),shadow=new Uint8Array(width*height);
    for(let y=0;y<height;y++)for(let x=0;x<width;x++) {
      const vignette=Math.min(1,Math.hypot((x-width/2)/width,(y-height/2)/height));
      const shade=1-vignette*.15,index=(y*width+x)*3;
      rgb[index]=Math.round(53*shade);rgb[index+1]=Math.round(60*shade);rgb[index+2]=Math.round(64*shade);
    }
    function raster(p,callback) {
      const [a,b,c]=p;
      const denominator=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);
      if(Math.abs(denominator)<1e-8)return;
      const minX=Math.max(0,Math.floor(Math.min(...p.map(q=>q[0])))),maxX=Math.min(width-1,Math.ceil(Math.max(...p.map(q=>q[0]))));
      const minY=Math.max(0,Math.floor(Math.min(...p.map(q=>q[1])))),maxY=Math.min(height-1,Math.ceil(Math.max(...p.map(q=>q[1]))));
      for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
        const u=((b[1]-c[1])*(x+.5-c[0])+(c[0]-b[0])*(y+.5-c[1]))/denominator;
        const v=((c[1]-a[1])*(x+.5-c[0])+(a[0]-c[0])*(y+.5-c[1]))/denominator,w=1-u-v;
        if(u>=-.00001&&v>=-.00001&&w>=-.00001)callback(x,y,u,v,w);
      }
    }
    // A neutral ground-plane shadow projected from the actual triangles.
    const shadowPoints=mesh.vertices.map(p=>screen([p[0]-p[2]*light[0]/light[2],p[1]-p[2]*light[1]/light[2],0]));
    for(const t of mesh.triangles)raster(t.map(i=>shadowPoints[i]),(x,y)=>{shadow[y*width+x]=1;});
    for(let i=0;i<shadow.length;i++)if(shadow[i])for(let c=0;c<3;c++)rgb[i*3+c]*=.55;
    for(const t of mesh.triangles) {
      const geometric=unit(cross(sub(mesh.vertices[t[1]],mesh.vertices[t[0]]),sub(mesh.vertices[t[2]],mesh.vertices[t[0]])));
      if(dot(geometric,forward)<=0)continue;
      const p=t.map(i=>projected[i]),uv=t.map(i=>mesh.uvs[i]);
      raster(p,(x,y,a,b,c)=>{
        const i=y*width+x,z=a*p[0][2]+b*p[1][2]+c*p[2][2];
        if(z<depth[i])return;depth[i]=z;
        const u=a*uv[0][0]+b*uv[1][0]+c*uv[2][0],v=a*uv[0][1]+b*uv[1][1]+c*uv[2][1];
        const tx=Math.max(0,Math.min(tw-1,Math.floor(u*tw))),ty=Math.max(0,Math.min(th-1,Math.floor(v*th))),tex=18+(ty*tw+tx)*4;
        const blend=values=>unit([0,1,2].map(k=>a*values[t[0]][k]+b*values[t[1]][k]+c*values[t[2]][k]));
        const baseN=blend(mesh.normals),tangent=blend(tangents),bitangent=blend(binormals);
        const localN=[2,1,0].map((k,i)=>(normalMap[tex+k]/127.5-1)*(i<2?shaderResponse.normalXYScale:1));
        const n=unit(baseN.map((v,k)=>v*localN[2]+tangent[k]*localN[0]+bitangent[k]*localN[1]));
        const shade=.42+Math.max(0,dot(n,light))*.65+Math.max(0,dot(n,fillDirection))*.15;
        const spec=specMap[tex+2]*shaderResponse.specularGain*Math.pow(Math.max(0,dot(n,half)),shaderResponse.specularExponent)*(dot(n,light)>0?1:0);
        const env=specMap[tex+1]/255*(.15+.35*Math.pow(1-Math.max(0,dot(n,forward)),3));
        const alpha=houseMap[tex+3]/255,team=options.teamColor||[164,48,30],sky=[110,135,157];
        for(let channel=0;channel<3;channel++) {
          const base=atlas[tex+2-channel]*(1-alpha)+team[channel]*alpha;
          rgb[i*3+channel]=Math.min(255,Math.round(base*shade*(1-env)+sky[channel]*env+spec));
        }
      });
    }
    const final=Buffer.alloc(width/size*height/size*3);
    for(let y=0;y<height/size;y++)for(let x=0;x<width/size;x++)for(let c=0;c<3;c++) {
      let sum=0;for(let yy=0;yy<size;yy++)for(let xx=0;xx<size;xx++)sum+=rgb[((y*size+yy)*width+x*size+xx)*3+c];
      final[(y*width/size+x)*3+c]=Math.round(sum/(size*size));
    }
    const file=path.join(outDir,`${options.namePrefix||'dually-v3'}-${name}.png`);savePng(file,width/size,height/size,final);console.log('Rendered '+file);
  }
};
