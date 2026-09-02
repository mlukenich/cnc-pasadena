'use strict';

// Complete Procedural 3D Geometry Generator for Columbia Active-Camouflage HOA Surveillance Cruiser
// Revision 4: Master Hard-Surface Finish — Sculpted Aerodynamic Flares, Framed Aero-Disc Wheels,
// Elevated Surveillance LiDAR Tower, Hydraulic Turret Actuators, Dual 4-Tube Citation Missile Pods.

function createStealthGeometry() {
  const vertices = [];
  const normals = [];
  const uvs = [];
  const triangles = [];
  const groups = [];
  const materials = [];

  // UV mapper with inset padding to completely avoid AI cell corner numbers (1, 5, 9, 13)
  function uvCell(cellX, cellY, uLocal, vLocal) {
    const padU = 0.12 + Math.max(0.0, Math.min(1.0, uLocal)) * 0.76;
    const padV = 0.12 + Math.max(0.0, Math.min(1.0, vLocal)) * 0.76;
    const u = (cellX + padU) / 4.0;
    const v = ((3 - cellY) + padV) / 4.0;
    return [u, v];
  }

  function addQuad(p0, p1, p2, p3, norm, uv0, uv1, uv2, uv3, group, mat = 'ObjectsGDI') {
    const base = vertices.length;
    vertices.push(p0, p1, p2, p3);
    normals.push(norm, norm, norm, norm);
    uvs.push(uv0, uv1, uv2, uv3);
    // CCW winding: [p0, p1, p2] and [p0, p2, p3]
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
      [x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0],
      [0, 0, -1],
      uvCell(cellX, cellY, 0, 0), uvCell(cellX, cellY, 1, 0), uvCell(cellX, cellY, 1, 1), uvCell(cellX, cellY, 0, 1),
      group, mat
    );
  }

  function addCylinder(center, radius, height, axis, segments, cellX, cellY, group, mat = 'ObjectsGDI', rotY = 0) {
    const [cx, cy, cz] = center;
    const cosY = Math.cos(rotY), sinY = Math.sin(rotY);

    for (let i = 0; i < segments; i++) {
      const a0 = (i / segments) * Math.PI * 2;
      const a1 = ((i + 1) / segments) * Math.PI * 2;
      const u0 = i / segments, u1 = (i + 1) / segments;

      if (axis === 'Y') {
        const c0 = Math.cos(a0) * radius, s0 = Math.sin(a0) * radius;
        const c1 = Math.cos(a1) * radius, s1 = Math.sin(a1) * radius;
        const y0 = cy - height / 2, y1 = cy + height / 2;

        // Sidewall: Outward facing CCW winding
        addQuad(
          [cx + c0, y0, cz + s0], [cx + c0, y1, cz + s0], [cx + c1, y1, cz + s1], [cx + c1, y0, cz + s1],
          [(c0 + c1) / 2 / radius, 0, (s0 + s1) / 2 / radius],
          uvCell(cellX, cellY, u0, 0), uvCell(cellX, cellY, u0, 1), uvCell(cellX, cellY, u1, 1), uvCell(cellX, cellY, u1, 0),
          group, mat
        );
        if (cy > 0) {
          // Outer face (+Y): Outward facing CCW winding
          addTri(
            [cx, y1, cz], [cx + c1, y1, cz + s1], [cx + c0, y1, cz + s0],
            [0, 1, 0],
            uvCell(3, 3, 0.5, 0.5), uvCell(3, 3, 0.5 + Math.cos(a1) * 0.45, 0.5 + Math.sin(a1) * 0.45), uvCell(3, 3, 0.5 + Math.cos(a0) * 0.45, 0.5 + Math.sin(a0) * 0.45),
            group, mat
          );
        } else {
          // Outer face (-Y): Outward facing CCW winding
          addTri(
            [cx, y0, cz], [cx + c0, y0, cz + s0], [cx + c1, y0, cz + s1],
            [0, -1, 0],
            uvCell(3, 3, 0.5, 0.5), uvCell(3, 3, 0.5 + Math.cos(a0) * 0.45, 0.5 + Math.sin(a0) * 0.45), uvCell(3, 3, 0.5 + Math.cos(a1) * 0.45, 0.5 + Math.sin(a1) * 0.45),
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
        addTri(
          [cx, cy, z1], [cx + c0, cy + s0, z1], [cx + c1, cy + s1, z1],
          [0, 0, 1],
          uvCell(0, 3, 0.5, 0.5), uvCell(0, 3, 0.5 + Math.cos(a0) * 0.45, 0.5 + Math.sin(a0) * 0.45), uvCell(0, 3, 0.5 + Math.cos(a1) * 0.45, 0.5 + Math.sin(a1) * 0.45),
          group, mat
        );
      } else if (axis === 'X') {
        const r0 = Math.cos(a0) * radius, s0 = Math.sin(a0) * radius;
        const r1 = Math.cos(a1) * radius, s1 = Math.sin(a1) * radius;
        const h0 = -height / 2, h1 = height / 2;

        const transform = (dx, dy, dz) => {
          const rx = dx * cosY + dz * sinY;
          const rz = -dx * sinY + dz * cosY;
          return [cx + rx, cy + dy, cz + rz];
        };

        const p0 = transform(h0, r0, s0);
        const p1 = transform(h0, r1, s1);
        const p2 = transform(h1, r1, s1);
        const p3 = transform(h1, r0, s0);
        const nrm = [cosY, 0, sinY];

        addQuad(
          p0, p1, p2, p3,
          nrm,
          uvCell(cellX, cellY, u0, 0), uvCell(cellX, cellY, u1, 0), uvCell(cellX, cellY, u1, 1), uvCell(cellX, cellY, u0, 1),
          group, mat
        );
        const pCapCenter = transform(h1, 0, 0);
        addTri(
          pCapCenter, p2, p3,
          nrm,
          uvCell(2, 1, 0.5, 0.5), uvCell(2, 1, 0.5 + Math.cos(a1) * 0.45, 0.5 + Math.sin(a1) * 0.45), uvCell(2, 1, 0.5 + Math.cos(a0) * 0.45, 0.5 + Math.sin(a0) * 0.45),
          group, mat
        );
      }
    }
  }

  // =========================================================================
  // 1. SLEEK WIDEBODY MONOLITHIC CYBER WEDGE BODY (BODY)
  // =========================================================================
  // Front Fascia / Bumper Wedge (X = 22.0, Y = [-9.2..9.2], Z = [1.8..4.0])
  addQuad(
    [22.0, -9.2, 1.8], [22.0, 9.2, 1.8], [22.0, 9.2, 4.0], [22.0, -9.2, 4.0],
    [1, 0, 0],
    uvCell(0, 2, 0, 0), uvCell(0, 2, 1, 0), uvCell(0, 2, 1, 1), uvCell(0, 2, 0, 1),
    'body-front-fascia'
  );

  // Sloped Cyber Hood (X = 22.0..5.0, Y = [-9.2..9.2], Z = 4.0..7.8) - Satin Pearl White
  addQuad(
    [22.0, -9.2, 4.0], [22.0, 9.2, 4.0], [5.0, 9.2, 7.8], [5.0, -9.2, 7.8],
    [0.22, 0, 0.97],
    uvCell(0, 0, 0, 0), uvCell(0, 0, 1, 0), uvCell(0, 0, 1, 1), uvCell(0, 0, 0, 1),
    'body-hood'
  );

  // Raked Dark Photovoltaic Windshield (X = 5.0..-1.0, Y = [-8.5..8.5], Z = 7.8..11.5)
  addQuad(
    [5.0, -8.5, 7.8], [5.0, 8.5, 7.8], [-1.0, 7.5, 11.5], [-1.0, -7.5, 11.5],
    [0.52, 0, 0.85],
    uvCell(0, 1, 0, 0), uvCell(0, 1, 1, 0), uvCell(0, 1, 1, 1), uvCell(0, 1, 0, 1),
    'body-windshield'
  );

  // Fastback Photovoltaic Solar Glass Rear Roof & Deck (X = -1.0..-21.0, Y = [-8.5..8.5], Z = 11.5..7.5)
  addQuad(
    [-1.0, -7.5, 11.5], [-1.0, 7.5, 11.5], [-21.0, 9.2, 7.5], [-21.0, -9.2, 7.5],
    [-0.20, 0, 0.98],
    uvCell(0, 1, 0, 0), uvCell(0, 1, 1, 0), uvCell(0, 1, 1, 1), uvCell(0, 1, 0, 1),
    'body-fastback-roof'
  );

  // --- Left Side Upper & Lower Hull Panels (+Y Outward Normal) ---
  // Front quarter side (X: 22..5, Z: 1.8..7.8)
  addQuad(
    [22.0, 9.2, 1.8], [5.0, 9.2, 2.5], [5.0, 9.2, 7.8], [22.0, 9.2, 4.0],
    [0, 1, 0],
    uvCell(0, 0, 0, 0), uvCell(0, 0, 1, 0), uvCell(0, 0, 1, 1), uvCell(0, 0, 0, 1),
    'body-side-l'
  );
  // Center lower door & quarter panel (X: 5..-21, Z: 2.5..7.5)
  addQuad(
    [5.0, 9.2, 2.5], [-21.0, 9.2, 2.5], [-21.0, 9.2, 7.5], [5.0, 9.2, 7.8],
    [0, 1, 0],
    uvCell(0, 0, 0, 0), uvCell(0, 0, 1, 0), uvCell(0, 0, 1, 1), uvCell(0, 0, 0, 1),
    'body-side-l'
  );
  // Cabin greenhouse left side window glass (X: 5..-1, Z: 7.8..11.5)
  addTri(
    [5.0, 9.2, 7.8], [-1.0, 9.2, 7.8], [-1.0, 7.5, 11.5],
    [0, 1, 0],
    uvCell(0, 1, 0, 0), uvCell(0, 1, 1, 0), uvCell(0, 1, 1, 1),
    'body-side-window-l'
  );
  // Rear quarter side window glass (X: -1..-21, Z: 11.5..7.5)
  addTri(
    [-1.0, 9.2, 7.8], [-21.0, 9.2, 7.5], [-1.0, 7.5, 11.5],
    [0, 1, 0],
    uvCell(0, 1, 0, 0), uvCell(0, 1, 1, 0), uvCell(0, 1, 0, 1),
    'body-side-window-l'
  );

  // --- Right Side Upper & Lower Hull Panels (-Y Outward Normal) ---
  addQuad(
    [5.0, -9.2, 2.5], [22.0, -9.2, 1.8], [22.0, -9.2, 4.0], [5.0, -9.2, 7.8],
    [0, -1, 0],
    uvCell(0, 0, 0, 0), uvCell(0, 0, 1, 0), uvCell(0, 0, 1, 1), uvCell(0, 0, 0, 1),
    'body-side-r'
  );
  addQuad(
    [-21.0, -9.2, 2.5], [5.0, -9.2, 2.5], [5.0, -9.2, 7.8], [-21.0, -9.2, 7.5],
    [0, -1, 0],
    uvCell(0, 0, 0, 0), uvCell(0, 0, 1, 0), uvCell(0, 0, 1, 1), uvCell(0, 0, 0, 1),
    'body-side-r'
  );
  addTri(
    [-1.0, -9.2, 7.8], [5.0, -9.2, 7.8], [-1.0, -7.5, 11.5],
    [0, -1, 0],
    uvCell(0, 1, 0, 0), uvCell(0, 1, 1, 0), uvCell(0, 1, 1, 1),
    'body-side-window-r'
  );
  addTri(
    [-21.0, -9.2, 7.5], [-1.0, -9.2, 7.5], [-1.0, -7.5, 11.5],
    [0, -1, 0],
    uvCell(0, 1, 0, 0), uvCell(0, 1, 1, 0), uvCell(0, 1, 0, 1),
    'body-side-window-r'
  );

  // Rear Vertical Fascia & Optical Citation Printer Slot (X = -21.0, Z: 2.5..7.5)
  addQuad(
    [-21.0, 9.2, 2.5], [-21.0, -9.2, 2.5], [-21.0, -9.2, 7.5], [-21.0, 9.2, 7.5],
    [-1, 0, 0],
    uvCell(3, 2, 0, 0), uvCell(3, 2, 1, 0), uvCell(3, 2, 1, 1), uvCell(3, 2, 0, 1),
    'body-rear-fascia'
  );

  // Underbody Armor Floor Pan (Z = 2.5)
  addQuad(
    [22.0, 9.2, 1.8], [-21.0, 9.2, 2.5], [-21.0, -9.2, 2.5], [22.0, -9.2, 1.8],
    [0, 0, -1],
    uvCell(2, 0, 0, 0), uvCell(2, 0, 1, 0), uvCell(2, 0, 1, 1), uvCell(2, 0, 0, 1),
    'body-floor'
  );

  // =========================================================================
  // 2. SCULPTED FACETED AERODYNAMIC WHEEL BLISTER ARCHES
  // =========================================================================
  // Front Left Wheel Blister (Centered at X = 12.0, Y: [9.2..10.8], Z: [4.5..7.5])
  addBox([7.5, 9.2, 4.5], [16.5, 10.8, 7.5], 0, 0, 'body-arch-fl');
  addBox([7.5, -10.8, 4.5], [16.5, -9.2, 7.5], 0, 0, 'body-arch-fr');
  addBox([-16.5, 9.2, 4.5], [-7.5, 10.8, 7.5], 0, 0, 'body-arch-rl');
  addBox([-16.5, -10.8, 4.5], [-7.5, -9.2, 7.5], 0, 0, 'body-arch-rr');

  // Carbon Fiber Wheel Arch Eyebrow Lip (Z: 7.3..7.7)
  addBox([7.2, 9.2, 7.3], [16.8, 11.0, 7.7], 2, 0, 'body-arch-lip-fl');
  addBox([7.2, -11.0, 7.3], [16.8, -9.2, 7.7], 2, 0, 'body-arch-lip-fr');
  addBox([-16.8, 9.2, 7.3], [-7.2, 11.0, 7.7], 2, 0, 'body-arch-lip-rl');
  addBox([-16.8, -11.0, 7.3], [-7.2, -9.2, 7.7], 2, 0, 'body-arch-lip-rr');

  // =========================================================================
  // 3. ACTIVE-CAMOUFLAGE GLOWING HEXAGONAL SIDE SKIRTS & CARBON DIFFUSERS
  // =========================================================================
  // Left Glowing Cyan Hex Camo Lower Skirt (+Y Outward)
  addQuad(
    [21.5, 9.25, 1.0], [-20.5, 9.25, 1.0], [-20.5, 9.25, 2.8], [21.5, 9.25, 2.8],
    [0, 1, 0],
    uvCell(1, 0, 0, 0), uvCell(1, 0, 1, 0), uvCell(1, 0, 1, 1), uvCell(1, 0, 0, 1),
    'body-camo-skirt-l'
  );
  // Right Glowing Cyan Hex Camo Lower Skirt (-Y Outward)
  addQuad(
    [-20.5, -9.25, 1.0], [21.5, -9.25, 1.0], [21.5, -9.25, 2.8], [-20.5, -9.25, 2.8],
    [0, -1, 0],
    uvCell(1, 0, 0, 0), uvCell(1, 0, 1, 0), uvCell(1, 0, 1, 1), uvCell(1, 0, 0, 1),
    'body-camo-skirt-r'
  );

  // Front Carbon Fiber Ground-Effect Splitter & Corner Canards
  addBox([18.5, -10.5, 0.8], [23.5, 10.5, 1.8], 2, 0, 'body-carbon-splitter');
  addBox([19.0, 9.2, 1.8], [23.0, 10.5, 3.2], 2, 0, 'body-canard-l');
  addBox([19.0, -10.5, 1.8], [23.0, -9.2, 3.2], 2, 0, 'body-canard-r');

  // Rear Carbon Diffuser with Vertical Aero Vanes
  addBox([-23.0, -9.0, 0.8], [-20.5, 9.0, 2.5], 1, 3, 'body-rear-diffuser');
  [-7.0, -2.5, 2.5, 7.0].forEach(dy => {
    addBox([-23.2, dy - 0.15, 0.8], [-20.5, dy + 0.15, 2.2], 2, 0, 'body-diffuser-vane');
  });

  // =========================================================================
  // 4. DOOR SEALS, CAMERAS, CONSOLES & HOA GRAPHICS
  // =========================================================================
  // Left Door "COLUMBIA HOA SPECIAL CODE ENFORCEMENT - UNIT 00" Seal (+Y Outward)
  addQuad(
    [3.5, 9.28, 3.8], [-3.5, 9.28, 3.8], [-3.5, 9.28, 7.0], [3.5, 9.28, 7.0],
    [0, 1, 0],
    uvCell(1, 2, 0, 0), uvCell(1, 2, 1, 0), uvCell(1, 2, 1, 1), uvCell(1, 2, 0, 1),
    'body-seal-l'
  );
  // Right Door Seal (-Y Outward)
  addQuad(
    [-3.5, -9.28, 3.8], [3.5, -9.28, 3.8], [3.5, -9.28, 7.0], [-3.5, -9.28, 7.0],
    [0, -1, 0],
    uvCell(1, 2, 0, 0), uvCell(1, 2, 1, 0), uvCell(1, 2, 1, 1), uvCell(1, 2, 0, 1),
    'body-seal-r'
  );

  // Left Rear Quarter "AUTHORIZED ZONING CITATION ENFORCEMENT" Placard (+Y Outward)
  addQuad(
    [-8.0, 9.28, 3.8], [-16.0, 9.28, 3.8], [-16.0, 9.28, 6.8], [-8.0, 9.28, 6.8],
    [0, 1, 0],
    uvCell(2, 2, 0, 0), uvCell(2, 2, 1, 0), uvCell(2, 2, 1, 1), uvCell(2, 2, 0, 1),
    'body-placard-l'
  );
  // Right Rear Quarter Emergency Touchscreen Citation Scanner Console (-Y Outward)
  addQuad(
    [-16.0, -9.28, 3.8], [-8.0, -9.28, 3.8], [-8.0, -9.28, 6.8], [-16.0, -9.28, 6.8],
    [0, -1, 0],
    uvCell(2, 3, 0, 0), uvCell(2, 3, 1, 0), uvCell(2, 3, 1, 1), uvCell(2, 3, 0, 1),
    'body-console-r'
  );

  // Aerodynamic Carbon Side-View Wing Cameras
  addBox([4.0, 9.2, 7.8], [6.5, 11.2, 8.8], 2, 0, 'body-cam-l');
  addCylinder([6.4, 10.6, 8.3], 0.35, 0.4, 'X', 12, 0, 3, 'body-cam-lens-l');

  addBox([4.0, -11.2, 7.8], [6.5, -9.2, 8.8], 2, 0, 'body-cam-r');
  addCylinder([6.4, -10.6, 8.3], 0.35, 0.4, 'X', 12, 0, 3, 'body-cam-lens-r');

  // =========================================================================
  // 5. ROOFTOP 360-DEGREE LIDAR SURVEILLANCE PERISCOPE (BODY / LIDAR)
  // =========================================================================
  // Elevated on aerodynamic roof pod at X = 2.0, Y = 0.0
  addBox([0.0, -3.2, 11.2], [4.0, 3.2, 12.6], 2, 0, 'body-lidar-pod'); // Carbon aerodynamic pod base
  addCylinder([2.0, 0.0, 12.6], 1.8, 0.9, 'Z', 24, 2, 0, 'body-lidar-riser'); // Carbon riser
  addCylinder([2.0, 0.0, 13.5], 2.2, 1.0, 'Z', 24, 0, 3, 'body-lidar-lens');  // Sapphire multi-lens dome
  addCylinder([2.0, 0.0, 14.4], 1.8, 0.5, 'Z', 24, 3, 0, 'body-lidar-cap');   // Anodized cyan top cap

  // =========================================================================
  // 6. CENTER TURRET RISER & ELEVATING CRADLE (`TURRET` at [-2.0, 0.0, 11.5])
  // =========================================================================
  addBox([-6.5, -4.5, 11.2], [0.5, 4.5, 12.6], 2, 0, 'turret-cradle'); // Carbon riser base
  addBox([-5.5, -3.5, 12.6], [-0.5, 3.5, 14.0], 3, 0, 'turret-actuator'); // Anodized cyan hydraulic turntable

  // Cross-Support Trunnion Arms extending left and right to pod pivots
  addBox([-2.0, 3.5, 13.8], [1.0, 7.5, 15.0], 3, 0, 'turret-arm-left');
  addBox([-2.0, -7.5, 13.8], [1.0, -3.5, 15.0], 3, 0, 'turret-arm-right');

  // Hydraulic Elevation Cylinders
  addCylinder([-3.5, 4.5, 13.0], 0.45, 2.2, 'X', 12, 3, 0, 'turret-piston-l', 'ObjectsGDI', 0.5);
  addCylinder([-3.5, -4.5, 13.0], 0.45, 2.2, 'X', 12, 3, 0, 'turret-piston-r', 'ObjectsGDI', 0.5);

  // =========================================================================
  // 7. POP-UP DUAL 4-TUBE CITATION MISSILE LAUNCHER PODS
  //    (`LAUNCHER_L` on `FXWeaponL` at [2.0, 7.5, 15.0] in World Space)
  //    (`LAUNCHER_R` on `FXWeaponR` at [2.0, -7.5, 15.0] in World Space)
  // =========================================================================
  const pitchRad = (18 * Math.PI) / 180; // Elevated at +18 degrees

  // --- Left Missile Pod ---
  const podL_center = [2.0, 7.5, 15.0];
  addBox([podL_center[0] - 6.0, podL_center[1] - 2.3, podL_center[2] - 2.1],
         [podL_center[0] + 6.0, podL_center[1] + 2.3, podL_center[2] + 2.1],
         3, 0, 'launcher-left-pod');

  addBox([podL_center[0] + 6.0, podL_center[1] - 2.1, podL_center[2] - 1.9],
         [podL_center[0] + 6.8, podL_center[1] + 2.1, podL_center[2] + 1.9],
         2, 0, 'launcher-left-bezel');

  const tubeLocalOffsets = [
    [-1.0, 0.95], [1.0, 0.95],
    [-1.0, -0.95], [1.0, -0.95],
  ];
  tubeLocalOffsets.forEach(([dy, dz], i) => {
    const tCenter = [podL_center[0] + 6.8, podL_center[1] + dy, podL_center[2] + dz];
    addCylinder(tCenter, 0.75, 1.2, 'X', 16, 2, 1, `launcher-left-tube-${i}`, 'ObjectsGDI', pitchRad);
    const wCenter = [podL_center[0] + 7.6, podL_center[1] + dy, podL_center[2] + dz];
    addCylinder(wCenter, 0.55, 0.8, 'X', 12, 3, 0, `launcher-left-warhead-${i}`, 'ObjectsGDI', pitchRad);
  });
  addBox([podL_center[0] - 6.8, podL_center[1] - 1.9, podL_center[2] - 1.7],
         [podL_center[0] - 6.0, podL_center[1] + 1.9, podL_center[2] + 1.7],
         1, 3, 'launcher-left-exhaust');

  // --- Right Missile Pod ---
  const podR_center = [2.0, -7.5, 15.0];
  addBox([podR_center[0] - 6.0, podR_center[1] - 2.3, podR_center[2] - 2.1],
         [podR_center[0] + 6.0, podR_center[1] + 2.3, podR_center[2] + 2.1],
         3, 0, 'launcher-right-pod');

  addBox([podR_center[0] + 6.0, podR_center[1] - 2.1, podR_center[2] - 1.9],
         [podR_center[0] + 6.8, podR_center[1] + 2.1, podR_center[2] + 1.9],
         2, 0, 'launcher-right-bezel');

  tubeLocalOffsets.forEach(([dy, dz], i) => {
    const tCenter = [podR_center[0] + 6.8, podR_center[1] + dy, podR_center[2] + dz];
    addCylinder(tCenter, 0.75, 1.2, 'X', 16, 2, 1, `launcher-right-tube-${i}`, 'ObjectsGDI', pitchRad);
    const wCenter = [podR_center[0] + 7.6, podR_center[1] + dy, podR_center[2] + dz];
    addCylinder(wCenter, 0.55, 0.8, 'X', 12, 3, 0, `launcher-right-warhead-${i}`, 'ObjectsGDI', pitchRad);
  });
  addBox([podR_center[0] - 6.8, podR_center[1] - 1.9, podR_center[2] - 1.7],
         [podR_center[0] - 6.0, podR_center[1] + 1.9, podR_center[2] + 1.7],
         1, 3, 'launcher-right-exhaust');

  // =========================================================================
  // 8. AERODYNAMIC FLUSH AERO-DISC WHEELS (TIRE_LF, TIRE_RF, TIRE_LR, TIRE_RR)
  // =========================================================================
  const wheelRadius = 4.2;
  const wheelWidth = 2.4;

  // Front Left Wheel at [12.0, 10.5, 4.2] - Outer face at Y = 11.7
  addCylinder([12.0, 10.5, 4.2], wheelRadius, wheelWidth, 'Y', 24, 1, 1, 'wheel-front-left');
  // Front Right Wheel at [12.0, -10.5, 4.2] - Outer face at Y = -11.7
  addCylinder([12.0, -10.5, 4.2], wheelRadius, wheelWidth, 'Y', 24, 1, 1, 'wheel-front-right');
  // Rear Left Wheel at [-12.0, 10.5, 4.2]
  addCylinder([-12.0, 10.5, 4.2], wheelRadius, wheelWidth, 'Y', 24, 1, 1, 'wheel-rear-left');
  // Rear Right Wheel at [-12.0, -10.5, 4.2]
  addCylinder([-12.0, -10.5, 4.2], wheelRadius, wheelWidth, 'Y', 24, 1, 1, 'wheel-rear-right');

  // Low Skirt / Tread Dummy Box for Track Animation
  addBox([-16.0, -9.2, 0.8], [16.0, 9.2, 1.2], 1, 1, 'skirt-treads');

  return { vertices, normals, uvs, triangles, groups, materials };
}

module.exports = {
  createStealthGeometry,
};
