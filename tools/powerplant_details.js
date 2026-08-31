'use strict';
// Editable architecture and machinery. +X front. Level 0 preserves the blockout.
module.exports=function({box,face,triangle,cylinder,emit,detail,checks}) {
 const sub=(a,b)=>a.map((v,k)=>v-b[k]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],unit=a=>a.map(v=>v/Math.hypot(...a));
 const block=(g,x,y,z,sx,sy,sz,m)=>box(x-sx/2,x+sx/2,y-sy/2,y+sy/2,z-sz/2,z+sz/2,m,g);
 const beam=(g,a,b,r,m,n=8)=>cylinder('',a,b,r,n,m,g);
 function quad(g,p,m,n){face(p,n||unit(cross(sub(p[1],p[0]),sub(p[2],p[0]))),m,g);}
 function bevel(g,x,y,z,sx,sy,sz,m,c=.3){
  const ring=(zz,inset)=>{const a=sx/2-inset,b=sy/2-inset,d=Math.min(c,a/2,b/2);return [[-a+d,-b],[a-d,-b],[a,-b+d],[a,b-d],[a-d,b],[-a+d,b],[-a,b-d],[-a,-b+d]].map(p=>[p[0]+x,p[1]+y,zz]);};
  const h=Math.min(c,sz/3),inset=Math.min(.15,sx*.1,sy*.1),rr=[ring(z-sz/2,inset),ring(z-sz/2+h,0),ring(z+sz/2-h,0),ring(z+sz/2,inset)];
  for(let j=0;j<3;j++)for(let i=0;i<8;i++)quad(g,[rr[j][i],rr[j][(i+1)%8],rr[j+1][(i+1)%8],rr[j+1][i]],m);
  for(const j of [0,3])for(let i=1;i<7;i++)triangle([rr[j][0],rr[j][i],rr[j][i+1]],[0,0,j?1:-1],m,g);
 }
 function lathe(g,center,profile,m,axis='x',seg=32){
  const ax={x:0,y:1,z:2}[axis],rr=[0,1,2].filter(k=>k!==ax);
  const pt=(a,r,t)=>{let p=[...center];p[ax]+=a;p[rr[0]]+=r*Math.cos(t);p[rr[1]]+=r*Math.sin(t);return p;};
  for(let j=0;j<profile.length-1;j++)for(let i=0;i<seg;i++){
   const [a,r]=profile[j],[b,s]=profile[j+1],t=i*2*Math.PI/seg,u=(i+1)*2*Math.PI/seg,n=[0,0,0];
   n[ax]=r-s;n[rr[0]]=(b-a)*Math.cos((t+u)/2);n[rr[1]]=(b-a)*Math.sin((t+u)/2);
   const p=[pt(a,r,t),pt(b,s,t),pt(b,s,u),pt(a,r,u)];
   if(!r)triangle([p[0],p[1],p[2]],n,m,g);else if(!s)triangle([p[0],p[1],p[3]],n,m,g);else face(p,n,m,g);
  }
 }
 function pipe(g,points,r,m,n=12){
  let pp=points;
  if(detail>=2&&/^intake-pipe|^exhaust-upfeed|^radiator-hose/.test(g)){
   pp=[points[0]];
   for(let i=1;i<points.length-1;i++){
    const p=points[i],a=p.map((v,k)=>v*.7+points[i-1][k]*.3),b=p.map((v,k)=>v*.7+points[i+1][k]*.3);pp.push(a);
    for(let s=1;s<=4;s++){const t=s/4;pp.push(p.map((v,k)=>(1-t)*(1-t)*a[k]+2*(1-t)*t*v+t*t*b[k]));}
   }pp.push(points[points.length-1]);
  }
  for(let i=1;i<pp.length;i++)beam(g+'-'+i,pp[i-1],pp[i],r,m,n);
 }
 function ring(g,center,ax,r,tube,m,seg=32){
  const [a,b]=[0,1,2].filter(k=>k!==ax);for(let i=0;i<seg;i++){const p=[...center],q=[...center];p[a]+=r*Math.cos(i*2*Math.PI/seg);p[b]+=r*Math.sin(i*2*Math.PI/seg);q[a]+=r*Math.cos((i+1)*2*Math.PI/seg);q[b]+=r*Math.sin((i+1)*2*Math.PI/seg);beam(g+'-'+i,p,q,tube,m,6);}
 }
 const N=detail?32:16;
 bevel('foundation',0,0,1,64,52,2,0,.65);
 // Utility shed: wall thickness and a real open engine bay, never a dark decal.
 block('shed-rear-wall',-28.5,-.5,14.3,1,41,24.6,1);
 for(const y of [-21,20])block('shed-side-wall-'+y,-19.5,y,14.3,19,.7,24.6,1);
 block('shed-front-wing',-10,-15.25,14.3,1,11.5,24.6,1);
 for(const y of [-6,19.4])block('shed-bay-column-'+y,-9.3,y,14.3,1.2,1,24.6,3);
 block('shed-bay-lintel',-9.3,6.7,24.5,1.3,26.4,3.7,3);
 // Both exterior roof faces and underside have explicit outward normals.
 for(const side of [-1,1]){
  const y=side<0?-22:21;
  quad('roof-sheet-'+side,[[-30,-.5,33],[-7,-.5,33],[-7,y,27.5],[-30,y,27.5]],2,[0,side,Math.abs(y+.5)/5.5]);
  quad('roof-underside-'+side,[[-30,-.5,32.6],[-7,-.5,32.6],[-7,y,27.1],[-30,y,27.1]],3,[0,-side,-Math.abs(y+.5)/5.5]);
 }
 for(const x of [-30,-7])triangle([[x,-22,27.1],[x,21,27.1],[x,-.5,32.6]],[x<0&&x===-30?-1:1,0,0],1,'roof-gable-'+x);
 block('roof-ridge',-18.5,-.5,33.12,23.3,.6,.3,4);
 for(const y of [-22,21])block('roof-eave-'+y,-18.5,y,27.3,23,.5,.7,4);
 // Concrete-mounted machinery skids and a large black crankcase.
 for(const y of [.3,12.5])bevel('engine-skid-'+y,5,y,3.25,42,1.5,1.7,3);
 bevel('engine-crankcase',5,6.4,9.2,24,10.6,8.5,3,.7);
 for(const y of [1.4,11.4])bevel('engine-red-bank-'+y,4,y,14,23.5,4.4,5.4,1,.7);
 cylinder('',[-12,6.4,11],[-7,6.4,11],6.6,N,3,'alternator');
 cylinder('',[24,6.4,11.2],[26.3,6.4,11.2],7.2,N,3,'radiator-shroud',true,false);
 for(const y of [-2.2,15])block('radiator-post-'+y,27,y,11.2,1.3,1.3,18,1);
 for(const z of [2.2,20.2])block('radiator-crossbar-'+z,27,6.4,z,1.3,18.5,1.3,1);
 // Fuel tank and saddle supports, visible alongside the machinery.
 const tankShift=detail>=2?12:0;
 lathe('fuel-tank',[-6+tankShift,-14.8,9],[[ -15,0],[-15,3.8],[-14.2,4.8],[-13.3,5.2],[9.3,5.2],[10.2,4.8],[11,3.8],[11,0]],5,'x',N);
 for(const x0 of [-17,1]){const x=x0+tankShift;bevel('fuel-saddle-'+x,x,-14.8,3.6,3,10.5,3.1,3);block('fuel-saddle-foot-'+x,x,-14.8,2.25,4,11.5,.4,4);}
 // Twin open stacks: outer wall, rolled lip, inner bore and recessed darkness.
 for(const [x,y,top] of [[18,1.4,46],[18,11.4,41]]){
  cylinder('',[x,y,13],[x,y,top],1.25,N,4,'stack-outer-'+y,false,false);
  cylinder('',[x,y,top-4],[x,y,top-.02],1.02,N,3,'stack-inner-'+y,false,false);
  // The collector explicitly points inner-bore surfaces into the opening.
  lathe('stack-lip-'+y,[x,y,0],[[top-.35,1.25],[top,1.3],[top+.13,1.19],[top,1.02],[top-.35,1.02]],4,'z',N);
  cylinder('',[x,y,top-4.1],[x,y,top-4],1.02,N,3,'stack-darkness-'+y);
  block('stack-support-foot-'+y,x,y,2.4,4,4,.65,3);
  checks.push({type:'stack',g:'stack-outer-'+y,center:[x,y],top,inner:1.02});
 }
 if(!detail)return;
 // Sheet ribs, seams and structural connections carry the silhouette.
 for(let x=-29.5;x<=-7.5;x+=1.35)for(const side of [-1,1])beam('roof-rib-'+x+'-'+side,[x,-.5,33.13],[x,side<0?-22:21,27.63],.085,4,6);
 for(let x=-28;x<=-11;x+=1.5)for(const y of [-21.4,20.4])block('wall-rib-'+x+'-'+y,x,y,14.2,.16,.2,24,5);
 for(let y=-20;y<=19;y+=1.5)block('back-rib-'+y,-29.1,y,14.2,.2,.16,24,5);
 for(const x of [-29,-10])for(const y of [-21.5,20.5])block('wall-corner-'+x+'-'+y,x,y,14.1,.5,.5,24.6,4);
 // Identity, placed once per sign rather than repeated on box sides.
 block('sign-frame',-6.75,-.5,28.4,.35,27,6,3);
 quad('sign-front',[[-6.54,-13.7,25.65],[-6.54,12.7,25.65],[-6.54,12.7,31.15],[-6.54,-13.7,31.15]],9,[1,0,0]);
 bevel('service-door-frame',-20,-21.55,10.5,7.2,.5,15.8,3);
 block('service-door',-20,-21.9,10.5,6.2,.2,14.8,2);
 quad('door-warning',[[-21.5,-22.03,13],[-18,-22.03,13],[-18,-22.03,16.5],[-21.5,-22.03,16.5]],13,[0,-1,0]);
 beam('door-handle',[-17.7,-22.2,8.5],[-17.7,-22.2,10.5],.12,4);
 for(const z of [5,14])block('door-hinge-'+z,-23,-22,z,.55,.5,.75,4);
 bevel('window-seal',-13,-21.65,18,3.8,.3,4.2,3);
 block('window-glass',-13,-21.84,18,3.3,.05,3.7,8);
 block('window-bar',-13,-21.9,18,.15,.12,3.7,4);
 for(const y of [-6,19.4]){bevel('bay-lamp-cage-'+y,-8.5,y,22,1,1.5,2.1,3);block('bay-lamp-'+y,-7.94,y,22,.16,1.1,1.4,10);}
 // Engine: six separable cylinder heads per bank, injectors and manifolds.
 for(const y of [1.4,11.4]){
  for(let i=0;i<6;i++){
   const x=-6+i*4;
   bevel('head-'+y+'-'+i,x,y,16.5,3.4,4.5,1.3,1,.25);
   beam('injector-'+y+'-'+i,[x,y,17.05],[x,y,18],.3,3);
   pipe('injector-line-'+y+'-'+i,[[x,y,18],[x,y+(y<6?1.5:-1.5),18.6],[x,6.4,18.6]],.09,11,6);
   for(const dx of [-1.2,1.2])for(const dy of [-1.55,1.55])beam('head-bolt-'+y+'-'+i+'-'+dx+'-'+dy,[x+dx,y+dy,17.1],[x+dx,y+dy,17.35],.15,4,6);
   pipe('exhaust-runner-'+y+'-'+i,[[x,y+(y<6?-2.2:2.2),14],[x,y+(y<6?-3:3),13],[x,y+(y<6?-3:3),11.7]],.36,5,8);
  }
  beam('exhaust-manifold-'+y,[-7,y+(y<6?-3:3),11.7],[16,y+(y<6?-3:3),11.7],.65,5,16);
  pipe('exhaust-upfeed-'+y,[[16,y+(y<6?-3:3),11.7],[18,y+(y<6?-3:3),12.5],[18,y,13]],.75,4,16);
  for(const z of [14,23,34]){cylinder('',[18,y,z-.25],[18,y,z+.25],1.48,24,3,'stack-clamp-'+y+'-'+z);}
  for(const yy of [y-1.8,y+1.8])beam('stack-upright-'+y+'-'+yy,[16.6,yy,2.7],[16.6,yy,24],.22,4);
  beam('stack-brace-'+y,[16.6,y-1.8,5],[16.6,y+1.8,21],.17,4);
  // Turbo compressor and intake pipe connect to both cylinder banks.
  cylinder('',[-3,y,19.6],[0,y,19.6],1.8,24,4,'turbo-housing-'+y);
  cylinder('',[-3.1,y,19.6],[-3.35,y,19.6],1.1,24,3,'turbo-inlet-'+y);
  pipe('intake-pipe-'+y,[[0,y,19.6],[3,y,20.4],[10,y,20.4],[12,y,18]],.65,4,16);
  for(const x of [3,8])cylinder('',[x-.18,y,20.4],[x+.18,y,20.4],.81,16,3,'intake-coupler-'+y+'-'+x);
  for(let x=-4;x<=12;x+=8){bevel('engine-foot-'+y+'-'+x,x,y,5,2.8,3,4,3);beam('foot-bolt-'+y+'-'+x,[x,y,2.8],[x,y,3.5],.25,4,6);}
 }
 beam('fuel-common-rail',[-7,6.4,18.6],[16,6.4,18.6],.22,11);
 for(const x of [-11.5,-7.5]){cylinder('',[x-.15,6.4,11],[x+.15,6.4,11],6.8,32,4,'alternator-band-'+x);}
 for(let i=0;i<12;i++){const a=i*2*Math.PI/12;beam('alternator-cooling-rib-'+i,[-11,6.4+6.65*Math.cos(a),11+6.65*Math.sin(a)],[-8,6.4+6.65*Math.cos(a),11+6.65*Math.sin(a)],.13,4,6);}
 // Seven modeled fan blades, a separate rigid component for future animation.
 for(let i=0;i<7;i++){
  const a=i*2*Math.PI/7,point=(r,t,x)=>[x,6.4+r*Math.cos(t),11.2+r*Math.sin(t)];
  quad('fan-blade-'+i,[point(1.1,a,25.8),point(6.55,a+.12,25.8),point(6.55,a+.53,26),point(1.1,a+.8,26)],3,[1,0,0]);
  quad('fan-blade-back-'+i,[point(1.1,a,25.75),point(6.55,a+.12,25.75),point(6.55,a+.53,25.95),point(1.1,a+.8,25.95)],3,[-1,0,0]);
 }
 cylinder('',[25.7,6.4,11.2],[26.6,6.4,11.2],1.55,24,3,'fan-hub');
 ring('fan-guard-outer',[27.78,6.4,11.2],0,7.2,.12,4,40);
 for(const r of [2.8,4.2,5.65])ring('fan-guard-ring-'+r,[27.8,6.4,11.2],0,r,.07,4,32);
 for(let i=0;i<8;i++){const a=i*Math.PI/4;beam('fan-guard-spoke-'+i,[27.82,6.4,11.2],[27.82,6.4+7.2*Math.cos(a),11.2+7.2*Math.sin(a)],.08,4,6);}
 for(const y of [-2.2,15])for(const z of [2.2,20.2])beam('radiator-frame-bolt-'+y+'-'+z,[27.5,y,z],[27.9,y,z],.3,4,6);
 block('radiator-top-grate',25,6.4,19.2,3.3,15,.3,12);
 pipe('radiator-hose',[[24,13,16.5],[21,14.5,17],[16,14.5,16.5]],.42,7,12);
 // Tank straps, fill, fuel filter and working connection to the engine.
 for(const x0 of [-17,1]){const x=x0+tankShift;lathe('fuel-strap-'+x,[0,-14.8,9],[[x-.25,5.2],[x-.25,5.35],[x+.25,5.35],[x+.25,5.2]],4,'x',32);}
 cylinder('',[-12+tankShift,-14.8,13.5],[-12+tankShift,-14.8,14.5],1.3,20,3,'tank-fill');
 cylinder('',[-12+tankShift,-14.8,14.5],[-12+tankShift,-14.8,14.75],1.6,20,4,'tank-fill-cap');
 pipe('fuel-supply',[[5+tankShift,-14.8,8],[8+tankShift,-14.8,8],[8+tankShift,-9,8],[4,-7,8],[4,-1.6,11.7]],.24,11,10);
 cylinder('',[8+tankShift,-9,5],[8+tankShift,-9,8.5],.65,16,1,'fuel-filter');
 pipe('fuel-vent',[[-18+tankShift,-14.8,13],[-18+tankShift,-14.8,16],[-18+tankShift,-13.6,16]],.18,11,8);
 quad('tank-equipment-label',[[-8+tankShift,-20.04,7],[-3+tankShift,-20.04,7],[-3+tankShift,-20.04,11],[-8+tankShift,-20.04,11]],15,[0,-1,0]);
 // Switchgear at rear: covered cabinets with ceramic bushings and grounded conduits.
 for(const y of [-13,-4,5,14]){
  bevel('switch-cabinet-'+y,-29.65,y,15,2.5,6.5,10,2);
  quad('switch-warning-'+y,[[-30.95,y+1.4,14],[-30.95,y-1.4,14],[-30.95,y-1.4,17],[-30.95,y+1.4,17]],13,[-1,0,0]);
  beam('bushing-core-'+y,[-29.7,y,20],[-29.7,y,26],.4,11,12);
  for(let z=20.8;z<25.7;z+=.7)cylinder('',[-29.7,y,z],[-29.7,y,z+.22],.8,16,7,'bushing-disc-'+y+'-'+z);
  pipe('power-cable-'+y,[[-29.7,y,26],[-27.5,y,28],[-23,y,28]],.14,7,8);
  pipe('conduit-'+y,[[-30,y,10],[-30,y,4],[-27,y,4]],.2,4,8);
 }
 // Maintenance walkways, perimeter rails and a real gap aligned with the steps.
 for(const y of [-23,23])block('catwalk-'+y,0,y,2.08,60,3.4,.16,12);
 block('front-catwalk',30,0,2.08,2.7,48,.16,12);
 for(const y of [-24,24]){
  const ranges=y<0?[[-29,-2],[8,30]]:[[-29,30]];
  for(const [a,b] of ranges){for(const z of [5,8])beam('rail-'+y+'-'+a+'-'+z,[a,y,z],[b,y,z],.13,6,8);for(let x=a;x<=b;x+=7)beam('rail-post-'+y+'-'+x,[x,y,2],[x,y,8],.16,6,8);}
 }
 for(const z of [5,8])beam('front-rail-'+z,[30,-24,z],[30,-4,z],.13,6,8);
 for(const y of [-24,-14,-4])beam('front-post-'+y,[30,y,2],[30,y,8],.16,6,8);
 // Entry from the near side, clear of the fuel tank, 10 units wide.
 for(let i=0;i<4;i++)block('entry-step-'+i,3,-29.3+i*1.35,.25+i*.5,10,1.4,.5,12);
 for(const x of [-2,8]){
  beam('stair-stringer-'+x,[x,-30,.25],[x,-24,2.1],.24,3,8);
  for(const z of [3.2,5.8])beam('stair-rail-'+x+'-'+z,[x,-30,z],[x,-24,z+2.1],.13,6,8);
  for(const y of [-30,-24])beam('stair-post-'+x+'-'+y,[x,y,y===-30?0:2],[x,y,y===-30?5.8:7.9],.16,6,8);
 }
 for(const [x,y] of [[-30,-24],[30,-24],[30,24]]){cylinder('',[x,y,2],[x,y,6.7],.65,12,6,'bollard-'+x+'-'+y);}
 // Team-color patches are restricted to bolt-on plates and never recolor signs.
 block('team-front-plate',27.72,6.4,20.2,.14,10,.65,14);
 block('team-shed-plate',-18,-21.6,24,12,.14,1,14);
 checks.push({type:'entry',x:[-2,8],y:[-30,-23],width:10});
 checks.push({type:'fan',pivot:[26.1,6.4,11.2],bladeRadius:6.55,shroudRadius:7.2,guardX:27.7});
 if(detail<2)return;
 // Second pass: assembled radiator core, slatted side covers and bolted feet.
 bevel('radiator-core',25.05,6.4,11.2,.65,16.3,16.3,3,.3);
 for(let y=-1.2;y<14.5;y+=.6)block('radiator-fin-'+y,25.48,y,11.2,.12,.12,15.6,7);
 for(const y of [-1.8,14.6])block('radiator-side-cover-'+y,24.1,y,11.2,3.7,.55,16.4,3);
 for(const y of [-2.13,14.93])for(let z=4.3;z<18.5;z+=1.2)block('radiator-side-vent-'+y+'-'+z,24.1,y,z,2.8,.16,.18,4);
 for(const y of [-2.2,15]){block('radiator-ground-foot-'+y,26,y,2.45,5,3,.7,3);for(const x of [24.5,27.5])beam('radiator-anchor-'+y+'-'+x,[x,y,2.8],[x,y,3.1],.22,4,6);}
 // Engine end cover, accessible inspection plates, bellhousing and oil filters.
 lathe('front-crankcase-cover',[17.25,6.4,9.5],[[0,0],[0,3.2],[.3,3.6],[.85,3.6],[1.15,3.2],[1.15,0]],3,'x',32);
 for(let i=0;i<8;i++){const a=i*Math.PI/4;beam('crankcase-bolt-'+i,[18.25,6.4+2.85*Math.cos(a),9.5+2.85*Math.sin(a)],[18.55,6.4+2.85*Math.cos(a),9.5+2.85*Math.sin(a)],.19,4,6);}
 for(const side of [-1,1]){
  const y=6.4+side*5.45;
  for(const x of [-3,4,11]){bevel('inspection-plate-'+side+'-'+x,x,y,8.8,4.8,.25,3.1,3,.18);for(const dx of [-1.75,1.75])for(const z of [7.9,9.7])beam('inspection-bolt-'+side+'-'+x+'-'+dx+'-'+z,[x+dx,y,z],[x+dx,y+side*.3,z],.16,4,6);}
 }
 for(const x of [-1,3]){cylinder('',[x,-.15,6],[x,-.15,9.5],.75,16,2,'oil-filter-'+x);cylinder('',[x,-.15,9.5],[x,-.15,9.9],.9,16,3,'filter-head-'+x);}
 for(const y of [1.4,11.4])pipe('breather-'+y,[[-6,y,17.1],[-6,y,19.7],[-7.8,y,20.2]],.23,7,10);
 // Tank gauge, positive flange connection and accessible shutoff wheel.
 cylinder('',[17,-14.8,9],[17.5,-14.8,9],1.3,20,4,'tank-outlet-flange');
 for(let i=0;i<6;i++){const a=i*Math.PI/3;beam('tank-flange-bolt-'+i,[17.4,-14.8+Math.cos(a),9+Math.sin(a)],[17.65,-14.8+Math.cos(a),9+Math.sin(a)],.13,3,6);}
 pipe('tank-outlet-neck',[[17.5,-14.8,9],[18.2,-14.8,9],[18.2,-14.8,8]],.27,11,10);
 beam('valve-stem',[20,-14.8,8],[20,-14.8,10.1],.15,4,8);
 ring('valve-wheel',[20,-14.8,10.1],2,.9,.1,1,16);
 for(const a of [0,Math.PI/2])beam('valve-spoke-'+a,[20-.8*Math.cos(a),-14.8-.8*Math.sin(a),10.1],[20+.8*Math.cos(a),-14.8+.8*Math.sin(a),10.1],.09,1,6);
 cylinder('',[8,-14.8,14],[8,-14.8,15.1],.22,10,11,'tank-gauge-stem');
 cylinder('',[8,-14.85,15.5],[8,-15.2,15.5],.65,16,4,'tank-gauge');
 // Shed gutter/downspout, vent hood and switchboard latches.
 beam('gutter',[-30,-22.3,27.1],[-7,-22.3,27.1],.25,4,10);
 pipe('downspout',[[-28,-22.3,27.1],[-28,-22.3,3],[-27.2,-22.3,2.3]],.22,4,10);
 for(const y of [-13,-4,5,14]){
  block('switch-latch-'+y,-31.02,y+2,14,.2,.3,1.4,3);
  for(const z of [11.5,18])block('switch-hinge-'+y+'-'+z,-31.02,y-2.7,z,.25,.4,.5,4);
 }
 block('rear-vent-recess',-29.25,-.5,6,.3,15,3.5,3);
 for(let y=-7;y<7;y+=.8)block('rear-vent-fin-'+y,-29.46,y,6,.15,.13,3.1,4);
 checks.push({type:'tankClearance',minX:-9,shedFront:-9.5,walkwayMinY:-24.5,walkwayMaxY:-21.5});
};
