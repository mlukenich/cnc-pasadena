'use strict';
// Local diagnostic extraction only. No stock assets are added to the mod.
const fs=require('fs'),path=require('path'),assert=require('assert');
const {BigReader}=require('./read_cnc_big');
const root=path.resolve(__dirname,'..');
const game=process.argv[2]||'C:/Program Files/EA Games/Command and Conquer 3 TW and KW/Command Conquer 3 Tiberium Wars';
const output=path.join(root,'build/render-diagnostics');fs.mkdirSync(output,{recursive:true});
const big=new BigReader(path.join(game,'Core/1.0/StaticStream.big'));
try {
  const manifest=big.get('data\\static_common.manifest'),count=manifest.readUInt32LE(12);
  assert.equal(manifest.readUInt16LE(2),5,'Only inspected v5 manifest layout is supported');
  const namesStart=48+count*44+manifest.readUInt32LE(32)+manifest.readUInt32LE(36);
  assert.equal(namesStart+manifest.readUInt32LE(40)+manifest.readUInt32LE(44),manifest.length,'Manifest layout mismatch');
  const binary=big.get('data\\static_common.bin');
  assert.equal(binary.length,manifest.readUInt32LE(16)+4,'Binary stream size mismatch');
  let position=4;const entries=[];
  for(let i=0;i<count;i++) {
    const start=48+i*44,nameOffset=namesStart+manifest.readUInt32LE(start+24),end=manifest.indexOf(0,nameOffset);
    const name=manifest.toString('utf8',nameOffset,end),size=manifest.readUInt32LE(start+32);
    if(/^(Texture:(GUPitbull(_NRM|_SPM)?|HC_GUPitbull)|W3DMesh:GUPITBULL_SKN.NEWSKIN)$/.test(name)) {
      const data=binary.subarray(position,position+size),file=name.replace(/[^A-Za-z0-9_.-]/g,'_')+'.bin';
      fs.writeFileSync(path.join(output,file),data);
      const strings=data.toString('latin1').match(/[A-Za-z_][A-Za-z0-9_.:/\\ -]{4,100}/g)||[];
      entries.push({name,size,file,header:data.subarray(0,100).toString('hex'),ddsOffset:data.indexOf('DDS '),strings:strings.filter(s=>/shader|spec|normal|texture|color|\.fx/i.test(s))});
    }
    position+=size;
  }
  assert.equal(position,binary.length);assert.equal(entries.length,5);
  const shaders=new BigReader(path.join(game,'Core/1.0/Shaders.big'));
  try {fs.writeFileSync(path.join(output,'ObjectsGDI.runtime.fxo'),shaders.get('shaders\\compiled\\objectsgdi.fxo'));}finally{shaders.close();}
  fs.writeFileSync(path.join(output,'stock-pitbull.json'),JSON.stringify(entries,null,2)+'\n');
  console.log(JSON.stringify(entries,null,2));
}finally{big.close();}
