'use strict';
const fs = require('fs');
const path = require('path');
const buildRoundaboutTank = require('./roundabout_geometry');
const {
  smoothNormals,
  tangentFrame,
  writeMaterialMaps,
} = require('./roundabout_surface_pipeline');

const artScale = 0.88;
const scalePoint = p => p.map(v => Number((v * artScale).toFixed(6)));

const palette = {
  paint: 0,
  cyanTrim: 1,
  skirtSeal: 2,
  aerospaceChrome: 3,
  solarGlass: 4,
  carbonFiber: 5,
  strobeOptics: 6,
  magneticRail: 7,
  frontWedge: 8,
  enforcerPanel: 9,
  solarRoof: 10,
  rearVenting: 11,
  frontFascia: 12,
  cautionStripes: 13,
  stealthTread: 14,
  microwaveFace: 15,
};
const materialKeys = Object.keys(palette);

const vertices = [];
const normals = [];
const uvs = [];
const triangles = [];
const groups = [];
const materials = [];

function fmt(value) {
  const safe = Math.abs(value) < 0.0000005 ? 0 : value;
  return safe.toFixed(6);
}

const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
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

function triangleNormal(triangle, points) {
  const a = points[triangle[0]], b = points[triangle[1]], c = points[triangle[2]];
  const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const n = [ab[1] * ac[2] - ab[2] * ac[1], ab[2] * ac[0] - ab[0] * ac[2], ab[0] * ac[1] - ab[1] * ac[0]];
  const length = Math.hypot(...n) || 1;
  return n.map(v => v / length);
}

function faceUvs(material, points, normal, group) {
  let index = materialKeys.indexOf(material);
  let projection;
  const clamp = (v, min = 0, max = 1) => Math.max(min, Math.min(max, v));

  // Dedicated panel projections
  if (group.startsWith('wedge-') && normal[2] > 0.3) {
    index = 8; projection = p => [(p[1] + 11.0) / 22.0, (23.0 - p[0]) / 18.0];
  } else if (group === 'skirt-outer-panel') {
    index = 9; projection = p => [(p[0] + 19.0) / 38.0, (8.5 - p[2]) / 5.0];
  } else if (group === 'turret-solar-roof' && normal[2] > 0.4) {
    index = 10; projection = p => [(p[1] + 4.5) / 9.0, (3.0 - p[0]) / 9.0];
  } else if (group === 'rear-engine-deck' && normal[2] > 0.3) {
    index = 11; projection = p => [(p[1] + 10.5) / 21.0, (-12.0 - p[0]) / 8.0];
  } else if (group === 'front-fascia-intake' && normal[0] > 0.3) {
    index = 12; projection = p => [(p[1] + 8.0) / 16.0, (6.0 - p[2]) / 2.0];
  } else if (group === 'rear-service-hatch') {
    index = 13;
  } else if (group.startsWith('wheel-')) {
    if (group.includes('tread')) {
      index = 14;
    } else if (group.includes('rim')) {
      index = 3;
    } else if (group.includes('sidewall')) {
      index = 2;
    } else {
      index = 1;
    }
  }

  if (index < 0) index = 0;
  const col = index % 4, row = Math.floor(index / 4);

  if (projection) {
    return points.map(p => {
      const [u, v] = projection(p);
      return [(col + 0.03 + 0.94 * clamp(u)) / 4, (row + 0.03 + 0.94 * clamp(v)) / 4];
    });
  }

  const u0 = col / 4 + 0.035;
  const v0 = row / 4 + 0.035;
  const dist = (a, b) => Math.hypot(...a.map((v, i) => v - b[i]));
  const w = dist(points[0], points[1]) || 0.01;
  const edge = points[1].map((v, i) => (v - points[0][i]) / w);
  const vertical = [
    normal[1] * edge[2] - normal[2] * edge[1],
    normal[2] * edge[0] - normal[0] * edge[2],
    normal[0] * edge[1] - normal[1] * edge[0],
  ];
  const local = points.map(p => {
    const d = p.map((v, i) => v - points[0][i]);
    return [
      d.reduce((s, v, i) => s + v * edge[i], 0),
      d.reduce((s, v, i) => s + v * vertical[i], 0)
    ];
  });
  const low = [0, 1].map(k => Math.min(...local.map(p => p[k])));
  const high = [0, 1].map(k => Math.max(...local.map(p => p[k])));
  const span = Math.max(high[0] - low[0], high[1] - low[1], 0.01);
  const scale = 0.18 / span;
  return local.map(p => [u0 + (p[0] - low[0]) * scale, v0 + (p[1] - low[1]) * scale]);
}

