'use strict';

// +X is forward; +Z is up; +Y is left, -Y is right.
// Dimensions and wheel centers fit the agile Nod Raider Buggy / Prius Patrol EV.
module.exports = function buildPrius({ addBox: box, addCylinder: cylinder, addFace: face, addTriangle: triangle }) {
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

  function quad(name, p, mat, n = normal(p)) {
    face(p, n, mat, name);
  }

  function cap(name, ring, mat, n) {
    for (let i = 1; i < ring.length - 1; i++) {
      triangle([ring[0], ring[i], ring[i + 1]], n, mat, name);
    }
  }

  function plate(name, ring, thickness, mat) {
    const n = normal(ring);
    const a = ring.map(p => p.map((v, k) => v - n[k] * thickness / 2));
    const b = ring.map(p => p.map((v, k) => v + n[k] * thickness / 2));
    cap(name, a, mat, n.map(v => -v));
    cap(name, b, mat, n);
    for (let i = 0; i < ring.length; i++) {
      quad(name, [a[i], a[(i + 1) % ring.length], b[(i + 1) % ring.length], b[i]], mat);
    }
  }

  function bevel(name, x, y, z, sx, sy, sz, mat, c = 0.5) {
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

  function beam(name, a, b, r, mat, segments = 6) {
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

  function lathe(name, cx, cy, cz, profile, mat, axis = 'y', segments = 16) {
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
        const mid = (t + u) / 2, da = b - a, dr = s - r;
        const n = unit(axis === 'y'
          ? [da * Math.cos(mid), -dr, da * Math.sin(mid)]
          : axis === 'z'
          ? [da * Math.cos(mid), da * Math.sin(mid), -dr]
          : [-dr, da * Math.cos(mid), da * Math.sin(mid)]);
        if (s <= 1e-5) {
          triangle([p0, p1, p3], n, mat, name);
        } else if (r <= 1e-5) {
          triangle([p0, p2, p3], n, mat, name);
        } else {
          quad(name, [p0, p1, p2, p3], mat, n);
        }
      }
    }
  }

  // ==========================================
  // 1. CHASSIS & UNDERBODY
  // ==========================================
  // Aerodynamic underbody flat floor pan
  bevel('underbody-tray', 0, 0, 5.0, 50, 19, 1.2, 'carbon', 0.4);
  // Front and rear suspension subframes & drive motors
  for (const x of [16.0, -16.0]) {
    cylinder('axle-housing', x, 0, 5.2, 0.8, 19.5, 'y', 8, 'carbon');
    bevel('ev-inverter', x, 0, 6.2, 3.8, 6.0, 2.2, 'gunmetal');
  }

  // ==========================================
  // 2. MAIN BODY SHELL (AERODYNAMIC HATCHBACK)
  // ==========================================
  // Lower body rockers and side panels
  for (const side of [-1, 1]) {
    const yVal = side * 9.5;
    // Lower rocker skirt
    bevel('rocker-skirt', 0, yVal, 5.8, 48, 1.2, 1.8, 'cyan', 0.2);
    // Door lower panels
    plate('door-lower', [
      [-14, yVal, 6.5], [14, yVal, 6.5],
      [14, yVal * 0.98, 10.5], [-14, yVal * 0.98, 10.5]
    ], 0.3, 'pearl');
    // Door upper enforcement panel with badge
    plate('door-badge-panel', [
      [-13, yVal * 0.98, 10.5], [13, yVal * 0.98, 10.5],
      [11, yVal * 0.92, 13.2], [-11, yVal * 0.92, 13.2]
    ], 0.25, 'doorPanel');
  }

  // Sloped Aerodynamic Hood (Teardrop Nose)
  const hoodRear = [
    [13.0, -9.0, 10.8], [13.0, 9.0, 10.8],
    [13.0, 7.5, 11.8], [13.0, -7.5, 11.8]
  ];
  const hoodNose = [
    [26.5, -7.8, 8.0], [26.5, 7.8, 8.0],
    [26.5, 6.5, 8.8], [26.5, -6.5, 8.8]
  ];
  // Hood top surface
  quad('hood-top', [hoodRear[3], hoodRear[2], hoodNose[2], hoodNose[3]], 'hoodPanel');
  // Hood side chamfers
  quad('hood-chamfer-left', [hoodRear[2], hoodRear[1], hoodNose[1], hoodNose[2]], 'pearl');
  quad('hood-chamfer-right', [hoodRear[0], hoodRear[3], hoodNose[3], hoodNose[0]], 'pearl');

  // Aggressive Front Fascia / Chin Splitter / Scanner Grille
  plate('front-bumper', [
    [26.5, -8.2, 5.2], [26.5, 8.2, 5.2],
    [27.8, 7.5, 7.2], [27.8, -7.5, 7.2]
  ], 0.4, 'cyan');
  // LED Headlight & Scanner Strip
  plate('front-headlights', [
    [27.6, -7.4, 7.2], [27.6, 7.4, 7.2],
    [26.8, 6.8, 8.4], [26.8, -6.8, 8.4]
  ], 0.2, 'frontFascia');
  // Lower carbon front air dam
  bevel('front-splitter', 27.2, 0, 4.6, 2.5, 17.5, 0.4, 'carbon', 0.2);

  // Greenhouse / Cabin / Raked Windshield & Solar Roof
  // Raked Windshield
  const windshieldLower = [[13.0, -7.6, 11.9], [13.0, 7.6, 11.9]];
  const windshieldUpper = [[2.5, -6.8, 16.4], [2.5, 6.8, 16.4]];
  quad('windshield', [windshieldLower[0], windshieldLower[1], windshieldUpper[1], windshieldUpper[0]], 'solarGlass');

  // Panoramic Solar Roof Matrix
  const roofFront = windshieldUpper;
  const roofRear = [[-8.0, -6.6, 16.1], [-8.0, 6.6, 16.1]];
  quad('roof-surface', [roofFront[0], roofFront[1], roofRear[1], roofRear[0]], 'solarRoof');

  // Sloping Rear Hatch Window
  const hatchLower = [[-21.5, -7.2, 11.2], [-21.5, 7.2, 11.2]];
  quad('rear-glass', [roofRear[0], roofRear[1], hatchLower[1], hatchLower[0]], 'solarGlass');

  // Side Windows (Left & Right)
  for (const side of [-1, 1]) {
    const yW = side * 8.6;
    const yR = side * 6.7;
    plate('side-glass', [
      [12.0, yW, 11.8], [2.0, yR, 16.3],
      [-7.5, yR, 16.0], [-19.5, yW, 11.4]
    ], 0.15, 'solarGlass');
    // A/B/C Pillars
    beam('pillar-a', [13.0, side * 7.6, 11.9], [2.5, side * 6.8, 16.4], 0.4, 'pearl');
    beam('pillar-b', [2.0, side * 7.4, 11.5], [0.0, side * 6.7, 16.2], 0.35, 'carbon');
    beam('pillar-c', [-8.0, side * 6.6, 16.1], [-21.5, side * 7.2, 11.2], 0.45, 'pearl');
  }

  // Kammback Rear Tailgate / Hatch Panel & Tail Light Bar
  plate('tailgate-panel', [
    [-21.5, -7.5, 11.2], [-21.5, 7.5, 11.2],
    [-24.0, 7.0, 8.2], [-24.0, -7.0, 8.2]
  ], 0.3, 'tailPanel');
  // Rear Bumper / Diffuser
  bevel('rear-bumper', -24.2, 0, 6.4, 3.2, 17.8, 2.6, 'cyan', 0.3);
  bevel('rear-diffuser', -24.8, 0, 4.8, 2.2, 14.5, 0.6, 'carbon', 0.2);

  // Interceptor Rear Spoiler Wing
  const spoilerLeft = [-22.5, 8.2, 12.8];
  const spoilerRight = [-22.5, -8.2, 12.8];
  // Spoiler struts
  beam('spoiler-strut-left', [-21.0, 6.0, 11.2], spoilerLeft, 0.28, 'carbon');
  beam('spoiler-strut-right', [-21.0, -6.0, 11.2], spoilerRight, 0.28, 'carbon');
  // Spoiler airfoil plate
  plate('spoiler-wing', [
    [-24.0, -8.8, 12.9], [-24.0, 8.8, 12.9],
    [-21.5, 8.8, 13.3], [-21.5, -8.8, 13.3]
  ], 0.22, 'pearl');

  // ==========================================
  // 3. WHEELS & TIRES (4 RIGID CORNERS)
  // ==========================================
  const wheelConfigs = [
    { prefix: 'wheel-front-left', cx: 16.0, cy: 9.8, cz: 5.2 },
    { prefix: 'wheel-front-right', cx: 16.0, cy: -9.8, cz: 5.2 },
    { prefix: 'wheel-rear-left', cx: -16.0, cy: 9.8, cz: 5.2 },
    { prefix: 'wheel-rear-right', cx: -16.0, cy: -9.8, cz: 5.2 },
  ];

  wheelConfigs.forEach(({ prefix, cx, cy, cz }) => {
    const isLeft = cy > 0;
    const ySign = isLeft ? 1 : -1;

    // Low-profile performance tire torus
    lathe(`${prefix}-tire-outer`, cx, cy, cz, [
      [0.0, 4.4], [ySign * 0.8, 4.9], [ySign * 1.6, 5.2], [ySign * 2.2, 5.0], [ySign * 2.4, 4.4]
    ], 'treadPanel', 'y', 16);

    // Tire sidewall disc
    lathe(`${prefix}-tire-sidewall`, cx, cy + ySign * 2.3, cz, [
      [0.0, 4.4], [0.0, 3.2]
    ], 'rubber', 'y', 16);

    // Aerodynamic Eco-Rim Cover (Chrome / Cyan Accent Disc)
    lathe(`${prefix}-rim-outer`, cx, cy + ySign * 2.35, cz, [
      [0.0, 3.2], [ySign * 0.15, 2.4], [ySign * 0.25, 1.2], [ySign * 0.15, 0.4]
    ], 'chrome', 'y', 16);

    // Center HOA compliance cyan hub emblem
    bevel(`${prefix}-hub-cap`, cx, cy + ySign * 2.5, cz, 1.2, 0.3, 1.2, 'cyan', 0.2);

    // Brake rotor & caliper inside rim
    cylinder(`${prefix}-brake-rotor`, cx, cy + ySign * 0.8, cz, 2.6, 0.4, 'y', 10, 'gunmetal');
    box(`${prefix}-brake-caliper`, cx + 1.2, cy + ySign * 0.9, cz + 1.5, 1.4, 0.8, 1.2, 'cyan');
  });

  // ==========================================
  // 4. ROOF CITATION LIGHTBAR & LASER TURRET
  // ==========================================
  // Turret Base (Yaw on Z-axis, centered at X=1.0, Y=0.0, Z=16.6)
  // Sleek aerodynamic compliance lightbar housing
  bevel('turret-base', 1.0, 0, 16.9, 8.5, 7.8, 1.2, 'carbon', 0.4);
  // Strobe LED lightbar array (Red / Blue / Amber)
  plate('turret-strobe-lens', [
    [-2.2, -3.6, 17.3], [3.8, -3.6, 17.3],
    [3.8, 3.6, 17.3], [-2.2, 3.6, 17.3]
  ], 0.5, 'strobe');
  // Upper turret pedestal dome
  lathe('turret-dome', 1.0, 0, 17.6, [
    [0.0, 2.6], [0.4, 2.2], [0.8, 1.4], [1.0, 0.3]
  ], 'cyan', 'z', 14);

  // Laser Pitch Assembly (Pitch on Y-axis, centered at X=2.5, Y=0.0, Z=18.6)
  // Dual Laser Emitter Housings (Left & Right)
  for (const side of [-1, 1]) {
    const yL = side * 2.0;
    // Emitter shroud / body
    bevel(`laser-housing-${side > 0 ? 'left' : 'right'}`, 4.0, yL, 18.6, 6.5, 1.8, 1.6, 'pearl', 0.25);
    // Dark alloy emitter barrel
    cylinder(`laser-barrel-${side > 0 ? 'left' : 'right'}`, 7.5, yL, 18.6, 0.65, 3.5, 'x', 10, 'gunmetal');
    // Diode focusing ring
    lathe(`laser-focus-${side > 0 ? 'left' : 'right'}`, 9.2, yL, 18.6, [
      [0.0, 0.65], [0.2, 0.8], [0.4, 0.8], [0.5, 0.5]
    ], 'laserFace', 'x', 12);
  }
  // Central citation optical scanner / targeting sensor dome
  bevel('laser-sensor-pod', 3.5, 0, 19.2, 3.2, 2.2, 1.2, 'cyan', 0.2);
  cylinder('laser-sensor-lens', 5.0, 0, 19.2, 0.5, 0.4, 'x', 8, 'strobe');

  // EMP Capacitor Node / Dish (Roof Hardpoint at X=-5.5, Y=0.0, Z=16.6)
  lathe('emp-dish-base', -5.5, 0, 16.5, [
    [0.0, 1.8], [0.5, 1.6], [0.8, 0.8], [1.0, 0.3]
  ], 'carbon', 'z', 12);
  cylinder('emp-antenna-rod', -5.5, 0, 18.0, 0.15, 2.2, 'z', 6, 'chrome');
  lathe('emp-emitter-ring', -5.5, 0, 19.0, [
    [0.0, 0.8], [0.2, 1.1], [0.4, 1.1], [0.5, 0.8]
  ], 'cyan', 'z', 10);
};
