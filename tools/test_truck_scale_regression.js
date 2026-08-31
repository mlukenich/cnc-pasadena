'use strict';
// Read-only comparison against the pre-fix export, including every rigid pivot.
const fs=require('fs'),path=require('path'),assert=require('assert'),crypto=require('crypto');
const root=path.resolve(__dirname,'..');
if(!process.argv[2])throw Error('Supply the preserved pre-fix baseline directory.');
const baseline=path.resolve(process.argv[2]);
const blocks=(s,tag)=>[...s.matchAll(new RegExp(`<${tag}(?:\\s[^>]*)?>[\\s\\S]*?<\\/${tag}>`,'g'))].map(m=>m[0]);
const xyz=s=>[...s.matchAll(/\b[XYZ]="(-?[\d.eE+-]+)"/g)].map(m=>Number(m[1]));
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
for(const [dir,name,ratio] of [['PV','PVDually',.75],['PM','PVMudTank',1.25]]){
 const before=path.join(baseline,'art',dir),after=path.join(root,'src/Art',dir);
 const a=fs.readFileSync(path.join(before,name+'_Model.w3x'),'utf8'),b=fs.readFileSync(path.join(after,name+'_Model.w3x'),'utf8');
 const av=blocks(a,'Vertices').flatMap(xyz),bv=blocks(b,'Vertices').flatMap(xyz);
 assert(av.length===bv.length&&av.length>0,'Vertex count changed');
 for(let i=0;i<av.length;i++)assert(Math.abs(bv[i]-av[i]*ratio)<.000003,`${name}: vertex component ${i} did not scale uniformly`);
 const ap=blocks(a,'Pivot'),bp=blocks(b,'Pivot');assert.equal(ap.length,bp.length);
 for(let i=0;i<ap.length;i++){
  const at=ap[i].match(/<Translation[^>]*\/>/)[0],bt=bp[i].match(/<Translation[^>]*\/>/)[0];
  const p=xyz(at),q=xyz(bt);p.forEach((v,k)=>assert(Math.abs(q[k]-v*ratio)<.000003,`${name}: pivot ${i} detached`));
  assert.equal(ap[i].replace(at,''),bp[i].replace(bt,''),'Bone name, parent or orientation changed');
 }
 // Triangle plane distances change with scale; connectivity must not.
 const indices=s=>blocks(s,'Triangles').map(t=>[...t.matchAll(/<V>(\d+)<\/V>/g)].map(m=>m[1]).join(','));
 assert(JSON.stringify(indices(a))===JSON.stringify(indices(b)),`${name}: triangle connectivity changed`);
 for(const tag of ['TexCoords','W3DContainer'])assert(JSON.stringify(blocks(a,tag))===JSON.stringify(blocks(b,tag)),`${name}: ${tag} changed`);
 for(const map of ['Atlas','Normal','Spec','House'])assert.equal(hash(path.join(before,name+map+'.tga')),hash(path.join(after,name+map+'.tga')),`${name}: material changed`);
 console.log(`[PASS] ${name}: ${av.length/3} vertices and ${ap.length} pivots scaled by ${ratio}; topology, UVs, rigid membership and all four maps preserved.`);
}
