'use strict';
const {tangentFrame}=require('./powerplant_materials');
function bounds(pts) {
  const min = [0, 1, 2].map(k => Math.min(...pts.map(p => p[k])));
  const max = [0, 1, 2].map(k => Math.max(...pts.map(p => p[k])));
  const center = min.map((v, k) => (v + max[k]) / 2);
  const radius = Math.max(...pts.map(p => Math.hypot(...p.map((c, k) => c - center[k]))));
  return { min, max, center, radius };
}


const modelId = 'PPPOWER_SKIN';

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
\t\t\t\t<Texture Name="DiffuseTexture"><Value>PPPowerAtlas</Value></Texture>
\t\t\t\t<Texture Name="NormalMap"><Value>PPPowerNormal</Value></Texture>
\t\t\t\t<Texture Name="SpecMap"><Value>PPPowerSpec</Value></Texture>
\t\t\t\t<Texture Name="RecolorTexture"><Value>PPPowerHouse</Value></Texture>
\t\t\t\t<Bool Name="AlphaTestEnable"><Value>false</Value></Bool>
\t\t\t</Constants>
\t\t</FXShader>
\t</W3DMesh>`;
}


module.exports={bounds,fmt,meshToXml};
