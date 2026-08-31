'use strict';
const fs = require('fs');
const path = require('path');
const { createMammothGeometry } = require('./mammoth_geometry');
const { smoothNormals, tangentFrame, writeMaterialMaps } = require('./mammoth_surface_pipeline');

const { vertices, normals, uvs, triangles, groups, materials } = createMammothGeometry();
smoothNormals({ vertices, normals, triangles, groups });

const pivots = [
  ['ROOTTRANSFORM', -1, 0.0, 0.0, 0.0],
  ['Bone_Turret', 0, -2.0, 0.0, 15.5],
  ['Bone_Rails', 1, 7.0, 0.0, 3.5], // local relative to Bone_Turret -> world [-2+7=5, 0, 15.5+3.5=19]
  ['Bone_Barrel_01', 2, 4.5, 4.2, 0.0], // local relative to Bone_Rails -> world [9.5, 4.2, 19.0]
  ['Bone_Barrel_02', 2, 4.5, -4.2, 0.0], // local relative to Bone_Rails -> world [9.5, -4.2, 19.0]
  ['MuzzleFX01', 3, 29.0, 0.0, 0.0],
  ['MuzzleFlash_01', 3, 29.0, 0.0, 0.0],
  ['MuzzleFX02', 4, 29.0, 0.0, 0.0],
  ['MuzzleFlash_02', 4, 29.0, 0.0, 0.0],
  ['Turret01', 0, 12.0, 16.5, 17.5], // left rocket pod
  ['RocketLaunch01', 9, 5.1, 0.0, 0.0],
  ['Turret02', 0, 12.0, -16.5, 17.5], // right rocket pod
  ['RocketLaunch02', 11, 5.1, 0.0, 0.0],
  ['Bone_TireLF', 0, 18.0, 17.0, 8.5],
  ['Bone_TireRF', 0, 18.0, -17.0, 8.5],
  ['Bone_TireLR', 0, -18.0, 17.0, 8.5],
  ['Bone_TireRR', 0, -18.0, -17.0, 8.5],
  ['FXTracksLF', 0, 18.0, 17.0, 0.0],
  ['FXTracksRF', 0, 18.0, -17.0, 0.0],
  ['FXTracksLR', 0, -18.0, 17.0, 0.0],
  ['FXTracksRR', 0, -18.0, -17.0, 0.0],
];

function worldPivot(index) {
  const p = pivots[index];
  if (p[1] < 0) return [p[2], p[3], p[4]];
  const parent = worldPivot(p[1]);
  return [parent[0] + p[2], parent[1] + p[3], parent[2] + p[4]];
}

// Subobject Partitioning
const isWheelFL = g => g.startsWith('wheel-front-left');
const isWheelFR = g => g.startsWith('wheel-front-right');
const isWheelRL = g => g.startsWith('wheel-rear-left');
const isWheelRR = g => g.startsWith('wheel-rear-right');
const isPodL = g => g.startsWith('pod-left');
const isPodR = g => g.startsWith('pod-right');
const isBarrel01 = g => g.startsWith('barrel-left');
const isBarrel02 = g => g.startsWith('barrel-right');
const isRails = g => g.startsWith('rails-');
const isTurret = g => g.startsWith('turret-');
const isSkirt = g => g.startsWith('skirt-treads');
const isBody = g => !isWheelFL(g) && !isWheelFR(g) && !isWheelRL(g) && !isWheelRR(g) &&
                   !isPodL(g) && !isPodR(g) && !isBarrel01(g) && !isBarrel02(g) &&
                   !isRails(g) && !isTurret(g) && !isSkirt(g);

function selectMesh(predicate, offset) {
  const selV = [];
  const selN = [];
  const selUV = [];
  const selTri = [];
  const remap = new Map();

  triangles.forEach((tri, triIdx) => {
    if (!predicate(groups[triIdx])) return;
    const mapped = tri.map(oldIdx => {
      if (!remap.has(oldIdx)) {
        remap.set(oldIdx, selV.length);
        selV.push([
          vertices[oldIdx][0] - offset[0],
          vertices[oldIdx][1] - offset[1],
          vertices[oldIdx][2] - offset[2],
        ]);
        selN.push(normals[oldIdx]);
        selUV.push(uvs[oldIdx]);
      }
      return remap.get(oldIdx);
    });
    selTri.push(mapped);
  });

  return {
    vertices: selV,
    normals: selN,
    uvs: selUV,
    triangles: selTri,
  };
}

