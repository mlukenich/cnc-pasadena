'use strict';
const fs = require('fs');
const path = require('path');
const buildMudTank = require('./mudtank_geometry');
const {
  smoothNormals,
  tangentFrame,
  writeMaterialMaps,
} = require('./mudtank_surface_pipeline');

const artScale = 1.10; // 25% larger than revision 2; vertices and attachments scale together.
const scalePoint = p => p.map(v => Number((v * artScale).toFixed(6)));

const palette = {
  paint: 0,
  blackFender: 1,
  tireRubber: 2,
  steelRim: 3,
  turretShell: 4,
  diamondPlate: 5,
  glass: 6,
  supercharger: 7,
  hoodPanel: 8,
  doorPanel: 9,
  cabRoof: 10,
  tailgate: 11,
  frontGrille: 12,
  oldBayCrate: 13,
  tireTread: 14,
  cannonMuzzle: 15,
};
const materialKeys = Object.keys(palette);

const vertices = [];
const normals = [];
const uvs = [];
const triangles = [];
const groups = [];
const materials = [];
const uvGroupBounds = new Map();
let collectingBounds = true;
function collectBounds(points,group) {
  if(!uvGroupBounds.has(group))uvGroupBounds.set(group,{min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]});
  const b=uvGroupBounds.get(group);
  for(const p of points)for(let k=0;k<3;k++) { b.min[k]=Math.min(b.min[k],p[k]); b.max[k]=Math.max(b.max[k],p[k]); }
}

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
  let index = material === 'chrome' ? palette.supercharger : materialKeys.indexOf(material);
  let projection;
  const clamp = (v, min = 0, max = 1) => Math.max(min, Math.min(max, v));

  // Dedicated panel projections
  if (group.startsWith('hood-') && normal[2] > 0.3) {
    index = 8; projection = p => [(p[1] + 8.5) / 17.0, (24.0 - p[0]) / 13.0];
  } else if (group === 'door-panel') {
    index = 9; projection = p => [0.10+0.8*(11.2-p[0])/14, 0.48+0.47*(14.0-p[2])/4.2];
  } else if (group === 'cab-roof-panel' && normal[2] > 0.4) {
    index = 10; projection = p => [(p[1] + 8.5) / 17.0, (5.0 - p[0]) / 8.0];
  } else if (group === 'tailgate-panel' && normal[0] < -0.3) {
    index = 11; projection = p => [0.07+0.86*(p[1]+8.5)/17, 0.28+0.46*(14.5-p[2])/4.5];
  } else if (group === 'front-grille-fascia' && normal[0] > 0.3) {
    index = 12; projection = p => [0.03+0.94*(1-Math.abs(p[1])/8.5), 0.16+0.77*(13.8-p[2])/4];
  } else if (group === 'old-bay-ammo-crate') {
    index = 13;
  } else if (group.startsWith('wheel-')) {
    const cx = group.includes('front') ? 15 : -15;
    if(group.includes('sidewall') || group.includes('rim')) {
      index=group.includes('sidewall')?2:3;
      const radius=group.includes('sidewall')?5.15:3.55;
      projection=p=>[0.5+0.47*(p[0]-cx)/radius,0.5-0.47*(p[2]-6)/radius];
    }
    if (group.includes('tread')) {
      index = 14;
    } else if (group.includes('rim')) {
      index = 3;
    } else if (group.includes('sidewall')) {
      index = 2;
    }
  }

  if (index < 0) throw new Error(`Unknown material ${material} on ${group}`);
  const col = index % 4, row = Math.floor(index / 4);

  if (projection) {
    const mapped = points.map(p => {
      const [u, v] = projection(p);
      return [(col + 0.03 + 0.94 * clamp(u)) / 4, (row + 0.03 + 0.94 * clamp(v)) / 4];
    });
    const [a,b,c]=mapped;
    if(Math.abs((b[0]-a[0])*(c[1]-a[1])-(c[0]-a[0])*(b[1]-a[1]))>1e-10)return mapped;
  }

  const axis=normal.map(Math.abs).indexOf(Math.max(...normal.map(Math.abs)));
  const axes=axis===0?[1,2]:axis===1?[0,2]:[0,1];
  const bounds=uvGroupBounds.get(group);
  const ranges=bounds.min.map((v,k)=>[v,v+Math.max(0.01,bounds.max[k]-v)]);
  let crop=[0.12,0.88,0.12,0.88];
  // The atlas contains component illustrations. Only designated panels use
  // their full image; structural metal/glass sample quiet interior patches.
  if(index===1)crop=[0.2,0.7,0.16,0.28];
  if(index===3)crop=[0.12,0.26,0.35,0.65];
  if(index===4)crop=[0.16,0.38,0.2,0.7];
  if(index===6)crop=[0.2,0.78,0.2,0.76];
  if(index===7)crop=[0.34,0.63,0.3,0.65];
  if(index===15)crop=[0.1,0.4,0.32,0.64];
  if(index===14)crop=[0.25,0.65,0.35,0.75];
  if(group==='old-bay-ammo-crate') {
    const limits=[[-21.25,-15.75],[-7.45,-2.95],[10.3,14.1]];
    return points.map(p=>axes.map((k,j)=>((j?row:col)+0.05+0.9*clamp((p[k]-limits[k][0])/(limits[k][1]-limits[k][0])))/4));
  }
  if (group.startsWith('wheel-')) {
    const cx = group.includes('front') ? 15 : -15;
    const cy = group.includes('left') ? 9.8 : -9.8;
    const cz = 6.0;
    const localRanges = [[-6.0, 6.0], [-3.0, 3.0], [-6.0, 6.0]];
    return points.map(p => {
      const lp = [p[0] - cx, p[1] - cy, p[2] - cz];
      return axes.map((k, j) => ((j ? row : col) + crop[j * 2] + (crop[j * 2 + 1] - crop[j * 2]) * clamp((lp[k] - localRanges[k][0]) / (localRanges[k][1] - localRanges[k][0]))) / 4);
    });
  }
  return points.map(p=>axes.map((k,j)=>((j?row:col)+crop[j*2]+(crop[j*2+1]-crop[j*2])*clamp((p[k]-ranges[k][0])/(ranges[k][1]-ranges[k][0])))/4));
}

