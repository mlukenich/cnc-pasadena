'use strict';

// 3D Hard-Surface Procedural Geometry Generator for Columbia Autonomous Street Sweeper
// NODFlameTank replacement across 5 iterative passes of mechanical detail.

function createSweeperGeometry() {
  const vertices = [];
  const normals = [];
  const uvs = [];
  const triangles = [];
  const groups = [];
  const materials = [];

  const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
  const unit = a => {
    const l = Math.hypot(...a);
    return l > 1e-12 ? a.map(v => v / l) : [1, 0, 0];
  };
  const cross = (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];

  function triangleNormal(t, pts) {
    const [p0, p1, p2] = t.map(i => pts[i]);
    const u = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]];
    const v = [p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]];
    return unit(cross(u, v));
  }

  function faceUvs(materialIndex, pts, n, group) {
    const row = Math.floor(materialIndex / 4);
    const col = materialIndex % 4;
    const absN = n.map(Math.abs);
    let axes = [0, 2];
    if (absN[1] >= absN[0] && absN[1] >= absN[2]) axes = [0, 2];
    else if (absN[0] >= absN[1] && absN[0] >= absN[2]) axes = [1, 2];
    else axes = [0, 1];

    if (group.startsWith('wheel-')) {
      const cx = group.includes('front') ? 14 : -12;
      const cy = group.includes('left') ? 10.5 : -10.5;
      const cz = 5.5;
      const ranges = [[-5, 5], [-3, 3], [-5, 5]];
      return pts.map(p => {
        const lp = [p[0] - cx, p[1] - cy, p[2] - cz];
        return axes.map((k, j) => ((j ? row : col) + 0.08 + 0.84 * clamp((lp[k] - ranges[k][0]) / (ranges[k][1] - ranges[k][0]))) / 4);
      });
    }

    if (group.startsWith('brush-')) {
      const cx = 20;
      const cy = group.includes('left') ? 14.5 : -14.5;
      const cz = 2.5;
      const ranges = [[-4.5, 4.5], [-4.5, 4.5], [-2.5, 2.5]];
      return pts.map(p => {
        const lp = [p[0] - cx, p[1] - cy, p[2] - cz];
        return axes.map((k, j) => ((j ? row : col) + 0.05 + 0.9 * clamp((lp[k] - ranges[k][0]) / (ranges[k][1] - ranges[k][0]))) / 4);
      });
    }

    const min = axes.map(k => Math.min(...pts.map(p => p[k])));
    const max = axes.map(k => Math.max(...pts.map(p => p[k])));
    const span = max.map((v, i) => Math.max(0.1, v - min[i]));

    return pts.map(p => axes.map((k, j) => {
      const cellOffset = j ? row : col;
      const local = (p[k] - min[j]) / span[j];
      return (cellOffset + 0.05 + 0.9 * clamp(local, 0, 1)) / 4;
    }));
  }

  function addTriangle(pts, n, mat, grp) {
    n = unit(n);
    if (triangleNormal([0, 1, 2], pts).reduce((s, v, i) => s + v * n[i], 0) < 0) {
      pts = [pts[0], pts[2], pts[1]];
    }
    const start = vertices.length;
    const u = faceUvs(mat, pts, n, grp);
    for (let i = 0; i < 3; i++) {
      vertices.push(pts[i]);
      normals.push(n);
      uvs.push(u[i]);
    }
    triangles.push([start, start + 1, start + 2]);
    groups.push(grp);
    materials.push(mat);
  }

  function addFace(pts, n, mat, grp) {
    n = unit(n);
    if (triangleNormal([0, 1, 2], pts).reduce((s, v, i) => s + v * n[i], 0) < 0) {
      pts = [...pts].reverse();
    }
    const start = vertices.length;
    const u = faceUvs(mat, pts, n, grp);
    for (let i = 0; i < 4; i++) {
      vertices.push(pts[i]);
      normals.push(n);
      uvs.push(u[i]);
    }
    triangles.push([start, start + 1, start + 2], [start, start + 2, start + 3]);
    groups.push(grp, grp);
    materials.push(mat, mat);
  }

  function addBox(x0, x1, y0, y1, z0, z1, mat, grp) {
    addFace([[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], [1, 0, 0], mat, grp); // Front (+X)
    addFace([[x0, y1, z0], [x0, y0, z0], [x0, y0, z1], [x0, y1, z1]], [-1, 0, 0], mat, grp); // Rear (-X)
    addFace([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], [0, 1, 0], mat, grp); // Left (+Y)
    addFace([[x1, y0, z0], [x0, y0, z0], [x0, y0, z1], [x1, y0, z1]], [0, -1, 0], mat, grp); // Right (-Y)
    addFace([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1], mat, grp); // Top (+Z)
    addFace([[x0, y1, z0], [x1, y1, z0], [x1, y0, z0], [x0, y0, z0]], [0, 0, -1], mat, grp); // Bottom (-Z)
  }

  function addCylinder(axis, p0, p1, r, segments, mat, grp, cap0 = true, cap1 = true) {
    const len = Math.hypot(...p1.map((v, i) => v - p0[i]));
    const dir = unit(p1.map((v, i) => v - p0[i]));
    const up = Math.abs(dir[2]) < 0.9 ? [0, 0, 1] : [0, 1, 0];
    const right = unit(cross(dir, up));
    const realUp = unit(cross(right, dir));

    const ring0 = [];
    const ring1 = [];
    const nRing = [];

    for (let i = 0; i < segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      const rn = [
        right[0] * cos + realUp[0] * sin,
        right[1] * cos + realUp[1] * sin,
        right[2] * cos + realUp[2] * sin,
      ];
      nRing.push(rn);
      ring0.push([
        p0[0] + rn[0] * r,
        p0[1] + rn[1] * r,
        p0[2] + rn[2] * r,
      ]);
      ring1.push([
        p1[0] + rn[0] * r,
        p1[1] + rn[1] * r,
        p1[2] + rn[2] * r,
      ]);
    }

    for (let i = 0; i < segments; i++) {
      const next = (i + 1) % segments;
      const nAvg = unit([
        nRing[i][0] + nRing[next][0],
        nRing[i][1] + nRing[next][1],
        nRing[i][2] + nRing[next][2],
      ]);
      addFace([ring0[i], ring1[i], ring1[next], ring0[next]], nAvg, mat, grp);
    }

    if (cap0) {
      const n0 = dir.map(v => -v);
      for (let i = 0; i < segments; i++) {
        const next = (i + 1) % segments;
        addTriangle([p0, ring0[next], ring0[i]], n0, mat, grp);
      }
    }

    if (cap1) {
      const n1 = dir;
      for (let i = 0; i < segments; i++) {
        const next = (i + 1) % segments;
        addTriangle([p1, ring1[i], ring1[next]], n1, mat, grp);
      }
    }
  }

  // ==========================================
  // PASS 1: Heavy Commercial Cab, Chassis, Disinfectant Boiler & Utility Wheels
  // ==========================================

  // Heavy Chassis Rails & Belly Pan
  addBox(-20, 18, -6, 6, 2.5, 5.5, 7, 'chassis-belly-pan');
  addBox(-18, 17, 6, 9.5, 4.0, 7.5, 11, 'chassis-side-deck-left');
  addBox(-18, 17, -9.5, -6, 4.0, 7.5, 11, 'chassis-side-deck-right');

  // Commercial Front-Control Armored Cab
  // Lower Cab Base
  addBox(2, 17.5, -9.5, 9.5, 7.0, 11.5, 0, 'cab-lower-hull');
  // Upper Cab Cabin (Angled front windshield)
  addFace([[17.5, -9.5, 11.5], [17.5, 9.5, 11.5], [14.0, 9.5, 18.5], [14.0, -9.5, 18.5]], [0.89, 0, 0.45], 4, 'cab-windshield');
  addFace([[14.0, -9.5, 18.5], [14.0, 9.5, 18.5], [2.0, 9.5, 18.5], [2.0, -9.5, 18.5]], [0, 0, 1], 0, 'cab-roof');
  addFace([[2.0, 9.5, 11.5], [2.0, -9.5, 11.5], [2.0, -9.5, 18.5], [2.0, 9.5, 18.5]], [-1, 0, 0], 0, 'cab-rear-wall');
  // Side Windows & Doors
  addFace([[17.5, 9.5, 11.5], [14.0, 9.5, 18.5], [2.0, 9.5, 18.5], [2.0, 9.5, 11.5]], [0, 1, 0], 4, 'cab-side-window-left');
  addFace([[14.0, -9.5, 18.5], [17.5, -9.5, 11.5], [2.0, -9.5, 11.5], [2.0, -9.5, 18.5]], [0, -1, 0], 4, 'cab-side-window-right');

  // Front Fascia, Grille & Headlights
  addBox(17.5, 19.5, -8.5, 8.5, 4.0, 11.5, 8, 'front-grille-fascia');
  // Heavy Steel Front Bumper & Push Bar
  addBox(18.5, 20.5, -10.0, 10.0, 2.5, 5.5, 7, 'front-bumper-beam');
  addBox(20.0, 21.0, -7.0, -6.0, 5.0, 10.0, 1, 'bumper-guard-right');
  addBox(20.0, 21.0, 6.0, 7.0, 5.0, 10.0, 1, 'bumper-guard-left');

  // Rear Pressurized Stainless Steel Disinfectant Boiler Tank
  // Cylindrical Main Body (Horizontal cylinder along X axis from X=-18 to X=1.5, radius=5.8, center Y=0, Z=13.0)
  addCylinder('X', [-18, 0, 13.0], [1.5, 0, 13.0], 5.8, 20, 3, 'tank-cylinder-body', true, true);
  // Tank Heavy Saddle Cradles
  addBox(-17, -15, -8.0, 8.0, 6.5, 11.0, 1, 'tank-cradle-rear');
  addBox(-2, 0, -8.0, 8.0, 6.5, 11.0, 1, 'tank-cradle-front');
  // Tank Top Inspection Dome & Pressure Relief Hatch
  addCylinder('Z', [-8.0, 0, 18.5], [-8.0, 0, 20.2], 2.2, 12, 3, 'tank-top-hatch', true, true);

  // 4 Heavy Commercial Utility Wheels
  const wheelPositions = [
    { name: 'wheel-front-left', cx: 14.0, cy: 10.5, cz: 5.5, side: 1 },
    { name: 'wheel-front-right', cx: 14.0, cy: -10.5, cz: 5.5, side: -1 },
    { name: 'wheel-rear-left', cx: -12.0, cy: 10.5, cz: 5.5, side: 1 },
    { name: 'wheel-rear-right', cx: -12.0, cy: -10.5, cz: 5.5, side: -1 },
  ];

  wheelPositions.forEach(({ name, cx, cy, cz, side }) => {
    // Tire Tread (outer cylinder)
    addCylinder('Y', [cx, cy - side * 1.6, cz], [cx, cy + side * 1.6, cz], 5.2, 18, 2, name + '-tread', false, false);
    // Outer Sidewall & Deep Chrome Rim
    addCylinder('Y', [cx, cy + side * 1.5, cz], [cx, cy + side * 1.7, cz], 5.2, 18, 15, name + '-rim', false, true);
    // Inner Sidewall
    addCylinder('Y', [cx, cy - side * 1.7, cz], [cx, cy - side * 1.5, cz], 5.2, 18, 2, name + '-inner', true, false);
    // Heavy Wheel Hub Spindle & Lug Nuts
    addCylinder('Y', [cx, cy + side * 1.6, cz], [cx, cy + side * 2.0, cz], 1.8, 8, 15, name + '-hub', false, true);
  });

  // Track / Tread Skirt Supports for Engine Compatibility
  addBox(-19, 18, 10.0, 10.5, 4.0, 7.5, 2, 'skirt-treads-left');
  addBox(-19, 18, -10.5, -10.0, 4.0, 7.5, 2, 'skirt-treads-right');

  // ==========================================
  // PASS 2: Dual Rotating Curb Scrubber Brushes & Hydraulic Articulation
  // ==========================================

  // Front-Left Curb Scrubber Brush Assembly
  // Hydraulic Swing Arm
  addBox(17.0, 20.0, 8.5, 12.5, 3.5, 4.8, 1, 'brush-arm-left');
  // Motor Housing Cap
  addCylinder('Z', [20.0, 14.5, 4.0], [20.0, 14.5, 5.8], 2.2, 12, 7, 'brush-motor-left', true, true);
  // Conical Wire Bristle Cluster (flaring from R=2.0 at Z=4.0 to R=4.2 at Z=1.0)
  for (let i = 0; i < 24; i++) {
    const a0 = (i / 24) * Math.PI * 2;
    const a1 = ((i + 1) / 24) * Math.PI * 2;
    const pTop0 = [20.0 + Math.cos(a0) * 2.0, 14.5 + Math.sin(a0) * 2.0, 4.0];
    const pTop1 = [20.0 + Math.cos(a1) * 2.0, 14.5 + Math.sin(a1) * 2.0, 4.0];
    const pBot0 = [20.0 + Math.cos(a0) * 4.2, 14.5 + Math.sin(a0) * 4.2, 0.8];
    const pBot1 = [20.0 + Math.cos(a1) * 4.2, 14.5 + Math.sin(a1) * 4.2, 0.8];
    addFace([pTop0, pTop1, pBot1, pBot0], unit([Math.cos(a0), Math.sin(a0), -0.4]), 5, 'brush-bristles-left');
    // Bottom bristle contact face
    addTriangle([[20.0, 14.5, 0.8], pBot1, pBot0], [0, 0, -1], 5, 'brush-bottom-left');
  }
  // Misting Spray Manifold Ring
  addCylinder('Z', [20.0, 14.5, 4.8], [20.0, 14.5, 5.2], 2.6, 12, 1, 'brush-spray-ring-left', false, false);

  // Front-Right Curb Scrubber Brush Assembly
  // Hydraulic Swing Arm
  addBox(17.0, 20.0, -12.5, -8.5, 3.5, 4.8, 1, 'brush-arm-right');
  // Motor Housing Cap
  addCylinder('Z', [20.0, -14.5, 4.0], [20.0, -14.5, 5.8], 2.2, 12, 7, 'brush-motor-right', true, true);
  // Conical Wire Bristle Cluster
  for (let i = 0; i < 24; i++) {
    const a0 = (i / 24) * Math.PI * 2;
    const a1 = ((i + 1) / 24) * Math.PI * 2;
    const pTop0 = [20.0 + Math.cos(a0) * 2.0, -14.5 + Math.sin(a0) * 2.0, 4.0];
    const pTop1 = [20.0 + Math.cos(a1) * 2.0, -14.5 + Math.sin(a1) * 2.0, 4.0];
    const pBot0 = [20.0 + Math.cos(a0) * 4.2, -14.5 + Math.sin(a0) * 4.2, 0.8];
    const pBot1 = [20.0 + Math.cos(a1) * 4.2, -14.5 + Math.sin(a1) * 4.2, 0.8];
    addFace([pTop0, pTop1, pBot1, pBot0], unit([Math.cos(a0), Math.sin(a0), -0.4]), 5, 'brush-bristles-right');
    addTriangle([[20.0, -14.5, 0.8], pBot0, pBot1], [0, 0, -1], 5, 'brush-bottom-right');
  }
  // Misting Spray Manifold Ring
  addCylinder('Z', [20.0, -14.5, 4.8], [20.0, -14.5, 5.2], 2.6, 12, 1, 'brush-spray-ring-right', false, false);

  // ==========================================
  // PASS 3: Twin Side-Mounted Sanitizer / Chemical Spray Cannons
  // ==========================================

  // Left Spray Cannon Turret Assembly (FXFireL at X=14.0, Y=11.0, Z=11.5)
  // Articulated Base Mantlet
  addBox(6.0, 9.5, 9.5, 12.5, 10.0, 13.0, 7, 'cannon-mantlet-left');
  // Hydraulic Elevation Ram
  addCylinder('X', [5.0, 11.0, 8.5], [8.0, 11.0, 10.5], 0.6, 8, 3, 'cannon-piston-left', true, true);
  // Perforated Gunmetal Heat Shield Shroud
  addCylinder('X', [9.0, 11.0, 11.5], [14.0, 11.0, 11.5], 1.2, 12, 7, 'cannon-heat-shield-left', false, true);
  // High-Pressure Stainless Steel Spray Barrel & Nozzle Tip
  addCylinder('X', [8.0, 11.0, 11.5], [15.5, 11.0, 11.5], 0.65, 10, 3, 'cannon-barrel-left', true, true);
  // High-Pressure Fluid Supply Hose (connected back to boiler)
  addCylinder('X', [0.0, 8.5, 12.0], [6.5, 10.5, 11.5], 0.45, 8, 2, 'cannon-hose-left', true, true);

  // Right Spray Cannon Turret Assembly (FXFireR at X=14.0, Y=-11.0, Z=11.5)
  // Articulated Base Mantlet
  addBox(6.0, 9.5, -12.5, -9.5, 10.0, 13.0, 7, 'cannon-mantlet-right');
  // Hydraulic Elevation Ram
  addCylinder('X', [5.0, -11.0, 8.5], [8.0, -11.0, 10.5], 0.6, 8, 3, 'cannon-piston-right', true, true);
  // Perforated Gunmetal Heat Shield Shroud
  addCylinder('X', [9.0, -11.0, 11.5], [14.0, -11.0, 11.5], 1.2, 12, 7, 'cannon-heat-shield-right', false, true);
  // High-Pressure Stainless Steel Spray Barrel & Nozzle Tip
  addCylinder('X', [8.0, -11.0, 11.5], [15.5, -11.0, 11.5], 0.65, 10, 3, 'cannon-barrel-right', true, true);
  // High-Pressure Fluid Supply Hose
  addCylinder('X', [0.0, -8.5, 12.0], [6.5, -10.5, 11.5], 0.45, 8, 2, 'cannon-hose-right', true, true);

  // ==========================================
  // PASS 4: Debris Vacuum System, Rear Blower & Chemical Sight Glass
  // ==========================================

  // Bottom Center Vacuum Suction Mouth & Plenum
  addBox(-4.0, 6.0, -6.5, 6.5, 0.8, 3.5, 7, 'vacuum-suction-plenum');
  // Flexible Rubber Vacuum Skirt Flaps around intake
  addBox(-4.5, 6.5, 6.5, 7.0, 0.2, 1.8, 2, 'vacuum-skirt-left');
  addBox(-4.5, 6.5, -7.0, -6.5, 0.2, 1.8, 2, 'vacuum-skirt-right');
  addBox(6.0, 6.5, -6.5, 6.5, 0.2, 1.8, 2, 'vacuum-skirt-front');
  addBox(-4.5, -4.0, -6.5, 6.5, 0.2, 1.8, 2, 'vacuum-skirt-rear');

  // Rear Vacuum Blower Fan Housing & Wire Mesh Grill
  addCylinder('X', [-20.0, 0, 13.5], [-18.5, 0, 13.5], 3.8, 16, 12, 'vacuum-blower-fan', true, false);

  // Side Chemical Disinfectant Sight Glass Level Tubes
  // Left Sight Glass Tube (cyan glowing fluid level gauge)
  addCylinder('Z', [-8.0, 6.2, 10.0], [-8.0, 6.2, 16.0], 0.75, 10, 14, 'sight-glass-tube-left', true, true);
  addBox(-9.0, -7.0, 5.8, 6.6, 9.5, 10.2, 1, 'sight-glass-bracket-bot-left');
  addBox(-9.0, -7.0, 5.8, 6.6, 15.8, 16.5, 1, 'sight-glass-bracket-top-left');

  // Right Sight Glass Tube
  addCylinder('Z', [-8.0, -6.2, 10.0], [-8.0, -6.2, 16.0], 0.75, 10, 14, 'sight-glass-tube-right', true, true);
  addBox(-9.0, -7.0, -6.6, -5.8, 9.5, 10.2, 1, 'sight-glass-bracket-bot-right');
  addBox(-9.0, -7.0, -6.6, -5.8, 15.8, 16.5, 1, 'sight-glass-bracket-top-right');

  // Biohazard / HOA Sanitizer Decals & Chemical Placards
  // Side Panel Decals ("COLUMBIA HOA STREET SANITIZER")
  addFace([[-16.0, 8.6, 7.8], [-2.0, 8.6, 7.8], [-2.0, 8.6, 12.2], [-16.0, 8.6, 12.2]], [0, 1, 0], 9, 'sanitizer-decal-panel-left');
  addFace([[-2.0, -8.6, 7.8], [-16.0, -8.6, 7.8], [-16.0, -8.6, 12.2], [-2.0, -8.6, 12.2]], [0, -1, 0], 9, 'sanitizer-decal-panel-right');
  // Biohazard Chemical Placards ("99.9% BLEACH")
  addFace([[-14.0, 0, 18.9], [-10.0, 0, 18.9], [-10.0, 0, 18.9], [-14.0, 0, 18.9]], [0, 0, 1], 10, 'chemical-placard-top');
  addFace([[-19.6, -2.5, 12.0], [-19.6, 2.5, 12.0], [-19.6, 2.5, 16.0], [-19.6, -2.5, 16.0]], [-1, 0, 0], 10, 'chemical-placard-rear');

  // ==========================================
  // PASS 5: Rooftop Emergency Strobe Lightbar, Mirrors & Polish
  // ==========================================

  // Rooftop Emergency Strobe Lightbar (Amber & Cyan High-Intensity LED Strobe)
  addBox(6.0, 10.0, -7.5, 7.5, 19.0, 20.8, 6, 'roof-strobe-lightbar');
  addBox(5.0, 11.0, -8.0, 8.0, 18.5, 19.0, 1, 'roof-lightbar-mount');

  // Commercial West Coast Heavy Side Towing Mirrors
  // Left Mirror
  addBox(12.0, 14.0, 11.5, 12.0, 13.0, 17.0, 4, 'towing-mirror-left');
  addCylinder('Y', [13.0, 9.5, 16.5], [13.0, 11.5, 16.5], 0.2, 6, 7, 'mirror-arm-top-left', true, true);
  addCylinder('Y', [13.0, 9.5, 13.5], [13.0, 11.5, 13.5], 0.2, 6, 7, 'mirror-arm-bot-left', true, true);

  // Right Mirror
  addBox(12.0, 14.0, -12.0, -11.5, 13.0, 17.0, 4, 'towing-mirror-right');
  addCylinder('Y', [13.0, -11.5, 16.5], [13.0, -9.5, 16.5], 0.2, 6, 7, 'mirror-arm-top-right', true, true);
  addCylinder('Y', [13.0, -11.5, 13.5], [13.0, -9.5, 13.5], 0.2, 6, 7, 'mirror-arm-bot-right', true, true);

  // Diamond Plate Aluminum Side Steps & Catwalks
  addBox(0.0, 4.0, 9.5, 11.5, 4.5, 5.2, 11, 'catwalk-step-left');
  addBox(0.0, 4.0, -11.5, -9.5, 4.5, 5.2, 11, 'catwalk-step-right');

  // Fluid Pressure Gauge & Control Valve Manifold
  addBox(-1.5, -0.5, 6.0, 8.5, 8.5, 11.5, 13, 'pressure-gauge-manifold');
  // Emergency Manual Shut-Off Valve Wheel
  addCylinder('Y', [-1.0, 8.5, 10.0], [-1.0, 9.2, 10.0], 1.2, 10, 1, 'emergency-valve-wheel', true, true);

  // Rear Heavy Rubber Docking Bumpers
  addBox(-20.5, -19.5, -8.5, -5.5, 3.0, 6.0, 2, 'rear-bumper-dock-right');
  addBox(-20.5, -19.5, 5.5, 8.5, 3.0, 6.0, 2, 'rear-bumper-dock-left');

  return { vertices, normals, uvs, triangles, groups, materials };
}

module.exports = {
  createSweeperGeometry,
};
