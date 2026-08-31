'use strict';
const assert=require('assert');
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

module.exports={ddsPixel};