function shapePoint(p,group) {
  if(group.startsWith('wheel-')) {
    const cx=group.includes('front')?15:-15, side=group.includes('left')?1:-1;
    return [cx+(p[0]-cx)*1.32,side*12.4+(p[1]-side*9.8)*1.4,8+(p[2]-6)*1.32];
  }
  const lift=/^(turret-|barrel-)/.test(group)?10:/^(axle-|diff-truss|steering-stabilizer|steering-drag)/.test(group)?2:3;
  return [p[0],p[1],p[2]+lift];
}
function shapeNormal(n,group) {
  return group.startsWith('wheel-')?unit([n[0]/1.32,n[1]/1.4,n[2]/1.32]):n;
}

function addFace(points, normal, material, group) {
  if(collectingBounds) { collectBounds(points,group); return; }
  normal = normal.map(v => v / Math.hypot(...normal));
  if (triangleNormal([0, 1, 2], points).reduce((s, n, i) => s + n * normal[i], 0) < 0) points = [...points].reverse();
  const start = vertices.length;
  const mappedUvs = faceUvs(material, points, normal, group);
  for (let i = 0; i < 4; i += 1) {
    vertices.push(shapePoint(points[i],group));
    normals.push(shapeNormal(normal,group));
    uvs.push(mappedUvs[i]);
  }
  triangles.push([start, start + 1, start + 2], [start, start + 2, start + 3]);
  groups.push(group, group);
  materials.push(material, material);
}

