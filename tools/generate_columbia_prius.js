/*
 * Deterministic source generator for the Columbia Prius Patrol EV model.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { smoothNormals, tangentFrame, writeMaterialMaps, writePortraitTga } = require('./prius_surface_pipeline');

const workspace = path.resolve(__dirname, '..');
const outputDir = path.join(workspace, 'src', 'Art', 'CV');
fs.mkdirSync(outputDir, { recursive: true });

const textureId = 'CVPriusAtlas';
const modelId = 'CUPRIUS_SKIN';
const meshId = `${modelId}.BODY`;
const artScale = 0.88;
const scalePoint = p => p.map(v => v * artScale);

const palette = {
  pearl:        [236, 240, 245, 255],
  cyan:         [0, 168, 204, 255],
  rubber:       [25, 26, 28, 255],
  chrome:       [220, 225, 230, 255],
  solarGlass:   [16, 32, 54, 255],
  carbon:       [32, 34, 36, 255],
  strobe:       [240, 40, 40, 255],
  gunmetal:     [48, 50, 56, 255],
};
const paletteKeys = Object.keys(palette);
const panelKeys = [
  'hoodPanel', 'doorPanel', 'solarRoof', 'tailPanel',
  'frontFascia', 'teamBadge', 'treadPanel', 'laserFace'
];
const materialKeys = [...paletteKeys, ...panelKeys];

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
  if (group === 'hood-top' && normal[2] > 0.4) {
    index = 8; projection = p => [(p[1] + 8.6) / 17.2, (26.8 - p[0]) / 15.3];
  } else if (group === 'door-badge-panel' && Math.abs(normal[1]) > 0.6) {
    index = 9; projection = p => [(p[0] + 9.5) / 19.0, (13.4 - p[2]) / 2.9];
  } else if (group === 'roof-surface' && normal[2] > 0.5) {
    index = 10; projection = p => [(p[1] + 6.8) / 13.6, (1.5 - p[0]) / 10.5];
  } else if (group === 'tailgate-panel' && normal[0] < -0.4) {
    index = 11; projection = p => [(p[1] + 7.5) / 15.0, (11.2 - p[2]) / 3.2];
  } else if (group === 'front-headlights' && normal[0] > 0.5) {
    index = 12; projection = p => [(p[1] + 7.4) / 14.8, (8.6 - p[2]) / 1.4];
  } else if (group === 'turret-strobe-lens' && normal[2] > 0.4) {
    index = 6; projection = p => [(p[1] + 3.8) / 7.6, (p[0] + 2.4) / 6.6];
  } else if (group.startsWith('wheel-')) {
    const cx = group.includes('front') ? 16.0 : -16.0;
    const cy = group.includes('left') ? 9.8 : -9.8;
    const ySign = group.includes('left') ? 1.0 : -1.0;
    const cz = 5.2;
    if (group.includes('tire-outer') && Math.abs(normal[1]) < 0.75) {
      index = 14;
      projection = p => {
        const theta = Math.atan2(p[2] - cz, p[0] - cx);
        const u = (theta / (2 * Math.PI) + 1.0) % 1.0;
        const v = (p[1] - cy) / (2.4 * ySign);
        return [u, v];
      };
    } else if (Math.abs(normal[1]) > 0.6) {
      index = group.includes('rim') ? 3 : 2;
      const radius = group.includes('rim') ? 3.2 : 5.0;
      projection = p => [
        0.5 + (p[0] - cx) / (2.2 * radius),
        0.5 - (p[2] - cz) / (2.2 * radius)
      ];
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

  // Automatic planar orthogonal UV mapping
  const u0 = col / 4 + 0.04;
  const v0 = row / 4 + 0.04;

  const absN = normal.map(Math.abs);
  let uDir, vDir;
  if (absN[0] >= absN[1] && absN[0] >= absN[2]) {
    uDir = [0, normal[0] > 0 ? 1 : -1, 0];
    vDir = [0, 0, 1];
  } else if (absN[1] >= absN[0] && absN[1] >= absN[2]) {
    uDir = [normal[1] > 0 ? -1 : 1, 0, 0];
    vDir = [0, 0, 1];
  } else {
    uDir = [1, 0, 0];
    vDir = [0, normal[2] > 0 ? 1 : -1, 0];
  }

  const local = points.map(pt => [
    pt.reduce((s, v, i) => s + v * uDir[i], 0),
    pt.reduce((s, v, i) => s + v * vDir[i], 0)
  ]);
  const minU = Math.min(...local.map(l => l[0])), maxU = Math.max(...local.map(l => l[0]));
  const minV = Math.min(...local.map(l => l[1])), maxV = Math.max(...local.map(l => l[1]));
  const spanU = Math.max(maxU - minU, 0.01);
  const spanV = Math.max(maxV - minV, 0.01);
  const maxSpan = Math.max(spanU, spanV, 1.0);
  const scale = 0.16 / maxSpan;

  return local.map(l => [
    u0 + (l[0] - minU) * scale,
    v0 + (l[1] - minV) * scale
  ]);
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

function addCylinder(name, cx, cy, cz, radius, length, axis, segments, material) {
  const half = length / 2;
  for (let i = 0; i < segments; i += 1) {
    const a0 = 2 * Math.PI * i / segments;
    const a1 = 2 * Math.PI * (i + 1) / segments;
    const c0 = Math.cos(a0), s0 = Math.sin(a0);
    const c1 = Math.cos(a1), s1 = Math.sin(a1);
    const p = [
      offsetPoint(axisPoint(axis, -half, radius * c0, radius * s0), cx, cy, cz),
      offsetPoint(axisPoint(axis,  half, radius * c0, radius * s0), cx, cy, cz),
      offsetPoint(axisPoint(axis,  half, radius * c1, radius * s1), cx, cy, cz),
      offsetPoint(axisPoint(axis, -half, radius * c1, radius * s1), cx, cy, cz),
    ];
    addFace(p, axisNormal(axis, Math.cos((a0 + a1) / 2), Math.sin((a0 + a1) / 2)), material, name);

    const centerNeg = offsetPoint(axisPoint(axis, -half, 0, 0), cx, cy, cz);
    const centerPos = offsetPoint(axisPoint(axis,  half, 0, 0), cx, cy, cz);
    const rim0Neg = offsetPoint(axisPoint(axis, -half, radius * c0, radius * s0), cx, cy, cz);
    const rim1Neg = offsetPoint(axisPoint(axis, -half, radius * c1, radius * s1), cx, cy, cz);
    const rim0Pos = offsetPoint(axisPoint(axis,  half, radius * c0, radius * s0), cx, cy, cz);
    const rim1Pos = offsetPoint(axisPoint(axis,  half, radius * c1, radius * s1), cx, cy, cz);
    addTriangle([centerNeg, rim1Neg, rim0Neg], axisNormal(axis, 0, 0, -1), material, name);
    addTriangle([centerPos, rim0Pos, rim1Pos], axisNormal(axis, 0, 0,  1), material, name);
  }
}

// Build geometry
require('./prius_geometry')({ addBox, addCylinder, addFace, addTriangle });

// Apply scalePoint after UV projection
for (let i = 0; i < vertices.length; i++) {
  vertices[i] = scalePoint(vertices[i]);
}
require('./prius_surface_pipeline').smoothNormals({ vertices, normals, triangles, groups });

function bounds(points) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const v of points) {
    for (let i = 0; i < 3; i++) {
      min[i] = Math.min(min[i], v[i]);
      max[i] = Math.max(max[i], v[i]);
    }
  }
  const center = min.map((v, i) => (v + max[i]) / 2);
  let radius = 0;
  for (const v of points) {
    radius = Math.max(radius, Math.hypot(v[0] - center[0], v[1] - center[1], v[2] - center[2]));
  }
  return { min, max, center, radius };
}

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
  return { vertices: selectedVertices, normals: selectedNormals, uvs: selectedUvs, triangles: selectedTriangles };
}

function makeMeshXml(id, mesh) {
  const b = bounds(mesh.vertices);
  const { tangents, binormals } = tangentFrame(mesh);

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
${mesh.normals.map(n => `\t\t\t<N X="${fmt(n[0])}" Y="${fmt(n[1])}" Z="${fmt(n[2])}"/>`).join('\n')}
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
\t\t\t\t<Texture Name="DiffuseTexture"><Value>${textureId}</Value></Texture>
\t\t\t\t<Texture Name="NormalMap"><Value>CVPriusNormal</Value></Texture>
\t\t\t\t<Texture Name="SpecMap"><Value>CVPriusSpec</Value></Texture>
\t\t\t\t<Texture Name="RecolorTexture"><Value>CVPriusHouse</Value></Texture>
\t\t\t\t<Bool Name="AlphaTestEnable"><Value>false</Value></Bool>
\t\t\t</Constants>
\t\t</FXShader>
\t</W3DMesh>`;
}

// Wheel bindings matching NODScorpionBuggy TruckDraw:
// Bone_TireLF, Bone_TireRF, Bone_TireLR, Bone_TireRR
const wheelBindings = [
  { id: 'TIRE_LF', bone: 1, prefix: 'wheel-front-left', offset: [16.0, 9.8, 5.2] },
  { id: 'TIRE_RF', bone: 2, prefix: 'wheel-front-right', offset: [16.0, -9.8, 5.2] },
  { id: 'TIRE_LR', bone: 3, prefix: 'wheel-rear-left', offset: [-16.0, 9.8, 5.2] },
  { id: 'TIRE_RR', bone: 4, prefix: 'wheel-rear-right', offset: [-16.0, -9.8, 5.2] },
].map(binding => ({ ...binding, offset: scalePoint(binding.offset) }));

const isWheel = group => group.startsWith('wheel-');
const isTurret = group => group.startsWith('turret-') || group.startsWith('emp-');
const isLaser = group => group.startsWith('laser-');

const bodyMesh = selectMesh(group => !isWheel(group) && !isTurret(group) && !isLaser(group), [0, 0, 0]);
const turretMesh = selectMesh(isTurret, scalePoint([1.0, 0, 16.6]));
const laserMesh = selectMesh(isLaser, scalePoint([2.5, 0, 18.6]));
const wheelMeshes = wheelBindings.map(binding => ({
  ...binding,
  mesh: selectMesh(group => group.startsWith(binding.prefix), binding.offset),
}));

const meshXml = [
  makeMeshXml(meshId, bodyMesh),
  makeMeshXml(`${modelId}.TURRET`, turretMesh),
  makeMeshXml(`${modelId}.GUNS`, laserMesh),
  ...wheelMeshes.map(binding => makeMeshXml(`${modelId}.${binding.id}`, binding.mesh)),
].join('\n');

const b = bounds(vertices);

const identityFixup = '<FixupMatrix M00="1" M10="0" M20="0" M30="0" M01="0" M11="1" M21="0" M31="0" M02="0" M12="0" M22="1" M32="0"/>';
const pivots = [
  ['ROOTTRANSFORM', -1, 0, 0, 0],
  ['Bone_TireLF', 0, 16.0, 9.8, 5.2],
  ['Bone_TireRF', 0, 16.0, -9.8, 5.2],
  ['Bone_TireLR', 0, -16.0, 9.8, 5.2],
  ['Bone_TireRR', 0, -16.0, -9.8, 5.2],
  ['Turret', 0, 1.0, 0, 16.6],
  ['Turret_Pitch', 5, 1.5, 0, 2.0],
  ['FX_Weapon01', 6, 6.0, 0, 0.0],
  ['EMP', 0, -5.5, 0, 16.5],
].map(([name, parent, ...translation]) => [name, parent, ...scalePoint(translation)]);

const hierarchyXml = `\t<W3DHierarchy id="CUPRIUS_SKL">
${pivots.map(([name, parent, x, y, z]) => `\t\t<Pivot Name="${name}" Parent="${parent}"><Translation X="${fmt(x)}" Y="${fmt(y)}" Z="${fmt(z)}"/>\t\t<Rotation X="0" Y="0" Z="0" W="1"/>${identityFixup}</Pivot>`).join('\n')}
\t</W3DHierarchy>`;

const w3x = `<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
\t<Includes><Include type="all" source="ART:CV/CVPrius_Texture.xml"/></Includes>
${hierarchyXml}
\t<W3DCollisionBox id="${modelId}.COLLISION"><Center X="${fmt(b.center[0])}" Y="${fmt(b.center[1])}" Z="${fmt(b.center[2])}"/><Extent X="${fmt((b.max[0] - b.min[0]) / 2)}" Y="${fmt((b.max[1] - b.min[1]) / 2)}" Z="${fmt((b.max[2] - b.min[2]) / 2)}"/></W3DCollisionBox>
${meshXml}
\t<W3DContainer id="${modelId}" Hierarchy="CUPRIUS_SKL">
\t\t<SubObject SubObjectID="COLLISION" BoneIndex="0"><RenderObject><CollisionBox>${modelId}.COLLISION</CollisionBox></RenderObject></SubObject>
\t\t<SubObject SubObjectID="BODY" BoneIndex="0"><RenderObject><Mesh>${meshId}</Mesh></RenderObject></SubObject>
\t\t<SubObject SubObjectID="TURRET" BoneIndex="5"><RenderObject><Mesh>${modelId}.TURRET</Mesh></RenderObject></SubObject>
\t\t<SubObject SubObjectID="GUNS" BoneIndex="6"><RenderObject><Mesh>${modelId}.GUNS</Mesh></RenderObject></SubObject>
${wheelMeshes.map(binding => `\t\t<SubObject SubObjectID="${binding.id}" BoneIndex="${binding.bone}"><RenderObject><Mesh>${modelId}.${binding.id}</Mesh></RenderObject></SubObject>`).join('\n')}
\t</W3DContainer>
</AssetDeclaration>
`;

fs.writeFileSync(path.join(outputDir, 'CVPrius_Model.w3x'), w3x, 'utf8');

const textureXml = `<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset">
\t<Texture id="CVPriusAtlas" File="CVPriusAtlas.tga" OutputFormat="DXT1" AllowAutomaticResize="false"/>
\t<Texture id="CVPriusNormal" File="CVPriusNormal.tga" OutputFormat="A8R8G8B8" AllowAutomaticResize="false"/>
\t<Texture id="CVPriusSpec" File="CVPriusSpec.tga" OutputFormat="DXT5" AllowAutomaticResize="false"/>
\t<Texture id="CVPriusHouse" File="CVPriusHouse.tga" OutputFormat="DXT5" AllowAutomaticResize="false"/>
</AssetDeclaration>
`;
fs.writeFileSync(path.join(outputDir, 'CVPrius_Texture.xml'), textureXml, 'utf8');

const portraitXml = `<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
\t<Texture id="CVPriusPortraitAtlas" File="CVPriusPortrait.tga" OutputFormat="A8R8G8B8" GenerateMipMaps="false" AllowAutomaticResize="false"/>
\t<PackedTextureImage id="Portrait_ColumbiaPrius" Texture="CVPriusPortraitAtlas" Rotated="false">
\t\t<Dimensions x="128" y="128"/><Coords x="0" y="0"/><TextureDimensions x="128" y="128"/>
\t</PackedTextureImage>
</AssetDeclaration>
`;
fs.writeFileSync(path.join(outputDir, 'CVPrius_Portrait.xml'), portraitXml, 'utf8');

// Write Material Maps & Portrait TGA
writeMaterialMaps(outputDir);
writePortraitTga(outputDir);

// Write OBJ/MTL
const objLines = [`# Columbia Prius Patrol EV OBJ export`, `mtllib CVPrius.mtl`, `o CVPrius`];
for (const v of vertices) objLines.push(`v ${fmt(v[0])} ${fmt(v[1])} ${fmt(v[2])}`);
for (const uv of uvs) objLines.push(`vt ${fmt(uv[0])} ${fmt(uv[1])}`);
for (const n of normals) objLines.push(`vn ${fmt(n[0])} ${fmt(n[1])} ${fmt(n[2])}`);
for (const t of triangles) {
  objLines.push(`f ${t[0] + 1}/${t[0] + 1}/${t[0] + 1} ${t[1] + 1}/${t[1] + 1}/${t[1] + 1} ${t[2] + 1}/${t[2] + 1}/${t[2] + 1}`);
}
fs.writeFileSync(path.join(outputDir, 'CVPrius.obj'), objLines.join('\n') + '\n', 'utf8');
fs.writeFileSync(path.join(outputDir, 'CVPrius.mtl'), `newmtl Material\nmap_Kd CVPriusAtlas.tga\n`, 'utf8');

const report = {
  artVersion: 1,
  unit: 'ColumbiaVehiclePrius',
  slot: 'NODScorpionBuggy',
  artScale,
  shader: 'ObjectsGDI.fx',
  model: modelId,
  vertices: vertices.length,
  triangles: triangles.length,
  bounds: b,
  bones: pivots.map(p => p[0]),
  outputs: [
    'CVPrius_Model.w3x',
    'CVPrius_Texture.xml',
    'CVPriusAtlas.tga',
    'CVPriusNormal.tga',
    'CVPriusSpec.tga',
    'CVPriusHouse.tga',
    'CVPrius_Portrait.xml',
    'CVPriusPortrait.tga',
    'CVPrius.obj',
    'CVPrius.mtl'
  ],
};
fs.writeFileSync(path.join(outputDir, 'CVPrius_Model.report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');

console.log(`[OK] Generated Columbia Prius Patrol EV art assets:`);
console.log(`     Triangles: ${triangles.length}, Vertices: ${vertices.length}`);
console.log(`     Output: ${outputDir}`);

module.exports = {
  vertices,
  normals,
  uvs,
  triangles,
  groups,
  materials,
  wheelBindings,
  pivots,
  bodyMesh,
  turretMesh,
  laserMesh,
  wheelMeshes,
  artScale,
};