const bodyMesh = selectMesh(isBody, worldPivot(0));
const turretMesh = selectMesh(isTurret, worldPivot(1));
const railsMesh = selectMesh(isRails, worldPivot(2));
const barrel01Mesh = selectMesh(isBarrel01, worldPivot(3));
const barrel02Mesh = selectMesh(isBarrel02, worldPivot(4));
const podLMesh = selectMesh(isPodL, worldPivot(9));
const podRMesh = selectMesh(isPodR, worldPivot(11));
const wheelFLMesh = selectMesh(isWheelFL, worldPivot(13));
const wheelFRMesh = selectMesh(isWheelFR, worldPivot(14));
const wheelRLMesh = selectMesh(isWheelRL, worldPivot(15));
const wheelRRMesh = selectMesh(isWheelRR, worldPivot(16));
const skirtMesh = selectMesh(isSkirt, worldPivot(0));

const submeshDefs = [
  { id: 'BODY', bone: 0, mesh: bodyMesh },
  { id: 'TURRET', bone: 1, mesh: turretMesh },
  { id: 'RAILS', bone: 2, mesh: railsMesh },
  { id: 'BARREL_01', bone: 3, mesh: barrel01Mesh },
  { id: 'BARREL_02', bone: 4, mesh: barrel02Mesh },
  { id: 'POD_L', bone: 9, mesh: podLMesh },
  { id: 'POD_R', bone: 11, mesh: podRMesh },
  { id: 'TIRE_LF', bone: 13, mesh: wheelFLMesh },
  { id: 'TIRE_RF', bone: 14, mesh: wheelFRMesh },
  { id: 'TIRE_LR', bone: 15, mesh: wheelRLMesh },
  { id: 'TIRE_RR', bone: 16, mesh: wheelRRMesh },
  { id: 'TreadsStop', bone: 0, mesh: skirtMesh },
  { id: 'TreadsMove', bone: 0, mesh: skirtMesh },
  { id: 'TreadsLeft', bone: 0, mesh: skirtMesh },
  { id: 'TreadsRight', bone: 0, mesh: skirtMesh },
  { id: 'TreadsBack', bone: 0, mesh: skirtMesh },
];

function bounds(pts) {
  const min = [0, 1, 2].map(k => Math.min(...pts.map(p => p[k])));
  const max = [0, 1, 2].map(k => Math.max(...pts.map(p => p[k])));
  const center = min.map((v, k) => (v + max[k]) / 2);
  const radius = Math.max(...pts.map(p => Math.hypot(...p.map((c, k) => c - center[k]))));
  return { min, max, center, radius };
}

const allBounds = bounds(vertices);
const modelId = 'PJMAMMOTH_SKIN';

function fmt(n) {
  return Number(n.toFixed(6)).toString();
}

function triangleNormal(t, pts) {
  const [p0, p1, p2] = t.map(i => pts[i]);
  const u = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]];
  const v = [p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]];
  const cr = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const l = Math.hypot(...cr);
  return l > 1e-12 ? cr.map(c => c / l) : [0, 0, 1];
}

