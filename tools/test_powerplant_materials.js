'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const {response}=require('./powerplant_materials'),art=path.resolve(__dirname,'../src/Art/PP');
const maps=Object.fromEntries(['Atlas','Normal','Spec','House'].map(n=>[n,fs.readFileSync(path.join(art,'PPPower'+n+'.tga'))]));
for(const [n,d] of Object.entries(maps)){assert.equal(d.readUInt16LE(12),2048);assert.equal(d.readUInt16LE(14),2048);assert.equal(d[16],32);assert.equal(d[17],0x28);assert.equal(d.length,18+2048*2048*4);}
let samples=0;
for(let cell=0;cell<16;cell++)for(const u of [.1,.3,.5,.7,.9])for(const v of [.1,.3,.5,.7,.9]){
 const x=Math.floor((cell%4+u)*512),y=Math.floor((Math.floor(cell/4)+v)*512),p=18+(y*2048+x)*4;
 assert.equal(maps.Spec[p+2],response[cell][0]);assert.equal(maps.Spec[p+1],response[cell][1]);assert.equal(maps.Spec[p],cell===10?45:0);
 assert.equal(maps.House[p+3],cell===14?255:0,'Team mask affects a label or structure material');
 assert.equal(maps.Normal[p],255);assert.equal(maps.Normal[p+1],128);assert.equal(maps.Normal[p+2],128);
 assert.equal(maps.Atlas[p+3],255);samples++;
}
assert(response[7][0]<=2&&response[7][1]===0);assert(response[0][0]<=5);assert(response[4][0]>response[1][0]);
console.log(`[PASS] ${samples} material samples: four 2048 maps, ObjectsGDI channels, matte concrete/rubber, steel/paint distinction and isolated team plates.`);
