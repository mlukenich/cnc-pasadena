'use strict';
// Validate the compiler output, not just the exporter's own assumptions.
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..'),art=path.join(root,'src/Art/PV');
const directory=path.join(root,'ModSDK/BuiltMods/mods/marylandshowdown/data/mod/assets');
const files=fs.readdirSync(directory);
function asset(type,id) {
  const matches=files.filter(f=>f.startsWith(type+'.')&&f.split('.')[2]===id);
  assert.equal(matches.length,1,`Missing/ambiguous asset ${type}:${id}`);
  return fs.readFileSync(path.join(directory,matches[0]));
}
function ddsPixel(data,x,y) {
  const start=data.indexOf('DDS ');assert(start>=0,'Missing DDS payload');
  const width=data.readUInt32LE(start+16),height=data.readUInt32LE(start+12),fourcc=data.toString('ascii',start+84,start+88);
  assert(x>=0&&x<width&&y>=0&&y<height);
  if(!['DXT1','DXT5'].includes(fourcc)) {
    assert.equal(data.readUInt32LE(start+88),32,'Unsupported RGB DDS bit depth');
    const value=data.readUInt32LE(start+128+(y*width+x)*4);
    return [92,96,100,104].map(offset=>{
      const mask=data.readUInt32LE(start+offset);if(!mask)return 255;
      let shift=0;while(shift<32&&!((mask>>>shift)&1))shift++;
      return Math.round(((value&mask)>>>shift)*255/(mask>>>shift));
    });
  }
  const stride=fourcc==='DXT5'?16:8,block=start+128+(Math.floor(y/4)*Math.ceil(width/4)+Math.floor(x/4))*stride;
  const offset=block+(stride===16?8:0),c0=data.readUInt16LE(offset),c1=data.readUInt16LE(offset+2);
  const unpack=n=>[(n>>11)*255/31,((n>>5)&63)*255/63,(n&31)*255/31];
  const a=unpack(c0),b=unpack(c1),pixel=(y%4)*4+x%4,index=(data.readUInt32LE(offset+4)>>>(pixel*2))&3;
  const colours=[a,b,a.map((v,i)=>(2*v+b[i])/3),a.map((v,i)=>(v+2*b[i])/3)];
  if(stride===8&&c0<=c1){colours[2]=a.map((v,i)=>(v+b[i])/2);colours[3]=[0,0,0];}
  let alpha=255;
  if(stride===16) {
    const aa=data[block],ab=data[block+1],table=[aa,ab];
    if(aa>ab)for(let i=1;i<=6;i++)table.push(((7-i)*aa+i*ab)/7);
    else {for(let i=1;i<=4;i++)table.push(((5-i)*aa+i*ab)/5);table.push(0,255);}
    let bits=0n;for(let i=0;i<6;i++)bits|=BigInt(data[block+2+i])<<BigInt(i*8);
    alpha=table[Number((bits>>BigInt(pixel*3))&7n)];
  }
  return [...colours[index].map(Math.round),Math.round(alpha)];
}
const maps={PVDuallyAtlas:'eaf80a26',PVDuallyNormal:'82ff3e1a',PVDuallySpec:'085b2476',PVDuallyHouse:'4dc3ec98',PVDuallyPortrait:'27f0a32e'};
for(const [name,id] of Object.entries(maps)) {
  const data=asset('21e727da',id),source=fs.readFileSync(path.join(art,name+'.tga')),size=source.readUInt16LE(12);
  for(let row=0;row<4;row++)for(let col=0;col<4;col++) {
    const x=Math.floor((col+.5)*size/4),y=Math.floor((row+.5)*size/4),p=18+(y*size+x)*4;
    const expected=[source[p+2],source[p+1],source[p],source[p+3]],actual=ddsPixel(data,x,y);
    actual.forEach((v,k)=>assert(Math.abs(v-expected[k])<=18,`${name}: compiled pixel (${x},${y}) differs in channel ${k}: ${v} vs ${expected[k]}`));
  }
}
const ids={BODY:'fb2d4067',TURRET:'fe0b69b1',GUNS:'6ba3164e',TIRE01:'49c3ce1c',TIRE02:'615c23a2',TIRE03:'6d7621f8',TIRE04:'59937a24'};
const xml=fs.readFileSync(path.join(art,'PVDually_Model.w3x'),'utf8');
const entries=[...xml.matchAll(/<W3DMesh id="PVDUALLY_SKIN\.([^"]+)"[\s\S]*?<\/W3DMesh>/g)];
let total=0;
function section(text,name,tag,count=3) {
  const block=text.match(new RegExp('<'+name+'>([\\s\\S]*?)</'+name+'>'))[1];
  const regex=new RegExp('<'+tag+' X="([^\"]+)" Y="([^\"]+)"'+(count===3?' Z="([^\"]+)"':''),'g');
  return [...block.matchAll(regex)].map(m=>m.slice(1).map(Number));
}
for(const entry of entries) {
  const name=entry[1],text=entry[0],data=asset('c2b1a262',ids[name]);
  const vertices=section(text,'Vertices','V'),uvs=section(text,'TexCoords','T',2),normals=section(text,'Normals','N');
  const tangents=section(text,'Tangents','T'),binormals=section(text,'Binormals','B');
  const marker=Buffer.alloc(12);vertices[0].forEach((v,i)=>marker.writeFloatLE(v,i*4));
  const start=data.indexOf(marker);assert(start>=0,`No vertex buffer for ${name}`);
  // ObjectsGDI Normal geometry is POSITION/NORMAL/COLOR/TANGENT/BINORMAL/UV:
  // 60 bytes per vertex. Verify all fields so a layout change fails loudly.
  assert(start+vertices.length*60<=data.length,'Truncated vertex buffer');
  vertices.forEach((position,i)=>{
    assert.equal(data.readUInt32LE(start+i*60+24),0xffffffff,`${name} vertex ${i}: unexpected vertex-color tint/alpha`);
    const expected=[...position,...normals[i],null,...tangents[i],...binormals[i],uvs[i][0],1-uvs[i][1]];
    expected.forEach((value,k)=>{
      if(value===null)return;
      const got=data.readFloatLE(start+i*60+k*4);
      assert(Math.abs(got-value)<.00002,`${name} vertex ${i} field ${k}: ${got} vs ${value}`);
    });
  });
  assert(data.includes(Buffer.from('ObjectsGDI.fx')),'Compiled mesh missing vehicle shader');
  total+=vertices.length;
}
assert.equal(entries.length,7);
console.log(`[PASS] Compiled DDS orientation/channels for five textures; all ${total} compiled vertices, UV flips and tangent frames across seven meshes.`);
module.exports={ddsPixel};