function addTriangle(points, normal, material, group) {
  if(collectingBounds) { collectBounds(points,group); return; }
  normal = normal.map(v => v / Math.hypot(...normal));
  if (triangleNormal([0, 1, 2], points).reduce((s, n, i) => s + n * normal[i], 0) < 0) points = [points[0], points[2], points[1]];
  const start = vertices.length;
  const mappedUvs = faceUvs(material, points, normal, group);
  for (let i = 0; i < 3; i += 1) {
    vertices.push(shapePoint(points[i],group));
    normals.push(shapeNormal(normal,group));
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

function addCylinder(name, cx, cy, cz, radius, length, axis = 'x', segments = 12, material = 'steelRim') {
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

// Build 3D Mud Tank Geometry
buildMudTank({ addBox, addCylinder, addFace, addTriangle });
collectingBounds=false;
buildMudTank({ addBox, addCylinder, addFace, addTriangle });
smoothNormals({vertices,normals,triangles,groups});

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
const isBarrel = g => g.startsWith('barrel-');
const isTurret = g => g.startsWith('turret-') && !isBarrel(g);
const isBody = g => !isWheelFL(g) && !isWheelFR(g) && !isWheelRL(g) && !isWheelRR(g) && !isTurret(g) && !isBarrel(g);

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
const turretMesh = selectMesh(isTurret, [-12.0, 0, 20.2]);
const barrelMesh = selectMesh(isBarrel, [-10.0, 0, 25.2]);
const wheelFLMesh = selectMesh(isWheelFL, [15.0, 12.4, 8.0]);
const wheelFRMesh = selectMesh(isWheelFR, [15.0, -12.4, 8.0]);
const wheelRLMesh = selectMesh(isWheelRL, [-15.0, 12.4, 8.0]);
const wheelRRMesh = selectMesh(isWheelRR, [-15.0, -12.4, 8.0]);

const wheelMeshes = [
  { id: 'TIRE_LF', bone: 1, mesh: wheelFLMesh },
  { id: 'TIRE_RF', bone: 2, mesh: wheelFRMesh },
  { id: 'TIRE_LR', bone: 3, mesh: wheelRLMesh },
  { id: 'TIRE_RR', bone: 4, mesh: wheelRRMesh },
];

function makeMeshXml(id, mesh) {
  const b = bounds(mesh.vertices);
  const smoothedNormals = mesh.normals.map(n => [...n]);
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
\t\t\t\t<Texture Name="DiffuseTexture"><Value>PVMudTankAtlas</Value></Texture>
\t\t\t\t<Texture Name="NormalMap"><Value>PVMudTankNormal</Value></Texture>
\t\t\t\t<Texture Name="SpecMap"><Value>PVMudTankSpec</Value></Texture>
\t\t\t\t<Texture Name="RecolorTexture"><Value>PVMudTankHouse</Value></Texture>
\t\t\t\t<Bool Name="AlphaTestEnable"><Value>false</Value></Bool>
\t\t\t</Constants>
\t\t</FXShader>
\t</W3DMesh>`;
}

const modelId = 'PVMUDTANK_SKIN';
const meshXml = [
  makeMeshXml(`${modelId}.BODY`, bodyMesh),
  makeMeshXml(`${modelId}.TURRET`, turretMesh),
  makeMeshXml(`${modelId}.BARREL`, barrelMesh),
  ...wheelMeshes.map(binding => makeMeshXml(`${modelId}.${binding.id}`, binding.mesh)),
].join('\n');

const b = bounds(vertices.map(scalePoint));

const identityFixup = '<FixupMatrix M00="1" M10="0" M20="0" M30="0" M01="0" M11="1" M21="0" M31="0" M02="0" M12="0" M22="1" M32="0"/>';
const pivots = [
  ['ROOTTRANSFORM', -1, 0, 0, 0],
  ['Bone_TireLF', 0, 15.0, 12.4, 8.0],
  ['Bone_TireRF', 0, 15.0, -12.4, 8.0],
  ['Bone_TireLR', 0, -15.0, 12.4, 8.0],
  ['Bone_TireRR', 0, -15.0, -12.4, 8.0],
  ['Turret', 0, -12.0, 0, 20.2],
  ['Barrel', 5, 2.0, 0, 5.0],
  ['FXMUZZLEFLASH', 6, 25.9, 0, 0.0],
  ['FXTracksL', 0, 0, 12.4, 0],
  ['FXTracksR', 0, 0, -12.4, 0],
].map(([name, parent, ...translation]) => [name, parent, ...scalePoint(translation)]);

const hierarchyXml = `\t<W3DHierarchy id="PVMUDTANK_SKL">
${pivots.map(([name, parent, x, y, z]) => `\t\t<Pivot Name="${name}" Parent="${parent}"><Translation X="${fmt(x)}" Y="${fmt(y)}" Z="${fmt(z)}"/>\t\t<Rotation X="0" Y="0" Z="0" W="1"/>${identityFixup}</Pivot>`).join('\n')}
\t</W3DHierarchy>`;

const w3x = `<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
\t<Includes><Include type="all" source="ART:PM/PVMudTank_Texture.xml"/></Includes>
${hierarchyXml}
\t<W3DCollisionBox id="${modelId}.COLLISION"><Center X="${fmt(b.center[0])}" Y="${fmt(b.center[1])}" Z="${fmt(b.center[2])}"/><Extent X="${fmt((b.max[0] - b.min[0]) / 2)}" Y="${fmt((b.max[1] - b.min[1]) / 2)}" Z="${fmt((b.max[2] - b.min[2]) / 2)}"/></W3DCollisionBox>
${meshXml}
\t<W3DContainer id="${modelId}" Hierarchy="PVMUDTANK_SKL">
\t\t<SubObject SubObjectID="COLLISION" BoneIndex="0"><RenderObject><CollisionBox>${modelId}.COLLISION</CollisionBox></RenderObject></SubObject>
\t\t<SubObject SubObjectID="BODY" BoneIndex="0"><RenderObject><Mesh>${modelId}.BODY</Mesh></RenderObject></SubObject>
\t\t<SubObject SubObjectID="TURRET" BoneIndex="5"><RenderObject><Mesh>${modelId}.TURRET</Mesh></RenderObject></SubObject>
\t\t<SubObject SubObjectID="BARREL" BoneIndex="6"><RenderObject><Mesh>${modelId}.BARREL</Mesh></RenderObject></SubObject>
${wheelMeshes.map(binding => `\t\t<SubObject SubObjectID="${binding.id}" BoneIndex="${binding.bone}"><RenderObject><Mesh>${modelId}.${binding.id}</Mesh></RenderObject></SubObject>`).join('\n')}
\t</W3DContainer>
</AssetDeclaration>
`;

const outputDir = path.resolve(__dirname, '..', 'src', 'Art', 'PM');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const submeshes = [
  { name: 'BODY', mesh: bodyMesh },
  { name: 'TURRET', mesh: turretMesh },
  { name: 'BARREL', mesh: barrelMesh },
  ...wheelMeshes.map(b => ({ name: b.id, mesh: b.mesh })),
];

const report = {
  artVersion: 2,
  unit: 'PasadenaVehicleMudTank',
  slot: 'GDIPredator',
  artScale,
  shader: 'ObjectsGDI.fx',
  model: modelId,
  vertices: submeshes.reduce((s, m) => s + m.mesh.vertices.length, 0),
  triangles: submeshes.reduce((s, m) => s + m.mesh.triangles.length, 0),
  bounds: b,
  bones: pivots.map(p => p[0]),
  outputs: [
    'PVMudTank_Model.w3x',
    'PVMudTank_Texture.xml',
    'PVMudTankAtlas.tga',
    'PVMudTankNormal.tga',
    'PVMudTankSpec.tga',
    'PVMudTankHouse.tga',
    'PVMudTank_Portrait.xml',
    'PVMudTankPortrait.tga',
    'PVMudTank.obj',
    'PVMudTank.mtl',
  ],
};

function exportAssets() {
  fs.writeFileSync(path.join(outputDir, 'PVMudTank_Model.w3x'), w3x, 'utf8');
  fs.writeFileSync(path.join(outputDir, 'PVMudTank_Model.report.json'), JSON.stringify(report, null, 2) + '\n');
  writeMaterialMaps(outputDir);

  let obj = '# Pasadena Monster Mud Tank OBJ\nmtllib PVMudTank.mtl\n';
  let objVertOffset = 1;
  submeshes.forEach(({ name, mesh }) => {
    obj += `o ${name}\nusemtl ObjectsGDI\n`;
    const bone={BODY:0,TURRET:5,BARREL:6,TIRE_LF:1,TIRE_RF:2,TIRE_LR:3,TIRE_RR:4}[name];
    const worldPivot=i=>pivots[i].slice(2).map((v,k)=>v+(pivots[i][1]<0?0:worldPivot(pivots[i][1])[k]));
    const offset=worldPivot(bone);
    mesh.vertices.forEach(v => { obj += `v ${v.map((q,k)=>fmt(q+offset[k])).join(' ')}\n`; });
    mesh.uvs.forEach(uv => { obj += `vt ${fmt(uv[0])} ${fmt(1-uv[1])}\n`; });
    mesh.normals.forEach(n => { obj += `vn ${fmt(n[0])} ${fmt(n[1]) || 0} ${fmt(n[2])}\n`; });
    mesh.triangles.forEach(t => {
      const f = t.map(i => i + objVertOffset);
      obj += `f ${f[0]}/${f[0]}/${f[0]} ${f[1]}/${f[1]}/${f[1]} ${f[2]}/${f[2]}/${f[2]}\n`;
    });
    objVertOffset += mesh.vertices.length;
  });
  fs.writeFileSync(path.join(outputDir, 'PVMudTank.obj'), obj);

  const mtl = `newmtl ObjectsGDI
Ka 1.0 1.0 1.0
Kd 1.0 1.0 1.0
Ks 0.1 0.1 0.1
map_Kd PVMudTankAtlas.tga
bump PVMudTankNormal.tga
`;
  fs.writeFileSync(path.join(outputDir, 'PVMudTank.mtl'), mtl);

  console.log(`[OK] Generated Pasadena Monster Mud Tank art assets:
     Triangles: ${report.triangles}, Vertices: ${report.vertices}
     Output: ${outputDir}`);
}

if (require.main === module) {
  exportAssets();
}

module.exports = {
  pivots,
  worldMesh: { vertices: vertices.map(scalePoint), normals, uvs, triangles, groups, materials },
  report,
  submeshes,
  w3x,
  exportAssets,
};
