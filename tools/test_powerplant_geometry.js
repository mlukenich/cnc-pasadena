'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path');
const {build}=require('./generate_pasadena_powerplant'),{sub,cross,dot,unit}=require('./powerplant_geometry'),{tangentFrame}=require('./powerplant_materials');
const {mesh:m,parts,pivots,w3x,report}=build();const tf=tangentFrame(m);
assert(m.triangles.length<30000,'Building triangle budget exceeded');assert(m.vertices.length<65536,'16-bit mesh vertex budget exceeded');
let exterior=0;
for(let i=0;i<m.vertices.length;i++){
 const v=m.vertices[i],n=m.normals[i];assert(v.every(Number.isFinite));assert(Math.abs(Math.hypot(...n)-1)<1e-6);
 for(const t of [tf.tangents[i],tf.binormals[i]]){assert(t.every(Number.isFinite));assert(Math.abs(Math.hypot(...t)-1)<1e-5);assert(Math.abs(dot(n,t))<1e-5);}
 assert(Math.abs(dot(tf.tangents[i],tf.binormals[i]))<1e-5);
}
for(let j=0;j<m.triangles.length;j++){
 const t=m.triangles[j],p=t.map(i=>m.vertices[i]),uv=t.map(i=>m.uvs[i]),g=m.groups[j],mat=m.materials[j];
 const geo=cross(sub(p[1],p[0]),sub(p[2],p[0]));assert(Math.hypot(...geo)>1e-8,'Zero triangle '+g);
 for(const i of t)assert(dot(unit(geo),m.normals[i])>.7,'Normals oppose winding '+g);
 const area=Math.abs((uv[1][0]-uv[0][0])*(uv[2][1]-uv[0][1])-(uv[2][0]-uv[0][0])*(uv[1][1]-uv[0][1]));assert(area>1e-12,'Collapsed UV '+g);
 for(const u of uv)assert(u[0]>(mat%4)/4&&u[0]<(mat%4+1)/4&&u[1]>Math.floor(mat/4)/4&&u[1]<(Math.floor(mat/4)+1)/4,'UV escaped cell '+g);
 const c=p[0].map((_,k)=>p.reduce((s,q)=>s+q[k],0)/3);
 if(g==='foundation'){assert(dot(geo,sub(c,[0,0,1]))>0,'Foundation faces inward');exterior++;}
 if(g.startsWith('roof-sheet')){assert(geo[2]>0,'Roof top faces down');exterior++;}
 if(g.startsWith('roof-underside')){assert(geo[2]<0,'Roof underside faces up');exterior++;}
 if(g==='sign-front'){assert(geo[0]>0,'Sign faces into shed');exterior++;}
 if(g==='fuel-tank'&&Math.abs(geo[0]/Math.hypot(...geo))<.9){assert(dot(geo,[0,c[1]+14.8,c[2]-9])>0,'Fuel shell faces inward');exterior++;}
 if(/^stack-(outer|inner)-/.test(g)){
  const y=Number(g.split('-').at(-1)),direction=[c[0]-18,c[1]-y,0],sign=g.includes('inner')?-1:1;
  assert(sign*dot(geo,direction)>0,'Stack bore/exterior inverted');exterior++;
 }
}
const points=re=>m.triangles.flatMap((t,i)=>re.test(m.groups[i])?t.map(v=>m.vertices[v]):[]);
const tank=points(/^fuel-tank$/);assert(Math.min(...tank.map(p=>p[0]))>-9.5,'Fuel tank intersects shed front wall');
assert(Math.min(...tank.map(p=>p[1]))>-21.5,'Tank obstructs side service walkway');
assert(Math.max(...points(/^door-/).map(p=>p[1]))<-21.7,'Service door buried in wall');
const fan=parts.find(p=>p.id==='FAN');assert(fan&&fan.bone===1);
let fanSamples=0;
for(const v of fan.mesh.vertices){
 const radius=Math.hypot(v[1],v[2]);assert(radius<6.56,'Fan extends outside design sweep');
 // Every rotation about X preserves radius and X: analytic full-revolution clearance.
 assert(radius<7.2-.5,'Fan hits shroud');assert(v[0]+pivots[1][2]>25.375+.25,'Fan hits radiator core');assert(v[0]+pivots[1][2]<27.7-.8,'Fan hits front safety cage');fanSamples++;
}
for(const g of ['stack-inner-1.4','stack-inner-11.4'])assert(m.groups.includes(g),'No hollow stack');
const entry=points(/^entry-step/);assert(Math.min(...entry.map(p=>p[0]))===-2&&Math.max(...entry.map(p=>p[0]))===8,'Entry width changed');
assert(report.bounds.min[0]>=-32&&report.bounds.max[0]<=32&&report.bounds.min[1]>=-31&&report.bounds.max[1]<=26&&report.bounds.max[2]<47);
assert(report.bounds.min[2]>=0,'Geometry protrudes below the foundation ground plane');
assert.equal(parts.reduce((s,p)=>s+p.mesh.triangles.length,0),m.triangles.length,'Partition dropped or duplicated surfaces');
for(const p of parts)assert(p.mesh.vertices.length<65536);
const clip=w3x.match(/<ChannelQuaternion[\s\S]*?<\/ChannelQuaternion>/)[0];
const frames=[...clip.matchAll(/<Frame X="([^"]+)" Y="([^"]+)" Z="([^"]+)" W="([^"]+)"/g)].map(m=>m.slice(1).map(Number));assert.equal(frames.length,61);
for(const q of frames){assert(Math.abs(Math.hypot(...q)-1)<1e-6);assert(q[1]===0&&q[2]===0);}
assert(Math.abs(dot(frames[0],frames.at(-1)))>.99999,'Animation loop seam');
const obj=fs.readFileSync(path.resolve(__dirname,'../src/Art/PP/PPPower.obj'),'utf8');
const ov=[...obj.matchAll(/^v (.+)$/gm)].map(m=>m[1].split(' ').map(Number));assert.equal(ov.length,m.vertices.length);
ov.forEach((p,i)=>assert(Math.hypot(...sub(p,m.vertices[i]))<1e-6,'OBJ world reconstruction'));
console.log(`[PASS] Power plant: ${m.triangles.length} triangles, ${exterior} exterior-direction checks; UVs/tangents, tank/shed and walkway clearance, ${fanSamples} full-sweep fan vertices, rigid partition, 61 animation quaternions, OBJ reconstruction.`);
