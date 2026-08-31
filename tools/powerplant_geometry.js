'use strict';
// Building-specific editable geometry collector. Never imports a vehicle generator.
const unit=a=>{const n=Math.hypot(...a);if(n<1e-12)throw Error('Zero direction');return a.map(v=>v/n);};
const sub=(a,b)=>a.map((v,k)=>v-b[k]);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot=(a,b)=>a.reduce((s,v,k)=>s+v*b[k],0);
function createPowerplantGeometry(detail=2) {
 const vertices=[],normals=[],uvs=[],triangles=[],groups=[],materials=[],records=[],bounds=new Map(),checks=[];
 function emit(points,n,mat,g,customUV) {
  if(!Number.isInteger(mat)||mat<0||mat>15)throw Error('Unknown material '+mat);
  n=unit(n);let p=points.map(a=>[...a]),uv=customUV?.map(a=>[...a]);
  if(dot(cross(sub(p[1],p[0]),sub(p[2],p[0])),n)<0){p.reverse();uv?.reverse();}
  const start=vertices.length;vertices.push(...p);normals.push(...p.map(()=>n));uvs.push(...p.map(()=>[0,0]));
  for(let i=1;i<p.length-1;i++){triangles.push([start,start+i,start+i+1]);groups.push(g);materials.push(mat);}
  records.push({p,n,mat,g,start,uv});
 }
 const face=(p,n,m,g)=>emit(p,n,m,g);
 const triangle=face;
 function box(x0,x1,y0,y1,z0,z1,m,g) {
  if(!(x1>x0&&y1>y0&&z1>z0))throw Error('Empty box '+g);
  const faces=[[[[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[x1,y0,z1]],[1,0,0]],[[[x0,y1,z0],[x0,y0,z0],[x0,y0,z1],[x0,y1,z1]],[-1,0,0]],[[[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]],[0,1,0]],[[[x1,y0,z0],[x0,y0,z0],[x0,y0,z1],[x1,y0,z1]],[0,-1,0]],[[[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]],[0,0,1]],[[[x0,y1,z0],[x1,y1,z0],[x1,y0,z0],[x0,y0,z0]],[0,0,-1]]];
  for(const [p,n] of faces)face(p,n,m,g);
 }
 function cylinder(axis,a,b,r,segments,m,g,cap0=true,cap1=true) {
  const dir=unit(sub(b,a)),right=unit(cross(dir,Math.abs(dir[2])<.9?[0,0,1]:[0,1,0])),up=unit(cross(right,dir));
  const at=(p,t)=>p.map((v,k)=>v+r*(right[k]*Math.cos(t)+up[k]*Math.sin(t)));
  for(let i=0;i<segments;i++){
   const t=i*2*Math.PI/segments,u=(i+1)*2*Math.PI/segments,n=right.map((v,k)=>v*Math.cos((t+u)/2)+up[k]*Math.sin((t+u)/2));
   emit([at(a,t),at(b,t),at(b,u),at(a,u)],g.startsWith('stack-inner-')?n.map(v=>-v):n,m,g,[[i/segments,1],[i/segments,0],[(i+1)/segments,0],[(i+1)/segments,1]]);
   if(cap0)face([a,at(a,u),at(a,t)],dir.map(v=>-v),m,g+'-cap0');
   if(cap1)face([b,at(b,t),at(b,u)],dir,m,g+'-cap1');
  }
  checks.push({type:'cylinder',g,a,b,r});
 }
 require('./powerplant_details')({box,face,triangle,cylinder,emit,detail,checks});
 for(const {p,g} of records){if(!bounds.has(g))bounds.set(g,{min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]});let b=bounds.get(g);for(const q of p)for(let k=0;k<3;k++){b.min[k]=Math.min(b.min[k],q[k]);b.max[k]=Math.max(b.max[k],q[k]);}}
 for(const {p,n,mat,g,start,uv} of records){
  const b=bounds.get(g),frac=(q,k)=>(q[k]-b.min[k])/Math.max(1e-8,b.max[k]-b.min[k]);
  const axis=n.map(Math.abs).indexOf(Math.max(...n.map(Math.abs)));
  p.forEach((q,i)=>{
   let [u,v]=uv?uv[i]:axis===2?[frac(q,0),frac(q,1)]:axis===1?[n[1]<0?frac(q,0):1-frac(q,0),1-frac(q,2)]:[n[0]>0?frac(q,1):1-frac(q,1),1-frac(q,2)];
   uvs[start+i]=[(mat%4+.025+.95*u)/4,(Math.floor(mat/4)+.025+.95*v)/4];
  });
 }
 // Analytic cylindrical side normals: preserve cap hard edges and UV seams.
 for(const c of checks.filter(c=>c.type==='cylinder')){
  const axis=unit(sub(c.b,c.a));
  for(const rec of records.filter(r=>r.g===c.g))for(let i=0;i<rec.p.length;i++){
   const d=sub(rec.p[i],c.a),n=unit(d.map((v,k)=>v-dot(d,axis)*axis[k]));normals[rec.start+i]=c.g.startsWith('stack-inner-')?n.map(v=>-v):n;
  }
 }
 return {vertices,normals,uvs,triangles,groups,materials,checks,detail};
}
module.exports={createPowerplantGeometry,unit,sub,cross,dot};
