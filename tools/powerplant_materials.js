'use strict';
const fs=require('fs'),path=require('path');
const {writeTga,tangentFrame}=require('./dually_surface_pipeline');
// ObjectsGDI: spec RGB = highlight / environment / house glow. Not PBR packing.
const response=[[3,0],[12,0],[28,4],[5,0],[48,12],[5,0],[10,0],[1,0],[25,8],[8,0],[48,4],[18,2],[10,1],[8,0],[12,0],[8,0]];
const names=['concrete','red enamel','galvanized zinc','cast iron','exhaust steel','rusted steel','safety yellow','rubber','glass','DENA POWER sign','amber lens','copper','floor grating','electric warning','team plate','equipment plate'];
function writeMaps(dir){
 const data=fs.readFileSync(path.join(dir,'PPPowerAtlas.tga')),size=data.readUInt16LE(12);
 if(data[2]!==2||data[16]!==32||data.readUInt16LE(14)!==size)throw Error('Expected square 32-bit TGA');
 const normal=Buffer.alloc(size*size*4),spec=Buffer.alloc(normal.length),house=Buffer.alloc(normal.length);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const p=(y*size+x)*4,cell=Math.floor(x/(size/4))+4*Math.floor(y/(size/4));
  normal[p]=128;normal[p+1]=128;normal[p+2]=255;normal[p+3]=255;
  // Broad shape relief is modeled. Keep shallow finish free of false bumps.
  spec[p]=response[cell][0];spec[p+1]=response[cell][1];spec[p+2]=cell===10?45:0;spec[p+3]=255;
  const lum=Math.round(.299*data[18+p+2]+.587*data[18+p+1]+.114*data[18+p]);
  house[p]=house[p+1]=house[p+2]=lum;house[p+3]=cell===14?255:0;
 }
 writeTga(path.join(dir,'PPPowerNormal.tga'),size,normal);writeTga(path.join(dir,'PPPowerSpec.tga'),size,spec);writeTga(path.join(dir,'PPPowerHouse.tga'),size,house);
 fs.writeFileSync(path.join(dir,'PPPower_Texture.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<AssetDeclaration xmlns="uri:ea.com:eala:asset">\n${['Atlas','Normal','Spec','House'].map(n=>` <Texture id="PPPower${n}" File="PPPower${n}.tga" OutputFormat="${n==='Normal'?'A8R8G8B8':n==='Atlas'?'DXT1':'DXT5'}" AllowAutomaticResize="false"/>`).join('\n')}\n</AssetDeclaration>\n`);
}
module.exports={writeMaps,tangentFrame,response,names};
