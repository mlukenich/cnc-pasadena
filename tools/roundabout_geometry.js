'use strict';

// +X is forward; +Z is up; +Y is left, -Y is right.
// High-detail hard-surface model for the Columbia Autonomous Roundabout Enforcer Tank (NODRaiderTank replacement).
// Refinement Passes 1-5:
// - Sleek aerodynamic wedge armor hull with ground-effect carbon skirts & illuminated cyan channels
// - 360° rotating LiDAR surveillance dome, front laser radar scanner, and LED headlights
// - Rotating central turret (Bone_Turret) with elevating dual pulsed microwave emitter cannons (GunPitch, GUN, TurretFX, MuzzleFlash_01)
// - Dual electromagnetic plasma coil rings, ribbed cooling heatsink radiators, and mantlet hydraulic actuators
// - Articulated rear communications & stinger mast (Turret2, Turret2_Gun, TurretMS, Bone_Tail)
// - 4 planetary omnidirectional covered wheel assemblies (Bone_TireLF, Bone_TireRF, Bone_TireLR, Bone_TireRR)
// - Automated side citation ejection slots, rear diffuser strakes, solar roof array, and safety beacons
module.exports = function buildRoundaboutTank({ addBox: box, addCylinder: cylinder, addFace: face, addTriangle: triangle }) {
  const sub = (a, b) => a.map((v, i) => v - b[i]);
  const cross = (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
  const unit = a => {
    const l = Math.hypot(...a);
    return l > 1e-12 ? a.map(v => v / l) : [1, 0, 0];
  };
  const normal = p => unit(cross(sub(p[1], p[0]), sub(p[2], p[0])));

  function quad(name, points, mat, outward) {
    if(outward && normal(points).reduce((s,v,k)=>s+v*outward[k],0)<0) points=[...points].reverse();
    const [p0,p1,p2,p3]=points;
    const n1 = normal([p0, p1, p2]);
    const n2 = normal([p0, p2, p3]);
    triangle([p0, p1, p2], n1, mat, name);
    triangle([p0, p2, p3], n2, mat, name);
  }

  function cap(name, ring, mat, n) {
    for (let i = 1; i < ring.length - 1; i++) {
      triangle([ring[0], ring[i], ring[i + 1]], n, mat, name);
    }
  }

  function bevel(name, x, y, z, sx, sy, sz, mat, c = 0.4) {
    const ring = (zz, shrink) => {
      const a = sx / 2 - shrink, b = sy / 2 - shrink, d = Math.min(c, a / 2, b / 2);
      return [
        [-a + d, -b], [a - d, -b], [a, -b + d], [a, b - d],
        [a - d, b], [-a + d, b], [-a, b - d], [-a, -b + d]
      ].map(p => [x + p[0], y + p[1], zz]);
    };
    const h = Math.min(c, sz / 3);
    const inset = Math.min(0.2, sx * 0.1, sy * 0.1);
    const rings = [ring(z - sz / 2, inset), ring(z - sz / 2 + h, 0), ring(z + sz / 2 - h, 0), ring(z + sz / 2, inset)];
    for (let j = 0; j < 3; j++) {
      for (let i = 0; i < 8; i++) {
        quad(name, [rings[j][i], rings[j][(i + 1) % 8], rings[j + 1][(i + 1) % 8], rings[j + 1][i]], mat);
      }
    }
    cap(name, rings[0], mat, [0, 0, -1]);
    cap(name, rings[3], mat, [0, 0, 1]);
  }

  function beam(name, a, b, r, mat, segments = 8) {
    const direction = unit(sub(b, a));
    const u = unit(cross(direction, Math.abs(direction[2]) < 0.8 ? [0, 0, 1] : [0, 1, 0]));
    const v = cross(direction, u);
    const ring = p => Array.from({ length: segments }, (_, i) =>
      p.map((q, k) => q + r * (Math.cos(i * 2 * Math.PI / segments) * u[k] + Math.sin(i * 2 * Math.PI / segments) * v[k]))
    );
    const ra = ring(a), rb = ring(b);
    for (let i = 0; i < segments; i++) {
      quad(name, [ra[i], ra[(i + 1) % segments], rb[(i + 1) % segments], rb[i]], mat);
    }
    cap(name, ra, mat, direction.map(v => -v));
    cap(name, rb, mat, direction);
  }

  function lathe(name, cx, cy, cz, profile, mat, axis = 'y', segments = 18) {
    const point = (a, r, t) => axis === 'y'
      ? [cx + r * Math.cos(t), cy + a, cz + r * Math.sin(t)]
      : axis === 'z'
      ? [cx + r * Math.cos(t), cy + r * Math.sin(t), cz + a]
      : [cx + a, cy + r * Math.cos(t), cz + r * Math.sin(t)];

    for (let j = 0; j < profile.length - 1; j++) {
      const [a, r] = profile[j], [b, s] = profile[j + 1];
      for (let i = 0; i < segments; i++) {
        const t = i * 2 * Math.PI / segments, u = (i + 1) * 2 * Math.PI / segments;
        let [p0,p1,p2,p3] = [point(a,r,t),point(b,s,t),point(b,s,u),point(a,r,u)];
        // The Y ring basis has opposite handedness to X/Z. A mirrored wheel
        // keeps its exterior side even when its recessed rim profile returns inward.
        const reverse = axis==='y' ? (name.startsWith('wheel-') && cy<0) : true;
        if(reverse) [p0,p1,p2,p3]=[p3,p2,p1,p0];
        if (s <= 1e-5) {
          triangle([p0, p1, p3], normal([p0, p1, p3]), mat, name);
        } else if (r <= 1e-5) {
          triangle([p0, p2, p3], normal([p0, p2, p3]), mat, name);
        } else {
          quad(name, [p0, p1, p2, p3], mat);
        }
      }
    }
  }

  // =========================================================================
  // 1. SLEEK LOW-PROFILE WEDGE CHASSIS & AERODYNAMIC GROUND SKIRTS
  // =========================================================================
  // Watertight armored core, with separate upper wheel fairings.
  bevel('hull-belly-pan',0,0,3.8,38,18,1.6,'skirtSeal',0.5);
  quad('wedge-glacis-center',[[22.5,5.5,4.8],[22.5,-5.5,4.8],[5,-6.5,8.4],[5,6.5,8.4]],'paint',[0,0,1]);
  for(const side of [-1,1]) {
    quad('wedge-glacis-shoulder-'+side,[[22.5,side*5.5,4.8],[5,side*6.5,8.4],[5,side*9,8.4],[19,side*9,4.8]],'paint',[0,0,1]);
    quad('hull-core-side-'+side,[[19,side*9,3.1],[-19,side*9,3.1],[-19,side*9,8.1],[5,side*9,8.4]],'skirtSeal',[0,side,0]);
    // Top armor covers the wheel crown. Lower wheel halves remain exposed.
    const rail=[[-19,7.9],[-18,9.65],[18,9.65],[21,6.2]];
    for(let i=0;i<rail.length-1;i++) {
      const [x,z]=rail[i], [xx,zz]=rail[i+1];
      quad('hull-fairing-roof-'+side+'-'+i,[[x,side*8.8,z],[xx,side*8.8,zz],[xx,side*12.3,zz-.4],[x,side*12.3,z-.4]],'paint',[0,0,1]);
      quad('skirt-armor-'+side+'-'+i,[[x,side*12.3,5.1],[xx,side*12.3,5.1],[xx,side*12.3,zz-.4],[x,side*12.3,z-.4]],'paint',[0,side,0]);
      quad('hull-fairing-inner-'+side+'-'+i,[[x,side*8.8,5.1],[xx,side*8.8,5.1],[xx,side*8.8,zz],[x,side*8.8,z]],'skirtSeal',[0,-side,0]);
      box('skirt-carbon-rail-'+side+'-'+i,(x+xx)/2,side*12.32,5.15,xx-x,.25,.4,'carbonFiber');
      beam('skirt-light-channel-'+side+'-'+i,[x,side*12.48,5.55],[xx,side*12.48,5.55],.1,'cyanTrim',6);
    }
    box('hull-fairing-front-'+side,21,side*10.55,5.4,.3,3.5,.6,'paint');
    box('hull-fairing-rear-'+side,-19,side*10.55,6.2,.3,3.5,2.2,'paint');
    // Identity belongs on a discrete panel, never stretched over a whole flank.
    bevel('skirt-badge-frame-'+side,-1,side*12.4,7.35,10,.2,3.2,'carbonFiber',.1);
    quad('skirt-enforcer-badge-'+side,[[-5.75,side*12.52,5.95],[3.75,side*12.52,5.95],[3.75,side*12.52,8.75],[-5.75,side*12.52,8.75]],'enforcerPanel',[0,side,0]);
    for(const x of [-13,11]) {
      box('skirt-panel-seam-'+side+'-'+x,x,side*12.34,7.25,.12,.10,3.1,'skirtSeal');
      bevel('skirt-clamp-'+side+'-'+x,x,side*12.5,8.6,1.2,.28,.4,'aerospaceChrome',.08);
    }
    bevel('citation-slot-'+side,8,side*12.5,6.5,3,.25,.5,'magneticRail',.08);
    bevel('citation-scanner-'+side,13.4,side*12.5,6.7,2,.25,.75,'strobeOptics',.1);
    // Shoulder warning strip, with the dark gaps retained by the team mask.
    box('hull-shoulder-stripe-'+side,1,side*10.45,9.51,19,.5,.08,'cyanTrim');
    bevel('hull-headlight-housing-'+side,20.8,side*7.6,5.1,1.2,3,1.1,'carbonFiber',.2);
    box('hull-headlight-'+side,21.43,side*7.6,5.2,.08,2.1,.36,'strobeOptics');
  }
  quad('hull-deck-center',[[5,9,8.4],[5,-9,8.4],[-12,-9,8.4],[-12,9,8.4]],'paint',[0,0,1]);
  quad('hull-front-closeout',[[22.5,-5.5,3.2],[22.5,5.5,3.2],[22.5,5.5,4.8],[22.5,-5.5,4.8]],'paint',[1,0,0]);
  for(const side of [-1,1]) quad('hull-front-corner-'+side,[[22.5,side*5.5,3.2],[19,side*9,3.2],[19,side*9,4.8],[22.5,side*5.5,4.8]],'paint',[1,side,0]);
  bevel('hull-chin-splitter',22.7,0,3.35,2.2,18.5,.65,'carbonFiber',.15);
  bevel('hull-front-sensor-frame',22.56,0,4.65,.3,3.1,2.1,'magneticRail',.15);
  quad('hull-front-sensor-face',[[22.74,-1.25,3.8],[22.74,1.25,3.8],[22.74,1.25,5.5],[22.74,-1.25,5.5]],'frontFascia',[1,0,0]);
  // Insets and panel lines give the large glacis a deliberate scale.
  for(const side of [-1,1]) {
    beam('wedge-seam-'+side,[7,side*4.5,8.01],[20,side*3.8,5.34],.055,'skirtSeal',4);
    quad('wedge-accent-'+side,[[7,side*5,8.01],[20,side*4.3,5.34],[20,side*4.65,5.34],[7,side*5.35,8.01]],'cyanTrim',[0,0,1]);
  }
  lathe('hull-turret-well-recess',0,0,8.4,[[0,6.2],[.4,6.2],[.4,5.8],[0,5.8]],'magneticRail','z',24);
  quad('rear-engine-deck',[[-12,9,8.4],[-12,-9,8.4],[-19,-9,8.1],[-19,9,8.1]],'paint',[0,0,1]);
  box('hull-rear-closeout',-19.1,0,5.75,.3,18,4.7,'paint');
  for(const side of [-1,1]) {
    bevel('rear-vent-frame-'+side,-15.7,side*6,8.37,5.5,4.5,.22,'magneticRail',.1);
    quad('rear-vent-panel-'+side,[[-13.1,side*3.9,8.5],[-18.3,side*3.9,8.5],[-18.3,side*8.1,8.5],[-13.1,side*8.1,8.5]],'rearVenting',[0,0,1]);
    box('rear-tail-light-'+side,-19.3,side*6.2,7,.1,3.8,.45,'strobeOptics');
    beam('rear-tow-eye-'+side,[-19.5,side*7,4.9],[-20.1,side*7,4.9],.4,'aerospaceChrome',8);
  }
  bevel('rear-diffuser-belly',-19.2,0,3.6,2,18,1.4,'carbonFiber',.2);
  for(let d=-3;d<=3;d++) box('rear-diffuser-strake-'+d,-19.1,d*2.3,3.1,2.2,.18,1.5,'carbonFiber');
  bevel('rear-service-hatch',-16,0,8.45,4.5,5,.2,'cautionStripes',.1);

  // =========================================================================
  // 2. ROTATING CENTRAL CITATION TURRET (YAW - Bone_Turret)
  // =========================================================================
  // Sleek Armored Hexagonal Turret Hull (Centered at X=0.0, Y=0.0, Z=8.5)
  bevel('turret-base-armor', 0.0, 0.0, 10.2, 16.0, 12.8, 2.8, 'paint', 0.8);
  bevel('turret-rear-bustle', -6.5, 0.0, 10.8, 6.2, 11.0, 2.2, 'paint', 0.5);
  for(const side of [-1,1]) {
    bevel('turret-cheek-'+side,2.9,side*5.7,10.9,6.2,1.8,1.4,'paint',.35);
    box('turret-cheek-trim-'+side,2.8,side*6.63,10.85,4.6,.07,.22,'cyanTrim');
    for(let k=0;k<3;k++) box('turret-rear-vent-'+side+'-'+k,-9.64,side*(2+k*.7),10.8,.06,.32,.8,'skirtSeal');
  }

  // Turret Roof Photovoltaic Solar Matrix
  bevel('turret-solar-roof', -1.5, 0.0, 11.65, 8.5, 8.0, 0.2, 'solarRoof', 0.2);

  // Side Heat Dissipation Cooling Radiators (Left & Right)
  for (const side of [-1, 1]) {
    const ySign = side;
    bevel(`turret-radiator-${side}`, -4.5, ySign * 5.8, 10.8, 5.0, 1.2, 1.8, 'magneticRail', 0.2);
    // Radiator cooling fins
    for (let f = 0; f < 5; f++) {
      quad(`turret-radiator-fin-${side}-${f}`, [
        [-6.5 + f * 0.9, ySign * 6.45, 10.0], [-6.5 + f * 0.9, ySign * 6.45, 11.6],
        [-6.3 + f * 0.9, ySign * 6.45, 11.6], [-6.3 + f * 0.9, ySign * 6.45, 10.0]
      ], 'cyanTrim', [0,side,0]);
    }
  }

  // 360-Degree Rotating LiDAR Surveillance Dome on Turret Roof
  lathe('turret-lidar-pedestal', 1.5, 0.0, 11.7, [
    [0.0, 1.8], [0.4, 1.6], [0.8, 1.4]
  ], 'magneticRail', 'z', 16);
  lathe('turret-lidar-dome-housing', 1.5, 0.0, 12.5, [
    [0.0, 1.35], [0.6, 1.4], [1.1, 1.1], [1.4, 0.4], [1.45, 0.0]
  ], 'paint', 'z', 24);
  cylinder('turret-lidar-optical-slit', 1.5, 0.0, 13.0, 1.38, 0.35, 'z', 24, 'solarGlass');
  cylinder('turret-lidar-scanner-lens', 2.8, 0.0, 13.0, 0.35, 0.2, 'x', 8, 'strobeOptics');

  // Multi-tier Emergency Strobe Warning Lightbar on Turret
  bevel('turret-lightbar-frame', 3.8, 0.0, 11.8, 1.4, 8.5, 0.8, 'carbonFiber', 0.15);
  for (let l = -3; l <= 3; l++) {
    cylinder(`turret-strobe-lens-${l}`, 4.5, l * 1.1, 11.8, 0.25, 0.25, 'x', 8, 'strobeOptics');
  }

  // =========================================================================
  // 3. ELEVATING DUAL PULSED MICROWAVE CANNONS (PITCH - GunPitch, GUN, TurretFX)
  // =========================================================================
  // Heavy Armored Trunnion Pivot & Mantlet (Pitch origin at X=6.5, Y=0.0, Z=10.2)
  cylinder('barrel-trunnion-pivot', 6.5, 0.0, 10.2, 0.95, 9.8, 'y', 12, 'magneticRail');
  bevel('barrel-mantlet-housing', 7.5, 0.0, 10.2, 4.0, 9.2, 3.2, 'paint', 0.4);

  // Hydraulic Elevation Ram Actuator Cylinders
  cylinder('gun-elevation-ram-l', 4.5, 3.8, 9.0, 0.35, 2.5, 'x', 8, 'chrome');
  cylinder('gun-elevation-ram-r', 4.5, -3.8, 9.0, 0.35, 2.5, 'x', 8, 'chrome');

  // Dual Pulsed Microwave Emitter Cannons (Left: Y=+2.4, Right: Y=-2.4)
  for (const side of [-1, 1]) {
    const yGun = side * 2.4;

    // Heavy Rectangular Armored Breech Shroud
    bevel(`gun-breech-shroud-${side}`, 9.5, yGun, 10.2, 5.0, 2.8, 2.4, 'magneticRail', 0.3);

    // Primary Accelerator Barrel Tube (Extends from X=11.0 to X=25.0)
    cylinder(`gun-barrel-tube-${side}`, 18.0, yGun, 10.2, 0.72, 14.0, 'x', 16, 'magneticRail');

    // Glowing Electromagnetic Plasma Induction Coils (4 per barrel)
    for (let c = 0; c < 4; c++) {
      const cx = 13.5 + c * 2.4;
      lathe(`gun-plasma-coil-${side}-${c}`, cx, yGun, 10.2, [
        [0.0, 0.75], [0.2, 1.1], [0.8, 1.1], [1.0, 0.75]
      ], 'aerospaceChrome', 'x', 24);
      cylinder(`gun-plasma-glow-${side}-${c}`, cx + 0.5, yGun, 10.2, 1.115, 0.32, 'x', 24, 'cyanTrim');
    }

    // High-Voltage Cryogenic Conduit Lines
    beam(`gun-cryo-line-a-${side}`, [8.0, yGun + (side > 0 ? 1.4 : -1.4), 11.2], [22.0, yGun + (side > 0 ? 1.4 : -1.4), 11.2], 0.16, 'chrome', 6);
    beam(`gun-cryo-line-b-${side}`, [8.0, yGun + (side > 0 ? 1.4 : -1.4), 9.2], [22.0, yGun + (side > 0 ? 1.4 : -1.4), 9.2], 0.16, 'chrome', 6);

    // Heavy Muzzle Emitter Faceplate with Circular Focusing Optics (Muzzle at X=25.5)
    lathe(`gun-muzzle-brake-${side}`, 24.8, yGun, 10.2, [
      [0.0, 0.75], [0.3, 1.15], [0.9, 1.15], [1.2, 0.95]
    ], 'aerospaceChrome', 'x', 24);
    cylinder(`gun-muzzle-lens-${side}`, 25.8, yGun, 10.2, 0.94, 0.2, 'x', 24, 'microwaveFace');
  }

  // =========================================================================
  // 4. ARTICULATED REAR STINGER & COMMUNICATIONS MAST (Turret2, Turret2_Gun, Bone_Tail)
  // =========================================================================
  // Base Mount on Rear Hull (Centered at X=-14.0, Y=0.0, Z=8.5)
  lathe('stinger-base-mount', -14.0, 0.0, 8.5, [
    [0.0, 2.2], [0.6, 1.8], [1.2, 1.4]
  ], 'magneticRail', 'z', 12);

  // Swept Aerodynamic Stinger Mast Arm (Extends rearward and upward)
  beam('stinger-arm-left', [-14.0, 1.2, 9.6], [-19.0, 2.5, 17.5], 0.55, 'paint', 8);
  beam('stinger-arm-right', [-14.0, -1.2, 9.6], [-19.0, -2.5, 17.5], 0.35, 'paint', 6);
  beam('stinger-cross-brace', [-16.5, -1.8, 13.5], [-16.5, 1.8, 13.5], 0.25, 'cyanTrim', 6);
  beam('stinger-central-conduit',[-14.6,0,9.7],[-19.5,0,17.5],.17,'carbonFiber',8);
  beam('stinger-actuator',[-15.5,0,9.3],[-17,0,13.2],.32,'aerospaceChrome',10);

  // Twin Vertical Telemetry Stabilizer Wings
  quad('stinger-wing-l', [
    [-17.0, 2.4, 15.0], [-20.5, 2.8, 18.5],
    [-21.5, 2.8, 18.5], [-18.5, 2.4, 15.0]
  ], 'carbonFiber');
  quad('stinger-wing-r', [
    [-17.0, -2.4, 15.0], [-18.5, -2.4, 15.0],
    [-21.5, -2.8, 18.5], [-20.5, -2.8, 18.5]
  ], 'carbonFiber');

  // Top Phased Array Antenna Pod & Stinger Laser Emitter (TurretMS origin at X=-19.5, Z=18.0)
  bevel('stinger-avionics-pod', -19.5, 0.0, 17.8, 3.2, 3.5, 1.6, 'paint', 0.25);
  cylinder('stinger-laser-emitter', -21.0, 0.0, 17.8, 0.45, 0.8, 'x', 10, 'cyanTrim');
  cylinder('stinger-laser-lens', -21.4, 0.0, 17.8, 0.38, 0.15, 'x', 10, 'strobeOptics');

  // High-Gain Satellite Uplink Dish & Omnidirectional Antenna Rods
  lathe('stinger-sat-dish', -18.5, 0.0, 19.2, [
    [0.0, 0.3], [0.4, 1.4], [0.6, 1.6], [0.7,1.6], [0.5,1.38], [0.12,0.3], [0.12,0]
  ], 'chrome', 'z', 14);
  cylinder('stinger-sat-feed-horn', -18.5, 0.0, 20.0, 0.12, 1.0, 'z', 6, 'cyanTrim');
  beam('stinger-whip-antenna-l', [-19.0, 1.6, 18.5], [-20.5, 2.0, 24.5], 0.08, 'chrome', 4);
  beam('stinger-whip-antenna-r', [-19.0, -1.6, 18.5], [-20.5, -2.0, 24.5], 0.08, 'chrome', 4);

  // =========================================================================
  // 5. 4 PLANETARY OMNIDIRECTIONAL WHEEL ASSEMBLIES (TIRE_LF, TIRE_RF, TIRE_LR, TIRE_RR)
  // =========================================================================
  const wheelConfigs = [
    { prefix: 'wheel-front-left', cx: 13.0, cy: 9.8, cz: 4.8 },
    { prefix: 'wheel-front-right', cx: 13.0, cy: -9.8, cz: 4.8 },
    { prefix: 'wheel-rear-left', cx: -13.0, cy: 9.8, cz: 4.8 },
    { prefix: 'wheel-rear-right', cx: -13.0, cy: -9.8, cz: 4.8 },
  ];

  wheelConfigs.forEach(({ prefix, cx, cy, cz }) => {
    const isLeft = cy > 0;
    const ySign = isLeft ? 1 : -1;

    // 1. High-Tech Composite Stealth Tread Torus (Radius 4.6, Width 2.8)
    lathe(`${prefix}-tire-tread`, cx, cy - ySign * 0.9, cz, [
      [0.0, 3.8],
      [ySign * 0.5, 4.4],
      [ySign * 1.2, 4.6],
      [ySign * 1.9, 4.4],
      [ySign * 2.4, 3.8]
    ], 'stealthTread', 'y', 20);

    cylinder(prefix+'-inner-closure',cx,cy-ySign*.85,cz,3.8,.12,'y',24,'skirtSeal');
    cylinder(prefix+'-axle',cx,cy-ySign*1.2,cz,.65,2,'y',12,'magneticRail');
    // 2. Smooth Aerodynamic Wheel Sidewall
    lathe(`${prefix}-tire-sidewall`, cx, cy + ySign * 1.5, cz, [
      [0.0, 3.8],
      [0.0, 2.4]
    ], 'skirtSeal', 'y', 18);

    // 3. Machined Aerospace Alloy Planetary Wheel Hub
    lathe(`${prefix}-planetary-rim`, cx, cy + ySign * 1.55, cz, [
      [0.0, 2.4],
      [-ySign * 0.3, 1.8],
      [-ySign * 0.6, 1.0],
      [-ySign * 0.5, 0.4]
    ], 'aerospaceChrome', 'y', 18);

    // 4. Illuminated Cyan Accent Ring on Outer Wheel Face
    lathe(`${prefix}-hub-light-ring`, cx, cy + ySign * 1.58, cz, [
      [0.0, 1.8],
      [ySign * 0.08, 1.8],
      [ySign * 0.08, 1.4],
      [0.0, 1.4]
    ], 'cyanTrim', 'y', 16);

    // 5. Center Planetary Drive Lock & Fasteners
    bevel(`${prefix}-center-drive-hub`, cx, cy + ySign * 1.2, cz, 1.1, 0.5, 1.1, 'aerospaceChrome', 0.2);
    for (let b = 0; b < 6; b++) {
      const ba = b * Math.PI / 3;
      cylinder(`${prefix}-drive-bolt-${b}`, cx + 0.7 * Math.cos(ba), cy + ySign * 1.25, cz + 0.7 * Math.sin(ba), 0.12, 0.2, 'y', 6, 'magneticRail');
    }

    // 6. Internal Heavy Electromagnetic Disc Brake Rotor & Caliper
    cylinder(`${prefix}-em-brake-rotor`, cx, cy, cz, 2.2, 0.35, 'y', 12, 'magneticRail');
    bevel(`${prefix}-em-brake-caliper`, cx + 0.9, cy + ySign * 0.2, cz + 1.1, 1.5, 0.6, 1.2, 'cyanTrim', 0.2);
  });
};
