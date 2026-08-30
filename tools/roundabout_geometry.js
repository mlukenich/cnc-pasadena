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
  // Lower Armor Belly Pan
  bevel('hull-belly-pan', 0.0, 0.0, 3.8, 38.0, 20.0, 1.6, 'skirtSeal', 0.5);

  // Sloped Front Wedge Glacis Plates (Left, Center, Right)
  quad('wedge-glacis-center', [
    [22.5, 5.5, 4.8], [22.5, -5.5, 4.8],
    [5.0, -6.5, 8.8], [5.0, 6.5, 8.8]
  ], 'frontWedge');
  quad('wedge-glacis-left', [
    [22.5, 5.5, 4.8], [5.0, 6.5, 8.8],
    [5.0, 10.8, 8.4], [19.0, 10.5, 4.8]
  ], 'paint');
  quad('wedge-glacis-right', [
    [22.5, -5.5, 4.8], [19.0, -10.5, 4.8],
    [5.0, -10.8, 8.4], [5.0, -6.5, 8.8]
  ], 'paint');

  // Front Chin Splitter & Lower Air Intake
  bevel('hull-chin-splitter', 23.2, 0.0, 4.0, 2.4, 21.0, 0.8, 'carbonFiber', 0.2);
  quad('front-fascia-intake', [
    [22.8, 8.0, 4.2], [22.8, -8.0, 4.2],
    [22.8, -8.0, 5.5], [22.8, 8.0, 5.5]
  ], 'frontFascia');

  // Side Ground-Effect Skirts with Illuminated Cyan Accent Channels
  for (const side of [-1, 1]) {
    const ySign = side;
    const ySkirt = ySign * 11.2;

    // Main Side Skirt Armor Panel with Columbia Enforcer Crest
    quad('skirt-outer-panel', [
      [18.5, ySkirt, 3.8], [-18.5, ySkirt, 3.8],
      [-18.5, ySkirt * 0.96, 8.4], [18.5, ySkirt * 0.96, 8.4]
    ], 'enforcerPanel');

    // Lower Carbon Ground Skirt Extension
    quad('skirt-carbon-lip', [
      [18.5, ySkirt * 1.04, 2.5], [-18.5, ySkirt * 1.04, 2.5],
      [-18.5, ySkirt, 3.8], [18.5, ySkirt, 3.8]
    ], 'carbonFiber');

    // Horizontal Cyan Illuminated Underglow Strip
    beam(`skirt-light-channel-${side}`, [17.5, ySkirt * 1.01, 3.9], [-17.5, ySkirt * 1.01, 3.9], 0.15, 'cyanTrim', 4);

    // Automated Citation Ticket Ejection Slots (High-Speed Enforcement)
    bevel(`citation-slot-${side}`, 8.0, ySkirt * 0.98, 6.2, 3.5, 0.3, 0.6, 'magneticRail', 0.1);
    bevel(`citation-scanner-${side}`, 12.0, ySkirt * 0.98, 6.2, 1.8, 0.3, 1.2, 'strobeOptics', 0.1);

    // Front Corner Aero Winglet / Canard
    quad('aero-canard-front', [
      [18.5, ySkirt * 1.08, 4.0], [21.5, ySkirt * 1.04, 4.0],
      [20.5, ySkirt * 1.04, 6.0], [17.5, ySkirt * 1.08, 6.0]
    ], 'carbonFiber');
  }

  // Upper Hull Deck Plate & Central Turret Ring Recess
  quad('hull-deck-center', [
    [5.0, 10.8, 8.4], [5.0, -10.8, 8.4],
    [-12.0, -10.8, 8.4], [-12.0, 10.8, 8.4]
  ], 'paint');
  lathe('hull-turret-well-recess', 0.0, 0.0, 8.4, [
    [0.0, 6.2], [0.4, 6.2], [0.4, 5.8], [0.0, 5.8]
  ], 'magneticRail', 'z', 18);

  // Rear Engine Deck & Louvered Ventilation Slats
  quad('rear-engine-deck', [
    [-12.0, 10.5, 8.4], [-12.0, -10.5, 8.4],
    [-19.5, -9.5, 7.8], [-19.5, 9.5, 7.8]
  ], 'rearVenting');

  // Rear Carbon Fiber Diffuser Fins & LED Taillight Bar
  quad('rear-taillight-bar', [
    [-19.6, 9.2, 7.2], [-19.6, -9.2, 7.2],
    [-19.6, -9.2, 8.0], [-19.6, 9.2, 8.0]
  ], 'strobeOptics');
  bevel('rear-diffuser-belly', -19.2, 0.0, 3.6, 2.0, 19.0, 1.4, 'carbonFiber', 0.2);
  for (let d = -3; d <= 3; d++) {
    quad('rear-diffuser-strake', [
      [-18.0, d * 2.8, 2.6], [-20.2, d * 2.8, 2.6],
      [-20.2, d * 2.8, 4.4], [-18.0, d * 2.8, 4.4]
    ], 'carbonFiber');
  }

  // Emergency Caution Stripes on Rear Access Hatch
  bevel('rear-service-hatch', -16.0, 0.0, 8.45, 4.5, 6.0, 0.2, 'cautionStripes', 0.1);

  // =========================================================================
  // 2. ROTATING CENTRAL CITATION TURRET (YAW - Bone_Turret)
  // =========================================================================
  // Sleek Armored Hexagonal Turret Hull (Centered at X=0.0, Y=0.0, Z=8.5)
  bevel('turret-base-armor', 0.0, 0.0, 10.2, 16.0, 12.8, 2.8, 'paint', 0.8);
  bevel('turret-rear-bustle', -6.5, 0.0, 10.8, 6.2, 11.0, 2.2, 'paint', 0.5);

  // Turret Roof Photovoltaic Solar Matrix
  bevel('turret-solar-roof', -1.5, 0.0, 11.65, 8.5, 8.0, 0.2, 'solarRoof', 0.2);

  // Side Heat Dissipation Cooling Radiators (Left & Right)
  for (const side of [-1, 1]) {
    const ySign = side;
    bevel(`turret-radiator-${side}`, -4.5, ySign * 5.8, 10.8, 5.0, 1.2, 1.8, 'magneticRail', 0.2);
    // Radiator cooling fins
    for (let f = 0; f < 5; f++) {
      quad(`radiator-fin-${side}-${f}`, [
        [-6.5 + f * 0.9, ySign * 6.45, 10.0], [-6.5 + f * 0.9, ySign * 6.45, 11.6],
        [-6.3 + f * 0.9, ySign * 6.45, 11.6], [-6.3 + f * 0.9, ySign * 6.45, 10.0]
      ], 'cyanTrim');
    }
  }

  // 360-Degree Rotating LiDAR Surveillance Dome on Turret Roof
  lathe('turret-lidar-pedestal', 1.5, 0.0, 11.7, [
    [0.0, 1.8], [0.4, 1.6], [0.8, 1.4]
  ], 'magneticRail', 'z', 16);
  lathe('turret-lidar-dome-housing', 1.5, 0.0, 12.5, [
    [0.0, 1.35], [0.6, 1.4], [1.1, 1.1], [1.4, 0.4]
  ], 'cyanTrim', 'z', 16);
  cylinder('turret-lidar-optical-slit', 1.5, 0.0, 13.0, 1.38, 0.35, 'z', 16, 'solarGlass');
  cylinder('turret-lidar-scanner-lens', 2.8, 0.0, 13.0, 0.35, 0.2, 'x', 8, 'strobeOptics');

  // Multi-tier Emergency Strobe Warning Lightbar on Turret
  bevel('turret-lightbar-frame', 5.5, 0.0, 11.8, 1.4, 8.5, 0.8, 'carbonFiber', 0.15);
  for (let l = -3; l <= 3; l++) {
    cylinder(`turret-strobe-lens-${l}`, 6.2, l * 1.1, 11.8, 0.25, 0.25, 'x', 8, 'strobeOptics');
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
      ], 'cyanTrim', 'x', 14);
      cylinder(`gun-plasma-glow-${side}-${c}`, cx + 0.5, yGun, 10.2, 0.95, 0.5, 'x', 12, 'strobeOptics');
    }

    // High-Voltage Cryogenic Conduit Lines
    beam(`gun-cryo-line-a-${side}`, [8.0, yGun + (side > 0 ? 1.4 : -1.4), 11.2], [22.0, yGun + (side > 0 ? 1.4 : -1.4), 11.2], 0.16, 'chrome', 6);
    beam(`gun-cryo-line-b-${side}`, [8.0, yGun + (side > 0 ? 1.4 : -1.4), 9.2], [22.0, yGun + (side > 0 ? 1.4 : -1.4), 9.2], 0.16, 'chrome', 6);

    // Heavy Muzzle Emitter Faceplate with Circular Focusing Optics (Muzzle at X=25.5)
    lathe(`gun-muzzle-brake-${side}`, 24.8, yGun, 10.2, [
      [0.0, 0.75], [0.3, 1.15], [0.9, 1.15], [1.2, 0.95]
    ], 'microwaveFace', 'x', 16);
    cylinder(`gun-muzzle-lens-${side}`, 25.8, yGun, 10.2, 0.65, 0.2, 'x', 14, 'strobeOptics');
  }

  // =========================================================================
  // 4. ARTICULATED REAR STINGER & COMMUNICATIONS MAST (Turret2, Turret2_Gun, Bone_Tail)
  // =========================================================================
  // Base Mount on Rear Hull (Centered at X=-14.0, Y=0.0, Z=8.5)
  lathe('stinger-base-mount', -14.0, 0.0, 8.5, [
    [0.0, 2.2], [0.6, 1.8], [1.2, 1.4]
  ], 'magneticRail', 'z', 12);

  // Swept Aerodynamic Stinger Mast Arm (Extends rearward and upward)
  beam('stinger-arm-left', [-14.0, 1.2, 9.6], [-19.0, 2.5, 17.5], 0.35, 'paint', 6);
  beam('stinger-arm-right', [-14.0, -1.2, 9.6], [-19.0, -2.5, 17.5], 0.35, 'paint', 6);
  beam('stinger-cross-brace', [-16.5, -1.8, 13.5], [-16.5, 1.8, 13.5], 0.25, 'cyanTrim', 6);

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
    [0.0, 0.3], [0.4, 1.4], [0.6, 1.6]
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
