'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert'),root=path.resolve(__dirname,'..');
const f=JSON.parse(fs.readFileSync(path.join(root,'src/Art/PV/PVDually_Model.report.json'))),m=JSON.parse(fs.readFileSync(path.join(root,'src/Art/PM/PVMudTank_Model.report.json')));
const size=r=>r.bounds.max.map((v,k)=>v-r.bounds.min[k]),a=size(f),b=size(m);
// Cross-asset hierarchy, not just matching the generator's scale constant.
assert(b[0]>a[0]*1.10&&b[0]<a[0]*1.25,'Monster should be modestly longer than F-250');
assert(b[1]>a[1]*1.40&&b[1]<a[1]*1.60,'Monster should have a substantially wider stance');
assert(b[2]>a[2]*1.20&&b[2]<a[2]*1.40,'Monster should stand taller');
assert(a[0]<55&&b[0]<65,'Both vehicles have grown beyond the paired scale target');
console.log(`[PASS] Relative dimensions: F-250 ${a.map(v=>v.toFixed(2)).join(' × ')}; monster ${b.map(v=>v.toFixed(2)).join(' × ')}.`);
