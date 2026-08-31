'use strict';
const path=require('path');
const {build}=require('./generate_pasadena_powerplant');
const detail=Number(process.argv[3]??2),hd=process.argv.includes('--hd');
const model=build(detail);
require('./powerplant_renderer')(model.mesh,path.resolve(__dirname,'../src/Art/PP'),{
 texturePrefix:'PPPower',namePrefix:detail?'powerplant-v1':'powerplant-blockout',
 outputDirectory:process.argv[2]||'build/pasadena-power-review/final',target:[0,-1,18],
 scale:Number(process.argv[4]||8.4)*(hd?2:1),width:hd?2200:1100,height:hd?1520:760,
});
