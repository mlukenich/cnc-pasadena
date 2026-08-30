'use strict';

// +X is forward; +Z is up; +Y is left, -Y is right.
// High-fidelity hard-surface model for the Columbia Prius Patrol EV.
// Proportions and styling match the high-definition C&C 3 unit portrait:
// - Sleek aerodynamic 4-door patrol hatchback with tucked performance wheels
// - Swept-back aerodynamic front fascia with integrated LED headlights
// - Realistic contoured fender arches with dark inner wheel-well liners
// - Panoramic solar glass roof and sloping fastback rear Kammback
// - Prominent roof emergency lightbar, dual PA speakers, articulating laser cannon turret, and EMP radar dish
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

  function curvedQuad(name, [p0, p1, p2, p3], mat) {
    triangle([p0, p1, p3], normal([p0, p1, p3]), mat, name);
    triangle([p1, p2, p3], normal([p1, p2, p3]), mat, name);
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
  // 1. CHASSIS UNDERBODY & EV BATTERY PACK
  // ==========================================
  // Full-length aerodynamic underbody belly pan
  bevel('underbody-battery-pack', 0, 0, 4.4, 46, 18.0, 1.2, 'carbon', 0.3);
  for (const y of [-6, -2, 2, 6]) {
    beam('underbody-rib', [-21, y, 3.9], [23, y, 3.9], 0.25, 'carbon', 6);
  }

  // Dual Electric Motor Subframes & Suspension Arms
  for (const x of [16.0, -16.0]) {
    cylinder('axle-subframe', x, 0, 5.2, 0.85, 18.4, 'y', 8, 'carbon');
    bevel('ev-inverter-casing', x, 0, 6.0, 3.8, 6.2, 2.2, 'gunmetal', 0.25);
    for (const side of [-1, 1]) {
      beam('suspension-control-arm', [x, side * 3.2, 4.8], [x, side * 8.6, 5.2], 0.38, 'gunmetal', 6);
      beam('suspension-coilover', [x, side * 8.4, 5.2], [x, side * 7.8, 9.4], 0.32, 'chrome', 6);
    }
  }

  // ==========================================
  // 2. SCULPTED AUTOMOTIVE FUSELAGE & DOORS
  // ==========================================
  // Tucked body dimensions:
  // Wheel centers at cy = +/-9.8 (wheels occupy Y from 8.6 to 11.0)
  // Doors at y = +/-10.2
  // Fender arches flare out to y = +/-11.4 directly over the wheels!
  for (const side of [-1, 1]) {
    const ySign = side;
    const yDoor = ySign * 10.2;
    const yFlare = ySign * 11.4;
    const yInner = ySign * 8.4;

    // Sculpted lower rocker skirt with aero ground-effect winglet
    bevel('rocker-panel', 0, yDoor, 5.2, 20, 1.2, 1.4, 'carbon', 0.2);
    curvedQuad('aero-side-winglet', [
      [-9.5, yDoor, 4.6], [-6.0, yDoor, 4.6],
      [-6.0, yDoor + ySign * 0.9, 6.4], [-9.5, yDoor + ySign * 0.5, 6.4]
    ], 'carbon');

    // Inner wheel arch liners (dark cavity behind the wheels)
    const archFrontPts = [
      [22.4, yInner, 5.0], [21.5, yInner, 9.6],
      [16.0, yInner, 11.2], [10.5, yInner, 9.6], [9.6, yInner, 5.0]
    ];
    for (let i = 0; i < archFrontPts.length - 1; i++) {
      curvedQuad('arch-liner-front', [
        archFrontPts[i], archFrontPts[i + 1],
        [archFrontPts[i + 1][0], archFrontPts[i + 1][1] + ySign * 2.0, archFrontPts[i + 1][2]],
        [archFrontPts[i][0], archFrontPts[i][1] + ySign * 2.0, archFrontPts[i][2]]
      ], 'carbon');
    }

    const archRearPts = [
      [-9.6, yInner, 5.0], [-10.5, yInner, 9.6],
      [-16.0, yInner, 11.2], [-21.5, yInner, 9.6], [-22.4, yInner, 5.0]
    ];
    for (let i = 0; i < archRearPts.length - 1; i++) {
      curvedQuad('arch-liner-rear', [
        archRearPts[i], archRearPts[i + 1],
        [archRearPts[i + 1][0], archRearPts[i + 1][1] + ySign * 2.0, archRearPts[i + 1][2]],
        [archRearPts[i][0], archRearPts[i][1] + ySign * 2.0, archRearPts[i][2]]
      ], 'carbon');
    }

    // Front Fender Flare (Pearl white outer aerodynamic fender curving over wheel)
    curvedQuad('fender-front-a', [
      [24.5, ySign * 9.2, 7.6], [21.8, yFlare, 9.8],
      [16.0, yFlare, 11.3], [16.0, ySign * 9.6, 11.4]
    ], 'pearl');
    curvedQuad('fender-front-b', [
      [16.0, ySign * 9.6, 11.4], [16.0, yFlare, 11.3],
      [10.2, yFlare, 9.8], [11.2, ySign * 9.6, 11.4]
    ], 'pearl');

    // Rear Fender Flare
    curvedQuad('fender-rear-a', [
      [-10.2, yFlare, 9.8], [-16.0, yFlare, 11.3],
      [-16.0, ySign * 9.6, 11.3], [-10.2, ySign * 9.6, 11.3]
    ], 'pearl');
    curvedQuad('fender-rear-b', [
      [-16.0, ySign * 9.6, 11.3], [-16.0, yFlare, 11.3],
      [-21.8, yFlare, 9.8], [-23.4, ySign * 9.2, 7.6]
    ], 'pearl');

    // Side Doors (Front & Rear Doors between fender arches)
    // Lower Door Cladding
    curvedQuad('door-lower', [
      [-9.6, yDoor, 5.8], [9.6, yDoor, 5.8],
      [9.6, yDoor * 0.98, 10.2], [-9.6, yDoor * 0.98, 10.2]
    ], 'pearl');

    // Upper Door Panel with Cyan Police Stripe & Official HOA Enforcement Crest
    curvedQuad('door-badge-panel', [
      [-9.6, yDoor * 0.98, 10.2], [9.6, yDoor * 0.98, 10.2],
      [9.6, yDoor * 0.92, 13.2], [-9.6, yDoor * 0.92, 13.2]
    ], 'doorPanel');

    // Recessed Door Handles (Front & Rear)
    for (const hx of [4.2, -4.2]) {
      bevel('door-handle-pocket', hx, yDoor * 0.93 + ySign * 0.05, 12.0, 2.2, 0.35, 0.8, 'carbon', 0.1);
      plate('door-handle', [
        [hx - 0.8, yDoor * 0.95 + ySign * 0.1, 11.85], [hx + 0.8, yDoor * 0.95 + ySign * 0.1, 11.85],
        [hx + 0.8, yDoor * 0.95 + ySign * 0.1, 12.2], [hx - 0.8, yDoor * 0.95 + ySign * 0.1, 12.2]
      ], 0.12, 'chrome');
    }

    // Aerodynamic Side View Mirror
    beam('mirror-stalk', [7.8, yDoor * 0.90, 13.0], [7.4, ySign * 11.2, 13.4], 0.22, 'carbon', 6);
    bevel('mirror-housing', 7.4, ySign * 11.6, 13.7, 2.0, 1.1, 1.3, 'cyan', 0.25);
    quad('mirror-glass', [
      [6.4, ySign * 11.1, 13.1], [6.4, ySign * 12.1, 13.1],
      [6.4, ySign * 12.1, 14.3], [6.4, ySign * 11.1, 14.3]
    ], 'chrome', [-1, 0, 0]);
  }

  // ==========================================
  // 3. FRONT SWEPT-BACK NOSE & HOOD
  // ==========================================
  // 3-section curved aerodynamic hood with center power bulge
  const hoodCowl = [
    [11.2, -9.0, 11.6], [11.2, -4.8, 12.2], [11.2, 0, 12.5],
    [11.2, 4.8, 12.2], [11.2, 9.0, 11.6]
  ];
  const hoodMid = [
    [18.5, -8.4, 9.6], [18.5, -4.4, 10.2], [18.5, 0, 10.6],
    [18.5, 4.4, 10.2], [18.5, 8.4, 9.6]
  ];
  const hoodNose = [
    [24.5, -7.5, 7.8], [25.0, -3.8, 8.2], [25.2, 0, 8.5],
    [25.0, 3.8, 8.2], [24.5, 7.5, 7.8]
  ];

  for (let i = 0; i < 4; i++) {
    curvedQuad('hood-top', [hoodCowl[i], hoodCowl[i + 1], hoodMid[i + 1], hoodMid[i]], 'hoodPanel');
    curvedQuad('hood-top', [hoodMid[i], hoodMid[i + 1], hoodNose[i + 1], hoodNose[i]], 'hoodPanel');
  }

  // Hood Cowl Air Intake Grille
  quad('hood-cowl-vent', [
    [11.4, -7.2, 11.8], [11.4, 7.2, 11.8],
    [12.4, 7.0, 12.0], [12.4, -7.2, 12.0]
  ], 'carbon');

  // Modern Integrated Front Fascia with LED Headlights
  curvedQuad('front-headlights', [
    [24.5, -8.2, 7.0], [24.5, 8.2, 7.0],
    [25.2, 7.8, 8.4], [25.2, -7.8, 8.4]
  ], 'frontFascia');

  // Swept-back Front Bumper & Lower Air Dam (Integrated into the nose)
  bevel('front-bumper', 25.0, 0, 5.8, 2.2, 16.8, 2.0, 'pearl', 0.35);
  bevel('front-lower-grille', 25.4, 0, 5.2, 1.6, 12.4, 1.1, 'carbon', 0.2);
  bevel('front-chin-splitter', 25.8, 0, 4.2, 1.8, 17.2, 0.35, 'carbon', 0.15);

  // Tactical Push Bumper Nudge Bar
  beam('bull-bar-l', [25.4, 4.2, 4.8], [26.4, 4.2, 7.6], 0.28, 'carbon', 6);
  beam('bull-bar-r', [25.4, -4.2, 4.8], [26.4, -4.2, 7.6], 0.28, 'carbon', 6);
  beam('bull-bar-cross', [26.4, -4.2, 7.4], [26.4, 4.2, 7.4], 0.25, 'carbon', 6);

  // ==========================================
  // 4. GREENHOUSE & PANORAMIC SOLAR ROOF
  // ==========================================
  // Raked Aerodynamic Windshield
  const windshieldBase = [[11.2, -8.8, 11.8], [11.2, 8.8, 11.8]];
  const windshieldTop = [[1.2, -7.2, 16.0], [1.2, 7.2, 16.0]];
  curvedQuad('windshield', [windshieldBase[0], windshieldBase[1], windshieldTop[1], windshieldTop[0]], 'solarGlass');

  // Panoramic Photovoltaic Solar Roof Matrix
  const roofTop = windshieldTop;
  const roofRear = [[-8.8, -7.0, 15.7], [-8.8, 7.0, 15.7]];
  curvedQuad('roof-surface', [roofTop[0], roofTop[1], roofRear[1], roofRear[0]], 'solarRoof');

  // Sloping Fastback Rear Window
  const hatchBase = [[-21.2, -7.6, 10.8], [-21.2, 7.6, 10.8]];
  curvedQuad('rear-glass', [roofRear[0], roofRear[1], hatchBase[1], hatchBase[0]], 'solarGlass');

  // Side Glass & Tapered Roof Pillars (A, B, C)
  for (const side of [-1, 1]) {
    const yG = side * 9.0;
    const yR = side * 7.1;
    curvedQuad('side-glass', [
      [10.2, yG, 12.0], [1.0, yR, 15.9],
      [-8.4, yR, 15.6], [-19.8, yG, 11.0]
    ], 'solarGlass');

    // Roof Pillars
    beam('pillar-a', [11.2, side * 8.8, 11.8], [1.2, side * 7.2, 16.0], 0.42, 'pearl', 6);
    beam('pillar-b', [0.8, side * 8.8, 12.4], [0.0, side * 7.1, 15.8], 0.32, 'carbon', 6);
    beam('pillar-c', [-8.8, side * 7.0, 15.7], [-21.2, side * 7.6, 10.8], 0.46, 'pearl', 6);
  }

  // ==========================================
  // 5. REAR KAMMBACK & DUCKTAIL SPOILER
  // ==========================================
  // Rear Hatch Panel with Horizontal LED Tail Light Bar
  curvedQuad('tailgate-panel', [
    [-21.2, -7.8, 10.8], [-21.2, 7.8, 10.8],
    [-23.8, 7.4, 7.8], [-23.8, -7.4, 7.8]
  ], 'tailPanel');

  // Rear Aerodynamic Bumper & Carbon Diffuser
  bevel('rear-bumper', -24.0, 0, 6.2, 2.4, 17.0, 2.4, 'pearl', 0.3);
  bevel('rear-diffuser', -24.6, 0, 4.6, 1.8, 13.6, 0.8, 'carbon', 0.2);
  for (const dy of [-4.2, -1.4, 1.4, 4.2]) {
    curvedQuad('diffuser-fin', [
      [-23.8, dy, 4.2], [-25.6, dy, 4.2],
      [-25.6, dy, 5.2], [-23.8, dy, 5.2]
    ], 'carbon');
  }

  // Interceptor Ducktail Spoiler
  curvedQuad('spoiler-wing', [
    [-24.0, -8.4, 12.2], [-24.0, 8.4, 12.2],
    [-21.4, 8.4, 12.6], [-21.4, -8.4, 12.6]
  ], 'cyan');
  for (const side of [-1, 1]) {
    curvedQuad('spoiler-endplate', [
      [-24.2, side * 8.4, 11.6], [-21.2, side * 8.4, 12.0],
      [-21.2, side * 8.4, 13.4], [-24.2, side * 8.4, 13.2]
    ], 'carbon');
  }

  // ==========================================
  // 6. HIGH-PERFORMANCE TUCKED WHEELS
  // ==========================================
  // Wheel centers at cy = +/-9.8 with width 2.4 (occupies Y from 8.6 to 11.0, under 11.4 fender flares)
  const wheelConfigs = [
    { prefix: 'wheel-front-left', cx: 16.0, cy: 9.8, cz: 5.2 },
    { prefix: 'wheel-front-right', cx: 16.0, cy: -9.8, cz: 5.2 },
    { prefix: 'wheel-rear-left', cx: -16.0, cy: 9.8, cz: 5.2 },
    { prefix: 'wheel-rear-right', cx: -16.0, cy: -9.8, cz: 5.2 },
  ];

  wheelConfigs.forEach(({ prefix, cx, cy, cz }) => {
    const isLeft = cy > 0;
    const ySign = isLeft ? 1 : -1;

    // 1. Tire Tread (5-step lathe cross section)
    lathe(`${prefix}-tire-outer`, cx, cy - ySign * 0.9, cz, [
      [0.0, 4.3],
      [ySign * 0.5, 4.8],
      [ySign * 1.2, 5.1],
      [ySign * 1.8, 4.9],
      [ySign * 2.2, 4.3]
    ], 'treadPanel', 'y', 20);

    // 2. Tire Sidewall Ring
    lathe(`${prefix}-tire-sidewall`, cx, cy + ySign * 1.3, cz, [
      [0.0, 4.3],
      [0.0, 3.1]
    ], 'rubber', 'y', 20);

    // 3. Directional Aero Turbine Alloy Rim Face
    lathe(`${prefix}-rim-outer`, cx, cy + ySign * 1.34, cz, [
      [0.0, 3.1],
      [ySign * 0.12, 2.4],
      [ySign * 0.22, 1.3],
      [ySign * 0.14, 0.4]
    ], 'chrome', 'y', 20);

    // 4. Center HOA Cyan Hub Emblem
    bevel(`${prefix}-hub-cap`, cx, cy + ySign * 1.5, cz, 1.0, 0.22, 1.0, 'cyan', 0.2);

    // 5. Ventilated Metallic Brake Rotor & Cyan Performance Caliper
    cylinder(`${prefix}-brake-rotor`, cx, cy, cz, 2.6, 0.35, 'y', 12, 'gunmetal');
    bevel(`${prefix}-brake-caliper`, cx + 1.1, cy + ySign * 0.15, cz + 1.3, 1.5, 0.65, 1.2, 'cyan', 0.2);
  });

  // ==========================================
  // 7. PROMINENT ROOF CITATION TURRET & WEAPONS
  // ==========================================
  // Prominent roof mounting rack (centered at X=1.0, Y=0.0, Z=16.2)
  bevel('turret-base', 1.0, 0, 16.5, 10.0, 9.0, 1.0, 'carbon', 0.35);

  // Wide Multi-tier Emergency Strobe Lightbar (Red Left, Blue Right, Amber Center)
  curvedQuad('turret-strobe-lens', [
    [-3.0, -4.5, 17.0], [4.5, -4.5, 17.0],
    [4.5, 4.5, 17.0], [-3.0, 4.5, 17.0]
  ], 'strobe');
  bevel('turret-strobe-housing', 0.8, 0, 16.8, 8.2, 9.4, 0.5, 'carbon', 0.2);

  // Dual PA Loudspeaker Horns (Left & Right of strobe bar, matching portrait!)
  cylinder('turret-pa-horn-l', 2.8, 2.5, 17.6, 0.75, 1.4, 'x', 10, 'carbon');
  cylinder('turret-pa-horn-r', 2.8, -2.5, 17.6, 0.75, 1.4, 'x', 10, 'carbon');

  // Central Rotating Optical Surveillance Turret Dome (Yaw)
  lathe('turret-dome', 1.0, 0, 17.3, [
    [0.0, 3.0], [0.4, 2.6], [0.8, 1.6], [1.1, 0.3]
  ], 'cyan', 'z', 16);
  cylinder('turret-camera-lens', 2.0, 0, 18.0, 0.55, 0.5, 'x', 10, 'solarGlass');

  // Articulated Heavy Laser Pitch Assembly (Centered at X=2.5, Y=0.0, Z=18.6)
  // Articulated gimbal arm
  beam('laser-gimbal-arm', [1.0, 0, 17.8], [2.5, 0, 18.6], 0.45, 'carbon', 8);

  // Dual Heavy Laser Diode Cannons
  for (const side of [-1, 1]) {
    const yL = side * 2.4;
    // Armored emitter receiver chassis
    bevel(`laser-chassis-${side > 0 ? 'l' : 'r'}`, 4.0, yL, 18.6, 7.2, 2.2, 2.0, 'pearl', 0.3);
    // Cyan top accent plate
    curvedQuad(`laser-top-plate-${side > 0 ? 'l' : 'r'}`, [
      [1.0, yL - 0.8, 19.65], [7.0, yL - 0.8, 19.65],
      [7.0, yL + 0.8, 19.65], [1.0, yL + 0.8, 19.65]
    ], 'cyan');

    // Ribbed Cooling Heat-Sink Fins on Emitter Barrel
    cylinder(`laser-barrel-${side > 0 ? 'l' : 'r'}`, 7.8, yL, 18.6, 0.8, 4.2, 'x', 14, 'gunmetal');
    for (const fx of [6.8, 7.4, 8.0, 8.6]) {
      cylinder(`laser-heatsink-${side > 0 ? 'l' : 'r'}`, fx, yL, 18.6, 0.98, 0.16, 'x', 14, 'carbon');
    }

    // High-Energy Diode Focusing Crystal Lens Faceplate
    lathe(`laser-focus-${side > 0 ? 'l' : 'r'}`, 9.9, yL, 18.6, [
      [0.0, 0.8], [0.22, 0.95], [0.5, 0.95], [0.6, 0.55]
    ], 'laserFace', 'x', 14);

    // High-Voltage Power Conduit Cable
    beam(`laser-conduit-${side > 0 ? 'l' : 'r'}`, [0.2, side * 1.8, 17.2], [1.2, yL, 18.4], 0.22, 'cyan', 6);
  }

  // Central Targeting Optical Sensor Pod
  bevel('laser-sensor-pod', 4.4, 0, 19.4, 3.8, 2.2, 1.4, 'cyan', 0.2);
  cylinder('laser-sensor-lens', 6.2, 0, 19.4, 0.6, 0.5, 'x', 10, 'strobe');

  // ==========================================
  // 8. ROOF EMP RADAR DISH & DISCHARGE ANTENNA
  // ==========================================
  // Rear Roof EMP Hardpoint (Centered at X=-5.5, Y=0.0, Z=16.2)
  lathe('emp-dish-base', -5.5, 0, 16.2, [
    [0.0, 2.4], [0.45, 2.0], [0.85, 1.1], [1.1, 0.4]
  ], 'carbon', 'z', 14);
  // Multi-ring parabolic capacitor dish
  lathe('emp-dish-parabolic', -5.5, 0, 17.6, [
    [0.0, 0.5], [0.3, 1.5], [0.6, 2.4], [0.8, 2.6]
  ], 'chrome', 'z', 16);
  // Central chrome lightning discharge antenna rod
  cylinder('emp-antenna-rod', -5.5, 0, 19.0, 0.18, 2.8, 'z', 8, 'chrome');
};