function meshToXml(id, mesh) {
  const b = bounds(mesh.vertices);
  const { tangents, binormals } = tangentFrame(mesh);

  const vertsXml = mesh.vertices.map(v => `\t\t\t<V X="${fmt(v[0])}" Y="${fmt(v[1])}" Z="${fmt(v[2])}"/>`).join('\n');
  const normalsXml = mesh.normals.map(n => `\t\t\t<N X="${fmt(n[0])}" Y="${fmt(n[1])}" Z="${fmt(n[2])}"/>`).join('\n');
  const tangXml = tangents.map(t => `\t\t\t<T X="${fmt(t[0])}" Y="${fmt(t[1])}" Z="${fmt(t[2])}"/>`).join('\n');
  const binormXml = binormals.map(b => `\t\t\t<B X="${fmt(b[0])}" Y="${fmt(b[1])}" Z="${fmt(b[2])}"/>`).join('\n');
  const uvsXml = mesh.uvs.map(u => `\t\t\t<T X="${fmt(u[0])}" Y="${fmt(1 - u[1])}"/>`).join('\n');
  const trisXml = mesh.triangles.map(t => {
    const n = triangleNormal(t, mesh.vertices);
    const d = n[0] * mesh.vertices[t[0]][0] + n[1] * mesh.vertices[t[0]][1] + n[2] * mesh.vertices[t[0]][2];
    return `\t\t\t<T><V>${t[0]}</V><V>${t[1]}</V><V>${t[2]}</V><Nrm X="${fmt(n[0])}" Y="${fmt(n[1])}" Z="${fmt(n[2])}"/><Dist>${fmt(d)}</Dist></T>`;
  }).join('\n');

  return `\t<W3DMesh id="${modelId}.${id}" CastShadow="true" GeometryType="Normal">
\t\t<BoundingBox>
\t\t\t<Min X="${fmt(b.min[0])}" Y="${fmt(b.min[1])}" Z="${fmt(b.min[2])}"/>
\t\t\t<Max X="${fmt(b.max[0])}" Y="${fmt(b.max[1])}" Z="${fmt(b.max[2])}"/>
\t\t</BoundingBox>
\t\t<BoundingSphere Radius="${fmt(b.radius)}"><Center X="${fmt(b.center[0])}" Y="${fmt(b.center[1])}" Z="${fmt(b.center[2])}"/></BoundingSphere>
\t\t<Vertices>
${vertsXml}
\t\t</Vertices>
\t\t<Normals>
${normalsXml}
\t\t</Normals>
\t\t<Tangents>
${tangXml}
\t\t</Tangents>
\t\t<Binormals>
${binormXml}
\t\t</Binormals>
\t\t<TexCoords>
${uvsXml}
\t\t</TexCoords>
\t\t<Triangles>
${trisXml}
\t\t</Triangles>
\t\t<FXShader ShaderName="ObjectsGDI.fx" TechniqueIndex="0">
\t\t\t<Constants>
\t\t\t\t<Texture Name="DiffuseTexture"><Value>PJMammothAtlas</Value></Texture>
\t\t\t\t<Texture Name="NormalMap"><Value>PJMammothNormal</Value></Texture>
\t\t\t\t<Texture Name="SpecMap"><Value>PJMammothSpec</Value></Texture>
\t\t\t\t<Texture Name="RecolorTexture"><Value>PJMammothHouse</Value></Texture>
\t\t\t\t<Bool Name="AlphaTestEnable"><Value>false</Value></Bool>
\t\t\t</Constants>
\t\t</FXShader>
\t</W3DMesh>`;
}

// Generate W3X Document
const meshXmlBlocks = submeshDefs.map(d => meshToXml(d.id, d.mesh)).join('\n\n');
const containerSubObjects = submeshDefs.map(d => `\t\t<SubObject SubObjectID="${d.id}" BoneIndex="${d.bone}"><RenderObject><Mesh>${modelId}.${d.id}</Mesh></RenderObject></SubObject>`).join('\n');
const identityFixup = '<FixupMatrix M00="1" M10="0" M20="0" M30="0" M01="0" M11="1" M21="0" M31="0" M02="0" M12="0" M22="1" M32="0"/>';

