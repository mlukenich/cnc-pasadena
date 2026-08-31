'use strict';

// 3D Hard-Surface Procedural Geometry Generator for The Monster Mudder Juggernaut
// Built across 5 iterative passes of mechanical and visual refinement.

function createMammothGeometry() {
  const vertices = [];
  const normals = [];
  const uvs = [];
  const triangles = [];
  const groups = [];
  const materials = [];

  // Atlas Coordinates (4x4 Grid):
  // 0: Paint (0, 0), 1: Chrome (1, 0), 2: Tire (2, 0), 3: Chassis (3, 0)
  // 4: Glass (0, 1), 5: Diamond (1, 1), 6: Blower (2, 1), 7: HeatShield (3, 1)
  // 8: Grille (0, 2), 9: DoorCrest (1, 2), 10: MDFlag (2, 2), 11: Subwoofer (3, 2)
  // 12: RocketPod (0, 3), 13: Muzzle (1, 3), 14: Winch (2, 3), 15: Rim (3, 3)
  const cellUV = (cx, cy) => {
    const pad = 0.008;
    const u0 = cx * 0.25 + pad, u1 = (cx + 1) * 0.25 - pad;
    const v0 = cy * 0.25 + pad, v1 = (cy + 1) * 0.25 - pad;
    return [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
  };

  const MAT_MAP = {
    PAINT: cellUV(0, 0),
    CHROME: cellUV(1, 0),
    TIRE: cellUV(2, 0),
    CHASSIS: cellUV(3, 0),
    GLASS: cellUV(0, 1),
    DIAMOND: cellUV(1, 1),
    BLOWER: cellUV(2, 1),
    HEAT_SHIELD: cellUV(3, 1),
    GRILLE: cellUV(0, 2),
    DOOR_CREST: cellUV(1, 2),
    MD_FLAG: cellUV(2, 2),
    SUBWOOFER: cellUV(3, 2),
    ROCKET_POD: cellUV(0, 3),
    MUZZLE: cellUV(1, 3),
    WINCH: cellUV(2, 3),
    RIM: cellUV(3, 3),
  };

  function addQuad(pts, n, matName, grpName, customUVs = null) {
    const start = vertices.length;
    const u = customUVs || MAT_MAP[matName] || MAT_MAP.CHASSIS;
    for (let i = 0; i < 4; i++) {
      vertices.push(pts[i]);
      normals.push(n);
      uvs.push(u[i]);
    }
    triangles.push([start, start + 1, start + 2]);
    triangles.push([start, start + 2, start + 3]);
    groups.push(grpName, grpName);
    materials.push(matName, matName);
  }

  function addTri(pts, n, matName, grpName, customUVs = null) {
    const start = vertices.length;
    const defUV = MAT_MAP[matName] || MAT_MAP.CHASSIS;
    const u = customUVs || [defUV[0], defUV[1], defUV[2]];
    for (let i = 0; i < 3; i++) {
      vertices.push(pts[i]);
      normals.push(n);
      uvs.push(u[i]);
    }
    triangles.push([start, start + 1, start + 2]);
    groups.push(grpName);
    materials.push(matName);
  }

  function addBox(c, s, matName, grpName) {
    const [x, y, z] = c;
    const [dx, dy, dz] = [s[0] / 2, s[1] / 2, s[2] / 2];
    // Front (+X)
    addQuad([[x + dx, y - dy, z - dz], [x + dx, y + dy, z - dz], [x + dx, y + dy, z + dz], [x + dx, y - dy, z + dz]], [1, 0, 0], matName, grpName);
    // Back (-X)
    addQuad([[x - dx, y + dy, z - dz], [x - dx, y - dy, z - dz], [x - dx, y - dy, z + dz], [x - dx, y + dy, z + dz]], [-1, 0, 0], matName, grpName);
    // Right (+Y)
    addQuad([[x + dx, y + dy, z - dz], [x - dx, y + dy, z - dz], [x - dx, y + dy, z + dz], [x + dx, y + dy, z + dz]], [0, 1, 0], matName, grpName);
    // Left (-Y)
    addQuad([[x - dx, y - dy, z - dz], [x + dx, y - dy, z - dz], [x + dx, y - dy, z + dz], [x - dx, y - dy, z + dz]], [0, -1, 0], matName, grpName);
    // Top (+Z)
    addQuad([[x - dx, y - dy, z + dz], [x + dx, y - dy, z + dz], [x + dx, y + dy, z + dz], [x - dx, y + dy, z + dz]], [0, 0, 1], matName, grpName);
    // Bottom (-Z)
    addQuad([[x - dx, y + dy, z - dz], [x + dx, y + dy, z - dz], [x + dx, y - dy, z - dz], [x - dx, y - dy, z - dz]], [0, 0, -1], matName, grpName);
  }

  function addCylinder(axis, p1, p2, radius, segs, matIdx, grpName, cap1 = true, cap2 = true) {
    const matName = typeof matIdx === 'string' ? matIdx : 'CHROME';
    const uvBox = MAT_MAP[matName] || MAT_MAP.CHROME;
    const u0 = uvBox[0][0], u1 = uvBox[1][0], v0 = uvBox[0][1], v1 = uvBox[2][1];

    const dx = p2[0] - p1[0], dy = p2[1] - p1[1], dz = p2[2] - p1[2];
    const len = Math.hypot(dx, dy, dz);
    if (len < 1e-6) return;
    const dir = [dx / len, dy / len, dz / len];

    let uAxis = [0, 0, 1];
    if (Math.abs(dir[2]) > 0.9) uAxis = [1, 0, 0];
    const vCross = [
      dir[1] * uAxis[2] - dir[2] * uAxis[1],
      dir[2] * uAxis[0] - dir[0] * uAxis[2],
      dir[0] * uAxis[1] - dir[1] * uAxis[0],
    ];
    const vLen = Math.hypot(...vCross);
    const rAxis = vCross.map(c => c / vLen);
    const uOrth = [
      rAxis[1] * dir[2] - rAxis[2] * dir[1],
      rAxis[2] * dir[0] - rAxis[0] * dir[2],
      rAxis[0] * dir[1] - rAxis[1] * dir[0],
    ];

    const ring1 = [], ring2 = [], nRing = [];
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      const ca = Math.cos(a), sa = Math.sin(a);
      const nr = [rAxis[0] * ca + uOrth[0] * sa, rAxis[1] * ca + uOrth[1] * sa, rAxis[2] * ca + uOrth[2] * sa];
      nRing.push(nr);
      ring1.push([p1[0] + nr[0] * radius, p1[1] + nr[1] * radius, p1[2] + nr[2] * radius]);
      ring2.push([p2[0] + nr[0] * radius, p2[1] + nr[1] * radius, p2[2] + nr[2] * radius]);
    }

    for (let i = 0; i < segs; i++) {
      const uFrac0 = u0 + (i / segs) * (u1 - u0);
      const uFrac1 = u0 + ((i + 1) / segs) * (u1 - u0);
      const start = vertices.length;

      vertices.push(ring1[i], ring1[i + 1], ring2[i + 1], ring2[i]);
      normals.push(nRing[i], nRing[i + 1], nRing[i + 1], nRing[i]);
      uvs.push([uFrac0, v0], [uFrac1, v0], [uFrac1, v1], [uFrac0, v1]);

      triangles.push([start, start + 1, start + 2]);
      triangles.push([start, start + 2, start + 3]);
      groups.push(grpName, grpName);
      materials.push(matName, matName);
    }

    if (cap1) {
      const cStart = vertices.length;
      const nCap = dir.map(c => -c);
      vertices.push(p1);
      normals.push(nCap);
      uvs.push([(u0 + u1) / 2, (v0 + v1) / 2]);
      for (let i = 0; i <= segs; i++) {
        vertices.push(ring1[i]);
        normals.push(nCap);
        const a = (i / segs) * Math.PI * 2;
        uvs.push([(u0 + u1) / 2 + Math.cos(a) * (u1 - u0) * 0.45, (v0 + v1) / 2 + Math.sin(a) * (v1 - v0) * 0.45]);
      }
      for (let i = 0; i < segs; i++) {
        triangles.push([cStart, cStart + 1 + i, cStart + 2 + i]);
        groups.push(grpName);
        materials.push(matName);
      }
    }

    if (cap2) {
      const c2Start = vertices.length;
      const nCap2 = dir;
      vertices.push(p2);
      normals.push(nCap2);
      uvs.push([(u0 + u1) / 2, (v0 + v1) / 2]);
      for (let i = 0; i <= segs; i++) {
        vertices.push(ring2[i]);
        normals.push(nCap2);
        const a = (i / segs) * Math.PI * 2;
        uvs.push([(u0 + u1) / 2 + Math.cos(a) * (u1 - u0) * 0.45, (v0 + v1) / 2 + Math.sin(a) * (v1 - v0) * 0.45]);
      }
      for (let i = 0; i < segs; i++) {
        triangles.push([c2Start, c2Start + 2 + i, c2Start + 1 + i]);
        groups.push(grpName);
        materials.push(matName);
      }
    }
  }

  // =========================================================================
  // PASS 1: Mega-Chassis, Chopped Squarebody Cab, 66" Wheels & Turret Base
  // =========================================================================

  // 1.1 Heavy Ladder Chassis Rails (Gunmetal steel)
  addBox([0.0, 6.5, 6.0], [54.0, 2.4, 2.8], 'CHASSIS', 'body-chassis-rail-left');
  addBox([0.0, -6.5, 6.0], [54.0, 2.4, 2.8], 'CHASSIS', 'body-chassis-rail-right');
  // Crossmembers
  [-22.0, -10.0, 0.0, 10.0, 22.0].forEach((cx, idx) => {
    addBox([cx, 0.0, 6.0], [2.2, 13.0, 2.2], 'CHASSIS', `body-chassis-cross-${idx}`);
  });
  // Center Monster Transfer Case
  addBox([0.0, 0.0, 5.0], [8.0, 7.0, 5.0], 'CHASSIS', 'body-transfer-case');

  // 1.2 Solid Monster Axles & 4-Link Suspension Hubs
  [-18.0, 18.0].forEach((axX, idx) => {
    const prefix = idx === 0 ? 'rear' : 'front';
    // Axle Tube
    addCylinder('Y', [axX, -16.0, 8.5], [axX, 16.0, 8.5], 2.0, 10, 'CHASSIS', `body-${prefix}-axle-tube`);
    // Differential Pumpkin
    addBox([axX, 0.0, 8.5], [6.0, 6.5, 6.0], 'CHASSIS', `body-${prefix}-diff-pumpkin`);
    // 4-Link Suspension Bars
    [-5.0, 5.0].forEach(sideY => {
      addCylinder('X', [axX - (idx === 0 ? -6.0 : 6.0), sideY, 6.0], [axX, sideY * 1.5, 8.5], 0.7, 8, 'CHROME', `body-${prefix}-susp-link`);
      // Heavy Dual Nitrogen Coilovers
      addCylinder('Z', [axX, sideY * 1.8, 8.5], [axX, sideY * 1.4, 13.5], 1.1, 8, 'CHROME', `body-${prefix}-coilover-main`);
      addCylinder('Z', [axX + 2.0, sideY * 1.8, 8.5], [axX + 2.0, sideY * 1.4, 13.5], 0.6, 6, 'CHASSIS', `body-${prefix}-coilover-res`);
    });
  });

  // 1.3 Chopped Squarebody Pasadena Truck Cab (Candy Apple Red & Glass)
  // Main Cab Body
  addBox([6.0, 0.0, 14.5], [18.0, 20.0, 8.0], 'PAINT', 'body-cab-lower');
  // Cab Roof (Chopped)
  addBox([4.5, 0.0, 19.5], [13.0, 18.5, 2.4], 'PAINT', 'body-cab-roof');
  // Front Windshield (Dark Solar Glass with Maryland Crab)
  addQuad([[11.0, -8.5, 14.5], [11.0, 8.5, 14.5], [8.5, 8.0, 19.0], [8.5, -8.0, 19.0]], [0.8, 0, 0.6], 'GLASS', 'body-windshield');
  // Rear Window
  addQuad([[-1.5, 7.8, 18.8], [-1.5, -7.8, 18.8], [-1.5, -8.0, 14.8], [-1.5, 8.0, 14.8]], [-1, 0, 0], 'GLASS', 'body-rear-window');
  // Side Windows (Left & Right)
  addQuad([[10.5, 9.1, 14.8], [0.0, 9.1, 14.8], [0.0, 8.8, 18.8], [8.0, 8.8, 18.8]], [0, 1, 0], 'GLASS', 'body-side-glass-left');
  addQuad([[0.0, -9.1, 14.8], [10.5, -9.1, 14.8], [8.0, -8.8, 18.8], [0.0, -8.8, 18.8]], [0, -1, 0], 'GLASS', 'body-side-glass-right');
  // Doors with "MONSTER MUDDER JUGGERNAUT" Crest
  addQuad([[12.0, 10.1, 11.0], [0.0, 10.1, 11.0], [0.0, 10.1, 15.0], [12.0, 10.1, 15.0]], [0, 1, 0], 'DOOR_CREST', 'body-door-left');
  addQuad([[0.0, -10.1, 11.0], [12.0, -10.1, 11.0], [12.0, -10.1, 15.0], [0.0, -10.1, 15.0]], [0, -1, 0], 'DOOR_CREST', 'body-door-right');

  // Front Hood & Grille
  addBox([20.0, 0.0, 13.0], [11.0, 19.0, 5.0], 'PAINT', 'body-hood');
  // Classic Chrome Billet Grille with Headlights
  addQuad([[25.6, -9.0, 10.5], [25.6, 9.0, 10.5], [25.6, 9.0, 15.5], [25.6, -9.0, 15.5]], [1, 0, 0], 'GRILLE', 'body-front-grille');

  // Open Truck Bed & Walls
  addBox([-14.0, 0.0, 10.5], [22.0, 20.0, 1.8], 'DIAMOND', 'body-bed-floor');
  addBox([-14.0, 9.5, 13.5], [22.0, 1.4, 4.5], 'PAINT', 'body-bed-wall-left');
  addBox([-14.0, -9.5, 13.5], [22.0, 1.4, 4.5], 'PAINT', 'body-bed-wall-right');
  // Front Bed Headboard
  addBox([-3.5, 0.0, 13.5], [1.2, 18.0, 4.5], 'PAINT', 'body-bed-headboard');

  // 1.4 Centrally Mounted Turret Pedestal / Traverse Base
  addCylinder('Z', [-2.0, 0.0, 11.0], [-2.0, 0.0, 15.5], 7.5, 16, 'CHASSIS', 'body-turret-pedestal');
  addBox([-2.0, 0.0, 15.2], [16.0, 16.0, 1.2], 'DIAMOND', 'body-turret-pedestal-catwalk');

  // 1.5 Massive 66-Inch Deep-Lug Tractor Tires & Deep-Dish Chrome Rims
  function addMonsterWheel(cx, cy, cz, grpPrefix) {
    const tireRadius = 8.5; // 66-inch monster tire in game scale
    const rimRadius = 4.8;
    const width = 8.0;
    const isLeft = cy > 0;
    const ySign = isLeft ? 1 : -1;

    // Tread & Sidewalls
    addCylinder('Y', [cx, cy - (width / 2) * ySign, cz], [cx, cy + (width / 2) * ySign, cz], tireRadius, 18, 'TIRE', `${grpPrefix}-tread`, false, false);
    // Outer & Inner Sidewall Cones
    addCylinder('Y', [cx, cy + (width / 2) * ySign, cz], [cx, cy + ((width / 2) - 1.2) * ySign, cz], tireRadius, 18, 'TIRE', `${grpPrefix}-sidewall-outer`, false, false);
    addCylinder('Y', [cx, cy - (width / 2) * ySign, cz], [cx, cy - ((width / 2) - 1.2) * ySign, cz], tireRadius, 18, 'TIRE', `${grpPrefix}-sidewall-inner`, false, false);

    // Deep-Dish Chrome Beadlock Rim Face
    const rimY = cy + (width / 2) * ySign;
    addCylinder('Y', [cx, rimY - 2.5 * ySign, cz], [cx, rimY, cz], rimRadius, 16, 'RIM', `${grpPrefix}-rim-outer`, true, false);
    // Inner Rim
    addCylinder('Y', [cx, cy - (width / 2) * ySign, cz], [cx, cy - ((width / 2) - 2.0) * ySign, cz], rimRadius, 16, 'CHROME', `${grpPrefix}-rim-inner`, true, false);

    // 10 Heavy Billet Chrome Lug Nuts & Center Hub Spindle
    addCylinder('Y', [cx, rimY - 3.0 * ySign, cz], [cx, rimY + 0.8 * ySign, cz], 1.4, 8, 'CHROME', `${grpPrefix}-hub-center`, true, true);
  }

  addMonsterWheel(18.0, 17.0, 8.5, 'wheel-front-left');
  addMonsterWheel(18.0, -17.0, 8.5, 'wheel-front-right');
  addMonsterWheel(-18.0, 17.0, 8.5, 'wheel-rear-left');
  addMonsterWheel(-18.0, -17.0, 8.5, 'wheel-rear-right');

  // Skirt flaps for TankDraw track simulation
  addBox([0.0, 14.5, 4.0], [42.0, 0.4, 3.5], 'CHASSIS', 'skirt-treads-left');
  addBox([0.0, -14.5, 4.0], [42.0, 0.4, 3.5], 'CHASSIS', 'skirt-treads-right');

  // =========================================================================
  // PASS 2: Dual Supercharged Big-Block V8 Engines & Chrome Smokestacks
  // =========================================================================

  // Twin V8 Engines emerging through the hood
  [-4.2, 4.2].forEach((engY, engIdx) => {
    const side = engIdx === 0 ? 'right' : 'left';
    // Engine Block
    addBox([18.0, engY, 15.5], [8.0, 4.2, 3.5], 'CHASSIS', `body-engine-block-${side}`);
    // Polished Blower Housing
    addBox([18.0, engY, 17.8], [7.0, 3.6, 1.8], 'CHROME', `body-blower-case-${side}`);
    // Red Butterfly Bug-Catcher Scoop
    addBox([19.5, engY, 19.2], [3.5, 3.8, 1.4], 'BLOWER', `body-blower-scoop-${side}`);
    // Front Drive Pulley & Belt
    addCylinder('X', [22.2, engY, 16.5], [23.2, engY, 16.5], 1.6, 10, 'CHROME', `body-pulley-belt-${side}`);
  });

  // Massive Twin 8-Inch High-Rise Mirror Chrome Smokestacks
  [-11.5, 11.5].forEach((stackY, sIdx) => {
    const side = sIdx === 0 ? 'right' : 'left';
    // Lower Manifold
    addCylinder('Y', [12.0, stackY * 0.7, 7.5], [12.0, stackY, 7.5], 1.2, 8, 'CHROME', `body-exhaust-pipe-${side}`);
    // Vertical Main Smokestack Tube
    addCylinder('Z', [12.0, stackY, 7.5], [12.0, stackY, 26.0], 1.4, 12, 'CHROME', `body-smokestack-${side}`);
    // Perforated Stainless Heat Shield
    addCylinder('Z', [12.0, stackY, 10.0], [12.0, stackY, 20.0], 1.8, 12, 'HEAT_SHIELD', `body-exhaust-shield-${side}`, false, false);
    // Exhaust Flapper Rain Cap (Angle cut at top)
    addCylinder('X', [11.0, stackY, 26.0], [13.2, stackY, 26.0], 1.5, 8, 'CHROME', `body-exhaust-flapper-${side}`);
  });

  // =========================================================================
  // PASS 3: Twin Heavy Old Bay Cannons & Dual 6-Tube Rocket Launch Pods
  // =========================================================================

  // 3.1 Main Armored Naval Turret Body (Turret Yaw on Bone_Turret at [-2, 0, 15.5])
  // Lower Turret Hull
  addBox([-2.0, 0.0, 17.5], [18.0, 17.0, 3.8], 'PAINT', 'turret-hull-main');
  // Upper Sloped Armor Deck
  addBox([-3.5, 0.0, 20.0], [14.0, 15.0, 2.2], 'PAINT', 'turret-hull-top');
  // Rear Bustle Ammo Counterweight Box
  addBox([-11.0, 0.0, 18.5], [5.0, 14.0, 4.0], 'CHASSIS', 'turret-rear-bustle');
  // Top Commander Hatch & Periscopes
  addCylinder('Z', [-3.0, 4.0, 21.0], [-3.0, 4.0, 22.2], 2.2, 10, 'CHROME', 'turret-commander-hatch');
  // Old Bay Seasoning Faction Decal Plates on Turret Sides
  addQuad([[-8.0, 8.6, 16.5], [3.0, 8.6, 16.5], [3.0, 8.6, 20.0], [-8.0, 8.6, 20.0]], [0, 1, 0], 'MD_FLAG', 'turret-decal-plate-left');
  addQuad([[3.0, -8.6, 16.5], [-8.0, -8.6, 16.5], [-8.0, -8.6, 20.0], [3.0, -8.6, 20.0]], [0, -1, 0], 'MD_FLAG', 'turret-decal-plate-right');

  // 3.2 Elevating Gun Mantlet (Bone_Rails at [7.0, 0.0, 19.0])
  addBox([7.0, 0.0, 19.0], [5.5, 12.0, 4.2], 'CHASSIS', 'rails-mantlet-block');
  addCylinder('Y', [7.0, -6.5, 19.0], [7.0, 6.5, 19.0], 1.6, 10, 'CHROME', 'rails-mantlet-pivot-trunnion');

  // 3.3 Twin Heavy Rifled Old Bay Pneumatic Cannons (Bone_Barrel_01, Bone_Barrel_02)
  [-4.2, 4.2].forEach((bY, bIdx) => {
    const side = bIdx === 0 ? 'right' : 'left';
    const barrelGrp = `barrel-${side}`;
    const barrelBone = bIdx === 0 ? 'barrel-right' : 'barrel-left';

    // Barrel Base Collar
    addCylinder('X', [9.5, bY, 19.0], [13.0, bY, 19.0], 2.2, 12, 'CHASSIS', `${barrelBone}-collar`);
    // Main Heavy Rifled Tube
    addCylinder('X', [13.0, bY, 19.0], [34.0, bY, 19.0], 1.5, 12, 'CHROME', `${barrelBone}-tube`);
    // Pressurized High-Velocity Reinforcement Sleeve
    addCylinder('X', [14.0, bY, 19.0], [22.0, bY, 19.0], 1.8, 12, 'HEAT_SHIELD', `${barrelBone}-sleeve`);
    // Slotted Heavy Muzzle Brake Compensator
    addCylinder('X', [34.0, bY, 19.0], [38.5, bY, 19.0], 2.1, 12, 'MUZZLE', `${barrelBone}-muzzle`);
    // Pneumatic Old Bay Spice Injection Feed Tube
    addCylinder('X', [10.0, bY + (bIdx === 0 ? -1.8 : 1.8), 20.2], [24.0, bY + (bIdx === 0 ? -1.8 : 1.8), 20.2], 0.5, 6, 'CHROME', `${barrelBone}-feed-tube`);
  });

  // 3.4 Dual 6-Tube Articulated Rocket Launch Pods (Turret01 at [12, 16.5, 17.5], Turret02 at [12, -16.5, 17.5])
  [-16.5, 16.5].forEach((podY, pIdx) => {
    const side = pIdx === 0 ? 'right' : 'left';
    const podGrp = `pod-${side}`;
    const podX = 12.0, podZ = 17.5;

    // Articulated Mounting Riser Arm
    addCylinder('Y', [podX, podY > 0 ? 10.0 : -10.0, podZ], [podX, podY, podZ], 1.2, 8, 'CHASSIS', `${podGrp}-mounting-arm`);
    // Pod Armored Box
    addBox([podX, podY, podZ], [10.0, 6.0, 5.0], 'CHASSIS', `${podGrp}-box`);
    // Front Rocket Launch Faceplate with 6 Red Warheads
    addQuad([[podX + 5.1, podY - 2.8, podZ - 2.3], [podX + 5.1, podY + 2.8, podZ - 2.3], [podX + 5.1, podY + 2.8, podZ + 2.3], [podX + 5.1, podY - 2.8, podZ + 2.3]], [1, 0, 0], 'ROCKET_POD', `${podGrp}-faceplate`);
    // Rear Exhaust Blast Vents
    addQuad([[podX - 5.1, podY + 2.8, podZ - 2.3], [podX - 5.1, podY - 2.8, podZ - 2.3], [podX - 5.1, podY - 2.8, podZ + 2.3], [podX - 5.1, podY + 2.8, podZ + 2.3]], [-1, 0, 0], 'HEAT_SHIELD', `${podGrp}-exhaust-vents`);
  });

  // =========================================================================
  // PASS 4: 5,000-Watt Tailgate Subwoofer Sonic Array & Audio Enclosure
  // =========================================================================

  // Subwoofer Acoustic Box installed in rear truck bed
  addBox([-17.0, 0.0, 13.5], [8.0, 17.0, 5.0], 'CHASSIS', 'body-subwoofer-enclosure');
  // Tailgate Subwoofer Speaker Faceplate (Four 15-inch excursion subwoofers)
  addQuad([[-25.1, 8.5, 11.0], [-25.1, -8.5, 11.0], [-25.1, -8.5, 16.0], [-25.1, 8.5, 16.0]], [-1, 0, 0], 'SUBWOOFER', 'body-tailgate-subwoofer-face');
  // Polished Chrome Billet Amplifier with Cooling Fins
  addBox([-14.0, 0.0, 16.5], [4.0, 10.0, 1.2], 'CHROME', 'body-amplifier-rack');
  // Tuned Bass Reflex Air Ports (Dual Chrome Bezels)
  addCylinder('X', [-24.5, -6.5, 9.5], [-25.2, -6.5, 9.5], 1.2, 8, 'CHROME', 'body-bass-port-left');
  addCylinder('X', [-24.5, 6.5, 9.5], [-25.2, 6.5, 9.5], 1.2, 8, 'CHROME', 'body-bass-port-right');

  // =========================================================================
  // PASS 5: External Exo-Rollcage, Catwalks, Heavy Winch Bumper & Finishing
  // =========================================================================

  // 5.1 Heavy Tubular External Exo-Rollcage (Mirror Chrome)
  const cageRad = 0.55;
  // A-Pillar Tubes
  addCylinder('Z', [10.5, 10.2, 11.0], [8.0, 9.2, 20.0], cageRad, 8, 'CHROME', 'body-rollcage-a-left');
  addCylinder('Z', [10.5, -10.2, 11.0], [8.0, -9.2, 20.0], cageRad, 8, 'CHROME', 'body-rollcage-a-right');
  // B-Pillar Tubes
  addCylinder('Z', [0.0, 10.2, 11.0], [0.0, 9.2, 20.0], cageRad, 8, 'CHROME', 'body-rollcage-b-left');
  addCylinder('Z', [0.0, -10.2, 11.0], [0.0, -9.2, 20.0], cageRad, 8, 'CHROME', 'body-rollcage-b-right');
  // Bed Sports Bar C-Pillar Tubes
  addCylinder('X', [0.0, 9.2, 20.0], [-23.0, 10.2, 11.0], cageRad, 8, 'CHROME', 'body-rollcage-c-left');
  addCylinder('X', [0.0, -9.2, 20.0], [-23.0, -10.2, 11.0], cageRad, 8, 'CHROME', 'body-rollcage-c-right');
  // Roof Crossbars
  addCylinder('Y', [8.0, -9.2, 20.0], [8.0, 9.2, 20.0], cageRad, 8, 'CHROME', 'body-rollcage-cross-front');
  addCylinder('Y', [0.0, -9.2, 20.0], [0.0, 9.2, 20.0], cageRad, 8, 'CHROME', 'body-rollcage-cross-rear');

  // 5.2 Diamond-Plate Aluminum Catwalks & Stirrup Side Access Steps
  addBox([5.0, 11.2, 10.0], [16.0, 2.5, 0.6], 'DIAMOND', 'body-catwalk-left');
  addBox([5.0, -11.2, 10.0], [16.0, 2.5, 0.6], 'DIAMOND', 'body-catwalk-right');
  // Stirrup drop steps
  addBox([5.0, 12.0, 7.5], [6.0, 1.2, 0.4], 'CHROME', 'body-drop-step-left');
  addBox([5.0, -12.0, 7.5], [6.0, 1.2, 0.4], 'CHROME', 'body-drop-step-right');

  // 5.3 Heavy Front Steel Cowcatcher Bumper & 12,000-lb Winch
  addBox([26.5, 0.0, 8.5], [3.0, 24.0, 4.0], 'CHASSIS', 'body-winch-bumper-main');
  // Angled Bumper Wings
  addBox([25.0, 12.5, 8.5], [4.0, 3.0, 4.0], 'CHASSIS', 'body-bumper-wing-left');
  addBox([25.0, -12.5, 8.5], [4.0, 3.0, 4.0], 'CHASSIS', 'body-bumper-wing-right');
  // Winch Housing & Spool Cable
  addBox([28.0, 0.0, 8.5], [2.2, 7.0, 2.5], 'WINCH', 'body-winch-spool');
  // Heavy Forged Recovery Shackles (Left & Right)
  addCylinder('Y', [28.2, -8.0, 7.5], [28.2, -6.5, 7.5], 0.6, 6, 'CHROME', 'body-tow-shackle-left');
  addCylinder('Y', [28.2, 6.5, 7.5], [28.2, 8.0, 7.5], 0.6, 6, 'CHROME', 'body-tow-shackle-right');

  // 5.4 Dual Spring-Mounted CB Whip Antennas
  addCylinder('Z', [-2.0, 9.8, 15.0], [-2.0, 9.8, 28.0], 0.15, 6, 'CHROME', 'body-antenna-left');
  addCylinder('Z', [-2.0, -9.8, 15.0], [-2.0, -9.8, 28.0], 0.15, 6, 'CHROME', 'body-antenna-right');

  return { vertices, normals, uvs, triangles, groups, materials };
}

module.exports = { createMammothGeometry };
