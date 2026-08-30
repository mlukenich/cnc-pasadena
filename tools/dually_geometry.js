'use strict';

// +X is forward; Z is up. Dimensions and wheel centers retain the tested
// Pitbull-compatible skeleton. Hard edges are intentional on armor, not tires.
module.exports = function buildDually({addBox: box, addCylinder: cylinder, addFace: face, addTriangle: triangle}) {
  const sub = (a,b) => a.map((v,i)=>v-b[i]);
  const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const unit = a => a.map(v=>v/Math.hypot(...a));
  const normal = p => unit(cross(sub(p[1],p[0]),sub(p[2],p[0])));
  function quad(name, p, mat, n=normal(p)) { face(p,n,mat,name); }
  function cap(name, ring, mat, n) {
    // Convex boundary fan avoids a redundant center vertex and two triangles.
    for(let i=1;i<ring.length-1;i++)triangle([ring[0],ring[i],ring[i+1]],n,mat,name);
  }
  // Convex metal plate with real thickness; visible from both sides.
  function plate(name,ring,thickness,mat) {
    const n=normal(ring),a=ring.map(p=>p.map((v,k)=>v-n[k]*thickness/2)),b=ring.map(p=>p.map((v,k)=>v+n[k]*thickness/2));
    cap(name,a,mat,n.map(v=>-v));cap(name,b,mat,n);
    for(let i=0;i<ring.length;i++)quad(name,[a[i],a[(i+1)%ring.length],b[(i+1)%ring.length],b[i]],mat);
  }
  // A beveled rectangular prism. Unlike a plain box, its edges catch light.
  function bevel(name,x,y,z,sx,sy,sz,mat,c=0.6) {
    const ring = (zz,shrink) => {
      const a=sx/2-shrink,b=sy/2-shrink,d=Math.min(c,a/2,b/2);
      return [[-a+d,-b],[a-d,-b],[a,-b+d],[a,b-d],[a-d,b],[-a+d,b],[-a,b-d],[-a,-b+d]].map(p=>[x+p[0],y+p[1],zz]);
    };
    const h=Math.min(c,sz/3);
    const inset=Math.min(.25,sx*.12,sy*.12);
    const rings=[ring(z-sz/2,inset),ring(z-sz/2+h,0),ring(z+sz/2-h,0),ring(z+sz/2,inset)];
    for(let j=0;j<3;j++)for(let i=0;i<8;i++)quad(name,[rings[j][i],rings[j][(i+1)%8],rings[j+1][(i+1)%8],rings[j+1][i]],mat);
    cap(name,rings[0],mat,[0,0,-1]);cap(name,rings[3],mat,[0,0,1]);
  }
  function beam(name,a,b,r,mat,segments=6) {
    const direction=unit(sub(b,a));
    const u=unit(cross(direction,Math.abs(direction[2])<0.8?[0,0,1]:[0,1,0]));
    const v=cross(direction,u);
    const ring = p=>Array.from({length:segments},(_,i)=>p.map((q,k)=>q+r*(Math.cos(i*2*Math.PI/segments)*u[k]+Math.sin(i*2*Math.PI/segments)*v[k])));
    const ra=ring(a),rb=ring(b);
    for(let i=0;i<segments;i++)quad(name,[ra[i],ra[(i+1)%segments],rb[(i+1)%segments],rb[i]],mat);
    cap(name,ra,mat,direction.map(v=>-v));cap(name,rb,mat,direction);
  }
  // Open-ended annular surfaces, also used for the rounded tire cross-section.
  function lathe(name,cx,cy,cz,profile,mat,axis='y',segments=20) {
    const point=(a,r,t)=>axis==='y'?[cx+r*Math.cos(t),cy+a,cz+r*Math.sin(t)]:axis==='z'?[cx+r*Math.cos(t),cy+r*Math.sin(t),cz+a]:[cx+a,cy+r*Math.cos(t),cz+r*Math.sin(t)];
    for(let j=0;j<profile.length-1;j++)for(let i=0;i<segments;i++) {
      const [a,r]=profile[j],[b,s]=profile[j+1],t=i*2*Math.PI/segments,u=(i+1)*2*Math.PI/segments;
      const p=[point(a,r,t),point(b,s,t),point(b,s,u),point(a,r,u)];
      // Profiles run left-to-right on outer walls, reversed on inner walls.
      const mid=(t+u)/2,da=b-a,dr=s-r;
      const n=unit(axis==='y'?[da*Math.cos(mid),-dr,da*Math.sin(mid)]:axis==='z'?[da*Math.cos(mid),da*Math.sin(mid),-dr]:[-dr,da*Math.cos(mid),da*Math.sin(mid)]);
      quad(name,p,mat,n);
    }
  }

  // Visible frame, axles, differentials and paired leaf springs.
  for(const side of [-1,1]) {
    bevel('frame-rail',0,side*6,9.4,66,1.6,2.1,'dark',0.25);
    for(const x of [24,-22]) {
      box('leaf-spring',x,side*6,7.8,16,0.8,0.5,'metal');
      beam('shock-absorber',[x-2,side*7,7.2],[x+1,side*8,12.4],0.52,'orange');
    }
  }
  for(const x of [24,-22]) {
    cylinder('axle',x,0,8.2,0.95,27,'y',8,'dark');
    bevel('differential',x,0,8.2,4.5,4,3.4,'metal');
  }
  beam('drive-shaft',[-22,0,8.2],[20,0,9.2],0.55,'metal');
  bevel('cab-lower',3,0,15.5,23,21,7.5,'red');

  // Hood slopes down toward the nose and is chamfered on both shoulders.
  const hoodRear=[ [14,-10.5,17.2],[14,10.5,17.2],[14,10.5,19.4],[14,8.8,20.7],[14,-8.8,20.7],[14,-10.5,19.4] ];
  const hoodFront=[ [34.5,-10.5,15.2],[34.5,10.5,15.2],[34.5,10.5,17.2],[34.5,8.8,18.4],[34.5,-8.8,18.4],[34.5,-10.5,17.2] ];
  for(let i=0;i<6;i++)if(i!==3)quad('hood',[hoodRear[i],hoodRear[(i+1)%6],hoodFront[(i+1)%6],hoodFront[i]],'red');
  cap('hood',hoodRear,'red',[-1,0,0]);cap('hood',hoodFront,'red',[1,0,0]);
  const hoodZ=x=>20.7-(x-14)*2.3/20.5;
  // Stamped power bulge is part of the panel, not another box on top.
  const sections=[[14,0],[18.7,0],[20.2,.55],[29.5,.55],[32.5,0],[34.5,0]];
  const ys=[-8.8,-5.3,-4.1,4.1,5.3,8.8];
  const hp=(section,k)=>[section[0],ys[k],hoodZ(section[0])+(k===2||k===3?section[1]:0)];
  for(let j=0;j<sections.length-1;j++)for(let k=0;k<ys.length-1;k++) {
    const p=[hp(sections[j],k),hp(sections[j],k+1),hp(sections[j+1],k+1),hp(sections[j+1],k)];
    // Twisted transition quads need their own triangle normals.
    triangle([p[0],p[1],p[2]],normal([p[0],p[1],p[2]]).map(v=>-v),'red','hood-top');
    triangle([p[0],p[2],p[3]],normal([p[0],p[2],p[3]]).map(v=>-v),'red','hood-top');
  }
  // Cowl vent and louvers follow the sloping surface, above (not inside) it.
  quad('hood-cowl-recess',[[14.7,-6.6,hoodZ(14.7)+.035],[18.1,-6.6,hoodZ(18.1)+.035],[18.1,6.6,hoodZ(18.1)+.035],[14.7,6.6,hoodZ(14.7)+.035]],'black');
  for(const x of [15,15.7,16.4,17.1,17.8]) {
    plate('hood-cowl-louver',[[x,-6.4,hoodZ(x)+.17],[x+.22,-6.4,hoodZ(x+.22)+.08],[x+.22,6.4,hoodZ(x+.22)+.08],[x,6.4,hoodZ(x)+.17]],.07,'dark');
  }
  for(const side of [-1,1]) {
    beam('hood-edge-seam',[14.5,side*9.5,20.18],[34,side*9.5,17.99],.07,'dark',4);
    box('hood-latch-base',30.8,side*10.57,16.9,1.8,.18,1.7,'dark');
    beam('hood-latch',[30.8,side*10.72,16.5],[30.8,side*10.72,18],.14,'metal');
  }

  // Actual tapered cab volume: rear wall, two side windows and raked screen.
  const lower=[[-8,-10.5,19], [14,-10.5,19], [14,10.5,19], [-8,10.5,19]];
  const upper=[[-6.3,-9,27.1],[8.5,-9,27.1],[8.5,9,27.1],[-6.3,9,27.1]];
  for(let i=0;i<4;i++)quad('cab-shell',[lower[i],lower[(i+1)%4],upper[(i+1)%4],upper[i]],'red');
  bevel('cab-roof',1.1,0,27.5,16.3,19.3,1.1,'red',0.5);
  // Window quads sit just outside the shell, with a visible red pillar margin.
  quad('windshield-seal',[[13.77,-9.65,19.8],[13.77,9.65,19.8],[8.92,8.75,26.55],[8.92,-8.75,26.55]],'black',[1,0,0.7]);
  quad('windshield',[[13.59,-9.1,20.15],[13.59,9.1,20.15],[9.22,8.36,26.12],[9.22,-8.36,26.12]],'glass',[1,0,0.7]);
  for(const side of [-1,1]) {
    const sideP=(x,z,extra=0)=>[x,side*(10.5-(z-19)*1.5/8.1+extra),z];
    quad('window-seal',[sideP(-6.8,20,.04),sideP(12.4,20,.04),sideP(8.0,26.25,.04),sideP(-5.4,26.25,.04)],'black',[0,side,0.18]);
    quad('side-window',[sideP(-6.05,20.5,.08),sideP(11.4,20.5,.08),sideP(7.55,25.8,.08),sideP(-4.9,25.8,.08)],'glass',[0,side,0.18]);
    beam('window-divider',sideP(-1.8,20.35,.14),sideP(-1.8,26,.14),0.23,'dark',4);
    beam('cab-rain-gutter',[-6.7,side*9.65,27.1],[9.1,side*9.65,27.1],.14,'dark',4);
    beam('window-sill',sideP(-6.6,19.9,.15),sideP(12.2,19.9,.15),.13,'metal',4);
    bevel('door-ivory',3.2,side*10.58,15.3,18,0.22,4.4,'cream',0.06);
    box('team-marker',3,side*10.64,18.5,20.6,0.2,0.45,'team');
    box('door-handle',-3.4,side*10.9,17.1,2.4,.45,.5,'metal');
    box('door-shutline',-7.6,side*10.7,15.4,.16,.12,6,'dark');
    box('door-shutline',13.6,side*10.7,15.4,.16,.12,6,'dark');
    bevel('side-step',3,side*12,10.9,22,3,1.0,'dark',0.3);
    for(let x=-6;x<13;x+=2.6)box('step-grip',x,side*12,11.44,.55,2.5,.12,'metal');
    beam('mirror-arm',[10,side*10.5,20.4],[10,side*13.5,21.5],.27,'metal');
    bevel('mirror-housing',10,side*13.5,22.2,1.3,2.4,3.1,'dark',.3);
    box('mirror-glass',9.3,side*13.5,22.2,.12,1.8,2.5,'glass');
    beam('wiper',[13.9,side*2,20.1],[11.8,side*7.4,22.8],.11,'dark',4);
  }
  quad('rear-window',[[-7.76,-7,20.5],[-7.76,7,20.5],[-6.65,7,25.6],[-6.65,-7,25.6]],'glass',[-1,0,.2]);
  for(const y of [-6,-3,0,3,6])bevel('roof-marker',7.0,y,28.35,1.6,.95,.72,'orange',.2);

  // Pickup bed: low steel sides, ridged floor and open tubular cargo rails.
  bevel('bed-floor',-22,0,13.1,28,22.8,1.4,'dark',.4);
  // Broad bed corrugation is now in the dedicated colour/normal map.
  for(const side of [-1,1]) {
    box('bed-upper-side',-22,side*11.3,18.0,29,1.3,2.6,'red');
    box('bed-cap',-22,side*11.3,19.45,29,1.8,.4,'metal');
    beam('bed-rail',[-35,side*11.3,22.4],[-9,side*11.3,22.4],.42,'dark');
    for(const x of [-34,-22,-10])beam('bed-stanchion',[x,side*11.3,19.5],[x,side*11.3,22.4],.34,'metal');
    // The bed floor is below the tops of the tires: cover those intrusions
    // with real wheel tubs instead of leaving the far wheels inside the bed.
    bevel('bed-wheel-tub',-22,side*8.5,16.0,18,6.2,5.2,'dark',.8);
  }
  bevel('tailgate',-36,0,16.4,1.3,22.6,6,'red',.35);
  box('tailgate-team-marker',-36.7,0,18.6,.12,15,.45,'team');
  box('tailgate-handle',-36.9,0,18.2,.2,2.7,.6,'dark');
  bevel('rear-bumper',-37.2,0,11.8,2.5,25,2,'metal',.55);
  for(const side of [-1,1]) {
    box('rear-lamp',-36.78,side*9.7,16.7,.15,1.6,3,'orange');
    box('mudflap',-31,side*12.1,7.5,.45,7.5,4.0,'black');
  }

  // Arch openings are modeled, not black circles pasted onto a solid side.
  for(const [x,halfWidth] of [[24,13],[-22,16.1]])for(const side of [-1,1]) {
    const inner=8.95,outer=10.05,steps=12;
    for(let i=0;i<steps;i++) {
      const a=i*Math.PI/steps,b=(i+1)*Math.PI/steps;
      const p=(angle,r,y)=>[x+r*Math.cos(angle),side*y,8.2+r*Math.sin(angle)];
      quad('fender-lip',[p(a,inner,halfWidth),p(a,outer,halfWidth),p(b,outer,halfWidth),p(b,inner,halfWidth)],'dark',[0,side,0]);
      quad('fender-flare',[p(a,outer,halfWidth),p(a,outer,10.4),p(b,outer,10.4),p(b,outer,halfWidth)],'red',[Math.cos((a+b)/2),0,Math.sin((a+b)/2)]);
      const top=angle=>x>0?20-(x+outer*Math.cos(angle)-14)*.08:19.2;
      quad('fender-shoulder',[p(a,outer,10.6),p(b,outer,10.6),[x+outer*Math.cos(b),side*10.6,top(b)],[x+outer*Math.cos(a),side*10.6,top(a)]],'red',[0,side,0]);
    }
  }

  // Sculpted six-wheel setup: rounded shoulders, recessed steel rims and
  // chunky alternating tread blocks that remain visible at gameplay scale.
  for(const [name,x,y] of [['tire-front-left',24,12],['tire-front-right',24,-12],['tire-rear-left-inner',-22,9.5],['tire-rear-left-outer',-22,14.5],['tire-rear-right-inner',-22,-9.5],['tire-rear-right-outer',-22,-14.5]]) {
    lathe(name,x,y,8.2,[[-2.25,3.8],[-2.25,6.4],[-1.55,7.65],[-1.1,7.95],[1.1,7.95],[1.55,7.65],[2.25,6.4],[2.25,3.8]],'black','y',name.includes('-inner')?16:24);
    // Only four exterior wheel faces expose rims. The other eight sides
    // are hidden behind the chassis or between the paired dually tires.
    for(const side of name.includes('-inner')?[]:[Math.sign(y)]) {
      // Open eight-spoke steel dish, with a recessed brake drum behind the
      // gaps. Unlike the old black discs, these openings have real depth.
      const rim=[[1.05,3.05],[1.7,3.45],[2.28,3.8],[2.42,3.88]].map(([a,r])=>[side*a,r]);
      lathe(name+'-rim',x,y,8.2,side>0?rim.reverse():rim,'metal','y',24);
      cylinder(name+'-brake-drum',x,y+side*.6,8.2,3.4,.3,'y',12,'dark');
      const wp=(a,r,depth)=>[x+r*Math.cos(a),y+side*depth,8.2+r*Math.sin(a)];
      for(let i=0;i<8;i++) {
        const a=i*Math.PI/4;
        plate(name+'-spoke',[wp(a-.18,1.3,1.48),wp(a-.105,3.3,1.48),wp(a+.105,3.3,1.48),wp(a+.18,1.3,1.48)],.24,'metal');
      }
      cylinder(name+'-hub',x,y+side*1.75,8.2,1.75,.8,'y',12,'metal');
      cylinder(name+'-hub-cap',x,y+side*2.3,8.2,.92,.4,'y',10,'dark');
      const bead=[[2.26,4.05],[2.34,4.15],[2.34,4.35],[2.26,4.45]].map(([a,r])=>[side*a,r]);
      lathe(name+'-sidewall-bead',x,y,8.2,side>0?bead.reverse():bead,'black','y',16);
      for(let i=0;i<8;i++) {
        const a=i*Math.PI/4;
        cylinder(name+'-lug',x+1.35*Math.cos(a),y+side*2.21,8.2+1.35*Math.sin(a),.2,.24,'y',6,'dark');
      }
    }
    for(let i=0;i<16;i++)for(const half of [-1,1]) {
      const a=(i+half*.16)*Math.PI/8,b=a+.21;
      const p=(angle,r,yy)=>[x+r*Math.cos(angle),y+yy,8.2+r*Math.sin(angle)];
      const y0=half*.13,y1=half*1.85,skew=half*.07;
      const outer=[p(a,8.2,y0),p(b,8.2,y0),p(b+skew,8.1,y1),p(a+skew,8.1,y1)];
      const inner=[p(a,7.85,y0),p(b,7.85,y0),p(b+skew,7.6,y1),p(a+skew,7.6,y1)];
      // No hidden bottom; top plus four walls forms an embedded tread lug.
      const n=[Math.cos((a+b+skew)/2),0,Math.sin((a+b+skew)/2)];
      triangle([outer[0],outer[1],outer[2]],n,'black',name+'-tread');
      triangle([outer[0],outer[2],outer[3]],n,'black',name+'-tread');
      for(let k=0;k<4;k++) {
        const l=(k+1)%4,points=[inner[k],inner[l],outer[l],outer[k]];
        let nn=normal(points);
        // Radial profile orientation reverses for the opposite tread half.
        if(half>0)nn=nn.map(v=>-v);
        quad(name+'-tread-edge',points,'black',nn);
      }
    }
  }

  // Compact front fascia with actual grille bars, paired lamps and winch.
  bevel('nose',34,0,14.8,2.7,21,6,'red');
  box('grille-recess',35.42,0,15.1,.18,12.4,3.7,'black');
  for(const z of [13.8,14.9,16])box('grille-bar',35.6,0,z,.22,12.2,.25,'metal');
  for(const y of [-5.4,-3.6,-1.8,0,1.8,3.6,5.4])box('grille-fin',35.65,y,14.9,.2,.2,3.7,'dark');
  for(const side of [-1,1]) {
    bevel('headlamp-surround',35.6,side*8.4,15.2,.6,3.5,3.4,'dark',.12);
    box('headlamp',35.98,side*8.4,15.6,.12,2.65,1.65,'cream');
    box('turn-signal',35.98,side*8.4,14.1,.12,2.65,.55,'orange');
  }
  bevel('front-bumper',36.6,0,10.95,3.2,25.3,2.7,'metal',.65);
  bevel('winch-body',38.3,0,12.1,2.6,6.5,2.5,'dark',.4);
  cylinder('winch-spool',39,0,12.3,.75,4.1,'y',10,'metal');
  beam('brushguard-top',[39.1,-10,18.5],[39.1,10,18.5],.6,'dark',8);
  beam('brushguard-mid',[39.1,-10,13],[39.1,10,13],.45,'metal',8);
  for(const y of [-10,-5,5,10])beam('brushguard-upright',[39,y,11],[39,y,18.5],.48,'dark',8);
  for(const y of [-8,8])beam('tow-hook',[38.3,y,10],[39.2,y,9.1],.45,'orange',8);

  // Soot-black open stack mouths, steel heat shields and retaining bands.
  for(const side of [-1,1]) {
    const x=-9.5,y=side*8.5;
    cylinder('stack-pipe',x,y,24,1.15,18,'z',12,'dark');
    cylinder('stack-shield',x,y,23.2,1.45,8.6,'z',12,'metal');
    lathe('stack-mouth',x,y,33,[[0,1.15],[1.8,1.15],[1.8,.88],[.4,.88]],'dark','z',12);
    cylinder('stack-soot',x,y,33.3,.88,.1,'z',12,'black');
    for(const z of [19.2,27.2])lathe('stack-band',x,y,z,[[-.2,1.55],[.2,1.55]],'dark','z',12);
    for(const z of [21,23,25])for(const dx of [-.55,.55])box('shield-slot',x+dx,y+side*1.45,z,.3,.1,.75,'dark');
  }

  // Higher pedestal keeps the barrels clear of the cab roof. These groups
  // remain independently bound to the stock rotating/elevating turret bones.
  bevel('turret-base',-16,0,14.3,8.5,8.5,.85,'dark',.3);
  cylinder('turret-pedestal',-16,0,20.4,1.6,11.8,'z',12,'dark');
  for(const side of [-1,1])plate('turret-gusset',[[-16,side*1.4,14.8],[-16,side*4,14.8],[-16,side*1.4,21.5]],.45,'metal');
  cylinder('turret-ring',-16,0,26.6,3.8,.65,'z',16,'dark');
  cylinder('turret-ring-lip',-16,0,27.05,3.55,.35,'z',16,'metal');
  bevel('turret-cradle-base',-14.4,0,28,7.6,7.5,1.2,'dark',.3);
  for(const side of [-1,1]) {
    plate('turret-cradle-arm',[[-17,side*3.4,28],[-11,side*3.4,28],[-11.8,side*3.4,31.6],[-14.4,side*3.4,31.6]],.5,'dark');
    cylinder('turret-trunnion',-13,side*3.75,31,1.05,.6,'y',10,'metal');
  }
  for(const side of [-1,1]) {
    bevel('ammo-box',-17.5,side*5.15,28.8,5.6,2.6,3.6,'dark',.3);
    box('ammo-box-lid',-17.5,side*5.15,30.7,5.9,2.85,.28,'dark');
    for(const x of [-19.4,-15.6])box('ammo-box-strap',x,side*6.5,28.8,.35,.18,3.1,'metal');
    box('ammo-box-latch',-17.5,side*6.55,29.6,.65,.22,.9,'metal');
    // Segmented feed chute belongs to the pitching gun assembly.
    for(let i=0;i<5;i++)box('gun-feed-link',-15.4,side*(2.75+i*.42),30.9-i*.09,1.15,.32,.42,'metal');
    bevel('gun-breech',-12.5,side*2.2,31,6,1.7,1.9,'dark',.3);
    box('gun-cover',-12.7,side*2.2,32.03,4.8,1.3,.22,'metal');
    beam('gun-charging-handle',[-13.7,side*3.05,31.4],[-13.7,side*3.55,31.4],.13,'metal');
    cylinder('gun-jacket',-6.8,side*2.2,31,.82,6.2,'x',10,'dark');
    cylinder('gun-barrel',1.9,side*2.2,31,.48,11.2,'x',10,'metal');
    lathe('gun-muzzle',7.4,side*2.2,31,[[0,.73],[1.1,.73],[1.1,.34],[.6,.34]],'dark','x',10);
    for(const x of [-9,-7,-5])lathe('gun-cooling-ring',x,side*2.2,31,[[-.175,.93],[.175,.93]],'black','x',10);
  }
  // A small angled armor shield makes the technical silhouette read at RTS zoom.
  quad('turret-shield',[[ -11,-6,27.3],[-11,6,27.3],[-9.8,5,30],[-9.8,-5,30]],'metal',[1,0,-.4]);
  quad('turret-shield-back',[[-11.22,-6,27.3],[-11.22,6,27.3],[-10.02,5,30],[-10.02,-5,30]],'dark',[-1,0,.4]);
  for(const side of [-1,1])plate('turret-shield-wing',[[-11,side*6,27.3],[-9.8,side*5,30],[-12,side*6.9,30],[-13.2,side*7.9,27.3]],.22,'dark');
  beam('antenna',[-7,-7,28],[-9,-7,37],.1,'dark',5);
};
