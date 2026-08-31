'use strict';
// Editable revision-2 masses and hardware. +X front, +Z up.
module.exports = function buildSweeper({box,face,triangle,cylinder}) {
  const sub=(a,b)=>a.map((v,k)=>v-b[k]);
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const unit=a=>a.map(v=>v/Math.hypot(...a));
  const beam=(g,a,b,r,m,n=8)=>cylinder('',a,b,r,n,m,g);
  const block=(g,x,y,z,sx,sy,sz,m)=>box(x-sx/2,x+sx/2,y-sy/2,y+sy/2,z-sz/2,z+sz/2,m,g);
  function quad(g,p,m,n) { face(p,n||unit(cross(sub(p[1],p[0]),sub(p[2],p[0]))),m,g); }
  function bevel(g,x,y,z,sx,sy,sz,m,c=.3) {
    const ring=(zz,inset)=>{
      const a=sx/2-inset,b=sy/2-inset,d=Math.min(c,a/2,b/2);
      return [[-a+d,-b],[a-d,-b],[a,-b+d],[a,b-d],[a-d,b],[-a+d,b],[-a,b-d],[-a,-b+d]].map(p=>[p[0]+x,p[1]+y,zz]);
    };
    const h=Math.min(c,sz/3),inset=Math.min(.18,sx*.1,sy*.1);
    const rings=[ring(z-sz/2,inset),ring(z-sz/2+h,0),ring(z+sz/2-h,0),ring(z+sz/2,inset)];
    for(let j=0;j<3;j++) for(let i=0;i<8;i++) quad(g,[rings[j][i],rings[j][(i+1)%8],rings[j+1][(i+1)%8],rings[j+1][i]],m);
    for(const j of [0,3]) for(let i=1;i<7;i++) triangle([rings[j][0],rings[j][i],rings[j][i+1]],[0,0,j?1:-1],m,g);
  }
  // Surface-of-revolution normals are computed from the profile derivative,
  // with an explicit orientation for mirrored tires and recessed rims.
  function lathe(g,center,profile,m,axis='x',segments=32,orientation=1) {
    const axisIndex={x:0,y:1,z:2}[axis],radial=[0,1,2].filter(k=>k!==axisIndex);
    const point=(a,r,t)=>{const p=[...center];p[axisIndex]+=a;p[radial[0]]+=r*Math.cos(t);p[radial[1]]+=r*Math.sin(t);return p;};
    for(let j=0;j<profile.length-1;j++) {
      const [a,r]=profile[j],[b,s]=profile[j+1];
      for(let i=0;i<segments;i++) {
        const t=i*2*Math.PI/segments,u=(i+1)*2*Math.PI/segments,mid=(t+u)/2;
        const n=[0,0,0];n[axisIndex]=(r-s)*orientation;n[radial[0]]=(b-a)*Math.cos(mid)*orientation;n[radial[1]]=(b-a)*Math.sin(mid)*orientation;
        const p=[point(a,r,t),point(b,s,t),point(b,s,u),point(a,r,u)];
        if(r===0) triangle([p[0],p[1],p[2]],unit(n),m,g);
        else if(s===0) triangle([p[0],p[1],p[3]],unit(n),m,g);
        else face(p,unit(n),m,g);
      }
    }
  }
  function fender(g,cx,side) {
    const radius=5.55,outer=5.95,yi=side*8.5,yo=side*12.8,cz=5.5;
    const point=(r,t,y)=>[cx+r*Math.cos(t),y,cz+r*Math.sin(t)];
    for(let i=0;i<16;i++) {
      const t=i*Math.PI/16,u=(i+1)*Math.PI/16,mid=(t+u)/2;
      quad(g+'-outer',[point(outer,t,yi),point(outer,u,yi),point(outer,u,yo),point(outer,t,yo)],0,[Math.cos(mid),0,Math.sin(mid)]);
      quad(g+'-inside',[point(radius,t,yo),point(radius,u,yo),point(radius,u,yi),point(radius,t,yi)],2,[-Math.cos(mid),0,-Math.sin(mid)]);
      for(const [y,sign] of [[yi,-side],[yo,side]]) quad(g+'-edge',[point(radius,t,y),point(outer,t,y),point(outer,u,y),point(radius,u,y)],1,[0,sign,0]);
    }
    for(const t of [0,Math.PI]) quad(g+'-end',[point(radius,t,yi),point(outer,t,yi),point(outer,t,yo),point(radius,t,yo)],0,[0,0,-1]);
  }

  bevel('chassis-belly-pan',-1,0,4,38,12,3,2,.4);
  for(const side of [-1,1]) {
    block('chassis-side-deck-'+side,-.5,side*7.5,6.1,37,3,1.3,11);
    // Narrow compatibility meshes retain the stock tread-state names without
    // running a false black panel across the visible wheels.
    block('skirt-treads-'+side,-1,side*6.8,4.1,35,.3,.5,2);
  }
  // Framed front-control cab. Upper glazing is inset inside white structural posts.
  bevel('cab-lower-core',9.5,0,9.3,15.5,15.8,4.4,0,.5);
  const frontAt=z=>17.5-(z-11.5)*.5;
  quad('cab-windshield-seal',[[17.5,-9.5,11.5],[17.5,9.5,11.5],[14,9.5,18.5],[14,-9.5,18.5]],2,[1,0,.5]);
  const glass=(side)=>{
    const y0=side<0?-8.75:.16,y1=side<0?-.16:8.75;
    quad('cab-windshield-glass-'+side,[[frontAt(12.2)+.045,y0,12.2],[frontAt(12.2)+.045,y1,12.2],[frontAt(17.9)+.045,y1,17.9],[frontAt(17.9)+.045,y0,17.9]],4,[1,0,.5]);
  }; glass(-1);glass(1);
  bevel('cab-roof',8,0,18.6,12.7,19.4,.7,0,.25);
  block('cab-rear-wall',2.1,0,14.8,.5,19,7.4,0);
  for(const side of [-1,1]) {
    const y=side*9.5;
    quad('cab-side-panel-'+side,[[17.5,y,11.5],[14,y,18.5],[2,y,18.5],[2,y,11.5]],0,[0,side,0]);
    quad('cab-side-window-seal-'+side,[[16.8,y+side*.025,12.25],[13.8,y+side*.025,18.02],[5.1,y+side*.025,18.02],[5.1,y+side*.025,12.25]],2,[0,side,0]);
    quad('cab-side-window-'+side,[[16.1,y+side*.045,12.75],[13.5,y+side*.045,17.65],[5.55,y+side*.045,17.65],[5.55,y+side*.045,12.75]],4,[0,side,0]);
    beam('cab-window-divider-'+side,[10,y+side*.075,12.55],[10,y+side*.075,17.7],.1,2,6);
    // Door skins fill only the region above the wheel opening.
    block('cab-door-lower-'+side,5.1,y,9.3,6.2,.35,4.4,0);
    for(let i=0;i<16;i++) {
      const t=i*Math.PI/16,u=(i+1)*Math.PI/16;
      quad('cab-wheel-opening-'+side,[[14+5.55*Math.cos(t),y,5.5+5.55*Math.sin(t)],[14+5.55*Math.cos(u),y,5.5+5.55*Math.sin(u)],[14+5.55*Math.cos(u),y,11.5],[14+5.55*Math.cos(t),y,11.5]],0,[0,side,0]);
    }
    beam('cab-door-seam-'+side,[4.5,y+side*.2,7.3],[4.5,y+side*.2,17.8],.045,2,4);
    bevel('cab-door-handle-'+side,6,y+side*.24,11.8,1.6,.3,.3,2,.08);
    beam('cab-front-pillar-'+side,[17.65,side*9.6,11.45],[14.15,side*9.6,18.6],.24,0,8);
    beam('cab-corner-guard-'+side,[18.35,side*9.9,5.5],[18.35,side*9.9,11.5],.24,1,8);
    beam('cab-roof-guard-'+side,[14.3,side*9.9,18.8],[3,side*9.9,18.8],.24,1,8);
    fender('fender-front-'+side,14,side);
    fender('fender-rear-'+side,-12,side);
    block('rear-mudflap-'+side,-18,side*10.7,4.4,.35,3.5,2.7,2);
    bevel('catwalk-step-'+side,3.3,side*10.4,5.5,5,2.9,.55,11,.15);
    beam('cab-grab-rail-'+side,[2.5,y+side*.5,8],[2.5,y+side*.5,13.5],.14,3,8);
    // Mirrors sit above the side-mounted spray nozzles.
    for(const z of [14.5,17]) beam('mirror-arm-'+side+'-'+z,[13.2,y,z],[13.2,side*12.6,z],.14,2,6);
    bevel('mirror-housing-'+side,13.2,side*12.6,15.75,1.6,.55,3.1,2,.15);
    block('mirror-glass-'+side,13.05,side*12.91,15.75,1.15,.055,2.65,4);
    for(let v=0;v<4;v++) block('cab-rear-vent-'+side+'-'+v,3.35,y+side*.03,15.2+v*.46,1.5,.07,.18,2);
  }
  // Separate grille bars, lamps, bumper and wipers; no grille image on box sides.
  bevel('front-fascia',18.25,0,8.5,1.5,16.8,6,0,.45);
  bevel('front-grille-recess',19.06,0,8.3,.25,10.5,5.35,2,.1);
  for(let i=0;i<6;i++) bevel('front-grille-slat-'+i,19.23,0,6.15+i*.83,.25,9.4,.28,3,.08);
  for(const side of [-1,1]) {
    bevel('front-lamp-frame-'+side,19.05,side*7.3,8.4,.3,2.35,4.7,2,.1);
    for(let i=0;i<2;i++) quad('front-headlight-'+side+'-'+i,[[19.25,side*7.3-.85,6.55+i*1.45],[19.25,side*7.3+.85,6.55+i*1.45],[19.25,side*7.3+.85,7.65+i*1.45],[19.25,side*7.3-.85,7.65+i*1.45]],8,[1,0,0]);
    block('front-marker-amber-'+side,19.28,side*7.3,10.12,.1,1.5,.42,6);
    beam('windshield-wiper-'+side,[17.3,side*3.5,12.3],[15.28,side*6,16.3],.09,2,6);
  }
  bevel('front-bumper-beam',20.75,0,4.1,2,20.8,2.0,2,.3);
  for(const side of [-1,1]) beam('bumper-upright-'+side,[20.3,side*5.8,4.5],[20.3,side*5.8,10.6],.3,3,10);
  for(const z of [5.4,10.5]) beam('bumper-crossbar-'+z,[20.3,-5.8,z],[20.3,5.8,z],.25,3,10);

  // Rounded tank ends, continuous axial/circumferential UVs, restrained welds.
  lathe('tank-cylinder-body',[0,0,13],[[-18,4.8],[-17.5,5.4],[-16.5,5.8],[-.5,5.8],[.5,5.4],[1.2,4.8]],3,'x',40);
  lathe('tank-rear-dome',[0,0,13],[[-19.2,0],[-19,2.2],[-18.65,3.6],[-18,4.8]],3,'x',40);
  lathe('tank-front-dome',[0,0,13],[[1.2,4.8],[1.75,3.6],[2.05,2.2],[2.2,0]],3,'x',40);
  for(const x of [-15.5,-2]) {
    bevel('tank-cradle-'+x,x,0,8.1,1.8,15.5,3.4,1,.3);
    lathe('tank-retaining-band-'+x,[x,0,13],[[-.4,5.8],[-.3,5.96],[.3,5.96],[.4,5.8]],3,'x',40);
    for(const side of [-1,1]) block('tank-band-clamp-'+x+'-'+side,x,side*5.8,10.2,1.3,.7,1.1,7);
  }
  lathe('tank-top-hatch',[-8,0,18.6],[[0,2.1],[.25,2.25],[.95,2.25],[1.15,2],[1.15,0]],3,'z',24);
  for(let i=0;i<8;i++) {const a=i*Math.PI/4;beam('tank-hatch-bolt-'+i,[-8+1.75*Math.cos(a),1.75*Math.sin(a),19.75],[-8+1.75*Math.cos(a),1.75*Math.sin(a),19.9],.12,3,6);}
  for(const side of [-1,1]) {
    // Tall utility bays bridge the gap between the wheel arches, below the tank.
    bevel('utility-bay-'+side,-1.8,side*8.8,9.4,8,1.2,5.2,0,.25);
    quad('sanitizer-decal-panel-'+side,[[-5.5,side*9.44,7.15],[1.9,side*9.44,7.15],[1.9,side*9.44,11.65],[-5.5,side*9.44,11.65]],9,[0,side,0]);
    block('utility-bay-trim-'+side,-1.8,side*9.48,6.8,8,.12,.22,1);
    // The sight glass picture is used once on a flat instrument face.
    bevel('sight-glass-mount-'+side,-8,side*6.4,13,2,.7,6.6,3,.12);
    quad('sight-glass-face-'+side,[[-8.8,side*6.78,10],[-7.2,side*6.78,10],[-7.2,side*6.78,16],[-8.8,side*6.78,16]],14,[0,side,0]);
  }
  // Fan artwork belongs on its round grille, not every triangle of its housing.
  lathe('vacuum-blower-housing',[-19.2,0,13.2],[[-1.0,3.6],[-.7,3.9],[.4,3.9]],3,'x',32);
  cylinder('x',[-20.23,0,13.2],[-20.17,0,13.2],3.55,32,12,'vacuum-blower-face');
  bevel('rear-hazard-plate',-20,-5.3,11.2,.22,2.8,3.0,0,.1);
  quad('chemical-placard-rear',[[-20.13,-6.6,9.8],[-20.13,-4,9.8],[-20.13,-4,12.6],[-20.13,-6.6,12.6]],10,[-1,0,0]);
  beam('rear-placard-bracket',[-19.8,-5.3,7],[-19.8,-5.3,11],.14,3,8);
  bevel('chemical-placard-support',-12.5,0,18.68,3.5,3.2,.2,0,.08);
  quad('chemical-placard-top',[[-14.2,-1.5,18.8],[-10.8,-1.5,18.8],[-10.8,1.5,18.8],[-14.2,1.5,18.8]],10,[0,0,1]);
  bevel('rear-bumper',-20,0,4.7,1.3,18,1.4,2,.25);
  for(const side of [-1,1]) {
    block('rear-lamp-amber-'+side,-20.72,side*6.8,5.1,.15,1.7,.5,6);
  }
  for(const y of [4,6.3]) beam('rear-access-rail-'+y,[-19.9,y,6.2],[-19.9,y,16.8],.16,3,8);
  beam('rear-ladder-top-mount',[-19.9,4,16.8],[-17,4,16.8],.16,3,8);
  for(const z of [6.3,8.2,10.1,12,13.9,15.8]) beam('rear-ladder-rung-'+z,[-19.9,4.0,z],[-19.9,6.3,z],.14,3,8);

  for(const [cx,front] of [[14,true],[-12,false]]) for(const side of [-1,1]) {
    const cy=side*10.5,cz=5.5,g='wheel-'+(front?'front':'rear')+'-'+(side>0?'left':'right');
    lathe(g+'-tread',[cx,cy-side*1.6,cz],[[0,4.7],[side*.35,5.05],[side*.7,5.2],[side*2.5,5.2],[side*2.85,5.05],[side*3.2,4.7]],2,'y',24,side);
    lathe(g+'-sidewall',[cx,cy+side*1.6,cz],[[0,4.7],[side*.12,4.3],[side*.12,2.95]],2,'y',40,side);
    lathe(g+'-rim',[cx,cy+side*1.75,cz],[[0,2.95],[side*.12,2.8],[-side*.25,2.5],[-side*.45,.7],[-side*.45,0]],15,'y',24,side);
    cylinder('y',[cx,cy-side*1.7,cz],[cx,cy-side*1.58,cz],4.7,24,2,g+'-inner');
    cylinder('y',[cx,cy+side*1.35,cz],[cx,cy+side*1.95,cz],.7,12,3,g+'-hub');
    cylinder('y',[cx,side*6.7,cz],[cx,side*9,cz],.6,12,3,'axle-'+g);
    // Tread relief changes the silhouette without oversizing the wheel.
    for(let i=0;i<16;i++) {
      const t=i*Math.PI/8;
      for(const across of [-.65,.65]) {
        const p=[cx+5.16*Math.cos(t),cy+across,cz+5.16*Math.sin(t)];
        beam(g+'-tread-cleat-'+i+'-'+across,[p[0]-.15*Math.sin(t),p[1]-.4,p[2]+.15*Math.cos(t)],[p[0]+.15*Math.sin(t),p[1]+.4,p[2]-.15*Math.cos(t)],.105,2,4);
      }
    }
  }
  // Fixed swing arms and hydraulic motors are body groups; ONLY scrubber heads
  // are children of the brush rotation bones.
  for(const side of [-1,1]) {
    const name=side>0?'left':'right',cy=side*14.5;
    beam('scrubber-arm-'+name,[21,side*8.5,4.3],[20,cy,4.3],.38,3,10);
    beam('scrubber-actuator-'+name,[21,side*8,5.7],[20,side*13,4.6],.25,3,8);
    beam('scrubber-feed-hose-'+name,[20.4,side*9,6.0],[20,cy,5.2],.17,2,8);
    lathe('scrubber-motor-'+name,[20,cy,0],[[4.1,1.7],[4.35,1.9],[5.65,1.9],[5.85,1.6],[5.85,0]],7,'z',20);
    lathe('brush-cap-'+name,[20,cy,0],[[3.3,2.1],[3.5,2.5],[3.9,2.5],[4.1,2.2],[4.1,0]],3,'z',32);
    lathe('brush-core-'+name,[20,cy,0],[[.8,3.65],[3.5,1.85]],5,'z',40);
    cylinder('z',[20,cy,.8],[20,cy,.9],3.65,32,5,'brush-bottom-'+name);
    for(let i=0;i<48;i++) {
      const t=i*Math.PI/24,off=(i%3)*.04;
      beam('brush-bristle-'+name+'-'+i,[20+1.95*Math.cos(t),cy+1.95*Math.sin(t),3.55],[20+(4.06+off)*Math.cos(t+.035),cy+(4.06+off)*Math.sin(t+.035),.8],.075,5,4);
    }
    lathe('scrubber-spray-ring-'+name,[20,cy,0],[[4.5,2.35],[4.5,2.7],[4.8,2.7],[4.8,2.35],[4.5,2.35]],1,'z',24);
    for(let i=0;i<6;i++) {const t=i*Math.PI/3;beam('scrubber-mist-nozzle-'+name+'-'+i,[20+2.6*Math.cos(t),cy+2.6*Math.sin(t),4.5],[20+2.95*Math.cos(t),cy+2.95*Math.sin(t),4.1],.12,3,6);}
  }
  // Roof monitor: translated by the geometry collector onto a shared pitch
  // pivot at [7.5,0,23], with lateral nozzle centers +/-2.6.
  for(const side of [-1,1]) {
    const name=side>0?'left':'right',y=side*11;
    bevel('cannon-mantlet-'+name,7.5,y,12.2,3.2,2.6,2.4,0,.25);
    cylinder('x',[9,y,12.2],[16.4,y,12.2],1.0,24,7,'cannon-heat-shield-'+name,false,false);
    cylinder('x',[8,y,12.2],[18.5,y,12.2],.52,24,3,'cannon-barrel-'+name);
    for(const x of [9,15.8]) lathe('cannon-collar-'+name+'-'+x,[x,y,12.2],[[0,.6],[.12,1.1],[.5,1.1],[.65,.6]],3,'x',24);
    lathe('cannon-nozzle-'+name,[18.3,y,12.2],[[0,.52],[.2,.72],[.75,.72],[.95,.55],[.95,.32],[.45,.32]],3,'x',24);
    cylinder('x',[18.72,y,12.2],[18.75,y,12.2],.32,16,2,'cannon-nozzle-bore-'+name);
    // Static supply connection retains body ownership.
    beam('supply-hose-'+name,[0,side*2.6,18],[2,side*2.6,19.6],.22,2,10);
    beam('supply-hose-elbow-'+name,[2,side*2.6,19.6],[7.5,side*.65,19.6],.22,2,10);
  }
  lathe('mount-fixed-pedestal',[7.5,0,0],[[18.95,2.4],[19.2,2.6],[19.6,2.6],[19.8,1.6],[20.3,1.6]],3,'z',32);
  bevel('mount-yaw-drive',7.5,0,21.1,2.4,2.2,2.0,0,.25);
  beam('mount-yaw-crossbeam',[7.5,-4.3,20.5],[7.5,4.3,20.5],.22,3,12);
  for(const side of [-1,1]) {
    beam('mount-yaw-fork-'+side,[7.5,side*4.3,20.5],[7.5,side*4.3,23],.25,0,12);
    cylinder('y',[7.5,side*3.95,23],[7.5,side*4.65,23],.62,20,3,'mount-yaw-bearing-'+side);
  }
  beam('mount-yaw-trunnion',[7.5,-4.3,23],[7.5,4.3,23],.28,3,16);
  // Suction gear and pressure controls remain readable from the rear/side.
  bevel('vacuum-suction-plenum',1,0,2.1,10,13,2.6,2,.3);
  for(const side of [-1,1]) block('vacuum-skirt-'+side,1,side*6.75,.95,11,.5,1.5,2);
  block('vacuum-skirt-front',6.25,0,.95,.5,13,1.5,2);
  bevel('pressure-console',-.4,-7,13,2.4,.6,3.5,3,.1);
  quad('pressure-console-face',[[-1.5,-7.33,11.35],[.7,-7.33,11.35],[.7,-7.33,14.65],[-1.5,-7.33,14.65]],13,[0,-1,0]);
  lathe('manual-valve-ring',[0,-7.9,10.3],[[0,1],[.2,1],[.2,.78],[0,.78],[0,1]],1,'y',20);
  for(let i=0;i<3;i++) {const t=i*Math.PI*2/3;beam('manual-valve-spoke-'+i,[0,-7.8,10.3],[.9*Math.cos(t),-7.8,10.3+.9*Math.sin(t)],.1,3,6);}
  bevel('roof-lightbar-base',13,0,19.25,2.7,15.5,.65,2,.18);
  for(let i=0;i<8;i++) bevel('roof-strobe-'+(i===3||i===4?'cyan':'amber')+'-'+i,13,(i-3.5)*1.8,19.95,2.1,1.6,.8,6,.12);
};
