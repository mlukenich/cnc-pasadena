'use strict';
const fs = require('fs');
const path = require('path');
const { createStealthGeometry } = require('./stealth_geometry');
const { smoothNormals, tangentFrame, writeMaterialMaps } = require('./stealth_surface_pipeline');

const { vertices, normals, uvs, triangles, groups, materials } = createStealthGeometry();
smoothNormals({ vertices, normals, triangles, groups });

const pivots = [
  ['ROOTTRANSFORM', -1, 0.0, 0.0, 0.0],
  ['Turret', 0, -2.0, 0.0, 11.5],
  ['FXWeaponL', 1, 4.0, 7.5, 3.5], // local to Turret -> world [-2+4=2, 7.5, 11.5+3.5=15.0]
  ['FXWeaponR', 1, 4.0, -7.5, 3.5], // local to Turret -> world [-2+4=2, -7.5, 11.5+3.5=15.0]
  ['FXMUZZLEFLASH', 1, 4.0, 0.0, 3.5],
  ['Bone_TireLF', 0, 12.0, 10.5, 4.2],
  ['Bone_TireRF', 0, 12.0, -10.5, 4.2],
  ['Bone_TireLR', 0, -12.0, 10.5, 4.2],
  ['Bone_TireRR', 0, -12.0, -10.5, 4.2],
  ['FXTracksL', 0, 0.0, 10.5, 0.0],
  ['FXTracksR', 0, 0.0, -10.5, 0.0],
  ['FXTracksB', 0, -16.0, 0.0, 0.0],
];

function worldPivot(index) {
  const p = pivots[index];
  if (p[1] < 0) return [p[2], p[3], p[4]];
  const parent = worldPivot(p[1]);
  return [parent[0] + p[2], parent[1] + p[3], parent[2] + p[4]];
}

// Subobject Partitioning
const isWheelFL = g => g === 'wheel-front-left';
const isWheelFR = g => g === 'wheel-front-right';
const isWheelRL = g => g === 'wheel-rear-left';
const isWheelRR = g => g === 'wheel-rear-right';
const isLauncherL = g => g.startsWith('launcher-left');
const isLauncherR = g => g.startsWith('launcher-right');
const isTurret = g => g.startsWith('turret-');
const isSkirt = g => g.startsWith('skirt-treads');
const isBody = g => !isWheelFL(g) && !isWheelFR(g) && !isWheelRL(g) && !isWheelRR(g) &&
                   !isLauncherL(g) && !isLauncherR(g) && !isTurret(g) && !isSkirt(g);

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
const launcherLMesh = selectMesh(isLauncherL, worldPivot(2));
const launcherRMesh = selectMesh(isLauncherR, worldPivot(3));
const wheelFLMesh = selectMesh(isWheelFL, worldPivot(5));
const wheelFRMesh = selectMesh(isWheelFR, worldPivot(6));
const wheelRLMesh = selectMesh(isWheelRL, worldPivot(7));
const wheelRRMesh = selectMesh(isWheelRR, worldPivot(8));
const skirtMesh = selectMesh(isSkirt, worldPivot(0));

const submeshDefs = [
  { id: 'BODY', bone: 0, mesh: bodyMesh },
  { id: 'TURRET', bone: 1, mesh: turretMesh },
  { id: 'LAUNCHER_L', bone: 2, mesh: launcherLMesh },
  { id: 'LAUNCHER_R', bone: 3, mesh: launcherRMesh },
  { id: 'TIRE_LF', bone: 5, mesh: wheelFLMesh },
  { id: 'TIRE_RF', bone: 6, mesh: wheelFRMesh },
  { id: 'TIRE_LR', bone: 7, mesh: wheelRLMesh },
  { id: 'TIRE_RR', bone: 8, mesh: wheelRRMesh },
  { id: 'TreadsStop', bone: 0, mesh: skirtMesh },
  { id: 'TreadsMove', bone: 0, mesh: skirtMesh },
  { id: 'TreadsTurnLeft', bone: 0, mesh: skirtMesh },
  { id: 'TreadsTurnRight', bone: 0, mesh: skirtMesh },
];

