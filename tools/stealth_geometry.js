'use strict';

// 5-Pass Procedural 3D Geometry Generator for Columbia Active-Camouflage HOA Surveillance Cruiser

function createStealthGeometry() {
  const vertices = [];
  const normals = [];
  const uvs = [];
  const triangles = [];
  const groups = [];
  const materials = [];

  function uvCell(cellX, cellY, uLocal, vLocal) {
    const u = (cellX + Math.max(0.01, Math.min(0.99, uLocal))) / 4.0;
    const v = ((3 - cellY) + Math.max(0.01, Math.min(0.99, vLocal))) / 4.0;
    return [u, v];
  }

  function addQuad(p0, p1, p2, p3, norm, uv0, uv1, uv2, uv3, group, mat = 'ObjectsGDI') {
    const base = vertices.length;
    vertices.push(p0, p1, p2, p3);
    normals.push(norm, norm, norm, norm);
    uvs.push(uv0, uv1, uv2, uv3);
    triangles.push([base, base + 1, base + 2], [base, base + 2, base + 3]);
    groups.push(group, group);
    materials.push(mat, mat);
  }

  function addTri(p0, p1, p2, norm, uv0, uv1, uv2, group, mat = 'ObjectsGDI') {
    const base = vertices.length;
    vertices.push(p0, p1, p2);
    normals.push(norm, norm, norm);
    uvs.push(uv0, uv1, uv2);
    triangles.push([base, base + 1, base + 2]);
    groups.push(group);
    materials.push(mat);
  }

  function addBox(min, max, cellX, cellY, group, mat = 'ObjectsGDI') {
    const [x0, y0, z0] = min;
    const [x1, y1, z1] = max;

    // +X Front
    addQuad(
      [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1],
      [1, 0, 0],
      uvCell(cellX, cellY, 0, 0), uvCell(cellX, cellY, 1, 0), uvCell(cellX, cellY, 1, 1), uvCell(cellX, cellY, 0, 1),
      group, mat
    );
    // -X Rear
    addQuad(
      [x0, y1, z0], [x0, y0, z0], [x0, y0, z1], [x0, y1, z1],
      [-1, 0, 0],
      uvCell(cellX, cellY, 0, 0), uvCell(cellX, cellY, 1, 0), uvCell(cellX, cellY, 1, 1), uvCell(cellX, cellY, 0, 1),
      group, mat
    );
    // +Y Left
    addQuad(
      [x1, y1, z0], [x0, y1, z0], [x0, y1, z1], [x1, y1, z1],
      [0, 1, 0],
      uvCell(cellX, cellY, 0, 0), uvCell(cellX, cellY, 1, 0), uvCell(cellX, cellY, 1, 1), uvCell(cellX, cellY, 0, 1),
      group, mat
    );
    // -Y Right
    addQuad(
      [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1],
      [0, -1, 0],
      uvCell(cellX, cellY, 0, 0), uvCell(cellX, cellY, 1, 0), uvCell(cellX, cellY, 1, 1), uvCell(cellX, cellY, 0, 1),
      group, mat
    );
    // +Z Top
    addQuad(
      [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1],
      [0, 0, 1],
      uvCell(cellX, cellY, 0, 0), uvCell(cellX, cellY, 1, 0), uvCell(cellX, cellY, 1, 1), uvCell(cellX, cellY, 0, 1),
      group, mat
    );
    // -Z Bottom
    addQuad(
      [x0, y1, z0], [x1, y1, z0], [x1, y0, z0], [x0, y0, z0],
      [0, 0, -1],
      uvCell(cellX, cellY, 0, 0), uvCell(cellX, cellY, 1, 0), uvCell(cellX, cellY, 1, 1), uvCell(cellX, cellY, 0, 1),
      group, mat
    );
  }

  function addCylinder(center, radius, height, axis, segments, cellX, cellY, group, mat = 'ObjectsGDI') {
    const [cx, cy, cz] = center;
    for (let i = 0; i < segments; i++) {
      const a0 = (i / segments) * Math.PI * 2;
      const a1 = ((i + 1) / segments) * Math.PI * 2;
      const u0 = i / segments, u1 = (i + 1) / segments;

      if (axis === 'Y') {
        const c0 = Math.cos(a0) * radius, s0 = Math.sin(a0) * radius;
        const c1 = Math.cos(a1) * radius, s1 = Math.sin(a1) * radius;
        const y0 = cy - height / 2, y1 = cy + height / 2;

        // Wall
        addQuad(
          [cx + c0, y1, cz + s0], [cx + c0, y0, cz + s0], [cx + c1, y0, cz + s1], [cx + c1, y1, cz + s1],
          [(c0 + c1) / 2 / radius, 0, (s0 + s1) / 2 / radius],
          uvCell(cellX, cellY, u0, 1), uvCell(cellX, cellY, u0, 0), uvCell(cellX, cellY, u1, 0), uvCell(cellX, cellY, u1, 1),
          group, mat
        );
        // Outer Cap (+Y if cy > 0, -Y if cy < 0)
        if (cy > 0) {
          addTri(
            [cx, y1, cz], [cx + c0, y1, cz + s0], [cx + c1, y1, cz + s1],
            [0, 1, 0],
            uvCell(3, 3, 0.5, 0.5), uvCell(3, 3, 0.5 + Math.cos(a0) * 0.45, 0.5 + Math.sin(a0) * 0.45), uvCell(3, 3, 0.5 + Math.cos(a1) * 0.45, 0.5 + Math.sin(a1) * 0.45),
            group, mat
          );
        } else {
          addTri(
            [cx, y0, cz], [cx + c1, y0, cz + s1], [cx + c0, y0, cz + s0],
            [0, -1, 0],
            uvCell(3, 3, 0.5, 0.5), uvCell(3, 3, 0.5 + Math.cos(a1) * 0.45, 0.5 + Math.sin(a1) * 0.45), uvCell(3, 3, 0.5 + Math.cos(a0) * 0.45, 0.5 + Math.sin(a0) * 0.45),
            group, mat
          );
        }
      } else if (axis === 'Z') {
        const c0 = Math.cos(a0) * radius, s0 = Math.sin(a0) * radius;
        const c1 = Math.cos(a1) * radius, s1 = Math.sin(a1) * radius;
        const z0 = cz - height / 2, z1 = cz + height / 2;

        addQuad(
          [cx + c0, cy + s0, z0], [cx + c1, cy + s1, z0], [cx + c1, cy + s1, z1], [cx + c0, cy + s0, z1],
          [(c0 + c1) / 2 / radius, (s0 + s1) / 2 / radius, 0],
          uvCell(cellX, cellY, u0, 0), uvCell(cellX, cellY, u1, 0), uvCell(cellX, cellY, u1, 1), uvCell(cellX, cellY, u0, 1),
          group, mat
        );
        // Top Cap (+Z)
        addTri(
          [cx, cy, z1], [cx + c0, cy + s0, z1], [cx + c1, cy + s1, z1],
          [0, 0, 1],
          uvCell(0, 3, 0.5, 0.5), uvCell(0, 3, 0.5 + Math.cos(a0) * 0.45, 0.5 + Math.sin(a0) * 0.45), uvCell(0, 3, 0.5 + Math.cos(a1) * 0.45, 0.5 + Math.sin(a1) * 0.45),
          group, mat
        );
      } else if (axis === 'X') {
        const c0 = Math.cos(a0) * radius, s0 = Math.sin(a0) * radius;
        const c1 = Math.cos(a1) * radius, s1 = Math.sin(a1) * radius;
        const x0 = cx - height / 2, x1 = cx + height / 2;

        addQuad(
          [x0, cy + c0, cz + s0], [x0, cy + c1, cz + s1], [x1, cy + c1, cz + s1], [x1, cy + c0, cz + s0],
          [0, (c0 + c1) / 2 / radius, (s0 + s1) / 2 / radius],
          uvCell(cellX, cellY, u0, 0), uvCell(cellX, cellY, u1, 0), uvCell(cellX, cellY, u1, 1), uvCell(cellX, cellY, u0, 1),
          group, mat
        );
        // Front Cap (+X)
        addTri(
          [x1, cy, cz], [x1, cy + c0, cz + s0], [x1, cy + c1, cz + s1],
          [1, 0, 0],
          uvCell(2, 1, 0.5, 0.5), uvCell(2, 1, 0.5 + Math.cos(a0) * 0.45, 0.5 + Math.sin(a0) * 0.45), uvCell(2, 1, 0.5 + Math.cos(a1) * 0.45, 0.5 + Math.sin(a1) * 0.45),
          group, mat
        );
      }
    }
  }

  // ==========================================
  // PASS 1: Stealth Wedge Cyber Van Hull & Wheels
  // ==========================================
  // Lower body chassis: X: [-20, 16], Y: [-9.5, 9.5], Z: [2.5, 7.5]
  addBox([-20, -9.5, 2.5], [16, 9.5, 7.5], 0, 0, 'body-lower'); // Pearl White Paint

  // Sloped aerodynamic hood wedge (slopes down from X=4, Z=9.5 to X=20, Z=4.0)
  addQuad(
    [4, -9.0, 9.5], [20, -8.5, 4.0], [20, 8.5, 4.0], [4, 9.0, 9.5],
    [0.32, 0, 0.95],
    uvCell(0, 0, 0, 0), uvCell(0, 0, 1, 0), uvCell(0, 0, 1, 1), uvCell(0, 0, 0, 1),
    'body-hood'
  );
  // Hood left slope
  addTri(
    [4, 9.0, 9.5], [20, 8.5, 4.0], [4, 9.0, 7.5],
    [0, 0.95, 0.31],
    uvCell(0, 0, 0, 1), uvCell(0, 0, 1, 0), uvCell(0, 0, 0, 0),
    'body-hood'
  );
  // Hood right slope
  addTri(
    [4, -9.0, 9.5], [4, -9.0, 7.5], [20, -8.5, 4.0],
    [0, -0.95, 0.31],
    uvCell(0, 0, 0, 1), uvCell(0, 0, 0, 0), uvCell(0, 0, 1, 0),
    'body-hood'
  );

  // Cabin Upper Greenhouse / Roof (X: [-16, 4], Y: [-7.5, 7.5], Z: [7.5, 11.0])
  addBox([-16, -7.5, 7.5], [4, 7.5, 11.0], 0, 0, 'body-cabin');

  // Raked Windshield: X=4, Z=9.5 to X=-2, Z=11.0
  addQuad(
    [4, -7.2, 9.5], [ -2, -6.8, 11.0], [ -2, 6.8, 11.0], [4, 7.2, 9.5],
    [0.24, 0, 0.97],
    uvCell(0, 1, 0, 0), uvCell(0, 1, 1, 0), uvCell(0, 1, 1, 1), uvCell(0, 1, 0, 1),
    'body-windshield'
  );

  // Cabin Left Side Windows
  addQuad(
    [-15.5, 7.6, 8.0], [-2, 7.6, 8.0], [-2, 6.9, 10.8], [-15.5, 6.9, 10.8],
    [0, 1, 0],
    uvCell(0, 1, 0, 0), uvCell(0, 1, 1, 0), uvCell(0, 1, 1, 1), uvCell(0, 1, 0, 1),
    'body-window-l'
  );
  // Cabin Right Side Windows
  addQuad(
    [-2, -7.6, 8.0], [-15.5, -7.6, 8.0], [-15.5, -6.9, 10.8], [-2, -6.9, 10.8],
    [0, -1, 0],
    uvCell(0, 1, 0, 0), uvCell(0, 1, 1, 0), uvCell(0, 1, 1, 1), uvCell(0, 1, 0, 1),
    'body-window-r'
  );

  // Center Turret Elevating Launcher Riser Base
  addBox([-6, -4.5, 11.0], [2, 4.5, 12.5], 2, 0, 'turret-base'); // Carbon fiber riser
  addBox([-5, -3.5, 12.5], [1, 3.5, 13.8], 3, 0, 'turret-actuator'); // Anodized cyan actuator pivot

  // 4 Aerodynamic Flush Aero-Disc Wheels (Radius: 4.2, Width: 2.8) with 24 segments
  const wheelRadius = 4.2;
  const wheelWidth = 2.8;

  addCylinder([0, 0, 0], wheelRadius, wheelWidth, 'Y', 24, 1, 1, 'wheel-front-left');
  addCylinder([0, 0, 0], wheelRadius, wheelWidth, 'Y', 24, 1, 1, 'wheel-front-right');
  addCylinder([0, 0, 0], wheelRadius, wheelWidth, 'Y', 24, 1, 1, 'wheel-rear-left');
  addCylinder([0, 0, 0], wheelRadius, wheelWidth, 'Y', 24, 1, 1, 'wheel-rear-right');

  // Wheel Arch Aero Fairing Cowls (4 corners on Body)
  const arches = [
    [12.0, 9.8], [12.0, -9.8], [-12.0, 9.8], [-12.0, -9.8]
  ];
  arches.forEach(([ax, ay], i) => {
    addBox([ax - 5.0, ay > 0 ? ay - 0.2 : ay - 0.8, 4.0], [ax + 5.0, ay > 0 ? ay + 0.8 : ay + 0.2, 8.0], 2, 0, `body-arch-${i}`);
  });

  // ==========================================
  // PASS 2: Pop-Up Dual 4-Tube Citation Missile Launchers
  // ==========================================
  // Left Launcher Pod (`LAUNCHER_L` / `FXWeaponL` at [4.0, 7.5, 3.5] relative to Turret)
  // World launcher left origin: Turret [-2, 0, 11.5] + FXWeaponL [4, 7.5, 3.5] = [2, 7.5, 15.0]
  addBox([-6, -2.2, -1.9], [6, 2.2, 1.9], 3, 0, 'launcher-left'); // Anodized Cyan Pod Housing
  // Stealth Chamfered Nose Cones on Pod
  addBox([6.0, -2.0, -1.7], [6.8, 2.0, 1.7], 2, 0, 'launcher-left-bezel');

  const tubeOffsets = [
    [-1.0, 0.9], [1.0, 0.9],
    [-1.0, -0.9], [1.0, -0.9],
  ];
  tubeOffsets.forEach(([ty, tz], i) => {
    addCylinder([6.8, ty, tz], 0.75, 1.2, 'X', 16, 2, 1, `launcher-left-tube-${i}`);
    // Rocket Warhead Tip
    addCylinder([7.4, ty, tz], 0.55, 0.8, 'X', 12, 3, 0, `launcher-left-warhead-${i}`);
  });
  // Pod Rear Blast Diffuser Vent
  addBox([-6.8, -1.8, -1.5], [-6.0, 1.8, 1.5], 1, 3, 'launcher-left-exhaust');

  // Right Launcher Pod (`LAUNCHER_R` / `FXWeaponR` at [4.0, -7.5, 3.5] relative to Turret)
  addBox([-6, -2.2, -1.9], [6, 2.2, 1.9], 3, 0, 'launcher-right');
  addBox([6.0, -2.0, -1.7], [6.8, 2.0, 1.7], 2, 0, 'launcher-right-bezel');
  tubeOffsets.forEach(([ty, tz], i) => {
    addCylinder([6.8, ty, tz], 0.75, 1.2, 'X', 16, 2, 1, `launcher-right-tube-${i}`);
    addCylinder([7.4, ty, tz], 0.55, 0.8, 'X', 12, 3, 0, `launcher-right-warhead-${i}`);
  });
  addBox([-6.8, -1.8, -1.5], [-6.0, 1.8, 1.5], 1, 3, 'launcher-right-exhaust');

  // ==========================================
  // PASS 3: 360° LiDAR Periscope Dome & Solar Roof Matrix
  // ==========================================
  // Retractable Rooftop LiDAR Optical Periscope Mast & Dome (`LIDAR_MAST` on Body at [0.0, 0.0, 12.0])
  addCylinder([0.0, 0.0, 11.4], 1.6, 0.8, 'Z', 24, 2, 0, 'lidar-mast'); // Carbon riser base
  addCylinder([0.0, 0.0, 12.2], 1.8, 0.8, 'Z', 24, 0, 3, 'lidar-mast'); // Multi-spectral optical dome
  addCylinder([0.0, 0.0, 12.8], 1.4, 0.4, 'Z', 24, 3, 0, 'lidar-mast'); // Top anodized cap

  // Solar Photovoltaic Roof Charging Panels across upper deck
  addQuad(
    [-15.0, -6.5, 11.05], [ -3.0, -6.5, 11.05], [ -3.0, 6.5, 11.05], [-15.0, 6.5, 11.05],
    [0, 0, 1],
    uvCell(0, 1, 0, 0), uvCell(0, 1, 1, 0), uvCell(0, 1, 1, 1), uvCell(0, 1, 0, 1),
    'body-solar-roof'
  );
  // Solar Panel Carbon Trim Frame
  addBox([-15.4, -6.8, 11.0], [-2.6, 6.8, 11.04], 2, 0, 'body-solar-frame');

  // ==========================================
  // PASS 4: Ground-Effect Active-Camo Skirts, Diffuser & Citation Printer
  // ==========================================
  // Left Ground-Effect Active-Camo Skirt (Glowing Cyan Hex Matrix)
  addBox([-19.5, 9.2, 1.2], [17.5, 10.2, 3.2], 1, 0, 'body-skirt-left');
  // Right Ground-Effect Active-Camo Skirt
  addBox([-19.5, -10.2, 1.2], [17.5, -9.2, 3.2], 1, 0, 'body-skirt-right');

  // Ground-Effect Aero Winglet Strakes
  addBox([15.0, 10.0, 1.2], [18.0, 10.8, 4.5], 2, 0, 'body-strake-l');
  addBox([15.0, -10.8, 1.2], [18.0, -10.0, 4.5], 2, 0, 'body-strake-r');
  addBox([-19.5, 10.0, 1.2], [-16.5, 10.8, 4.5], 2, 0, 'body-strake-rl');
  addBox([-19.5, -10.8, 1.2], [-16.5, -10.0, 4.5], 2, 0, 'body-strake-rr');

  // Rear Aerodynamic Diffuser & Citation Printer Ejection Slot
  addQuad(
    [-20.0, 9.5, 2.5], [-20.0, -9.5, 2.5], [-20.0, -9.5, 7.5], [-20.0, 9.5, 7.5],
    [-1, 0, 0],
    uvCell(3, 2, 0, 0), uvCell(3, 2, 1, 0), uvCell(3, 2, 1, 1), uvCell(3, 2, 0, 1),
    'body-rear-fascia'
  );
  // Rear carbon fiber aero under-diffuser vanes
  addBox([-21.5, -7.0, 1.0], [-19.5, 7.0, 2.5], 1, 3, 'body-diffuser');
  // Rear Slim Carbon Spoiler Winglet
  addBox([-20.5, -8.0, 8.5], [-18.5, 8.0, 9.2], 2, 0, 'body-rear-spoiler');

  // ==========================================
  // PASS 5: Front Fascia LiDAR Scanner, Side Cameras & Columbia HOA Markings
  // ==========================================
  // Front Bumper & LiDAR Laser Radar Scanner Bar (X = 20.0, Z: [2.5, 4.5])
  addQuad(
    [20.0, -8.5, 2.5], [20.0, 8.5, 2.5], [20.0, 8.5, 4.0], [20.0, -8.5, 4.0],
    [1, 0, 0],
    uvCell(0, 2, 0, 0), uvCell(0, 2, 1, 0), uvCell(0, 2, 1, 1), uvCell(0, 2, 0, 1),
    'body-front-fascia'
  );

  // Front Chin Aerodynamic Splitter Plate (X: [18.0, 22.0], Y: [-9.0, 9.0], Z: [1.2, 2.5])
  addBox([18.0, -9.0, 1.2], [22.0, 9.0, 2.4], 2, 0, 'body-front-splitter');

  // Left Door HOA Special Code Enforcement Seal (X: [-6, 2], Z: [4, 7.5])
  addQuad(
    [-6.0, 9.55, 4.0], [2.0, 9.55, 4.0], [2.0, 9.55, 7.2], [-6.0, 9.55, 7.2],
    [0, 1, 0],
    uvCell(1, 2, 0, 0), uvCell(1, 2, 1, 0), uvCell(1, 2, 1, 1), uvCell(1, 2, 0, 1),
    'body-seal-l'
  );
  // Right Door HOA Special Code Enforcement Seal
  addQuad(
    [2.0, -9.55, 4.0], [-6.0, -9.55, 4.0], [-6.0, -9.55, 7.2], [2.0, -9.55, 7.2],
    [0, -1, 0],
    uvCell(1, 2, 0, 0), uvCell(1, 2, 1, 0), uvCell(1, 2, 1, 1), uvCell(1, 2, 0, 1),
    'body-seal-r'
  );

  // Left Aerodynamic Wing-Cam (Side-view camera mirror pod)
  addBox([2.0, 9.5, 7.5], [4.0, 12.0, 8.5], 2, 0, 'body-cam-l');
  // Right Aerodynamic Wing-Cam
  addBox([2.0, -12.0, 7.5], [4.0, -9.5, 8.5], 2, 0, 'body-cam-r');

  // Emergency Touchscreen Citation Scanner Console (Right Rear Quarter Panel)
  addQuad(
    [-14.0, -9.55, 4.2], [-8.0, -9.55, 4.2], [-8.0, -9.55, 7.0], [-14.0, -9.55, 7.0],
    [0, -1, 0],
    uvCell(2, 3, 0, 0), uvCell(2, 3, 1, 0), uvCell(2, 3, 1, 1), uvCell(2, 3, 0, 1),
    'body-console'
  );

  // Columbia Planned Community Authorized Zoning Placard (Left Rear Quarter Panel)
  addQuad(
    [-14.0, 9.55, 4.2], [-8.0, 9.55, 4.2], [-8.0, 9.55, 7.0], [-14.0, 9.55, 7.0],
    [0, 1, 0],
    uvCell(2, 2, 0, 0), uvCell(2, 2, 1, 0), uvCell(2, 2, 1, 1), uvCell(2, 2, 0, 1),
    'body-placard'
  );

  // Low Skirt / Tread Dummy Box for Track Animation
  addBox([-16, -9.8, 0.8], [16, 9.8, 1.2], 1, 1, 'skirt-treads');

  return { vertices, normals, uvs, triangles, groups, materials };
}

module.exports = {
  createStealthGeometry,
};
