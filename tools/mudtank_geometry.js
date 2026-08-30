'use strict';

// +X is forward; +Z is up; +Y is left, -Y is right.
// High-detail hard-surface model for the Pasadena Monster Mud Tank (GDIPredator replacement).
// Refinement Iterations 1-5:
// - Beadlock rims with 16 perimeter bolts, valve stems, hub locks, ventilated rotors, and calipers
// - Hydraulic steering stabilizer, pitman arm, drag link, diff trusses, driveshafts, and anti-wrap traction ladder bars
// - Supercharger blower belt tensioner, braided fuel lines, distributor cap, 8 ignition leads, and zoomie exhaust headers
// - Cab sun visor with clearance lights, towing mirrors, interior racing seats/harnesses, CB whip antennas, and recovery D-rings
// - High-pressure pneumatic supply lines, brass solenoid valves, ammo feed hopper, slotted muzzle brake, and Old Bay ammo crate
// - Heavy rear mud flaps with chrome anti-sail bars, skid plate with laser-cut DENA vents
module.exports = function buildMudTank({ addBox: box, addCylinder: cylinder, addFace: face, addTriangle: triangle }) {
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

  function quad(name, [p0, p1, p2, p3], mat) {
    let desired;
    const side = Math.sign((p0[1]+p1[1]+p2[1]+p3[1])/4);
    if (/^(door-panel|door-glass|door-rain-shade|fender-shoulder|fender-flare-.*|bed-outer-wall)$/.test(name)) desired=[0,side,0];
    if (name==='bed-inner-wall') desired=[0,-side,0];
    if (name==='bed-rail-top' || name==='cab-sun-visor') desired=[0,0,1];
    if (/^cab-rear-/.test(name) || name==='rear-mud-flap' || name==='tailgate-panel') desired=[-1,0,0];
    if (name==='front-grille-fascia' || name==='cab-firewall') desired=[1,0,0];
    if (name==='windshield-glass') desired=[1,0,1];
    if(desired && normal([p0,p1,p2]).reduce((s,v,k)=>s+v*desired[k],0)<0) [p0,p1,p2,p3]=[p3,p2,p1,p0];
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
    // Profiles are authored inner-to-outer on each mirrored wheel. Deep-dish
    // rims turn back toward the axle but their visible face still faces out.
    const direction = name.startsWith('wheel-') ? Math.sign(cy) : 1;
    const oriented = p => direction*(axis==='y'?1:-1)<0 ? [...p].reverse() : p;
    const point = (a, r, t) => axis === 'y'
      ? [cx + r * Math.cos(t), cy + a, cz + r * Math.sin(t)]
      : axis === 'z'
      ? [cx + r * Math.cos(t), cy + r * Math.sin(t), cz + a]
      : [cx + a, cy + r * Math.cos(t), cz + r * Math.sin(t)];

    for (let j = 0; j < profile.length - 1; j++) {
      const [a, r] = profile[j], [b, s] = profile[j + 1];
      for (let i = 0; i < segments; i++) {
        const t = i * 2 * Math.PI / segments, u = (i + 1) * 2 * Math.PI / segments;
        const p0 = point(a, r, t), p1 = point(b, s, t), p2 = point(b, s, u), p3 = point(a, r, u);
        if (s <= 1e-5) {
          const p=oriented([p0,p1,p3]); triangle(p,normal(p),mat,name);
        } else if (r <= 1e-5) {
          const p=oriented([p0,p2,p3]); triangle(p,normal(p),mat,name);
        } else {
          quad(name, oriented([p0, p1, p2, p3]), mat);
        }
      }
    }
  }

  // =========================================================================
  // 1. LIFTED STEEL LADDER CHASSIS, DRIVESHAFTS, TRACTION BARS & SUSPENSION
  // =========================================================================
  // Main chassis frame rails
  for (const y of [-5.5, 5.5]) {
    beam('chassis-rail', [-23, y, 7.2], [24, y, 7.2], 0.65, 'blackFender', 6);
  }
  // Cross members
  for (const x of [-20, -10, 0, 10, 20]) {
    beam('chassis-cross', [x, -5.5, 7.2], [x, 5.5, 7.2], 0.5, 'blackFender', 6);
  }

  // Front Engine & Transmission Skid Plate with Laser-Cut Vents
  bevel('chassis-front-skid', 18.0, 0.0, 5.2, 10.0, 9.0, 0.8, 'diamondPlate', 0.25);

  // Transfer Case & Heavy Driveshafts
  bevel('transfer-case', 0.0, 0.0, 7.2, 4.0, 3.5, 2.5, 'steelRim', 0.3);
  beam('driveshaft-front', [0.0, 0.0, 7.0], [15.0, 0.0, 6.0], 0.45, 'chrome', 6);
  beam('driveshaft-rear', [0.0, 0.0, 7.0], [-15.0, 0.0, 6.0], 0.45, 'chrome', 6);

  // Heavy Dana 60/70 Monster Axles & Differentials
  for (const x of [15.0, -15.0]) {
    cylinder('axle-tube', x, 0, 6.0, 0.9, 18.0, 'y', 10, 'steelRim');
    lathe('axle-diff-housing', x, 0, 6.0, [
      [0.0, 1.8], [0.8, 2.3], [1.6, 2.3], [2.4, 1.8]
    ], 'steelRim', 'y', 14);

    // Differential Truss Reinforcement
    beam(`diff-truss-${x}`, [x, -4.5, 4.8], [x, 4.5, 4.8], 0.35, 'blackFender', 6);
    beam(`diff-truss-l-${x}`, [x, -4.5, 4.8], [x, -6.5, 6.0], 0.35, 'blackFender', 6);
    beam(`diff-truss-r-${x}`, [x, 4.5, 4.8], [x, 6.5, 6.0], 0.35, 'blackFender', 6);

    // 4-Link Heavy Suspension Arms & Dual Shocks
    for (const side of [-1, 1]) {
      beam('suspension-link-lower', [x, side * 3.5, 5.8], [x > 0 ? 4 : -4, side * 5.0, 7.2], 0.45, 'blackFender', 6);
      beam('suspension-link-upper', [x, side * 3.5, 6.8], [x > 0 ? 4 : -4, side * 4.0, 8.2], 0.42, 'blackFender', 6);
      beam('shock-absorber-a', [x - 1.2, side * 7.5, 6.2], [x - 0.8, side * 5.8, 10.5], 0.35, 'chrome', 6);
      beam('shock-absorber-b', [x + 1.2, side * 7.5, 6.2], [x + 0.8, side * 5.8, 10.5], 0.35, 'chrome', 6);

      // Heavy Anti-Wrap Traction Ladder Bars
      const txEnd = x > 0 ? 3.0 : -3.0;
      beam(`traction-bar-top-${x}-${side}`, [x, side * 6.5, 5.2], [txEnd, side * 4.5, 6.8], 0.3, 'paint', 6);
      beam(`traction-bar-bot-${x}-${side}`, [x, side * 6.5, 4.2], [txEnd, side * 4.5, 6.8], 0.3, 'paint', 6);
      beam(`traction-bar-brace-${x}-${side}`, [x + (x > 0 ? -4.5 : 4.5), side * 5.8, 4.7], [x + (x > 0 ? -4.5 : 4.5), side * 5.8, 6.0], 0.22, 'blackFender', 6);
    }
  }

  // Front Hydraulic Steering Stabilizer, Pitman Arm & Drag Link
  cylinder('steering-stabilizer-body', 16.5, 0.0, 5.5, 0.4, 6.0, 'y', 8, 'paint');
  cylinder('steering-stabilizer-ram', 16.5, 4.0, 5.5, 0.22, 4.0, 'y', 8, 'chrome');
  beam('steering-drag-link', [18.0, 6.5, 6.0], [15.5, -6.5, 5.6], 0.32, 'blackFender', 6);
  beam('steering-pitman-arm', [18.0, 6.5, 8.5], [18.0, 6.5, 6.0], 0.35, 'blackFender', 6);

  // =========================================================================
  // 2. CHEVY SQUAREBODY CAB, COCKPIT INTERIOR & PICKUP BED
  // =========================================================================
  // Cab Floor
  bevel('cab-floor', 5.0, 0, 9.8, 18.0, 17.0, 1.2, 'diamondPlate', 0.3);

  // Cab Firewall & Front Bulkhead
  quad('cab-firewall', [
    [13.0, 8.5, 9.8], [13.0, -8.5, 9.8],
    [13.0, -8.5, 14.5], [13.0, 8.5, 14.5]
  ], 'blackFender');

  // Cab Back Wall & Rear Window
  quad('cab-rear-wall', [
    [-3.0, -8.5, 9.8], [-3.0, 8.5, 9.8],
    [-3.0, 8.5, 18.8], [-3.0, -8.5, 18.8]
  ], 'paint');
  quad('cab-rear-glass', [
    [-3.05, -5.5, 14.5], [-3.05, 5.5, 14.5],
    [-3.05, 5.5, 17.5], [-3.05, -5.5, 17.5]
  ], 'glass');
  quad('cab-rear-sliding-frame', [
    [-3.08, -0.4, 14.5], [-3.08, 0.4, 14.5],
    [-3.08, 0.4, 17.5], [-3.08, -0.4, 17.5]
  ], 'blackFender');

  // Cab Interior: Racing Bucket Seats, Harness Bar & 3-Spoke Steering Wheel
  for (const side of [-1, 1]) {
    const sy = side * 4.0;
    // High-back racing bucket seat
    bevel(`interior-seat-cushion-${side}`, 3.5, sy, 11.2, 3.8, 3.2, 1.2, 'blackFender', 0.2);
    bevel(`interior-seat-back-${side}`, 1.2, sy, 14.0, 1.4, 3.0, 5.2, 'blackFender', 0.2);
    // 5-point safety harness straps (Pasadena Red)
    beam(`harness-l-${side}`, [1.8, sy - 0.7, 16.0], [3.2, sy - 0.7, 11.8], 0.12, 'paint', 4);
    beam(`harness-r-${side}`, [1.8, sy + 0.7, 16.0], [3.2, sy + 0.7, 11.8], 0.12, 'paint', 4);
  }
  // Dashboard & Steering Column / Wheel
  bevel('interior-dashboard', 8.5, 0.0, 13.2, 3.0, 14.0, 2.0, 'blackFender', 0.2);
  cylinder('steering-column', 7.5, 4.0, 13.5, 0.22, 2.5, 'x', 6, 'blackFender');
  lathe('steering-wheel-rim', 6.2, 4.0, 14.2, [[0, 1.2], [0.15, 1.2], [0.15, 1.0], [0, 1.0]], 'chrome', 'x', 12);

  // Cab Roof Panel
  quad('cab-roof-panel', [
    [-3.0, 8.2, 19.0], [-3.0, -8.2, 19.0],
    [5.0, -8.2, 19.0], [5.0, 8.2, 19.0]
  ], 'cabRoof');

  // Windshield & A-Pillars
  quad('windshield-glass', [
    [11.5, 7.8, 14.2], [11.5, -7.8, 14.2],
    [5.0, -8.0, 18.8], [5.0, 8.0, 18.8]
  ], 'glass');
  beam('a-pillar-l', [11.5, 8.0, 14.0], [5.0, 8.2, 19.0], 0.45, 'paint', 6);
  beam('a-pillar-r', [11.5, -8.0, 14.0], [5.0, -8.2, 19.0], 0.45, 'paint', 6);

  // Cab Sun Visor with 5 Amber Clearance Lights
  quad('cab-sun-visor', [
    [5.0, 8.4, 19.0], [5.0, -8.4, 19.0],
    [7.5, -8.2, 18.4], [7.5, 8.2, 18.4]
  ], 'blackFender');
  for (let k = 0; k < 5; k++) {
    const vy = -5.0 + k * 2.5;
    cylinder(`visor-clearance-light-${k}`, 7.0, vy, 18.6, 0.22, 0.35, 'x', 8, 'supercharger');
  }

  // Squarebody Doors & Heavy Chrome Towing Mirrors (Left & Right)
  for (const side of [-1, 1]) {
    const ySign = side;
    const yDoor = ySign * 8.6;

    // Lower Door Panel with Maryland Flag Decal
    quad('door-panel', [
      [-2.8, yDoor, 9.8], [11.2, yDoor, 9.8],
      [11.2, yDoor, 14.0], [-2.8, yDoor, 14.0]
    ], 'doorPanel');

    // Side Door Glass
    quad('door-glass', [
      [-2.6, yDoor * 0.96, 14.0], [5.0, yDoor * 0.96, 14.0],
      [4.8, yDoor * 0.94, 18.6], [-2.6, yDoor * 0.94, 18.6]
    ], 'glass');

    // Window Vent / Rain Guards
    // Triangular front quarter pane closes the gap to the sloping A-pillar.
    const quarter=[[5.1,yDoor*0.96,14.0],[11.0,yDoor*0.92,14.1],[5.1,yDoor*0.94,18.4]];
    triangle(quarter,[0,side,0],'glass','door-quarter-glass');
    beam('window-divider',[5.0,yDoor*0.97,14.0],[4.8,yDoor*0.95,18.6],0.16,'paint');
    quad('door-rain-shade', [
      [-2.6, yDoor * 1.02, 18.6], [5.0, yDoor * 1.02, 18.6],
      [4.8, yDoor * 1.05, 17.6], [-2.6, yDoor * 1.05, 17.6]
    ], 'blackFender');

    // Heavy Diamond Plate Rocker Step Bar
    beam('side-step-bar', [-1.5, ySign * 9.8, 7.8], [9.5, ySign * 9.8, 7.8], 0.38, 'diamondPlate', 6);
    beam('step-mount-front', [8.0, ySign * 6.0, 8.0], [8.0, ySign * 9.8, 7.8], 0.28, 'blackFender', 6);
    beam('step-mount-rear', [0.0, ySign * 6.0, 8.0], [0.0, ySign * 9.8, 7.8], 0.28, 'blackFender', 6);

    // Chrome West Coast Towing Mirror
    beam(`mirror-arm-top-${side}`, [8.0, ySign * 8.6, 17.5], [7.5, ySign * 11.2, 17.0], 0.2, 'chrome', 6);
    beam(`mirror-arm-bot-${side}`, [8.0, ySign * 8.6, 14.5], [7.5, ySign * 11.2, 15.0], 0.2, 'chrome', 6);
    bevel(`mirror-head-${side}`, 7.5, ySign * 11.5, 16.0, 1.4, 0.5, 2.6, 'chrome', 0.15);
  }

  // =========================================================================
  // 3. FRONT HOOD, FENDERS & CHEVY GRILLE
  // =========================================================================
  // Front Fenders (Left & Right)
  for (const side of [-1, 1]) {
    const ySign = side;
    const yFender = ySign * 8.8;

    // Outer Fender Shoulder
    quad('fender-shoulder', [
      [11.5, yFender, 10.0], [23.5, yFender, 10.0],
      [23.5, yFender * 0.95, 13.8], [11.5, yFender * 0.95, 13.8]
    ], 'blackFender');

    // Flared Fender Arch Over Front Wheel
    quad('fender-flare-front', [
      [21.5, yFender * 1.08, 9.5], [15.0, yFender * 1.15, 12.0],
      [15.0, yFender * 0.95, 13.8], [21.5, yFender * 0.95, 13.8]
    ], 'blackFender');
  }

  // Front Hood with Center Cutout for Blower
  quad('hood-left', [
    [11.5, 8.4, 14.0], [11.5, 3.2, 14.0],
    [23.5, 3.2, 13.8], [23.5, 8.4, 13.8]
  ], 'hoodPanel');
  quad('hood-right', [
    [11.5, -3.2, 14.0], [11.5, -8.4, 14.0],
    [23.5, -8.4, 13.8], [23.5, -3.2, 13.8]
  ], 'hoodPanel');
  quad('hood-front-nose', [
    [20.5, 3.2, 13.8], [20.5, -3.2, 13.8],
    [23.5, -3.2, 13.8], [23.5, 3.2, 13.8]
  ], 'hoodPanel');
  quad('hood-rear-cowl', [
    [11.5, 3.2, 14.0], [11.5, -3.2, 14.0],
    [13.5, -3.2, 14.0], [13.5, 3.2, 14.0]
  ], 'hoodPanel');

  // Front Classic Chevy Split Grille & Square Headlights
  quad('front-grille-fascia', [
    [24.0, 8.5, 9.8], [24.0, -8.5, 9.8],
    [24.0, -8.5, 13.8], [24.0, 8.5, 13.8]
  ], 'frontGrille');

  // Front Heavy Steel Push Bumper with Stinger Bar & Recovery Shackles
  bevel('front-bumper', 24.8, 0, 9.2, 2.0, 18.5, 2.2, 'blackFender', 0.3);
  beam('stinger-bar-l', [25.2, 4.5, 9.8], [27.0, 3.0, 14.0], 0.35, 'blackFender', 6);
  beam('stinger-bar-r', [25.2, -4.5, 9.8], [27.0, -3.0, 14.0], 0.35, 'blackFender', 6);
  beam('stinger-bar-top', [27.0, -3.0, 14.0], [27.0, 3.0, 14.0], 0.35, 'blackFender', 6);
  lathe('bumper-shackle-l', 25.8, 5.0, 8.8, [[0, 0.4], [0.6, 0.4]], 'paint', 'x', 8);
  lathe('bumper-shackle-r', 25.8, -5.0, 8.8, [[0, 0.4], [0.6, 0.4]], 'paint', 'x', 8);

  // =========================================================================
  // 4. EXPOSED SUPERCHARGED 454 BIG-BLOCK V8, IGNITION WIRES & ZOOMIES
  // =========================================================================
  // Engine Block, Finned Valve Covers & Oil Pan
  bevel('engine-block', 16.5, 0, 12.8, 6.0, 5.4, 2.8, 'supercharger', 0.2);
  bevel('engine-oil-pan', 16.5, 0, 9.8, 5.4, 4.4, 2.0, 'steelRim', 0.25);

  // 6-71 Roots Supercharger Blower
  bevel('supercharger-case', 16.5, 0, 15.0, 5.2, 3.4, 2.2, 'supercharger', 0.25);
  // Dual Carburetor Air Scoop (Shotgun Scoop) & Fuel Log
  bevel('air-scoop', 17.0, 0, 16.8, 4.0, 3.6, 1.4, 'chrome', 0.2);
  cylinder('scoop-butterfly-l', 19.1, 1.0, 16.8, 0.6, 0.4, 'x', 10, 'paint');
  cylinder('scoop-butterfly-r', 19.1, -1.0, 16.8, 0.6, 0.4, 'x', 10, 'paint');
  cylinder('carb-fuel-log-l', 17.0, 2.0, 16.4, 0.18, 3.0, 'x', 6, 'paint');
  cylinder('carb-fuel-log-r', 17.0, -2.0, 16.4, 0.18, 3.0, 'x', 6, 'paint');

  // Distributor Cap & Red Ignition Leads
  cylinder('engine-distributor-cap', 13.8, 0.0, 14.5, 0.55, 0.8, 'z', 8, 'paint');
  for (let s = 0; s < 4; s++) {
    const sx = 14.5 + s * 1.3;
    beam(`spark-wire-l-${s}`, [13.8, 0.2, 14.8], [sx, 2.4, 13.5], 0.08, 'paint', 4);
    beam(`spark-wire-r-${s}`, [13.8, -0.2, 14.8], [sx, -2.4, 13.5], 0.08, 'paint', 4);
  }

  // Blower Pulley, Cogged Drive Belt & Tensioner
  cylinder('blower-top-pulley', 19.2, 0, 15.0, 0.9, 0.4, 'x', 12, 'chrome');
  cylinder('blower-bottom-pulley', 19.4, 0, 12.8, 1.1, 0.4, 'x', 12, 'chrome');
  cylinder('blower-idler-tensioner', 19.3, 1.3, 13.9, 0.5, 0.4, 'x', 10, 'chrome');
  beam('blower-belt-l', [19.2, 0.9, 15.0], [19.3, 1.3, 13.9], 0.22, 'blackFender', 6);
  beam('blower-belt-mid', [19.3, 1.3, 13.9], [19.4, 1.1, 12.8], 0.22, 'blackFender', 6);
  beam('blower-belt-r', [19.2, -0.9, 15.0], [19.4, -1.1, 12.8], 0.22, 'blackFender', 6);

  // Spitting Chrome Zoomie Exhaust Headers (4 per side)
  for (const side of [-1, 1]) {
    const ySign = side;
    const yBase = ySign * 2.8;
    for (let k = 0; k < 4; k++) {
      const ex = 14.5 + k * 1.3;
      const pStart = [ex, yBase, 13.0];
      const pMid = [ex + 0.2, ySign * 5.2, 14.5];
      const pTip = [ex - 0.4, ySign * 6.5, 17.5 + k * 0.4];
      beam(`zoomie-pipe-a-${side}-${k}`, pStart, pMid, 0.25, 'chrome', 6);
      beam(`zoomie-pipe-b-${side}-${k}`, pMid, pTip, 0.25, 'chrome', 6);
      cylinder(`zoomie-tip-${side}-${k}`, pTip[0], pTip[1], pTip[2], 0.28, 0.3, 'z', 8, 'steelRim');
    }
  }

  // =========================================================================
  // 5. STEEL EXO-CAGE ROLL BAR, KC FLOODLIGHTS & CB WHIP ANTENNAS
  // =========================================================================
  // Roof Rack / Lightbar Mount
  beam('cage-front-l', [11.2, 8.6, 9.8], [4.8, 8.4, 19.4], 0.4, 'blackFender', 6);
  beam('cage-front-r', [11.2, -8.6, 9.8], [4.8, -8.4, 19.4], 0.4, 'blackFender', 6);
  beam('cage-roof-front', [4.8, -8.4, 19.4], [4.8, 8.4, 19.4], 0.4, 'blackFender', 6);

  beam('cage-rear-l', [-3.2, 8.6, 9.8], [-3.2, 8.4, 19.4], 0.4, 'blackFender', 6);
  beam('cage-rear-r', [-3.2, -8.6, 9.8], [-3.2, -8.4, 19.4], 0.4, 'blackFender', 6);
  beam('cage-roof-rear', [-3.2, -8.4, 19.4], [-3.2, 8.4, 19.4], 0.4, 'blackFender', 6);

  beam('cage-roof-side-l', [4.8, 8.4, 19.4], [-3.2, 8.4, 19.4], 0.4, 'blackFender', 6);
  beam('cage-roof-side-r', [4.8, -8.4, 19.4], [-3.2, -8.4, 19.4], 0.4, 'blackFender', 6);

  // Four lamps leave a clear center channel for the cannon.
  for (let k = 0; k < 4; k++) {
    const ly = [-6,-2.8,2.8,6][k];
    lathe(`kc-light-housing-${k}`, 4.9, ly, 20.4, [
      [0.0, 0.9], [0.3, 0.95], [0.6, 0.95], [0.75, 0.4]
    ], 'blackFender', 'x', 12);
    cylinder(`kc-light-lens-${k}`, 5.6, ly, 20.4, 0.85, 0.2, 'x', 12, 'supercharger');
  }

  // Dual 102-inch CB Radio Whip Antennas Arched Forward to Roll Bar
  for (const side of [-1, 1]) {
    const ay = side * 8.4;
    cylinder(`cb-spring-mount-${side}`, -3.2, ay, 19.6, 0.3, 0.8, 'z', 8, 'chrome');
    beam(`cb-whip-antenna-a-${side}`, [-3.2, ay, 20.4], [-1.0, ay * 1.02, 21.4], 0.09, 'chrome', 4);
    beam(`cb-whip-antenna-b-${side}`, [-1.0, ay * 1.02, 21.4], [4.5, ay * 0.98, 19.5], 0.08, 'chrome', 4);
  }

  // =========================================================================
  // 6. REAR PICKUP BED, DIAMOND PLATE, MUD FLAPS & TAILGATE
  // =========================================================================
  // Diamond Plate Bed Floor
  bevel('bed-floor', -13.0, 0, 9.8, 20.0, 16.5, 1.0, 'diamondPlate', 0.2);

  // Bed Sides & Outer Fenders
  for (const side of [-1, 1]) {
    const ySign = side;
    const yBed = ySign * 8.6;

    // Inner Bed Wall
    quad('bed-inner-wall', [
      [-3.0, yBed * 0.92, 10.2], [-23.0, yBed * 0.92, 10.2],
      [-23.0, yBed * 0.92, 14.5], [-3.0, yBed * 0.92, 14.5]
    ], 'diamondPlate');

    // Outer Bed Side
    quad('bed-outer-wall', [
      [-3.0, yBed, 10.0], [-23.0, yBed, 10.0],
      [-23.0, yBed, 14.5], [-3.0, yBed, 14.5]
    ], 'paint');

    // Bed Rail Top Cap
    quad('bed-rail-top', [
      [-3.0, yBed * 0.92, 14.5], [-23.0, yBed * 0.92, 14.5],
      [-23.0, yBed, 14.5], [-3.0, yBed, 14.5]
    ], 'diamondPlate');

    // Flared Rear Wheel Arch Over Monster Swamper
    quad('fender-flare-rear', [
      [-10.0, yBed * 1.08, 9.5], [-16.0, yBed * 1.15, 12.0],
      [-16.0, yBed * 0.95, 14.2], [-10.0, yBed * 0.95, 14.2]
    ], 'blackFender');

    // Heavy Rubber Rear Mud Flap with Chrome Anti-Sail Weight
    quad('rear-mud-flap', [
      [-21.5, ySign * 6.8, 3.5], [-21.5, ySign * 11.2, 3.5],
      [-21.5, ySign * 11.2, 9.5], [-21.5, ySign * 6.8, 9.5]
    ], 'blackFender');
    beam(`mud-flap-weight-${side}`, [-21.6, ySign * 7.0, 3.8], [-21.6, ySign * 11.0, 3.8], 0.22, 'chrome', 4);
  }

  // Stamped "CHEVROLET" Tailgate & Handle
  quad('tailgate-panel', [
    [-23.2, 8.5, 10.0], [-23.2, -8.5, 10.0],
    [-23.2, -8.5, 14.5], [-23.2, 8.5, 14.5]
  ], 'tailgate');
  bevel('tailgate-handle', -23.4, 0.0, 13.5, 0.4, 2.4, 0.8, 'blackFender', 0.15);

  // Rear Heavy Step Bumper & Tow Hitch
  bevel('rear-bumper', -23.8, 0, 9.2, 1.8, 18.0, 2.0, 'blackFender', 0.25);
  cylinder('tow-hitch-receiver', -24.8, 0, 8.5, 0.45, 1.2, 'x', 8, 'steelRim');

  // Wooden Old Bay Seasoning Ammo Crate & Brass Corner Brackets
  bevel('old-bay-ammo-crate', -18.5, -5.2, 12.2, 5.5, 4.5, 3.8, 'oldBayCrate', 0.2);
  cylinder('crate-rope-handle', -18.5, -7.6, 12.2, 0.2, 1.8, 'x', 6, 'steelRim');

  // Compressed Pneumatic Air Reserve Tanks & Manifold Fittings
  cylinder('air-tank-1', -18.0, 5.2, 11.8, 1.2, 6.5, 'x', 12, 'paint');
  cylinder('air-tank-2', -18.0, 5.2, 13.8, 1.0, 6.0, 'x', 12, 'paint');
  beam('air-tank-manifold', [-15.0, 5.2, 12.8], [-15.0, 5.2, 14.5], 0.25, 'chrome', 6);
  beam('air-conduit-pipe', [-15.0, 5.2, 14.5], [-12.0, 2.0, 16.0], 0.28, 'chrome', 6);

  // =========================================================================
  // 7. PNEUMATIC POTATO & OLD BAY CANNON TURRET (YAW & PITCH)
  // =========================================================================
  // Rotating Turret Pedestal Base (Yaw origin at X=-12.0, Y=0.0, Z=10.2)
  // Fixed armored riser reaches the raised yaw assembly, above the cab.
  cylinder('cannon-fixed-riser', -12, 0, 13.6, 2.8, 7.2, 'z', 16, 'turretShell');
  for(const side of [-1,1]) beam('cannon-riser-brace',[-12,side*5,10.3],[-12,side*2.4,17.0],0.42,'steelRim');
  lathe('turret-ring-pedestal', -12.0, 0, 10.2, [
    [0.0, 3.8], [0.8, 3.6], [1.6, 3.4], [2.2, 3.2]
  ], 'steelRim', 'z', 16);

  // Armored Cast-Iron Turret Housing (Centered at X=-12.0, Y=0.0, Z=14.0)
  bevel('turret-armored-housing', -12.0, 0, 14.2, 9.0, 7.8, 4.4, 'turretShell', 0.5);

  // Gunner's Vision Port & Top Access Hatch
  cylinder('turret-commander-cupola', -13.5, 0, 16.6, 1.8, 0.6, 'z', 12, 'steelRim');
  bevel('turret-vision-slit', -8.0, 1.8, 15.0, 1.2, 1.8, 0.8, 'supercharger', 0.15);

  // Heavy Pneumatic Pressure Vessel Sphere on Turret Rear
  lathe('turret-pressure-accumulator', -16.5, 0, 14.2, [
    [-1.8, 0.4], [-1.4, 1.8], [0.0, 2.4], [1.4, 1.8], [1.8, 0.4]
  ], 'steelRim', 'x', 14);

  // High-Pressure Spiral Air Feed Lines into Turret
  beam('turret-air-feed-line-l', [-15.0, 2.8, 14.5], [-11.0, 2.2, 15.2], 0.22, 'chrome', 6);
  beam('turret-air-feed-line-r', [-15.0, -2.8, 14.5], [-11.0, -2.2, 15.2], 0.22, 'chrome', 6);

  // Elevating Cannon Breech & Trunnions (Pitch origin at X=-10.0, Y=0.0, Z=15.2)
  cylinder('barrel-trunnion-axle', -10.0, 0, 15.2, 0.85, 8.4, 'y', 10, 'steelRim');
  bevel('barrel-breech-block', -9.0, 0, 15.2, 5.2, 3.6, 3.2, 'cannonMuzzle', 0.3);

  // Armored Curved Mantlet Shield
  lathe('barrel-mantlet-shield', -9.8, 0.0, 15.2, [
    [0.0, 2.4], [0.6, 2.6], [1.2, 2.4]
  ], 'turretShell', 'y', 12);

  // Brass Pressure Dial Gauge & Solenoid Actuator Valves
  cylinder('barrel-pressure-gauge-bezel', -9.0, 1.9, 16.2, 0.6, 0.25, 'y', 10, 'chrome');
  cylinder('barrel-pressure-gauge-face', -9.0, 2.05, 16.2, 0.5, 0.1, 'y', 10, 'supercharger');
  cylinder('barrel-solenoid-valve', -9.0, -1.9, 16.0, 0.4, 0.6, 'y', 8, 'paint');
  beam('barrel-solenoid-lever', [-9.0, -2.2, 16.0], [-9.0, -2.2, 17.2], 0.12, 'paint', 4);

  // Rotary Ammo Feed Hopper (Feeds Potatoes & Old Bay Canisters into Breech)
  cylinder('barrel-ammo-hopper-tube', -8.0, 0.0, 17.2, 0.95, 1.8, 'z', 10, 'steelRim');

  // Heavy Rifled Cannon Barrel (Extends from X=-6.5 to X=+14.0)
  cylinder('barrel-main-tube', 3.5, 0, 15.2, 1.1, 20.0, 'x', 16, 'steelRim');
  cylinder('barrel-collar-base', -6.0, 0, 15.2, 1.4, 1.5, 'x', 14, 'cannonMuzzle');
  cylinder('barrel-collar-mid', 2.0, 0, 15.2, 1.3, 1.2, 'x', 14, 'cannonMuzzle');

  // Heavy Cast-Iron Ribbed Muzzle Brake with Side Compensator Gas Vents
  lathe('barrel-muzzle-brake', 13.8, 0, 15.2, [
    [0.0, 1.15], [0.3, 1.6], [1.2, 1.6], [1.5, 1.35], [1.8, 1.7], [2.1, 0.95]
  ], 'cannonMuzzle', 'x', 16);
  cylinder('barrel-bore-interior', 14.8, 0, 15.2, 0.92, 0.3, 'x', 14, 'blackFender');
  // Side Compensator Gas Diverter Slots
  bevel('barrel-gas-slot-l', 14.4, 1.5, 15.2, 0.8, 0.3, 0.6, 'blackFender', 0.1);
  bevel('barrel-gas-slot-r', 14.4, -1.5, 15.2, 0.8, 0.3, 0.6, 'blackFender', 0.1);

  // =========================================================================
  // 8. 4 MASSIVE 54-INCH SWAMPER TRACTOR WHEELS WITH BEADLOCK RIMS
  // =========================================================================
  // Broad curved steel guards follow the enlarged tires, without closing the
  // wheel opening with a rectangular panel. Coordinates precede body lift.
  for(const cx of [-15,15]) for(const side of [-1,1]) {
    const p=(a,y,r=8.55)=>[cx+r*Math.cos(a),side*y,5+r*Math.sin(a)];
    for(let k=0;k<10;k++) {
      const a=(20+k*14)*Math.PI/180,b=(34+k*14)*Math.PI/180;
      let panel=[p(a,8.7),p(a,13.5),p(b,13.5),p(b,8.7)];
      if(normal(panel)[2]<0)panel.reverse();
      quad('fender-guard-skin',panel,'blackFender');
      beam('fender-guard-lip',p(a,13.5),p(b,13.5),0.16,'blackFender',6);
    }
  }
  const wheelConfigs = [
    { prefix: 'wheel-front-left', cx: 15.0, cy: 9.8, cz: 6.0 },
    { prefix: 'wheel-front-right', cx: 15.0, cy: -9.8, cz: 6.0 },
    { prefix: 'wheel-rear-left', cx: -15.0, cy: 9.8, cz: 6.0 },
    { prefix: 'wheel-rear-right', cx: -15.0, cy: -9.8, cz: 6.0 },
  ];

  wheelConfigs.forEach(({ prefix, cx, cy, cz }) => {
    const isLeft = cy > 0;
    const ySign = isLeft ? 1 : -1;

    // Real alternating chevron cleats: visible silhouette at gameplay zoom.
    for(let k=0;k<18;k++) for(const half of [-1,1]) {
      const theta=k*Math.PI/9;
      const point=(axial,tangent,r)=> {
        const a=theta+tangent+half*axial*0.07;
        return [cx+r*Math.cos(a),cy+0.3*ySign+axial,cz+r*Math.sin(a)];
      };
      const rings=[5.65,6.05].map(r=>[
        point(half*0.08,-0.055,r),point(half*1.45,-0.055,r),
        point(half*1.45,0.055,r),point(half*0.08,0.055,r)]);
      const center=point(half*0.76,0,5.85);
      for(const ids of [[0,1,2,3],[7,6,5,4],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]]) {
        let p=ids.map(i=>rings.flat()[i]);
        const n=normal(p),c=p[0].map((_,j)=>p.reduce((s,v)=>s+v[j],0)/4-center[j]);
        if(n.reduce((s,v,j)=>s+v*c[j],0)<0)p.reverse();
        quad(`${prefix}-cleat`,p,'tireTread');
      }
    }

    // 1. Deep-Cleat Swamper Tractor Tire (Radius 5.85, Width 3.4)
    lathe(`${prefix}-tire-tread`, cx, cy - ySign * 1.2, cz, [
      [0.0, 5.0],
      [ySign * 0.6, 5.6],
      [ySign * 1.5, 5.85],
      [ySign * 2.4, 5.6],
      [ySign * 3.0, 5.0]
    ], 'tireTread', 'y', 20);

    // 2. Heavy Muddy Tire Sidewall
    lathe(`${prefix}-tire-sidewall`, cx, cy + ySign * 1.75, cz, [
      [0.0, 5.0],
      [0.0, 3.2]
    ], 'tireRubber', 'y', 20);

    // 3. Heavy Steel Wheel Rim with Deep Dish Offset
    lathe(`${prefix}-steel-rim`, cx, cy + ySign * 1.8, cz, [
      [0.0, 3.2],
      [-ySign * 0.4, 2.6],
      [-ySign * 0.8, 1.4],
      [-ySign * 0.6, 0.5]
    ], 'steelRim', 'y', 18);

    // 4. Beadlock Outer Ring with 16 Perimeter Locking Bolts
    lathe(`${prefix}-beadlock-ring`, cx, cy + ySign * 1.82, cz, [
      [0.0, 3.35],
      [ySign * 0.15, 3.35],
      [ySign * 0.15, 3.05],
      [0.0, 3.05]
    ], 'chrome', 'y', 18);
    for (let b = 0; b < 16; b++) {
      const ba = b * Math.PI / 8;
      cylinder(`${prefix}-beadlock-bolt-${b}`, cx + 3.2 * Math.cos(ba), cy + ySign * 1.9, cz + 3.2 * Math.sin(ba), 0.08, 0.15, 'y', 6, 'supercharger');
    }

    // 5. Brass Schrader Air Valve Stem
    cylinder(`${prefix}-valve-stem`, cx + 2.4, cy + ySign * 1.88, cz + 0.5, 0.08, 0.35, 'y', 6, 'supercharger');

    // 6. 8 Heavy Lug Nuts & Center Locking Hub
    bevel(`${prefix}-center-hub`, cx, cy + ySign * 1.4, cz, 1.4, 0.6, 1.4, 'steelRim', 0.25);
    for (let l = 0; l < 8; l++) {
      const la = l * Math.PI / 4;
      cylinder(`${prefix}-lug-${l}`, cx + 0.9 * Math.cos(la), cy + ySign * 1.45, cz + 0.9 * Math.sin(la), 0.15, 0.25, 'y', 6, 'chrome');
    }

    // 7. Heavy Ventilated Brake Rotor & Caliper
    cylinder(`${prefix}-brake-rotor`, cx, cy, cz, 2.8, 0.4, 'y', 12, 'steelRim');
    bevel(`${prefix}-brake-caliper`, cx + 1.2, cy + ySign * 0.2, cz + 1.4, 1.8, 0.8, 1.4, 'paint', 0.25);
  });
};