function bounds(pts) {
  const min = [0, 1, 2].map(k => Math.min(...pts.map(p => p[k])));
  const max = [0, 1, 2].map(k => Math.max(...pts.map(p => p[k])));
  const center = min.map((v, k) => (v + max[k]) / 2);
  const radius = Math.max(...pts.map(p => Math.hypot(...p.map((c, k) => c - center[k]))));
  return { min, max, center, radius };
}

const allBounds = bounds(vertices);
const modelId = 'CTSTEALTH_SKIN';

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
\t\t\t\t<Texture Name="DiffuseTexture"><Value>CTStealthAtlas</Value></Texture>
\t\t\t\t<Texture Name="NormalMap"><Value>CTStealthNormal</Value></Texture>
\t\t\t\t<Texture Name="SpecMap"><Value>CTStealthSpec</Value></Texture>
\t\t\t\t<Texture Name="RecolorTexture"><Value>CTStealthHouse</Value></Texture>
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
\t<Includes><Include type="all" source="ART:CT/CTStealth_Texture.xml"/></Includes>
\t<W3DHierarchy id="CTSTEALTH_SKL">
${pivots.map((p, i) => `\t\t<Pivot Name="${p[0]}" Parent="${p[1]}"><Translation X="${fmt(p[2])}" Y="${fmt(p[3])}" Z="${fmt(p[4])}"/><Rotation X="0" Y="0" Z="0" W="1"/>${identityFixup}</Pivot>`).join('\n')}
\t</W3DHierarchy>
\t<W3DCollisionBox id="${modelId}.COLLISION"><Center X="${fmt(allBounds.center[0])}" Y="${fmt(allBounds.center[1])}" Z="${fmt(allBounds.center[2])}"/><Extent X="${fmt((allBounds.max[0] - allBounds.min[0]) / 2)}" Y="${fmt((allBounds.max[1] - allBounds.min[1]) / 2)}" Z="${fmt((allBounds.max[2] - allBounds.min[2]) / 2)}"/></W3DCollisionBox>

${meshXmlBlocks}

\t<W3DContainer id="${modelId}" Hierarchy="CTSTEALTH_SKL">
\t\t<SubObject SubObjectID="COLLISION" BoneIndex="0"><RenderObject><CollisionBox>${modelId}.COLLISION</CollisionBox></RenderObject></SubObject>
${containerSubObjects}
\t</W3DContainer>
</AssetDeclaration>
`;

const outputDir = path.resolve(__dirname, '..', 'src', 'Art', 'CT');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const report = {
  artVersion: 1,
  unit: 'ColumbiaVehicleStealth',
  slot: 'NODStealthTank',
  shader: 'ObjectsGDI.fx',
  model: modelId,
  vertices: submeshDefs.reduce((s, m) => s + m.mesh.vertices.length, 0),
  triangles: submeshDefs.reduce((s, m) => s + m.mesh.triangles.length, 0),
  bounds: allBounds,
  bones: pivots.map(p => p[0]),
  outputs: [
    'CTStealth_Model.w3x',
    'CTStealth_Texture.xml',
    'CTStealthAtlas.tga',
    'CTStealthNormal.tga',
    'CTStealthSpec.tga',
    'CTStealthHouse.tga',
    'CTStealth_Portrait.xml',
    'CTStealthPortrait.tga',
    'CTStealth.obj',
    'CTStealth.mtl',
  ],
};

function exportAssets() {
  fs.writeFileSync(path.join(outputDir, 'CTStealth_Model.w3x'), w3x, 'utf8');
  fs.writeFileSync(path.join(outputDir, 'CTStealth_Model.report.json'), JSON.stringify(report, null, 2) + '\n');
  writeMaterialMaps(outputDir);

  // Write OBJ & MTL
  let obj = '# Columbia Active-Camouflage HOA Surveillance Cruiser OBJ\nmtllib CTStealth.mtl\n';
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
  fs.writeFileSync(path.join(outputDir, 'CTStealth.obj'), obj);

  const mtl = `newmtl ObjectsGDI
Ka 1.0 1.0 1.0
Kd 1.0 1.0 1.0
Ks 0.1 0.1 0.1
map_Kd CTStealthAtlas.tga
bump CTStealthNormal.tga
`;
  fs.writeFileSync(path.join(outputDir, 'CTStealth.mtl'), mtl);

  console.log(`[OK] Generated Columbia Stealth Cruiser art assets:
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