function addFace(points, normal, material, group) {
  normal = normal.map(v => v / Math.hypot(...normal));
  if (triangleNormal([0, 1, 2], points).reduce((s, n, i) => s + n * normal[i], 0) < 0) points = [...points].reverse();
  const start = vertices.length;
  const mappedUvs = faceUvs(material, points, normal, group);
  for (let i = 0; i < 4; i += 1) {
    vertices.push(points[i]);
    normals.push(normal);
    uvs.push(mappedUvs[i]);
  }
  triangles.push([start, start + 1, start + 2], [start, start + 2, start + 3]);
  groups.push(group, group);
  materials.push(material, material);
}

function addTriangle(points, normal, material, group) {
  normal = normal.map(v => v / Math.hypot(...normal));
  if (triangleNormal([0, 1, 2], points).reduce((s, n, i) => s + n * normal[i], 0) < 0) points = [points[0], points[2], points[1]];
  const start = vertices.length;
  const mappedUvs = faceUvs(material, points, normal, group);
  for (let i = 0; i < 3; i += 1) {
    vertices.push(points[i]);
    normals.push(normal);
    uvs.push(mappedUvs[i]);
  }
  triangles.push([start, start + 1, start + 2]);
  groups.push(group);
  materials.push(material);
}

function addBox(name, cx, cy, cz, sx, sy, sz, material) {
  const x0 = cx - sx / 2, x1 = cx + sx / 2;
  const y0 = cy - sy / 2, y1 = cy + sy / 2;
  const z0 = cz - sz / 2, z1 = cz + sz / 2;
  addFace([[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], [1, 0, 0], material, name);
  addFace([[x0, y1, z0], [x0, y0, z0], [x0, y0, z1], [x0, y1, z1]], [-1, 0, 0], material, name);
  addFace([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], [0, 1, 0], material, name);
  addFace([[x1, y0, z0], [x0, y0, z0], [x0, y0, z1], [x1, y0, z1]], [0, -1, 0], material, name);
  addFace([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1], material, name);
  addFace([[x0, y1, z0], [x1, y1, z0], [x1, y0, z0], [x0, y0, z0]], [0, 0, -1], material, name);
}

function axisPoint(axis, axial, r1, r2) {
  if (axis === 'x') return [axial, r1, r2];
  if (axis === 'y') return [r1, axial, r2];
  return [r1, r2, axial];
}

function axisNormal(axis, n1, n2, sign = 0) {
  if (sign !== 0) {
    if (axis === 'x') return [sign, 0, 0];
    if (axis === 'y') return [0, sign, 0];
    return [0, 0, sign];
  }
  if (axis === 'x') return [0, n1, n2];
  if (axis === 'y') return [n1, 0, n2];
  return [n1, n2, 0];
}

function offsetPoint(point, cx, cy, cz) {
  return [point[0] + cx, point[1] + cy, point[2] + cz];
}

function addCylinder(name, cx, cy, cz, radius, length, axis = 'x', segments = 12, material = 'aerospaceChrome') {
  const half = length / 2;
  const startAngle = 0;
  for (let i = 0; i < segments; i += 1) {
    const a0 = startAngle + (i / segments) * Math.PI * 2;
    const a1 = startAngle + ((i + 1) / segments) * Math.PI * 2;
    const c0 = Math.cos(a0), s0 = Math.sin(a0);
    const c1 = Math.cos(a1), s1 = Math.sin(a1);

    const p0Neg = offsetPoint(axisPoint(axis, -half, radius * c0, radius * s0), cx, cy, cz);
    const p1Neg = offsetPoint(axisPoint(axis, -half, radius * c1, radius * s1), cx, cy, cz);
    const p0Pos = offsetPoint(axisPoint(axis, half, radius * c0, radius * s0), cx, cy, cz);
    const p1Pos = offsetPoint(axisPoint(axis, half, radius * c1, radius * s1), cx, cy, cz);

    const sideNormal = axisNormal(axis, (c0 + c1) / 2, (s0 + s1) / 2);
    addFace([p0Neg, p1Neg, p1Pos, p0Pos], sideNormal, material, name);

    const centerNeg = offsetPoint(axisPoint(axis, -half, 0, 0), cx, cy, cz);
    const centerPos = offsetPoint(axisPoint(axis, half, 0, 0), cx, cy, cz);
    addTriangle([centerNeg, p1Neg, p0Neg], axisNormal(axis, 0, 0, -1), material, name);
    addTriangle([centerPos, p0Pos, p1Pos], axisNormal(axis, 0, 0, 1), material, name);
  }
}

// Build 3D Roundabout Tank Geometry
buildRoundaboutTank({ addBox, addCylinder, addFace, addTriangle });

function bounds(pts) {
  const min = [0, 1, 2].map(k => Math.min(...pts.map(p => p[k])));
  const max = [0, 1, 2].map(k => Math.max(...pts.map(p => p[k])));
  const center = min.map((v, k) => (v + max[k]) / 2);
  const radius = Math.max(...pts.map(p => Math.hypot(...p.map((c, k) => c - center[k]))));
  return { min, max, center, radius };
}

// Partition rigid meshes
const isWheelFL = g => g.startsWith('wheel-front-left');
const isWheelFR = g => g.startsWith('wheel-front-right');
const isWheelRL = g => g.startsWith('wheel-rear-left');
const isWheelRR = g => g.startsWith('wheel-rear-right');
const isGun = g => g.startsWith('gun-') || g.startsWith('barrel-');
const isTurret = g => g.startsWith('turret-') && !isGun(g);
const isTail = g => g.startsWith('stinger-');
const isBody = g => !isWheelFL(g) && !isWheelFR(g) && !isWheelRL(g) && !isWheelRR(g) && !isTurret(g) && !isGun(g) && !isTail(g);

function selectMesh(predicate, offset) {
  const selectedVertices = [];
  const selectedNormals = [];
  const selectedUvs = [];
  const selectedTriangles = [];
  const remap = new Map();

  triangles.forEach((triangle, triangleIndex) => {
    if (!predicate(groups[triangleIndex])) return;
    const mapped = triangle.map(oldIndex => {
      if (!remap.has(oldIndex)) {
        remap.set(oldIndex, selectedVertices.length);
        selectedVertices.push([
          vertices[oldIndex][0] - offset[0],
          vertices[oldIndex][1] - offset[1],
          vertices[oldIndex][2] - offset[2],
        ]);
        selectedNormals.push(normals[oldIndex]);
        selectedUvs.push(uvs[oldIndex]);
      }
      return remap.get(oldIndex);
    });
    selectedTriangles.push(mapped);
  });
  return {
    vertices: selectedVertices.map(scalePoint),
    normals: selectedNormals,
    uvs: selectedUvs,
    triangles: selectedTriangles
  };
}

const bodyMesh = selectMesh(isBody, [0, 0, 0]);
const turretMesh = selectMesh(isTurret, [0, 0, 8.5]);
const gunMesh = selectMesh(isGun, [9.5, 0, 10.2]);
const tailMesh = selectMesh(isTail, [-14.0, 0, 8.5]);
const wheelFLMesh = selectMesh(isWheelFL, [13.0, 9.8, 4.8]);
const wheelFRMesh = selectMesh(isWheelFR, [13.0, -9.8, 4.8]);
const wheelRLMesh = selectMesh(isWheelRL, [-13.0, 9.8, 4.8]);
const wheelRRMesh = selectMesh(isWheelRR, [-13.0, -9.8, 4.8]);

const wheelMeshes = [
  { id: 'TIRE_LF', bone: 10, mesh: wheelFLMesh },
  { id: 'TIRE_RF', bone: 11, mesh: wheelFRMesh },
  { id: 'TIRE_LR', bone: 12, mesh: wheelRLMesh },
  { id: 'TIRE_RR', bone: 13, mesh: wheelRRMesh },
];

function makeMeshXml(id, mesh) {
  const b = bounds(mesh.vertices);
  const smoothedNormals = mesh.normals.map(n => [...n]);
  smoothNormals({ vertices: mesh.vertices, normals: smoothedNormals, triangles: mesh.triangles, groups: mesh.triangles.map(() => id) });
  const { tangents, binormals } = tangentFrame({ vertices: mesh.vertices, normals: smoothedNormals, uvs: mesh.uvs, triangles: mesh.triangles });

  return `\t<W3DMesh id="${id}" CastShadow="true" GeometryType="Normal">
\t\t<BoundingBox>
\t\t\t<Min X="${fmt(b.min[0])}" Y="${fmt(b.min[1])}" Z="${fmt(b.min[2])}"/>
\t\t\t<Max X="${fmt(b.max[0])}" Y="${fmt(b.max[1])}" Z="${fmt(b.max[2])}"/>
\t\t</BoundingBox>
\t\t<BoundingSphere Radius="${fmt(b.radius)}"><Center X="${fmt(b.center[0])}" Y="${fmt(b.center[1])}" Z="${fmt(b.center[2])}"/></BoundingSphere>
\t\t<Vertices>
${mesh.vertices.map(v => `\t\t\t<V X="${fmt(v[0])}" Y="${fmt(v[1])}" Z="${fmt(v[2])}"/>`).join('\n')}
\t\t</Vertices>
\t\t<Normals>
${smoothedNormals.map(n => `\t\t\t<N X="${fmt(n[0])}" Y="${fmt(n[1])}" Z="${fmt(n[2])}"/>`).join('\n')}
\t\t</Normals>
\t\t<Tangents>
${tangents.map(v => `\t\t\t<T X="${fmt(v[0])}" Y="${fmt(v[1])}" Z="${fmt(v[2])}"/>`).join('\n')}
\t\t</Tangents>
\t\t<Binormals>
${binormals.map(v => `\t\t\t<B X="${fmt(v[0])}" Y="${fmt(v[1])}" Z="${fmt(v[2])}"/>`).join('\n')}
\t\t</Binormals>
\t\t<TexCoords>
${mesh.uvs.map(uv => `\t\t\t<T X="${fmt(uv[0])}" Y="${fmt(1 - uv[1])}"/>`).join('\n')}
\t\t</TexCoords>
\t\t<Triangles>
${mesh.triangles.map(t => {
  const n = triangleNormal(t, mesh.vertices);
  const d = n[0] * mesh.vertices[t[0]][0] + n[1] * mesh.vertices[t[0]][1] + n[2] * mesh.vertices[t[0]][2];
  return `\t\t\t<T><V>${t[0]}</V><V>${t[1]}</V><V>${t[2]}</V><Nrm X="${fmt(n[0])}" Y="${fmt(n[1])}" Z="${fmt(n[2])}"/><Dist>${fmt(d)}</Dist></T>`;
}).join('\n')}
\t\t</Triangles>
\t\t<FXShader ShaderName="ObjectsGDI.fx" TechniqueIndex="0">
\t\t\t<Constants>
\t\t\t\t<Texture Name="DiffuseTexture"><Value>CRRoundaboutAtlas</Value></Texture>
\t\t\t\t<Texture Name="NormalMap"><Value>CRRoundaboutNormal</Value></Texture>
\t\t\t\t<Texture Name="SpecMap"><Value>CRRoundaboutSpec</Value></Texture>
\t\t\t\t<Texture Name="RecolorTexture"><Value>CRRoundaboutHouse</Value></Texture>
\t\t\t\t<Bool Name="AlphaTestEnable"><Value>false</Value></Bool>
\t\t\t</Constants>
\t\t</FXShader>
\t</W3DMesh>`;
}

const modelId = 'CRROUNDABOUT_SKIN';
const meshXml = [
  makeMeshXml(`${modelId}.BODY`, bodyMesh),
  makeMeshXml(`${modelId}.TURRET`, turretMesh),
  makeMeshXml(`${modelId}.GUN`, gunMesh),
  makeMeshXml(`${modelId}.TAIL`, tailMesh),
  ...wheelMeshes.map(binding => makeMeshXml(`${modelId}.${binding.id}`, binding.mesh)),
].join('\n');

const b = bounds(vertices.map(scalePoint));

const identityFixup = '<FixupMatrix M00="1" M10="0" M20="0" M30="0" M01="0" M11="1" M21="0" M31="0" M02="0" M12="0" M22="1" M32="0"/>';

// Hierarchy Definition matching NODRaiderTank:
// 0: ROOTTRANSFORM (parent -1)
// 1: Bone_Turret (parent 0, [0, 0, 8.5])
// 2: GunPitch (parent 1, [6.5, 0, 1.7]) -> world [6.5, 0, 10.2]
// 3: GUN (parent 2, [3.0, 0, 0]) -> world [9.5, 0, 10.2]
// 4: TurretFX (parent 3, [16.0, 0, 0]) -> world [25.5, 0, 10.2]
// 5: MuzzleFlash_01 (parent 3, [16.0, 0, 0]) -> world [25.5, 0, 10.2]
// 6: Turret2 (parent 0, [-14.0, 0, 8.5])
// 7: Turret2_Gun (parent 6, [-5.5, 0, 9.3]) -> world [-19.5, 0, 17.8]
// 8: TurretMS (parent 7, [-1.5, 0, 0]) -> world [-21.0, 0, 17.8]
// 9: Bone_Tail (parent 6, [0, 0, 0])
// 10: Bone_TireLF (parent 0, [13.0, 9.8, 4.8])
// 11: Bone_TireRF (parent 0, [13.0, -9.8, 4.8])
// 12: Bone_TireLR (parent 0, [-13.0, 9.8, 4.8])
// 13: Bone_TireRR (parent 0, [-13.0, -9.8, 4.8])
// 14: FXTracksL (parent 0, [0, 9.8, 0])
// 15: FXTracksR (parent 0, [0, -9.8, 0])
// 16: FXTracksB (parent 0, [-19.0, 0, 4.0])
const pivots = [
  ['ROOTTRANSFORM', -1, 0, 0, 0],
  ['Bone_Turret', 0, 0, 0, 8.5],
  ['GunPitch', 1, 6.5, 0, 1.7],
  ['GUN', 2, 3.0, 0, 0],
  ['TurretFX', 3, 16.0, 0, 0],
  ['MuzzleFlash_01', 3, 16.0, 0, 0],
  ['Turret2', 0, -14.0, 0, 8.5],
  ['Turret2_Gun', 6, -5.5, 0, 9.3],
  ['TurretMS', 7, -1.5, 0, 0],
  ['Bone_Tail', 6, 0, 0, 0],
  ['Bone_TireLF', 0, 13.0, 9.8, 4.8],
  ['Bone_TireRF', 0, 13.0, -9.8, 4.8],
  ['Bone_TireLR', 0, -13.0, 9.8, 4.8],
  ['Bone_TireRR', 0, -13.0, -9.8, 4.8],
  ['FXTracksL', 0, 0, 9.8, 0],
  ['FXTracksR', 0, 0, -9.8, 0],
  ['FXTracksB', 0, -19.0, 0, 4.0],
].map(([name, parent, ...translation]) => [name, parent, ...scalePoint(translation)]);

const hierarchyXml = `\t<W3DHierarchy id="CRROUNDABOUT_SKL">
${pivots.map(([name, parent, x, y, z]) => `\t\t<Pivot Name="${name}" Parent="${parent}"><Translation X="${fmt(x)}" Y="${fmt(y)}" Z="${fmt(z)}"/>\t\t<Rotation X="0" Y="0" Z="0" W="1"/>${identityFixup}</Pivot>`).join('\n')}
\t</W3DHierarchy>`;

const w3x = `<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
\t<Includes><Include type="all" source="ART:CR/CRRoundabout_Texture.xml"/></Includes>
${hierarchyXml}
\t<W3DCollisionBox id="${modelId}.COLLISION"><Center X="${fmt(b.center[0])}" Y="${fmt(b.center[1])}" Z="${fmt(b.center[2])}"/><Extent X="${fmt((b.max[0] - b.min[0]) / 2)}" Y="${fmt((b.max[1] - b.min[1]) / 2)}" Z="${fmt((b.max[2] - b.min[2]) / 2)}"/></W3DCollisionBox>
${meshXml}
\t<W3DContainer id="${modelId}" Hierarchy="CRROUNDABOUT_SKL">
\t\t<SubObject SubObjectID="COLLISION" BoneIndex="0"><RenderObject><CollisionBox>${modelId}.COLLISION</CollisionBox></RenderObject></SubObject>
\t\t<SubObject SubObjectID="BODY" BoneIndex="0"><RenderObject><Mesh>${modelId}.BODY</Mesh></RenderObject></SubObject>
\t\t<SubObject SubObjectID="TURRET" BoneIndex="1"><RenderObject><Mesh>${modelId}.TURRET</Mesh></RenderObject></SubObject>
\t\t<SubObject SubObjectID="GUN" BoneIndex="3"><RenderObject><Mesh>${modelId}.GUN</Mesh></RenderObject></SubObject>
\t\t<SubObject SubObjectID="TAIL" BoneIndex="6"><RenderObject><Mesh>${modelId}.TAIL</Mesh></RenderObject></SubObject>
${wheelMeshes.map(binding => `\t\t<SubObject SubObjectID="${binding.id}" BoneIndex="${binding.bone}"><RenderObject><Mesh>${modelId}.${binding.id}</Mesh></RenderObject></SubObject>`).join('\n')}
\t</W3DContainer>
</AssetDeclaration>
`;

const outputDir = path.resolve(__dirname, '..', 'src', 'Art', 'CR');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const submeshes = [
  { name: 'BODY', mesh: bodyMesh },
  { name: 'TURRET', mesh: turretMesh },
  { name: 'GUN', mesh: gunMesh },
  { name: 'TAIL', mesh: tailMesh },
  ...wheelMeshes.map(b => ({ name: b.id, mesh: b.mesh })),
];

const report = {
  artVersion: 1,
  unit: 'ColumbiaVehicleRoundabout',
  slot: 'NODRaiderTank',
  artScale,
  shader: 'ObjectsGDI.fx',
  model: modelId,
  vertices: submeshes.reduce((s, m) => s + m.mesh.vertices.length, 0),
  triangles: submeshes.reduce((s, m) => s + m.mesh.triangles.length, 0),
  bounds: b,
  bones: pivots.map(p => p[0]),
  outputs: [
    'CRRoundabout_Model.w3x',
    'CRRoundabout_Texture.xml',
    'CRRoundaboutAtlas.tga',
    'CRRoundaboutNormal.tga',
    'CRRoundaboutSpec.tga',
    'CRRoundaboutHouse.tga',
    'CRRoundabout_Portrait.xml',
    'CRRoundaboutPortrait.tga',
    'CRRoundabout.obj',
    'CRRoundabout.mtl',
  ],
};

function exportAssets() {
  fs.writeFileSync(path.join(outputDir, 'CRRoundabout_Model.w3x'), w3x, 'utf8');
  fs.writeFileSync(path.join(outputDir, 'CRRoundabout_Model.report.json'), JSON.stringify(report, null, 2) + '\n');
  writeMaterialMaps(outputDir);

  let obj = '# Columbia Roundabout Enforcer Tank OBJ\nmtllib CRRoundabout.mtl\n';
  let objVertOffset = 1;
  submeshes.forEach(({ name, mesh }) => {
    obj += `o ${name}\nusemtl ObjectsGDI\n`;
    mesh.vertices.forEach(v => { obj += `v ${fmt(v[0])} ${fmt(v[1])} ${fmt(v[2])}\n`; });
    mesh.uvs.forEach(uv => { obj += `vt ${fmt(uv[0])} ${fmt(uv[1])}\n`; });
    mesh.normals.forEach(n => { obj += `vn ${fmt(n[0])} ${fmt(n[1]) || 0} ${fmt(n[2])}\n`; });
    mesh.triangles.forEach(t => {
      const f = t.map(i => i + objVertOffset);
      obj += `f ${f[0]}/${f[0]}/${f[0]} ${f[1]}/${f[1]}/${f[1]} ${f[2]}/${f[2]}/${f[2]}\n`;
    });
    objVertOffset += mesh.vertices.length;
  });
  fs.writeFileSync(path.join(outputDir, 'CRRoundabout.obj'), obj);

  const mtl = `newmtl ObjectsGDI
Ka 1.0 1.0 1.0
Kd 1.0 1.0 1.0
Ks 0.1 0.1 0.1
map_Kd CRRoundaboutAtlas.tga
bump CRRoundaboutNormal.tga
`;
  fs.writeFileSync(path.join(outputDir, 'CRRoundabout.mtl'), mtl);

  console.log(`[OK] Generated Columbia Autonomous Roundabout Enforcer Tank art assets:
     Triangles: ${report.triangles}, Vertices: ${report.vertices}
     Output: ${outputDir}`);
}

if (require.main === module) {
  exportAssets();
}

module.exports = {
  report,
  submeshes,
  w3x,
  exportAssets,
};