const w3x = `<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
\t<Includes><Include type="all" source="ART:PJ/PJMammoth_Texture.xml"/></Includes>
\t<W3DHierarchy id="PJMAMMOTH_SKL">
${pivots.map((p, i) => `\t\t<Pivot Name="${p[0]}" Parent="${p[1]}"><Translation X="${fmt(p[2])}" Y="${fmt(p[3])}" Z="${fmt(p[4])}"/><Rotation X="0" Y="0" Z="0" W="1"/>${identityFixup}</Pivot>`).join('\n')}
\t</W3DHierarchy>
\t<W3DCollisionBox id="${modelId}.COLLISION"><Center X="${fmt(allBounds.center[0])}" Y="${fmt(allBounds.center[1])}" Z="${fmt(allBounds.center[2])}"/><Extent X="${fmt((allBounds.max[0] - allBounds.min[0]) / 2)}" Y="${fmt((allBounds.max[1] - allBounds.min[1]) / 2)}" Z="${fmt((allBounds.max[2] - allBounds.min[2]) / 2)}"/></W3DCollisionBox>

${meshXmlBlocks}

\t<W3DContainer id="${modelId}" Hierarchy="PJMAMMOTH_SKL">
\t\t<SubObject SubObjectID="COLLISION" BoneIndex="0"><RenderObject><CollisionBox>${modelId}.COLLISION</CollisionBox></RenderObject></SubObject>
${containerSubObjects}
\t</W3DContainer>
</AssetDeclaration>
`;

const outputDir = path.resolve(__dirname, '..', 'src', 'Art', 'PJ');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const report = {
  artVersion: 1,
  unit: 'PasadenaVehicleMonster',
  slot: 'GDIMammoth',
  shader: 'ObjectsGDI.fx',
  model: modelId,
  vertices: submeshDefs.reduce((s, m) => s + m.mesh.vertices.length, 0),
  triangles: submeshDefs.reduce((s, m) => s + m.mesh.triangles.length, 0),
  bounds: allBounds,
  bones: pivots.map(p => p[0]),
  outputs: [
    'PJMammoth_Model.w3x',
    'PJMammoth_Texture.xml',
    'PJMammothAtlas.tga',
    'PJMammothNormal.tga',
    'PJMammothSpec.tga',
    'PJMammothHouse.tga',
    'PJMammoth_Portrait.xml',
    'PJMammothPortrait.tga',
    'PJMammoth.obj',
    'PJMammoth.mtl',
  ],
};

function exportAssets() {
  fs.writeFileSync(path.join(outputDir, 'PJMammoth_Model.w3x'), w3x, 'utf8');
  fs.writeFileSync(path.join(outputDir, 'PJMammoth_Model.report.json'), JSON.stringify(report, null, 2) + '\n');
  writeMaterialMaps(outputDir);

  // Write OBJ & MTL
  let obj = '# The Monster Mudder Juggernaut OBJ\nmtllib PJMammoth.mtl\n';
  let objVertOffset = 1;
  submeshDefs.forEach(({ id, bone, mesh }) => {
    obj += `o ${id}\nusemtl ObjectsGDI\n`;
    const offset = worldPivot(bone);
    mesh.vertices.forEach(v => { obj += `v ${fmt(v[0] + offset[0])} ${fmt(v[1] + offset[1])} ${fmt(v[2] + offset[2])}\n`; });
    mesh.uvs.forEach(u => { obj += `vt ${fmt(u[0])} ${fmt(1 - u[1])}\n`; });
    mesh.normals.forEach(n => { obj += `vn ${fmt(n[0])} ${fmt(n[1])} ${fmt(n[2])}\n`; });
    mesh.triangles.forEach(t => {
      const f = t.map(i => i + objVertOffset);
      obj += `f ${f[0]}/${f[0]}/${f[0]} ${f[1]}/${f[1]}/${f[1]} ${f[2]}/${f[2]}/${f[2]}\n`;
    });
    objVertOffset += mesh.vertices.length;
  });
  fs.writeFileSync(path.join(outputDir, 'PJMammoth.obj'), obj);

  const mtl = `newmtl ObjectsGDI
Ka 1.0 1.0 1.0
Kd 1.0 1.0 1.0
Ks 0.1 0.1 0.1
map_Kd PJMammothAtlas.tga
bump PJMammothNormal.tga
`;
  fs.writeFileSync(path.join(outputDir, 'PJMammoth.mtl'), mtl);

  console.log(`[OK] Generated Pasadena Monster Mudder Juggernaut art assets:
     Triangles: ${report.triangles}, Vertices: ${report.vertices}
     Output: ${outputDir}`);
}

if (require.main === module) {
  exportAssets();
}

module.exports = {
  pivots,
  worldMesh: { vertices, normals, uvs, triangles, groups, materials },
  report,
  submeshDefs,
  w3x,
  exportAssets,
};
