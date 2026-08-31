'use strict';

// 3D Hard-Surface Procedural Geometry Generator for Columbia Autonomous Street Sweeper
// NODFlameTank replacement across 5 iterative passes of mechanical detail.

function createSweeperGeometry() {
  const vertices = [];
  const normals = [];
  const uvs = [];
  const triangles = [];
  const groups = [];
  const materials = [];

  const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
  const unit = a => {
    const l = Math.hypot(...a);
    return l > 1e-12 ? a.map(v => v / l) : [1, 0, 0];
  };
  const cross = (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];

  function triangleNormal(t, pts) {
    const [p0, p1, p2] = t.map(i => pts[i]);
    const u = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]];
    const v = [p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]];
    return unit(cross(u, v));
  }

  const records=[];
  const groupBounds=new Map();
  function faceUvs(mat,pts,n,group) {
    if(!Number.isInteger(mat)||mat<0||mat>15) throw new Error('Unknown Sweeper material: '+mat);
    const b=groupBounds.get(group);
    const fraction=(p,k)=>(p[k]-b.min[k])/Math.max(b.max[k]-b.min[k],.00001);
    const abs=n.map(Math.abs),axis=abs.indexOf(Math.max(...abs));
    let project=p=>axis===2?[fraction(p,1),1-fraction(p,0)]:axis===1?[n[1]<0?fraction(p,0):1-fraction(p,0),1-fraction(p,2)]:[n[0]>0?fraction(p,1):1-fraction(p,1),1-fraction(p,2)];
    let crop=[.04,.04,.96,.96];
    if(mat===0)crop=[.12,.12,.88,.88];
    if(mat===2)crop=[.795,.28,.805,.32];
    if(mat===3)crop=[.12,.15,.39,.85];
    if(mat===4)crop=[.10,.10,.90,.90];
    if(mat===5)crop=[.3,.5,.36,.66];
    if(mat===6)crop=group.includes('cyan')?[.53,.04,.71,.205]:[.035,.04,.205,.205];
    if(mat===8)crop=[.055,.53,.23,.68];
    if(mat===9)crop=[.035,.065,.965,.96];
    if(mat===14)crop=[.35,.095,.61,.905];
    const cylindrical=(center,axial)=>{
      const radial=[0,1,2].filter(k=>k!==axial);
      const angles=pts.map(p=>{let a=Math.atan2(p[radial[1]]-center[radial[1]],p[radial[0]]-center[radial[0]]);return a<-.0000001?a+Math.PI*2:Math.max(0,a);});
      if(Math.max(...angles)-Math.min(...angles)>Math.PI) angles.forEach((a,i)=>{if(a<Math.PI)angles[i]+=Math.PI*2;});
      return p=>[fraction(p,axial),angles[pts.indexOf(p)]/(2*Math.PI)];
    };
    if(group==='tank-cylinder-body') {project=cylindrical([0,0,13],0);crop=[.12,.15,.39,.85];}
    if(group.startsWith('cannon-heat-shield')) project=cylindrical([0,group.includes('left')?2.6:-2.6,23],0);
    if(/^wheel-.*-tread$/.test(group)) {project=cylindrical([group.includes('front')?14:-12,0,5.5],1);crop=[.04,.04,.59,.96];}
    if(/^wheel-.*-rim$/.test(group) && Math.abs(n[1])>.02) {
      const cx=group.includes('front')?14:-12;
      project=p=>[.5+(p[0]-cx)/5.9,.5-(p[2]-5.5)/5.9];
      crop=[.04,.04,.96,.96];
    }
    if(group==='vacuum-blower-face' && axis===0) {project=p=>[.5+p[1]/7.1,.5-(p[2]-13.2)/7.1];crop=[.025,.025,.975,.975];}
    return pts.map(p=>{const [u,v]=project(p);return [(mat%4+crop[0]+u*(crop[2]-crop[0]))/4,(Math.floor(mat/4)+crop[1]+v*(crop[3]-crop[1]))/4];});
  }

  function addTriangle(pts, n, mat, grp) {
    if(grp.startsWith('cannon-')) pts=pts.map(p=>[p[0],p[1]-(grp.includes('left')?8.4:-8.4),p[2]+10.8]);
    n = unit(n);
    if (triangleNormal([0, 1, 2], pts).reduce((s, v, i) => s + v * n[i], 0) < 0) {
      pts = [pts[0], pts[2], pts[1]];
    }
    const start = vertices.length;
    records.push({pts,n,mat,grp,start});
    for (let i = 0; i < 3; i++) {
      vertices.push(pts[i]);
      normals.push(n);
      uvs.push([0,0]);
    }
    triangles.push([start, start + 1, start + 2]);
    groups.push(grp);
    materials.push(mat);
  }

  function addFace(pts, n, mat, grp) {
    if(grp.startsWith('cannon-')) pts=pts.map(p=>[p[0],p[1]-(grp.includes('left')?8.4:-8.4),p[2]+10.8]);
    n = unit(n);
    if (triangleNormal([0, 1, 2], pts).reduce((s, v, i) => s + v * n[i], 0) < 0) {
      pts = [...pts].reverse();
    }
    const start = vertices.length;
    records.push({pts,n,mat,grp,start});
    for (let i = 0; i < 4; i++) {
      vertices.push(pts[i]);
      normals.push(n);
      uvs.push([0,0]);
    }
    triangles.push([start, start + 1, start + 2], [start, start + 2, start + 3]);
    groups.push(grp, grp);
    materials.push(mat, mat);
  }

  function addBox(x0, x1, y0, y1, z0, z1, mat, grp) {
    addFace([[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], [1, 0, 0], mat, grp); // Front (+X)
    addFace([[x0, y1, z0], [x0, y0, z0], [x0, y0, z1], [x0, y1, z1]], [-1, 0, 0], mat, grp); // Rear (-X)
    addFace([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], [0, 1, 0], mat, grp); // Left (+Y)
    addFace([[x1, y0, z0], [x0, y0, z0], [x0, y0, z1], [x1, y0, z1]], [0, -1, 0], mat, grp); // Right (-Y)
    addFace([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1], mat, grp); // Top (+Z)
    addFace([[x0, y1, z0], [x1, y1, z0], [x1, y0, z0], [x0, y0, z0]], [0, 0, -1], mat, grp); // Bottom (-Z)
  }

  function addCylinder(axis, p0, p1, r, segments, mat, grp, cap0 = true, cap1 = true) {
    const len = Math.hypot(...p1.map((v, i) => v - p0[i]));
    const dir = unit(p1.map((v, i) => v - p0[i]));
    const up = Math.abs(dir[2]) < 0.9 ? [0, 0, 1] : [0, 1, 0];
    const right = unit(cross(dir, up));
    const realUp = unit(cross(right, dir));

    const ring0 = [];
    const ring1 = [];
    const nRing = [];

    for (let i = 0; i < segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      const cos = Math.cos(a);
      const sin = Math.sin(a);
      const rn = [
        right[0] * cos + realUp[0] * sin,
        right[1] * cos + realUp[1] * sin,
        right[2] * cos + realUp[2] * sin,
      ];
      nRing.push(rn);
      ring0.push([
        p0[0] + rn[0] * r,
        p0[1] + rn[1] * r,
        p0[2] + rn[2] * r,
      ]);
      ring1.push([
        p1[0] + rn[0] * r,
        p1[1] + rn[1] * r,
        p1[2] + rn[2] * r,
      ]);
    }

    for (let i = 0; i < segments; i++) {
      const next = (i + 1) % segments;
      const nAvg = unit([
        nRing[i][0] + nRing[next][0],
        nRing[i][1] + nRing[next][1],
        nRing[i][2] + nRing[next][2],
      ]);
      addFace([ring0[i], ring1[i], ring1[next], ring0[next]], nAvg, mat, grp);
    }

    if (cap0) {
      const n0 = dir.map(v => -v);
      for (let i = 0; i < segments; i++) {
        const next = (i + 1) % segments;
        addTriangle([p0, ring0[next], ring0[i]], n0, mat, grp);
      }
    }

    if (cap1) {
      const n1 = dir;
      for (let i = 0; i < segments; i++) {
        const next = (i + 1) % segments;
        addTriangle([p1, ring1[i], ring1[next]], n1, mat, grp);
      }
    }
  }

  require('./sweeper_details')({box:addBox,face:addFace,triangle:addTriangle,cylinder:addCylinder});
  // Resolve continuous component bounds only after all geometry is authored.
  for(const {pts,grp} of records) {
    if(!groupBounds.has(grp)) groupBounds.set(grp,{min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]});
    const b=groupBounds.get(grp);
    for(const p of pts)for(let k=0;k<3;k++){b.min[k]=Math.min(b.min[k],p[k]);b.max[k]=Math.max(b.max[k],p[k]);}
  }
  for(const {pts,n,mat,grp,start} of records) faceUvs(mat,pts,n,grp).forEach((uv,i)=>{uvs[start+i]=uv;});

  return { vertices, normals, uvs, triangles, groups, materials };
}

module.exports = {
  createSweeperGeometry,
};
