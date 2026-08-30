'use strict';

// +X is forward; +Z is up; +Y is left, -Y is right.
// Continuous aerodynamic hard-surface model for the Columbia Prius Patrol EV.
// Proportions and styling match the high-definition C&C 3 unit portrait:
// - Seamless curved automotive fuselage with continuous visible hood, roof, and hatch
// - Swept-back aerodynamic front fascia with integrated LED headlights and smooth nose
// - Contoured wheel arches with tucked performance wheels and inner liners
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

  // Quad with guaranteed outward winding: [p0, p1, p2, p3]
  function quad(name, [p0, p1, p2, p3], mat) {
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
    // Choose winding from the profile's outward meridian normal. Axis-Y
    // uses the opposite angular handedness to X/Z; mirrored wheels reverse
    // the axial traversal too. Matching stored normals to inward triangles
    // does not make those triangles externally visible.
    const direction = Math.sign(profile[profile.length - 1][0] - profile[0][0]) || Math.sign(cy) || 1;
    const oriented = points => direction * (axis === 'y' ? 1 : -1) < 0 ? [...points].reverse() : points;
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
          const p = oriented([p0, p1, p3]);
          triangle(p, normal(p), mat, name);
        } else if (r <= 1e-5) {
          const p = oriented([p0, p2, p3]);
          triangle(p, normal(p), mat, name);
        } else {
          quad(name, oriented([p0, p1, p2, p3]), mat);
        }
      }
    }
  }

  // =========================================================================
  // 1. LOFTED AERODYNAMIC AUTOMOTIVE FUSELAGE (CONTINUOUS BODY SURFACE)
  // =========================================================================
  // Transverse cross-sections from Front Nose (X=25.5) to Rear Tailgate (X=-24.0)
  // Each cross section defines 9 points across Y:
  // [Y_rocker_L, Y_fender_L, Y_shoulder_L, Y_hood_L, Center_Top, Y_hood_R, Y_shoulder_R, Y_fender_R, Y_rocker_R]
  const crossSections = [
    // 0: Front Nose / Lower Splitter Tip (X = 25.5)
    {
      x: 25.5,
      points: [
        [7.0, 4.2], [7.2, 5.2], [6.5, 6.4], [3.5, 7.6], [0, 8.0],
        [-3.5, 7.6], [-6.5, 6.4], [-7.2, 5.2], [-7.0, 4.2]
      ],
      group: 'front-bumper', mat: 'pearl'
    },
    // 1: Front Fascia & LED Headlights (X = 24.2)
    {
      x: 24.2,
      points: [
        [8.2, 4.5], [8.8, 6.0], [8.2, 7.6], [4.4, 8.6], [0, 9.0],
        [-4.4, 8.6], [-8.2, 7.6], [-8.8, 6.0], [-8.2, 4.5]
      ],
      group: 'front-headlights', mat: 'frontFascia'
    },
    // 2: Front Hood Forward Section (X = 20.0)
    {
      x: 20.0,
      points: [
        [9.2, 4.8], [10.8, 7.8], [9.8, 9.8], [4.8, 10.2], [0, 10.6],
        [-4.8, 10.2], [-9.8, 9.8], [-10.8, 7.8], [-9.2, 4.8]
      ],
      group: 'hood-top', mat: 'hoodPanel'
    },
    // 3: Front Hood Mid / Wheel Arch Top (X = 16.0)
    {
      x: 16.0,
      points: [
        [9.4, 5.0], [11.2, 8.4], [10.2, 11.0], [5.0, 11.2], [0, 11.6],
        [-5.0, 11.2], [-10.2, 11.0], [-11.2, 8.4], [-9.4, 5.0]
      ],
      group: 'hood-top', mat: 'hoodPanel'
    },
    // 4: Hood Rear / Windshield Cowl Base (X = 11.2)
    {
      x: 11.2,
      points: [
        [9.6, 5.2], [10.6, 9.2], [9.8, 11.6], [4.8, 12.0], [0, 12.4],
        [-4.8, 12.0], [-9.8, 11.6], [-10.6, 9.2], [-9.6, 5.2]
      ],
      group: 'hood-top', mat: 'hoodPanel'
    },
    // 5: Mid Windshield & Front A-Pillars (X = 6.0)
    {
      x: 6.0,
      points: [
        [9.8, 5.2], [10.4, 9.6], [9.4, 13.0], [4.0, 14.4], [0, 14.8],
        [-4.0, 14.4], [-9.4, 13.0], [-10.4, 9.6], [-9.8, 5.2]
      ],
      group: 'windshield', mat: 'solarGlass'
    },
    // 6: Windshield Top / Front Solar Roof (X = 1.0)
    {
      x: 1.0,
      points: [
        [9.8, 5.2], [10.4, 9.8], [9.2, 13.2], [3.6, 15.8], [0, 16.2],
        [-3.6, 15.8], [-9.2, 13.2], [-10.4, 9.8], [-9.8, 5.2]
      ],
      group: 'roof-surface', mat: 'solarRoof'
    },
    // 7: Center Solar Roof & B-Pillars (X = -4.0)
    {
      x: -4.0,
      points: [
        [9.8, 5.2], [10.4, 9.8], [9.2, 13.2], [3.6, 15.8], [0, 16.2],
        [-3.6, 15.8], [-9.2, 13.2], [-10.4, 9.8], [-9.8, 5.2]
      ],
      group: 'roof-surface', mat: 'solarRoof'
    },
    // 8: Rear Solar Roof & C-Pillars (X = -9.0)
    {
      x: -9.0,
      points: [
        [9.8, 5.2], [10.4, 9.8], [9.2, 13.0], [3.6, 15.6], [0, 16.0],
        [-3.6, 15.6], [-9.2, 13.0], [-10.4, 9.8], [-9.8, 5.2]
      ],
      group: 'roof-surface', mat: 'solarRoof'
    },
    // 9: Fastback Rear Glass / Rear Wheel Arch (X = -16.0)
    {
      x: -16.0,
      points: [
        [9.4, 5.0], [11.2, 8.4], [10.0, 11.2], [4.4, 13.0], [0, 13.4],
        [-4.4, 13.0], [-10.0, 11.2], [-11.2, 8.4], [-9.4, 5.0]
      ],
      group: 'rear-glass', mat: 'solarGlass'
    },
    // 10: Ducktail Spoiler & Taillights (X = -21.4)
    {
      x: -21.4,
      points: [
        [8.6, 4.8], [9.8, 7.8], [8.6, 10.4], [4.0, 11.6], [0, 12.0],
        [-4.0, 11.6], [-8.6, 10.4], [-9.8, 7.8], [-8.6, 4.8]
      ],
      group: 'tailgate-panel', mat: 'tailPanel'
    },
    // 11: Rear Bumper & Lower Diffuser (X = -24.0)
    {
      x: -24.0,
      points: [
        [7.2, 4.4], [8.2, 6.0], [7.2, 8.0], [3.6, 9.0], [0, 9.4],
        [-3.6, 9.0], [-7.2, 8.0], [-8.2, 6.0], [-7.2, 4.4]
      ],
      group: 'rear-bumper', mat: 'pearl'
    }
  ];

  // Beltline, side glass and roof rails are separate strips. A roof texture
  // wrapped down the entire flank obscures the hatchback silhouette.
  for (const k of [5,6,7,8]) {
    const cs = crossSections[k];
    cs.points[2] = [8.0, cs.points[4][1] - 0.45];
    cs.points[3] = [6.9, cs.points[4][1] - 0.12];
    cs.points[5] = [-6.9, cs.points[4][1] - 0.12];
    cs.points[6] = [-8.0, cs.points[4][1] - 0.45];
  }

  // Resample around each wheel to cut actual openings in the shell. Liners
  // alone cannot create a hole in a solid fender. Keep the original wheel rig.
  const stationXs = [...new Set([...crossSections.map(s=>s.x), ...[-16,16].flatMap(cx=>
    Array.from({length:13},(_,i)=>cx+5.5*Math.cos(i*Math.PI/12)))])].sort((a,b)=>b-a);
  const stations = stationXs.map(x => {
    let k = crossSections.findIndex((s,i)=>i<crossSections.length-1 && x<=s.x && x>=crossSections[i+1].x);
    if(k<0) k=crossSections.length-2;
    const a=crossSections[k], b=crossSections[k+1], t=(a.x-x)/(a.x-b.x);
    const points=a.points.map((p,i)=>p.map((v,j)=>v+(b.points[i][j]-v)*t));
    for(const cx of [-16,16]) {
      const dx=x-cx;
      if(Math.abs(dx)<=5.5) {
        const z=5.2+Math.sqrt(Math.max(0,5.5**2-dx**2));
        for(const i of [0,8]) { points[i][1]=Math.max(points[i][1],z); points[i][0]=Math.sign(points[i][0])*11.0; }
        for(const i of [1,7]) points[i][1]=Math.max(points[i][1],z+0.55);
        for(const i of [2,6]) points[i][1]=Math.max(points[i][1],z+0.7);
      }
    }
    return {x,points};
  });

  // Generate the smooth lofted surface across adjacent cross-sections
  for (let station = 0; station < stations.length - 1; station++) {
    const csA = stations[station];
    const csB = stations[station + 1];
    const midX = (csA.x + csB.x)/2;
    const k = crossSections.findIndex((s,i)=>i<crossSections.length-1 && midX<=s.x && midX>=crossSections[i+1].x);

    for (let i = 0; i < 8; i++) {
      // 4 points on the quad:
      // p0 = csA point i (Left)
      // p1 = csA point i+1 (moving toward Right)
      // p2 = csB point i+1 (Rear Right)
      // p3 = csB point i (Rear Left)
      const p0 = [csA.x, csA.points[i][0], csA.points[i][1]];
      const p1 = [csA.x, csA.points[i + 1][0], csA.points[i + 1][1]];
      const p2 = [csB.x, csB.points[i + 1][0], csB.points[i + 1][1]];
      const p3 = [csB.x, csB.points[i][0], csB.points[i][1]];

      // Material and group assignment per region:
      let mat = 'pearl';
      let group = 'body-shell';

      if(i>=2 && i<=5 && k>=2 && k<=3) { mat='hoodPanel'; group='hood-top'; }
      if(i>=2 && i<=5 && k===4) { mat='solarGlass'; group='windshield'; }
      if(i>=3 && i<=4 && k>=5 && k<=7) { mat='solarRoof'; group='roof-surface'; }
      if((i===1 || i===6) && k>=5 && k<=7) { mat='solarGlass'; group='side-glass'; }
      if(i>=2 && i<=5 && k===8) { mat='solarGlass'; group='rear-glass'; }

      // Lower side panels (i=0 or i=7) use door panel texture
      if ((i === 0 || i === 7) && csA.x <= 10.5 && csB.x >= -10.5) {
        group = 'door-badge-panel';
        mat = 'doorPanel';
      }

      quad(group, [p3, p2, p1, p0], mat);
    }
  }

  // Nose cap (front bumper center closeout)
  const noseRing = crossSections[0].points.map(pt => [crossSections[0].x, pt[0], pt[1]]);
  cap('front-bumper-cap', noseRing, 'frontFascia', [1, 0, 0]);

  // Tailgate cap (rear bumper center closeout)
  const tailRing = [...crossSections[crossSections.length - 1].points.map(pt => [crossSections[crossSections.length - 1].x, pt[0], pt[1]])].reverse();
  cap('rear-bumper-cap', tailRing, 'tailPanel', [-1, 0, 0]);

  // Underbody flat floor pan
  bevel('underbody-pan', 0, 0, 4.4, 46, 17.5, 1.0, 'carbon', 0.3);

  // =========================================================================
  // 2. INNER WHEEL ARCH LINERS (DARK CAVITY BEHIND WHEELS)
  // =========================================================================
  for (const side of [-1, 1]) {
    plate('headlamp-housing', [[23.9,side*4.9,8.8],[21.0,side*8.9,10.2],[21.9,side*9.3,9.65],[24.0,side*6.2,8.5]], 0.12, 'gunmetal');
    beam('headlamp-led', [23.75,side*5.2,9.12], [21.35,side*8.75,10.42], 0.17, 'pearl');
    // Slim pillars and door shutlines give the cabin a readable scale.
    beam('b-pillar', [-3.8, side*10.45, 9.8], [-3.8, side*8.02, 15.85], 0.21, 'carbon');
    beam('window-sill', [-9, side*10.46, 9.8], [6, side*10.46, 9.6], 0.13, 'chrome');
    beam('door-seam', [-3.8, side*9.84, 5.35], [-3.8, side*10.45, 9.7], 0.065, 'gunmetal', 6);
    const ySign = side;
    const yInner = ySign * 8.0;
    const yOuter = ySign * 10.5;

    // Front inner liner
    const fArch = [
      [21.5, 4.8], [20.5, 9.2], [16.0, 10.8], [11.5, 9.2], [10.5, 4.8]
    ];
    for (let j = 0; j < fArch.length - 1; j++) {
      quad('arch-liner-front', [
        [fArch[j][0], yInner, fArch[j][1]],
        [fArch[j + 1][0], yInner, fArch[j + 1][1]],
        [fArch[j + 1][0], yOuter, fArch[j + 1][1]],
        [fArch[j][0], yOuter, fArch[j][1]]
      ], 'carbon');
    }

    // Rear inner liner
    const rArch = [
      [-10.5, 4.8], [-11.5, 9.2], [-16.0, 10.8], [-20.5, 9.2], [-21.5, 4.8]
    ];
    for (let j = 0; j < rArch.length - 1; j++) {
      quad('arch-liner-rear', [
        [rArch[j][0], yInner, rArch[j][1]],
        [rArch[j + 1][0], yInner, rArch[j + 1][1]],
        [rArch[j + 1][0], yOuter, rArch[j + 1][1]],
        [rArch[j][0], yOuter, rArch[j][1]]
      ], 'carbon');
    }

    // Aerodynamic Side View Mirror
    beam('mirror-stalk', [7.8, yOuter * 0.90, 13.0], [7.4, ySign * 11.2, 13.4], 0.22, 'carbon', 6);
    bevel('mirror-housing', 7.4, ySign * 11.6, 13.7, 2.0, 1.1, 1.3, 'cyan', 0.25);
    quad('mirror-glass', [
      [6.4, ySign * 11.1, 13.1], [6.4, ySign * 12.1, 13.1],
      [6.4, ySign * 12.1, 14.3], [6.4, ySign * 11.1, 14.3]
    ], 'chrome');
  }

  // =========================================================================
  // 3. FRONT & REAR AERODYNAMIC SPLITTERS & BARS
  // =========================================================================
  bevel('front-chin-splitter', 25.4, 0, 4.0, 1.6, 16.5, 0.35, 'carbon', 0.15);
  beam('bull-bar-l', [25.6, 4.0, 4.6], [26.4, 4.0, 7.4], 0.25, 'carbon', 6);
  beam('bull-bar-r', [25.6, -4.0, 4.6], [26.4, -4.0, 7.4], 0.25, 'carbon', 6);
  beam('bull-bar-cross', [26.4, -4.0, 7.2], [26.4, 4.0, 7.2], 0.24, 'carbon', 6);

  bevel('rear-diffuser', -24.4, 0, 4.5, 1.6, 13.5, 0.6, 'carbon', 0.2);
  for (const dy of [-4.2, -1.4, 1.4, 4.2]) {
    plate('diffuser-fin', [
      [-23.6, dy, 4.2], [-25.2, dy, 4.2],
      [-25.2, dy, 5.2], [-23.6, dy, 5.2]
    ], 0.12, 'carbon');
  }

  // =========================================================================
  // 4. HIGH-PERFORMANCE TUCKED PERFORMANCE WHEELS
  // =========================================================================
  const wheelConfigs = [
    { prefix: 'wheel-front-left', cx: 16.0, cy: 9.6, cz: 5.2 },
    { prefix: 'wheel-front-right', cx: 16.0, cy: -9.6, cz: 5.2 },
    { prefix: 'wheel-rear-left', cx: -16.0, cy: 9.6, cz: 5.2 },
    { prefix: 'wheel-rear-right', cx: -16.0, cy: -9.6, cz: 5.2 },
  ];

  wheelConfigs.forEach(({ prefix, cx, cy, cz }) => {
    const isLeft = cy > 0;
    const ySign = isLeft ? 1 : -1;

    // 1. Tire Tread (5-step lathe cross section)
    lathe(`${prefix}-tire-outer`, cx, cy - ySign * 0.9, cz, [
      [0.0, 4.2],
      [ySign * 0.5, 4.75],
      [ySign * 1.1, 5.0],
      [ySign * 1.6, 4.8],
      [ySign * 2.0, 4.2]
    ], 'treadPanel', 'y', 20);

    // 2. Tire Sidewall Ring
    lathe(`${prefix}-tire-sidewall`, cx, cy + ySign * 1.15, cz, [
      [0.0, 4.2],
      [0.0, 3.0]
    ], 'rubber', 'y', 20);

    // 3. Directional Aero Turbine Alloy Rim Face
    lathe(`${prefix}-rim-outer`, cx, cy + ySign * 1.2, cz, [
      [0.0, 3.0],
      [ySign * 0.12, 2.3],
      [ySign * 0.22, 1.2],
      [ySign * 0.14, 0.4]
    ], 'chrome', 'y', 20);

    // 4. Center HOA Cyan Hub Emblem
    bevel(`${prefix}-hub-cap`, cx, cy + ySign * 1.35, cz, 0.95, 0.2, 0.95, 'cyan', 0.2);

    // 5. Brake Rotor & Caliper
    cylinder(`${prefix}-brake-rotor`, cx, cy, cz, 2.5, 0.35, 'y', 12, 'gunmetal');
    bevel(`${prefix}-brake-caliper`, cx + 1.0, cy + ySign * 0.15, cz + 1.2, 1.4, 0.6, 1.1, 'cyan', 0.2);
  });

  // =========================================================================
  // 5. PROMINENT ROOF CITATION TURRET & WEAPONS (MATCHING PORTRAIT)
  // =========================================================================
  // Roof rack base
  bevel('turret-base', 1.0, 0, 16.7, 10.0, 8.8, 0.9, 'carbon', 0.35);

  // Wide Multi-tier Emergency Strobe Lightbar
  bevel('turret-strobe-housing', 0.8, 0, 17.2, 7.8, 9.2, 0.6, 'carbon', 0.2);
  quad('turret-strobe-lens', [
    [-2.8, -4.4, 17.5], [4.4, -4.4, 17.5],
    [4.4, 4.4, 17.5], [-2.8, 4.4, 17.5]
  ], 'strobe');

  // Dual PA Loudspeaker Horns
  cylinder('turret-pa-horn-l', 2.6, 2.4, 18.0, 0.75, 1.4, 'x', 10, 'carbon');
  cylinder('turret-pa-horn-r', 2.6, -2.4, 18.0, 0.75, 1.4, 'x', 10, 'carbon');

  // Central Rotating Optical Surveillance Turret Dome (Yaw)
  lathe('turret-dome', 1.0, 0, 17.6, [
    [0.0, 2.8], [0.35, 2.4], [0.75, 1.5], [1.0, 0.3]
  ], 'cyan', 'z', 16);
  cylinder('turret-camera-lens', 2.0, 0, 18.2, 0.5, 0.5, 'x', 10, 'solarGlass');

  // Articulated Heavy Laser Pitch Assembly (Centered at X=2.5, Y=0.0, Z=18.6)
  beam('laser-gimbal-arm', [1.0, 0, 17.8], [2.5, 0, 18.8], 0.45, 'carbon', 8);

  // Dual Heavy Laser Diode Cannons
  for (const side of [-1, 1]) {
    const yL = side * 2.4;
    // Armored emitter receiver chassis
    bevel(`laser-chassis-${side > 0 ? 'l' : 'r'}`, 4.0, yL, 18.8, 7.0, 2.2, 1.9, 'pearl', 0.3);
    quad(`laser-top-plate-${side > 0 ? 'l' : 'r'}`, [
      [1.0, yL - 0.8, 19.8], [6.8, yL - 0.8, 19.8],
      [6.8, yL + 0.8, 19.8], [1.0, yL + 0.8, 19.8]
    ], 'cyan');

    // Ribbed Cooling Heat-Sink Fins on Emitter Barrel
    cylinder(`laser-barrel-${side > 0 ? 'l' : 'r'}`, 7.8, yL, 18.8, 0.78, 4.0, 'x', 14, 'gunmetal');
    for (const fx of [6.8, 7.4, 8.0, 8.6]) {
      cylinder(`laser-heatsink-${side > 0 ? 'l' : 'r'}`, fx, yL, 18.8, 0.95, 0.16, 'x', 14, 'carbon');
    }

    // High-Energy Diode Focusing Crystal Lens Faceplate
    lathe(`laser-focus-${side > 0 ? 'l' : 'r'}`, 9.8, yL, 18.8, [
      [0.0, 0.78], [0.2, 0.92], [0.45, 0.92], [0.55, 0.5]
    ], 'laserFace', 'x', 14);

    // High-Voltage Power Conduit Cable
    beam(`laser-conduit-${side > 0 ? 'l' : 'r'}`, [0.2, side * 1.6, 17.4], [1.2, yL, 18.6], 0.22, 'cyan', 6);
  }

  // Central Targeting Optical Sensor Pod
  bevel('laser-sensor-pod', 4.4, 0, 19.6, 3.6, 2.0, 1.3, 'cyan', 0.2);
  cylinder('laser-sensor-lens', 6.2, 0, 19.6, 0.55, 0.5, 'x', 10, 'strobe');

  // =========================================================================
  // 6. ROOF EMP RADAR DISH & DISCHARGE ANTENNA
  // =========================================================================
  lathe('emp-dish-base', -5.5, 0, 16.4, [
    [0.0, 2.2], [0.4, 1.9], [0.8, 1.0], [1.0, 0.4]
  ], 'carbon', 'z', 14);
  lathe('emp-dish-parabolic', -5.5, 0, 17.6, [
    [0.0, 0.5], [0.3, 1.4], [0.6, 2.2], [0.75, 2.4]
  ], 'chrome', 'z', 16);
  cylinder('emp-antenna-rod', -5.5, 0, 19.0, 0.18, 2.6, 'z', 8, 'chrome');
};
