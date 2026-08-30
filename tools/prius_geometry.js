'use strict';

// +X is forward; +Z is up; +Y is left, -Y is right.
// High-detail hard-surface model for the Columbia Prius Patrol EV.
// Target polygon count: ~6,000 - 10,000 triangles.
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
  // 1. CHASSIS & AERODYNAMIC UNDERBODY
  // ==========================================
  // Smooth aerodynamic flat floor pan with air channels
  bevel('underbody-tray', 0, 0, 4.8, 48, 17.5, 1.0, 'carbon', 0.3);
  for (const y of [-5, 0, 5]) {
    beam('underbody-stiffener', [-22, y, 4.4], [24, y, 4.4], 0.3, 'carbon', 6);
  }

  // Front & rear electric drive units & suspension subframes
  for (const x of [16.0, -16.0]) {
    cylinder('axle-subframe', x, 0, 5.2, 0.9, 18.0, 'y', 8, 'carbon');
    bevel('ev-motor-inverter', x, 0, 6.2, 4.2, 6.5, 2.4, 'gunmetal', 0.3);
    for (const side of [-1, 1]) {
      beam('suspension-a-arm', [x, side * 3.5, 5.0], [x, side * 8.5, 5.2], 0.4, 'gunmetal', 6);
      beam('suspension-strut', [x, side * 8.2, 5.2], [x, side * 7.5, 9.8], 0.35, 'chrome', 6);
    }
  }

  // ==========================================
  // 2. SCULPTED BODY SHELL & WHEEL ARCHES
  // ==========================================
  // Lower center cabin floor between wheel arches (X: -10 to 10)
  for (const side of [-1, 1]) {
    const ySign = side;
    const yRocker = ySign * 9.2;
    const yOuter = ySign * 9.8;

    // Sculpted carbon side skirt with ground-effect winglet
    bevel('rocker-skirt', 0, yRocker, 5.4, 20, 1.4, 1.2, 'carbon', 0.2);
    plate('aero-winglet', [
      [-10, yOuter, 4.8], [-6, yOuter, 4.8],
      [-6, yOuter + ySign * 0.8, 6.5], [-10, yOuter + ySign * 0.4, 6.5]
    ], 0.15, 'carbon');

    // Wheel Arch Liners (Dark inner fender wells)
    // Front wheel arch (centered at X=16.0, Z=5.2)
    const archFront = [
      [22.5, yRocker * 0.95, 5.0], [21.5, yRocker * 0.95, 9.5],
      [16.0, yRocker * 0.95, 11.2], [10.5, yRocker * 0.95, 9.5], [9.5, yRocker * 0.95, 5.0]
    ];
    for (let i = 0; i < archFront.length - 1; i++) {
      curvedQuad('arch-liner-front', [
        archFront[i], archFront[i + 1],
        [archFront[i + 1][0], archFront[i + 1][1] - ySign * 1.8, archFront[i + 1][2]],
        [archFront[i][0], archFront[i][1] - ySign * 1.8, archFront[i][2]]
      ], 'carbon');
    }

    // Rear wheel arch (centered at X=-16.0, Z=5.2)
    const archRear = [
      [-9.5, yRocker * 0.95, 5.0], [-10.5, yRocker * 0.95, 9.5],
      [-16.0, yRocker * 0.95, 11.2], [-21.5, yRocker * 0.95, 9.5], [-22.5, yRocker * 0.95, 5.0]
    ];
    for (let i = 0; i < archRear.length - 1; i++) {
      curvedQuad('arch-liner-rear', [
        archRear[i], archRear[i + 1],
        [archRear[i + 1][0], archRear[i + 1][1] - ySign * 1.8, archRear[i + 1][2]],
        [archRear[i][0], archRear[i][1] - ySign * 1.8, archRear[i][2]]
      ], 'carbon');
    }

    // Front Fender Flare (Pearl white outer fender)
    curvedQuad('fender-front-flare-a', [
      [25.0, ySign * 8.6, 7.5], [22.0, yOuter, 9.8],
      [16.0, yOuter, 11.4], [16.0, ySign * 8.8, 11.5]
    ], 'pearl');
    curvedQuad('fender-front-flare-b', [
      [16.0, ySign * 8.8, 11.5], [16.0, yOuter, 11.4],
      [10.0, yOuter, 9.8], [12.0, ySign * 8.8, 11.5]
    ], 'pearl');

    // Rear Fender Flare
    curvedQuad('fender-rear-flare-a', [
      [-10.0, yOuter, 9.8], [-16.0, yOuter, 11.4],
      [-16.0, ySign * 8.8, 11.4], [-10.0, ySign * 8.8, 11.4]
    ], 'pearl');
    curvedQuad('fender-rear-flare-b', [
      [-16.0, ySign * 8.8, 11.4], [-16.0, yOuter, 11.4],
      [-22.0, yOuter, 9.8], [-23.5, ySign * 8.6, 7.5]
    ], 'pearl');

    // Side Doors (Front & Rear Doors between arches)
    // Lower Door Skirt / Cladding
    plate('door-lower', [
      [-9.5, yOuter, 6.0], [9.5, yOuter, 6.0],
      [9.5, yOuter * 0.98, 10.5], [-9.5, yOuter * 0.98, 10.5]
    ], 0.25, 'pearl');

    // Upper Door Panel with Cyan Police Stripe & Official HOA Crest
    plate('door-badge-panel', [
      [-9.5, yOuter * 0.98, 10.5], [9.5, yOuter * 0.98, 10.5],
      [9.5, yOuter * 0.92, 13.4], [-9.5, yOuter * 0.92, 13.4]
    ], 0.25, 'doorPanel');

    // Recessed Door Handles (Front & Rear)
    for (const hx of [4.5, -4.5]) {
      bevel('door-handle-pocket', hx, yOuter * 0.93 + ySign * 0.05, 12.2, 2.4, 0.4, 0.9, 'carbon', 0.1);
      plate('door-handle', [
        [hx - 0.9, yOuter * 0.95 + ySign * 0.12, 12.0], [hx + 0.9, yOuter * 0.95 + ySign * 0.12, 12.0],
        [hx + 0.9, yOuter * 0.95 + ySign * 0.12, 12.4], [hx - 0.9, yOuter * 0.95 + ySign * 0.12, 12.4]
      ], 0.15, 'chrome');
    }

    // Aerodynamic Side View Mirror
    beam('mirror-stalk', [8.0, yOuter * 0.90, 13.2], [7.5, ySign * 11.0, 13.5], 0.22, 'carbon', 6);
    bevel('mirror-housing', 7.5, ySign * 11.5, 13.8, 2.2, 1.2, 1.4, 'cyan', 0.25);
    quad('mirror-glass', [
      [6.4, ySign * 11.0, 13.2], [6.4, ySign * 12.0, 13.2],
      [6.4, ySign * 12.0, 14.4], [6.4, ySign * 11.0, 14.4]
    ], 'chrome', [-1, 0, 0]);
  }

  // ==========================================
  // 3. FRONT HOOD & FASCIA
  // ==========================================
  // Sloped aerodynamic hood with central power crease
  const hoodCowl = [
    [11.5, -8.6, 11.8], [11.5, -5.0, 12.4], [11.5, 0, 12.7],
    [11.5, 5.0, 12.4], [11.5, 8.6, 11.8]
  ];
  const hoodMid = [
    [19.0, -8.0, 9.8], [19.0, -4.5, 10.4], [19.0, 0, 10.8],
    [19.0, 4.5, 10.4], [19.0, 8.0, 9.8]
  ];
  const hoodNose = [
    [26.5, -7.2, 8.0], [26.5, -3.8, 8.4], [26.8, 0, 8.7],
    [26.5, 3.8, 8.4], [26.5, 7.2, 8.0]
  ];

  for (let i = 0; i < 4; i++) {
    quad('hood-top', [hoodCowl[i], hoodCowl[i + 1], hoodMid[i + 1], hoodMid[i]], 'hoodPanel');
    quad('hood-top', [hoodMid[i], hoodMid[i + 1], hoodNose[i + 1], hoodNose[i]], 'hoodPanel');
  }

  // Hood Cowl Air Intake Grille
  quad('hood-cowl-vent', [
    [11.7, -7.5, 12.0], [11.7, 7.5, 12.0],
    [12.8, 7.2, 12.2], [12.8, -7.5, 12.2]
  ], 'carbon');

  // Modern Front Fascia: Slim LED Daytime Running Lights & Radar Scanner
  plate('front-headlights', [
    [26.5, -7.4, 7.2], [26.5, 7.4, 7.2],
    [26.8, 7.0, 8.6], [26.8, -7.0, 8.6]
  ], 0.35, 'frontFascia');

  // Front Aerodynamic Bumper & Lower Air Dam
  bevel('front-bumper', 26.8, 0, 6.2, 2.4, 16.5, 2.2, 'pearl', 0.3);
  bevel('front-lower-grille', 27.2, 0, 5.6, 1.8, 12.0, 1.2, 'carbon', 0.2);
  bevel('front-chin-splitter', 27.6, 0, 4.6, 2.2, 17.0, 0.4, 'carbon', 0.15);

  // Front Push Bumper / Interceptor Bull Bar (Small Tactical Nudge Bar)
  beam('bull-bar-left', [27.0, 4.5, 5.0], [28.2, 4.5, 8.0], 0.3, 'carbon', 6);
  beam('bull-bar-right', [27.0, -4.5, 5.0], [28.2, -4.5, 8.0], 0.3, 'carbon', 6);
  beam('bull-bar-cross', [28.2, -4.5, 7.8], [28.2, 4.5, 7.8], 0.28, 'carbon', 6);

  // ==========================================
  // 4. GREENHOUSE & PANORAMIC SOLAR ROOF
  // ==========================================
  // Raked Aerodynamic Windshield
  const windshieldBase = [[11.5, -8.2, 12.0], [11.5, 8.2, 12.0]];
  const windshieldTop = [[1.5, -6.8, 16.5], [1.5, 6.8, 16.5]];
  quad('windshield', [windshieldBase[0], windshieldBase[1], windshieldTop[1], windshieldTop[0]], 'solarGlass');

  // Panoramic Photovoltaic Solar Roof Matrix
  const roofTop = windshieldTop;
  const roofRear = [[-9.0, -6.6, 16.2], [-9.0, 6.6, 16.2]];
  quad('roof-surface', [roofTop[0], roofTop[1], roofRear[1], roofRear[0]], 'solarRoof');

  // Sloping Fastback Rear Window
  const hatchBase = [[-22.0, -7.2, 11.2], [-22.0, 7.2, 11.2]];
  quad('rear-glass', [roofRear[0], roofRear[1], hatchBase[1], hatchBase[0]], 'solarGlass');

  // Side Glass & Tapered Roof Pillars (A, B, C)
  for (const side of [-1, 1]) {
    const yG = side * 8.6;
    const yR = side * 6.7;
    plate('side-glass', [
      [10.5, yG, 12.2], [1.0, yR, 16.4],
      [-8.5, yR, 16.1], [-20.5, yG, 11.4]
    ], 0.15, 'solarGlass');

    // Roof Pillars with clean gloss black/pearl finish
    beam('pillar-a', [11.5, side * 8.2, 12.0], [1.5, side * 6.8, 16.5], 0.45, 'pearl', 6);
    beam('pillar-b', [1.0, side * 8.4, 12.8], [0.0, side * 6.7, 16.3], 0.35, 'carbon', 6);
    beam('pillar-c', [-9.0, side * 6.6, 16.2], [-22.0, side * 7.2, 11.2], 0.5, 'pearl', 6);
  }

  // ==========================================
  // 5. REAR KAMMBACK HATCH & INTERCEPTOR SPOILER
  // ==========================================
  // Rear Tailgate / Hatch Panel with LED Tail Light Bar
  plate('tailgate-panel', [
    [-22.0, -7.5, 11.2], [-22.0, 7.5, 11.2],
    [-24.5, 7.0, 8.0], [-24.5, -7.0, 8.0]
  ], 0.35, 'tailPanel');

  // Rear Aerodynamic Bumper & Carbon Diffuser
  bevel('rear-bumper', -24.6, 0, 6.4, 2.8, 17.2, 2.6, 'pearl', 0.3);
  bevel('rear-diffuser', -25.2, 0, 4.8, 2.0, 14.0, 0.8, 'carbon', 0.2);
  for (const dy of [-4.5, -1.5, 1.5, 4.5]) {
    plate('diffuser-fin', [
      [-24.2, dy, 4.4], [-26.2, dy, 4.4],
      [-26.2, dy, 5.4], [-24.2, dy, 5.4]
    ], 0.12, 'carbon');
  }

  // Interceptor Aerodynamic Rear Spoiler Wing
  const spoilerL = [-23.0, 7.8, 13.0];
  const spoilerR = [-23.0, -7.8, 13.0];
  beam('spoiler-mount-left', [-21.5, 5.5, 11.2], spoilerL, 0.28, 'carbon', 6);
  beam('spoiler-mount-right', [-21.5, -5.5, 11.2], spoilerR, 0.28, 'carbon', 6);
  plate('spoiler-wing', [
    [-24.5, -8.6, 13.0], [-24.5, 8.6, 13.0],
    [-22.0, 8.6, 13.4], [-22.0, -8.6, 13.4]
  ], 0.24, 'cyan');
  // Endplate winglets
  for (const side of [-1, 1]) {
    plate('spoiler-endplate', [
      [-24.8, side * 8.6, 12.4], [-21.6, side * 8.6, 12.8],
      [-21.6, side * 8.6, 14.2], [-24.8, side * 8.6, 14.0]
    ], 0.12, 'carbon');
  }

  // ==========================================
  // 6. HIGH-DETAIL AERO PERFORMANCE WHEELS
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

    // 1. Tire Tread (Detailed 5-step lathe cross section)
    lathe(`${prefix}-tire-outer`, cx, cy, cz, [
      [0.0, 4.3],
      [ySign * 0.6, 4.85],
      [ySign * 1.4, 5.15],
      [ySign * 2.0, 4.95],
      [ySign * 2.4, 4.3]
    ], 'treadPanel', 'y', 20);

    // 2. Tire Sidewall Ring
    lathe(`${prefix}-tire-sidewall`, cx, cy + ySign * 2.32, cz, [
      [0.0, 4.3],
      [0.0, 3.2]
    ], 'rubber', 'y', 20);

    // 3. Directional Aero Turbine Alloy Rim Face
    lathe(`${prefix}-rim-outer`, cx, cy + ySign * 2.36, cz, [
      [0.0, 3.2],
      [ySign * 0.12, 2.5],
      [ySign * 0.22, 1.4],
      [ySign * 0.14, 0.4]
    ], 'chrome', 'y', 20);

    // 4. Center HOA Cyan Hub Emblem
    bevel(`${prefix}-hub-cap`, cx, cy + ySign * 2.52, cz, 1.1, 0.25, 1.1, 'cyan', 0.2);

    // 5. Ventilated Metallic Brake Rotor & Cyan Performance Caliper
    cylinder(`${prefix}-brake-rotor`, cx, cy + ySign * 1.0, cz, 2.6, 0.35, 'y', 12, 'gunmetal');
    bevel(`${prefix}-brake-caliper`, cx + 1.2, cy + ySign * 1.1, cz + 1.4, 1.6, 0.7, 1.3, 'cyan', 0.2);
  });

  // ==========================================
  // 7. ROOF CITATION LIGHTBAR & LASER TURRET
  // ==========================================
  // Turret Base (Yaw on Z-axis, centered at X=1.0, Y=0.0, Z=16.6)
  // Aerodynamic roof mounting rack / fairing
  bevel('turret-base', 1.0, 0, 16.85, 9.0, 8.2, 0.9, 'carbon', 0.35);

  // Multi-tier Emergency Strobe Lightbar (Red Left, Blue Right, Amber Center)
  plate('turret-strobe-lens', [
    [-2.4, -3.8, 17.3], [4.2, -3.8, 17.3],
    [4.2, 3.8, 17.3], [-2.4, 3.8, 17.3]
  ], 0.55, 'strobe');
  // Strobe housing bezel
  plate('turret-strobe-housing', [
    [-2.6, -4.0, 17.0], [4.4, -4.0, 17.0],
    [4.4, 4.0, 17.0], [-2.6, 4.0, 17.0]
  ], 0.25, 'carbon');

  // Central Rotating Citation Optical Tracking Camera Dome
  lathe('turret-dome', 1.0, 0, 17.55, [
    [0.0, 2.8], [0.35, 2.4], [0.7, 1.5], [0.95, 0.3]
  ], 'cyan', 'z', 16);
  cylinder('turret-camera-lens', 1.8, 0, 18.1, 0.45, 0.4, 'x', 10, 'solarGlass');

  // Laser Pitch Assembly (Pitch on Y-axis, centered at X=2.5, Y=0.0, Z=18.6)
  // Dual Heavy Laser Diode Cannons (Left & Right)
  for (const side of [-1, 1]) {
    const yL = side * 2.2;
    // Armored emitter receiver chassis
    bevel(`laser-chassis-${side > 0 ? 'left' : 'right'}`, 3.8, yL, 18.6, 6.8, 1.9, 1.8, 'pearl', 0.25);
    // Cyan top accent plate
    plate(`laser-top-plate-${side > 0 ? 'left' : 'right'}`, [
      [1.0, yL - 0.7, 19.55], [6.5, yL - 0.7, 19.55],
      [6.5, yL + 0.7, 19.55], [1.0, yL + 0.7, 19.55]
    ], 0.15, 'cyan');

    // Ribbed Cooling Heat-Sink Fins on Emitter Barrel
    cylinder(`laser-barrel-${side > 0 ? 'left' : 'right'}`, 7.2, yL, 18.6, 0.7, 3.8, 'x', 12, 'gunmetal');
    for (const fx of [6.2, 6.8, 7.4, 8.0]) {
      cylinder(`laser-heatsink-${side > 0 ? 'left' : 'right'}`, fx, yL, 18.6, 0.88, 0.15, 'x', 12, 'carbon');
    }

    // High-Energy Diode Focusing Crystal Lens Faceplate
    lathe(`laser-focus-${side > 0 ? 'left' : 'right'}`, 9.1, yL, 18.6, [
      [0.0, 0.7], [0.2, 0.85], [0.45, 0.85], [0.55, 0.5]
    ], 'laserFace', 'x', 14);

    // High-Voltage Power Conduit from Roof Rack to Emitter Rear
    beam(`laser-conduit-${side > 0 ? 'left' : 'right'}`, [0.5, side * 1.5, 17.5], [1.5, yL, 18.4], 0.2, 'cyan', 6);
  }

  // Center targeting optical sensor pod
  bevel('laser-sensor-pod', 4.2, 0, 19.3, 3.5, 2.0, 1.3, 'cyan', 0.2);
  cylinder('laser-sensor-lens', 5.8, 0, 19.3, 0.55, 0.45, 'x', 10, 'strobe');

  // ==========================================
  // 8. ROOF EMP CAPACITOR DISH (UPGRADE NODE)
  // ==========================================
  // Rear Roof EMP Hardpoint (centered at X=-5.5, Y=0.0, Z=16.5)
  lathe('emp-dish-base', -5.5, 0, 16.4, [
    [0.0, 2.2], [0.4, 1.9], [0.75, 1.0], [1.0, 0.4]
  ], 'carbon', 'z', 14);
  // Segmented multi-stage capacitor rings
  lathe('emp-emitter-ring', -5.5, 0, 18.2, [
    [0.0, 0.9], [0.25, 1.3], [0.45, 1.3], [0.6, 0.9]
  ], 'cyan', 'z', 14);
  // Chrome lightning discharge rod
  cylinder('emp-antenna-rod', -5.5, 0, 19.2, 0.18, 2.6, 'z', 8, 'chrome');
};
