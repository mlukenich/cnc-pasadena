/*
 * Deterministic source generator for the Pasadena Rolling Coal exemplar.
 *
 * C&C 3's SDK only ships W3X exporters for obsolete versions of 3ds Max.
 * This generator writes the documented W3X XML directly and also emits an
 * OBJ/MTL pair so the geometry remains inspectable in modern DCC tools.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const workspace = path.resolve(__dirname, '..');
const outputDir = path.join(workspace, 'src', 'Art', 'PV');
fs.mkdirSync(outputDir, { recursive: true });

const textureId = 'PVDuallyAtlas';
const modelId = 'PVDUALLY_SKIN';
const meshId = `${modelId}.BODY`;
// Art-only scaling: keep geometry, rigid offsets and every attachment in
// agreement. Do not modify GameObject.Scale, stats or simulation geometry.
const artScale = .66; // 25% smaller than the previous .88 art, including all bones.
const scalePoint = p => p.map(v => v * artScale);

const palette = {
  red:    [119, 48, 38, 255],
  cream:  [174, 151, 116, 255],
  black:  [23, 22, 20, 255],
  metal:  [75, 73, 68, 255],
  glass:  [28, 49, 53, 255],
  rust:   [105, 57, 30, 255],
  orange: [199, 93, 25, 255],
  dark:   [42, 35, 31, 255],
};
const paletteKeys = Object.keys(palette);
const panelKeys = ['hoodPanel','doorPanel','roofPanel','tailPanel','bedPanel','armorPanel','treadPanel','headlamp'];
const materialKeys = [...paletteKeys,...panelKeys];

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

function faceUvs(material, points, normal, group) {
  let index = materialKeys.indexOf(material);
  let projection;
  const clamp = v=>Math.max(0,Math.min(1,v));
  if((group==='hood'||group==='hood-top') && normal[2]>.65) { index=8;projection=p=>[(p[1]+10.5)/21,(p[0]-14)/20.5]; }
  if(group==='door-ivory' && Math.abs(normal[1])>.8) { index=9;projection=p=>[(p[0]+5.8)/18,(17.5-p[2])/4.4]; }
  if(group==='cab-roof' && normal[2]>.8) { index=10;projection=p=>[(p[1]+9.65)/19.3,(9.25-p[0])/16.3]; }
  if(group==='tailgate' && normal[0]<-.8) { index=11;projection=p=>[(p[1]+11.3)/22.6,(19.4-p[2])/6]; }
  if(group==='bed-floor' && normal[2]>.8) { index=12;projection=p=>[(p[1]+11.4)/22.8,(-8-p[0])/28]; }
  if(group==='turret-shield') { index=13;projection=p=>[(p[1]+6)/12,(30-p[2])/2.7]; }
  if(group==='headlamp' && normal[0]>.8) { index=15;projection=p=>[(Math.abs(p[1])-7.075)/2.65,(16.425-p[2])/1.65]; }
  // Position wear on actual lower panels rather than repeating one tiny
  // generic swatch on every polygon. Coordinates are pre-artScale.
  if(group==='cab-lower'&&Math.abs(normal[1])>.8) { index=0;projection=p=>[(p[0]+8.5)/23,(19.25-p[2])/7.5]; }
  if(group==='bed-upper-side'&&Math.abs(normal[1])>.8) { index=0;projection=p=>[(p[0]+36.5)/29,(19.3-p[2])/2.6]; }
  if(group==='fender-shoulder') {
    const cx=points.reduce((s,p)=>s+p[0],0)/points.length>0?24:-22;
    index=0;projection=p=>[(p[0]-cx+10.1)/20.2,(20-p[2])/11.8];
  }
  if(/^tire-/.test(group)&&!/(tread|lug)/.test(group)&&Math.abs(normal[1])>.5) {
    const cx=group.includes('-front-')?24:-22;
    const radius=material==='black'?8.4:4.25;
    // Radial planar UVs are continuous across sidewall and rim polygons.
    projection=p=>[.08+.84*(.5+(p[0]-cx)/(2*radius)),
      material==='metal'?.1+.2*(.5-(p[2]-8.2)/(2*radius)):.08+.84*(.5-(p[2]-8.2)/(2*radius))];
  }
  if(/^tire-.*-tread$/.test(group))index=14;
  if(group==='ammo-box'&&Math.abs(normal[1])>.8) { index=7;projection=p=>[.08+.84*(p[0]+20.3)/5.6,.08+.84*(30.6-p[2])/3.6]; }
  if(group==='gun-breech'&&Math.abs(normal[1])>.8) { index=7;projection=p=>[.08+.84*(p[0]+15.5)/6,.08+.84*(31.95-p[2])/1.9]; }
  if(material==='team') {
    // A narrow designated strip, not a global tint across all steel parts.
    return points.map((p,i)=>[.25+(.15+((i===1||i===2)?.7:0))*.25,.75+(.175+(i>=2?.035:0))*.25]);
  }
  if (index < 0) throw new Error(`Unknown material ${material}`);
  const col=index%4,row=Math.floor(index/4);
  // Dedicated panels use one projection across every triangle, including
  // triangulated roof caps. Generic fills sample only the inner tile area.
  if(projection)return points.map(p=>{const [u,v]=projection(p);return [(col+.02+.96*clamp(u))/4,(row+.02+.96*clamp(v))/4];});
  const u0 = col/4 + .035;
  const v0 = row/4 + .035;
  const length = (a,b) => Math.hypot(...a.map((v,i) => v-b[i]));
  const w = length(points[0],points[1]);
  const edge=points[1].map((v,i)=>(v-points[0][i])/w);
  const vertical=[normal[1]*edge[2]-normal[2]*edge[1],normal[2]*edge[0]-normal[0]*edge[2],normal[0]*edge[1]-normal[1]*edge[0]];
  const local=points.map(p=>{const d=p.map((v,i)=>v-points[0][i]);return [d.reduce((s,v,i)=>s+v*edge[i],0),d.reduce((s,v,i)=>s+v*vertical[i],0)];});
  const low=[0,1].map(k=>Math.min(...local.map(p=>p[k]))),high=[0,1].map(k=>Math.max(...local.map(p=>p[k])));
  const scale=Math.min(.008,.18/Math.max(high[0]-low[0],.01),.18/Math.max(high[1]-low[1],.01));
  return local.map(p=>[u0+(p[0]-low[0])*scale,v0+(p[1]-low[1])*scale]);
}

function addFace(points, normal, material, group) {
  normal = normal.map(v => v / Math.hypot(...normal));
  if (triangleNormal([0,1,2],points).reduce((s,n,i)=>s+n*normal[i],0) < 0) points = [...points].reverse();
  const start = vertices.length;
  const mappedUvs = faceUvs(material, points, normal, group);
  for (let i = 0; i < 4; i += 1) {
    vertices.push(points[i]);
    normals.push(normal);
    uvs.push(mappedUvs[i]);
  }
  triangles.push([start, start + 1, start + 2], [start, start + 2, start + 3]);
  groups.push(group, group);
  materials.push(material,material);
}

function addTriangle(points, normal, material, group) {
  normal = normal.map(v => v / Math.hypot(...normal));
  if (triangleNormal([0,1,2],points).reduce((s,n,i)=>s+n*normal[i],0) < 0) points = [points[0],points[2],points[1]];
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
  addFace([[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[x1,y0,z1]], [ 1, 0, 0], material, name);
  addFace([[x0,y1,z0],[x0,y0,z0],[x0,y0,z1],[x0,y1,z1]], [-1, 0, 0], material, name);
  addFace([[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]], [ 0, 1, 0], material, name);
  addFace([[x1,y0,z0],[x0,y0,z0],[x0,y0,z1],[x1,y0,z1]], [ 0,-1, 0], material, name);
  addFace([[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]], [ 0, 0, 1], material, name);
  addFace([[x0,y1,z0],[x1,y1,z0],[x1,y0,z0],[x0,y0,z0]], [ 0, 0,-1], material, name);
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
      offsetPoint(axisPoint(axis, -half, radius*c0, radius*s0), cx, cy, cz),
      offsetPoint(axisPoint(axis,  half, radius*c0, radius*s0), cx, cy, cz),
      offsetPoint(axisPoint(axis,  half, radius*c1, radius*s1), cx, cy, cz),
      offsetPoint(axisPoint(axis, -half, radius*c1, radius*s1), cx, cy, cz),
    ];
    addFace(p, axisNormal(axis, Math.cos((a0+a1)/2), Math.sin((a0+a1)/2)), material, name);

    const centerNeg = offsetPoint(axisPoint(axis, -half, 0, 0), cx, cy, cz);
    const centerPos = offsetPoint(axisPoint(axis,  half, 0, 0), cx, cy, cz);
    const rim0Neg = offsetPoint(axisPoint(axis, -half, radius*c0, radius*s0), cx, cy, cz);
    const rim1Neg = offsetPoint(axisPoint(axis, -half, radius*c1, radius*s1), cx, cy, cz);
    const rim0Pos = offsetPoint(axisPoint(axis,  half, radius*c0, radius*s0), cx, cy, cz);
    const rim1Pos = offsetPoint(axisPoint(axis,  half, radius*c1, radius*s1), cx, cy, cz);
    addTriangle([centerNeg, rim1Neg, rim0Neg], axisNormal(axis, 0, 0, -1), material, name);
    addTriangle([centerPos, rim0Pos, rim1Pos], axisNormal(axis, 0, 0,  1), material, name);
  }
}

// Keep the sculpted geometry separate from the W3X/texture serialization.
require('./dually_geometry')({ addBox, addCylinder, addFace, addTriangle });
// Apply after UV projection; resizing must not stretch or remap the atlas.
for(let i=0;i<vertices.length;i++)vertices[i]=scalePoint(vertices[i]);
require('./dually_surface_pipeline').smoothNormals({vertices,normals,triangles,groups});

function bounds(points) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const v of points) {
    for (let i = 0; i < 3; i += 1) {
      min[i] = Math.min(min[i], v[i]);
      max[i] = Math.max(max[i], v[i]);
    }
  }
  const center = min.map((v, i) => (v + max[i]) / 2);
  let radius = 0;
  for (const v of points) {
    radius = Math.max(radius, Math.hypot(v[0]-center[0], v[1]-center[1], v[2]-center[2]));
  }
  return { min, max, center, radius };
}

function triangleNormal(triangle, points) {
  const a = points[triangle[0]], b = points[triangle[1]], c = points[triangle[2]];
  const ab = [b[0]-a[0], b[1]-a[1], b[2]-a[2]];
  const ac = [c[0]-a[0], c[1]-a[1], c[2]-a[2]];
  const n = [ab[1]*ac[2]-ab[2]*ac[1], ab[2]*ac[0]-ab[0]*ac[2], ab[0]*ac[1]-ab[1]*ac[0]];
  const length = Math.hypot(...n) || 1;
  return n.map(v => v / length);
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
  const {tangents,binormals}=require('./dually_surface_pipeline').tangentFrame(mesh);
  // ObjectsGDI uses the four-map vehicle material described in Art_Textures.
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
${tangents.map(v=>`\t\t\t<T X="${fmt(v[0])}" Y="${fmt(v[1])}" Z="${fmt(v[2])}"/>`).join('\n')}
\t\t</Tangents>
\t\t<Binormals>
${binormals.map(v=>`\t\t\t<B X="${fmt(v[0])}" Y="${fmt(v[1])}" Z="${fmt(v[2])}"/>`).join('\n')}
\t\t</Binormals>
\t\t<TexCoords>
${mesh.uvs.map(uv => `\t\t\t<T X="${fmt(uv[0])}" Y="${fmt(1-uv[1])}"/>`).join('\n')}
\t\t</TexCoords>
\t\t<Triangles>
${mesh.triangles.map(t => {
  const n = triangleNormal(t, mesh.vertices);
  const d = n[0]*mesh.vertices[t[0]][0] + n[1]*mesh.vertices[t[0]][1] + n[2]*mesh.vertices[t[0]][2];
  return `\t\t\t<T><V>${t[0]}</V><V>${t[1]}</V><V>${t[2]}</V><Nrm X="${fmt(n[0])}" Y="${fmt(n[1])}" Z="${fmt(n[2])}"/><Dist>${fmt(d)}</Dist></T>`;
}).join('\n')}
\t\t</Triangles>
\t\t<FXShader ShaderName="ObjectsGDI.fx" TechniqueIndex="0">
\t\t\t<Constants>
\t\t\t\t<Texture Name="DiffuseTexture"><Value>${textureId}</Value></Texture>
\t\t\t\t<Texture Name="NormalMap"><Value>PVDuallyNormal</Value></Texture>
\t\t\t\t<Texture Name="SpecMap"><Value>PVDuallySpec</Value></Texture>
\t\t\t\t<Texture Name="RecolorTexture"><Value>PVDuallyHouse</Value></Texture>
\t\t\t\t<Bool Name="AlphaTestEnable"><Value>false</Value></Bool>
\t\t\t</Constants>
\t\t</FXShader>
\t</W3DMesh>`;
}

const wheelBindings = [
  { id: 'TIRE01', bone: 1, prefix: 'tire-front-left', offset: [24, 12, 8.2] },
  { id: 'TIRE02', bone: 2, prefix: 'tire-front-right', offset: [24, -12, 8.2] },
  { id: 'TIRE03', bone: 3, prefix: 'tire-rear-left', offset: [-22, 12, 8.2] },
  { id: 'TIRE04', bone: 4, prefix: 'tire-rear-right', offset: [-22, -12, 8.2] },
].map(binding=>({...binding,offset:scalePoint(binding.offset)}));
const isWheel = group => group.startsWith('tire-');
const isTurret = group => group.startsWith('turret-') || group.startsWith('ammo-box');
const isGun = group => group.startsWith('gun-');
const bodyMesh = selectMesh(group => !isWheel(group) && !isTurret(group) && !isGun(group), [0, 0, 0]);
const turretMesh = selectMesh(isTurret, scalePoint([-16, 0, 29]));
const gunMesh = selectMesh(isGun, scalePoint([-13, 0, 31]));
const wheelMeshes = wheelBindings.map(binding => ({
  ...binding,
  mesh: selectMesh(group => group.startsWith(binding.prefix), binding.offset),
}));
const meshXml = [
  makeMeshXml(meshId, bodyMesh),
  makeMeshXml(`${modelId}.TURRET`, turretMesh),
  makeMeshXml(`${modelId}.GUNS`, gunMesh),
  ...wheelMeshes.map(binding => makeMeshXml(`${modelId}.${binding.id}`, binding.mesh)),
].join('\n');

const b = bounds(vertices);

const identityFixup = '<FixupMatrix M00="1" M10="0" M20="0" M30="0" M01="0" M11="1" M21="0" M31="0" M02="0" M12="0" M22="1" M32="0"/>';
const pivots = [
  ['ROOTTRANSFORM', -1, 0, 0, 0],
  ['Tire01', 0, 24, 12, 8.2], ['Tire02', 0, 24, -12, 8.2],
  ['Tire03', 0, -22, 12, 8.2], ['Tire04', 0, -22, -12, 8.2],
  ['Turret', 0, -16, 0, 29], ['B_ Gun', 5, 3, 0, 2],
  ['FXWEAPON01', 6, 21.5, 2.2, 0], ['FXWEAPON02', 6, 21.5, -2.2, 0],
  ['mortortube', 6, 10, 0, 4], ['B_SPOTLIGHT', 0, 29, 0, 19],
].map(([name,parent,...translation])=>[name,parent,...scalePoint(translation)]);
const hierarchyXml = `\t<W3DHierarchy id="PVDUALLY_SKL">
${pivots.map(([name,parent,x,y,z]) => `\t\t<Pivot Name="${name}" Parent="${parent}"><Translation X="${fmt(x)}" Y="${fmt(y)}" Z="${fmt(z)}"/><Rotation X="0" Y="0" Z="0" W="1"/>${identityFixup}</Pivot>`).join('\n')}
\t</W3DHierarchy>`;

const w3x = `<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
\t<Includes><Include type="all" source="ART:PV/PVDually_Texture.xml"/></Includes>
${hierarchyXml}
\t<W3DCollisionBox id="${modelId}.COLLISION"><Center X="${fmt(b.center[0])}" Y="${fmt(b.center[1])}" Z="${fmt(b.center[2])}"/><Extent X="${fmt((b.max[0]-b.min[0])/2)}" Y="${fmt((b.max[1]-b.min[1])/2)}" Z="${fmt((b.max[2]-b.min[2])/2)}"/></W3DCollisionBox>
${meshXml}
\t<W3DContainer id="${modelId}" Hierarchy="PVDUALLY_SKL">
\t\t<SubObject SubObjectID="COLLISION" BoneIndex="0"><RenderObject><CollisionBox>${modelId}.COLLISION</CollisionBox></RenderObject></SubObject>
\t\t<SubObject SubObjectID="BODY" BoneIndex="0"><RenderObject><Mesh>${meshId}</Mesh></RenderObject></SubObject>
\t\t<SubObject SubObjectID="TURRET" BoneIndex="5"><RenderObject><Mesh>${modelId}.TURRET</Mesh></RenderObject></SubObject>
\t\t<SubObject SubObjectID="GUNS" BoneIndex="6"><RenderObject><Mesh>${modelId}.GUNS</Mesh></RenderObject></SubObject>
${wheelMeshes.map(binding => `\t\t<SubObject SubObjectID="${binding.id}" BoneIndex="${binding.bone}"><RenderObject><Mesh>${modelId}.${binding.id}</Mesh></RenderObject></SubObject>`).join('\n')}
\t</W3DContainer>
</AssetDeclaration>
`;
fs.writeFileSync(path.join(outputDir, 'PVDually_Model.w3x'), w3x, 'utf8');

const textureXml = `<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset">
  <Texture id="${textureId}" File="PVDuallyAtlas.tga" OutputFormat="DXT1" AllowAutomaticResize="false"/>
  <Texture id="PVDuallyNormal" File="PVDuallyNormal.tga" OutputFormat="A8R8G8B8" AllowAutomaticResize="false"/>
  <Texture id="PVDuallySpec" File="PVDuallySpec.tga" OutputFormat="DXT5" AllowAutomaticResize="false"/>
  <Texture id="PVDuallyHouse" File="PVDuallyHouse.tga" OutputFormat="DXT5" AllowAutomaticResize="false"/>
</AssetDeclaration>
`;
fs.writeFileSync(path.join(outputDir, 'PVDually_Texture.xml'), textureXml, 'utf8');

// Format conversion only: preserve the generated material sheet, resizing
// the square source to a power-of-two runtime texture with no painted edits.
makePortraitTga(path.join(outputDir,'Textures','dually-panels-v3-3.png'),path.join(outputDir,'PVDuallyAtlas.tga'),1024);
require('./dually_surface_pipeline').writeMaterialMaps(outputDir);

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : (pb <= pc ? b : c);
}

function decodePng(filePath) {
  const png = fs.readFileSync(filePath);
  const signature = '89504e470d0a1a0a';
  if (png.subarray(0, 8).toString('hex') !== signature) throw new Error(`Not a PNG: ${filePath}`);
  let cursor = 8, width, height, bitDepth, colorType, interlace;
  const idat = [];
  while (cursor < png.length) {
    const length = png.readUInt32BE(cursor);
    const type = png.subarray(cursor + 4, cursor + 8).toString('ascii');
    const data = png.subarray(cursor + 8, cursor + 8 + length);
    cursor += length + 12;
    if (type === 'IHDR') {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4);
      bitDepth = data[8]; colorType = data[9]; interlace = data[12];
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
  }
  if (bitDepth !== 8 || interlace !== 0 || ![2, 6].includes(colorType)) {
    throw new Error(`Portrait PNG must be non-interlaced 8-bit RGB/RGBA; got depth=${bitDepth}, type=${colorType}, interlace=${interlace}`);
  }
  const channels = colorType === 6 ? 4 : 3;
  const stride = width * channels;
  const packed = zlib.inflateSync(Buffer.concat(idat));
  const raw = Buffer.alloc(width * height * channels);
  let source = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = packed[source++];
    for (let x = 0; x < stride; x += 1) {
      const value = packed[source++];
      const left = x >= channels ? raw[y*stride + x - channels] : 0;
      const up = y > 0 ? raw[(y-1)*stride + x] : 0;
      const upperLeft = y > 0 && x >= channels ? raw[(y-1)*stride + x - channels] : 0;
      let decoded;
      if (filter === 0) decoded = value;
      else if (filter === 1) decoded = value + left;
      else if (filter === 2) decoded = value + up;
      else if (filter === 3) decoded = value + Math.floor((left + up) / 2);
      else if (filter === 4) decoded = value + paeth(left, up, upperLeft);
      else throw new Error(`Unsupported PNG filter ${filter}`);
      raw[y*stride + x] = decoded & 255;
    }
  }
  return { width, height, channels, raw };
}

function makePortraitTga(pngPath, tgaPath, size) {
  const image = decodePng(pngPath);
  const portraitHeader = Buffer.alloc(18);
  portraitHeader[2] = 2;
  portraitHeader.writeUInt16LE(size, 12);
  portraitHeader.writeUInt16LE(size, 14);
  portraitHeader[16] = 32;
  portraitHeader[17] = 0x28;
  const portraitPixels = Buffer.alloc(size * size * 4);
  const cropSize = Math.min(image.width, image.height);
  const cropX = Math.floor((image.width - cropSize) / 2);
  const cropY = Math.floor((image.height - cropSize) / 2);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const sx = cropX + Math.min(cropSize - 1, Math.floor((x + 0.5) * cropSize / size));
      const sy = cropY + Math.min(cropSize - 1, Math.floor((y + 0.5) * cropSize / size));
      const sourceIndex = (sy * image.width + sx) * image.channels;
      const targetIndex = (y * size + x) * 4;
      portraitPixels[targetIndex] = image.raw[sourceIndex + 2];
      portraitPixels[targetIndex + 1] = image.raw[sourceIndex + 1];
      portraitPixels[targetIndex + 2] = image.raw[sourceIndex];
      portraitPixels[targetIndex + 3] = image.channels === 4 ? image.raw[sourceIndex + 3] : 255;
    }
  }
  fs.writeFileSync(tgaPath, Buffer.concat([portraitHeader, portraitPixels]));
}

const portraitSource = path.join(outputDir, 'Portrait', 'PasadenaRollingCoal_portrait.png');
if (!fs.existsSync(portraitSource)) throw new Error(`Missing generated portrait source: ${portraitSource}`);
makePortraitTga(portraitSource, path.join(outputDir, 'PVDuallyPortrait.tga'), 128);
const portraitXml = `<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
\t<Texture id="PVDuallyPortraitAtlas" File="PVDuallyPortrait.tga" OutputFormat="A8R8G8B8" GenerateMipMaps="false" AllowAutomaticResize="false"/>
\t<PackedTextureImage id="Portrait_PasadenaDually" Texture="PVDuallyPortraitAtlas" Rotated="false">
\t\t<Dimensions x="128" y="128"/><Coords x="0" y="0"/><TextureDimensions x="128" y="128"/>
\t</PackedTextureImage>
</AssetDeclaration>
`;
fs.writeFileSync(path.join(outputDir, 'PVDually_Portrait.xml'), portraitXml, 'utf8');

const objLines = ['# Pasadena Rolling Coal - generated editable reference', 'mtllib PVDually_Model.mtl', 'usemtl PVDuallyAtlas'];
for (const v of vertices) objLines.push(`v ${fmt(v[0])} ${fmt(v[1])} ${fmt(v[2])}`);
for (const uv of uvs) objLines.push(`vt ${fmt(uv[0])} ${fmt(1 - uv[1])}`);
for (const n of normals) objLines.push(`vn ${fmt(n[0])} ${fmt(n[1])} ${fmt(n[2])}`);
let currentGroup = '';
triangles.forEach((t, i) => {
  if (groups[i] !== currentGroup) {
    currentGroup = groups[i];
    objLines.push(`g ${currentGroup.replace(/[^A-Za-z0-9_-]/g, '_')}`);
  }
  objLines.push(`f ${t.map(index => `${index+1}/${index+1}/${index+1}`).join(' ')}`);
});
fs.writeFileSync(path.join(outputDir, 'PVDually_Model.obj'), `${objLines.join('\n')}\n`, 'utf8');
fs.writeFileSync(path.join(outputDir, 'PVDually_Model.mtl'), `newmtl PVDuallyAtlas\nmap_Kd PVDuallyAtlas.tga\n`, 'utf8');

const report = {
  artVersion: 3,
  geometryRevision: '3.2-detail-and-proportions',
  artScale,
  materialRevision: '3.4-runtime-verified-highlights',
  shadingRevision: 'explicit complete hood smoothing group; runtime-calibrated paint specular',
  shader: 'ObjectsGDI.fx',
  textureSource: 'Textures/dually-panels-v3-3.png',
  uvConvention: 'Internal top-left; W3X bottom-left; SDK compiles V to 1-V. OBJ bottom-left.',
  model: modelId,
  vertices: vertices.length,
  triangles: triangles.length,
  bounds: b,
  bones: pivots.map(p => p[0]),
  outputs: ['PVDually_Model.w3x', 'PVDually_Texture.xml', 'PVDuallyAtlas.tga', 'PVDually_Model.obj', 'PVDually_Model.mtl', 'PVDually_Portrait.xml', 'PVDuallyPortrait.tga'],
};
fs.writeFileSync(path.join(outputDir, 'PVDually_Model.report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`Generated ${modelId}: ${vertices.length} vertices, ${triangles.length} triangles.`);

// The preview rasterizer consumes the same geometry used by the W3X writer,
// never an image-generated substitute for the model.
if (require.main === module && process.argv.includes('--preview')) {
  require('./render_dually_preview')({vertices,normals,uvs,triangles,groups},outputDir);
}
module.exports = {vertices,normals,uvs,triangles,groups,materials,pivots,wheelBindings,bodyMesh,turretMesh,gunMesh,wheelMeshes,artScale};
