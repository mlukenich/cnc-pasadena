'use strict';
// Read-only BIG4/RefPack inspection. Never writes into a game installation.
// RefPack bit fields checked against OpenSAGE's clean-room reader:
// https://github.com/OpenSAGE/OpenSAGE/blob/master/src/OpenSage.FileFormats.RefPack/RefPackStream.cs
const fs=require('fs'),assert=require('assert');
function unpack(input) {
  if(input.length<5||(input[0]&0x3e)!==0x10||input[1]!==0xfb)return input;
  const width=input[0]&0x80?4:3;let pos=2;
  if(input[0]&1)pos+=width;
  const size=input.readUIntBE(pos,width);pos+=width;
  assert(size<=512*1024*1024,'RefPack expansion exceeds inspection limit');
  const out=Buffer.alloc(size);let cursor=0,ended=false;
  const byte=()=>{assert(pos<input.length,'Truncated RefPack command');return input[pos++];};
  while(!ended) {
    const c=byte();let literal=0,count=0,distance=0;
    if(c<0x80){const d=byte();literal=c&3;count=((c&28)>>2)+3;distance=((c&96)<<3)+d+1;}
    else if(c<0xc0){const d=byte(),e=byte();literal=d>>6;count=(c&63)+4;distance=((d&63)<<8)+e+1;}
    else if(c<0xe0){const d=byte(),e=byte(),f=byte();literal=c&3;count=((c&12)<<6)+f+5;distance=((c&16)<<12)+(d<<8)+e+1;}
    else if(c<0xfc)literal=((c&31)+1)*4;
    else {literal=c&3;ended=true;}
    assert(pos+literal<=input.length&&cursor+literal+count<=size,'RefPack bounds');
    input.copy(out,cursor,pos,pos+literal);pos+=literal;cursor+=literal;
    if(count){assert(distance>0&&distance<=cursor,'Invalid RefPack back reference');for(let i=0;i<count;i++){out[cursor]=out[cursor-distance];cursor++;}}
  }
  assert.equal(cursor,size,'RefPack decoded size mismatch');return out;
}
class BigReader {
  constructor(file) {
    this.file=file;this.fd=fs.openSync(file,'r');const h=this.read(0,16);
    assert(['BIG4','BIGF'].includes(h.toString('ascii',0,4)),'Not a BIG archive');
    const count=h.readUInt32BE(8),tableSize=h.readUInt32BE(12),fileSize=fs.fstatSync(this.fd).size;
    assert(tableSize>=16&&tableSize<=16*1024*1024&&tableSize<=fileSize);
    const table=this.read(0,tableSize);this.entries=[];let p=16;
    for(let i=0;i<count;i++) {
      assert(p+8<table.length);const offset=table.readUInt32BE(p),size=table.readUInt32BE(p+4),end=table.indexOf(0,p+8);
      assert(end>=p+8&&offset+size<=fileSize);this.entries.push({name:table.toString('utf8',p+8,end),offset,size});p=end+1;
    }
  }
  read(offset,size){const b=Buffer.alloc(size);assert.equal(fs.readSync(this.fd,b,0,size,offset),size);return b;}
  get(name){const entry=this.entries.find(e=>e.name.toLowerCase()===name.toLowerCase());assert(entry,'Missing archive entry '+name);return unpack(this.read(entry.offset,entry.size));}
  close(){fs.closeSync(this.fd);}
}
if(require.main===module) {
  const big=new BigReader(process.argv[2]);try {
    const selected=big.entries.filter(e=>new RegExp(process.argv[3]||'.','i').test(e.name));
    for(const entry of selected){console.log(entry);if(process.argv.includes('--strings')){const b=big.get(entry.name);console.log('Decoded bytes:',b.length,'Header:',b.subarray(0,64).toString('hex'));console.log(b.toString('latin1').match(/[A-Za-z_][A-Za-z0-9_.:/\\ -]{4,120}/g)?.filter(s=>/spec|gloss|light|color|diffuse|normal|recolor|pitbull|texture|sampler/i.test(s)).slice(0,180));}}
  }finally{big.close();}
}
module.exports={BigReader,unpack};
