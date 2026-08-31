'use strict';
const fs=require('fs'),path=require('path');
const {createPowerplantGeometry}=require('./powerplant_geometry');
const {writeMaps}=require('./powerplant_materials');
const {bounds,fmt,meshToXml}=require('./powerplant_export');
const pivots=[['ROOTTRANSFORM',-1,0,0,0],['FAN',0,26.1,6.4,11.2],['EXHAUST01',0,18,1.4,46.13],['EXHAUST02',0,18,11.4,41.13]];
function build(detail=2){
 const mesh=createPowerplantGeometry(detail),allBounds=bounds(mesh.vertices);
 const select=(yes,offset)=>{const out={vertices:[],normals:[],uvs:[],triangles:[],groups:[]},remap=new Map();mesh.triangles.forEach((t,j)=>{if(!yes(mesh.groups[j]))return;out.triangles.push(t.map(i=>{if(!remap.has(i)){remap.set(i,out.vertices.length);out.vertices.push(mesh.vertices[i].map((v,k)=>v-offset[k]));out.normals.push(mesh.normals[i]);out.uvs.push(mesh.uvs[i]);}return remap.get(i);}));out.groups.push(mesh.groups[j]);});return out;};
 const fan=g=>/^fan-blade|^fan-hub/.test(g);
 const parts=[{id:'BUILDING',bone:0,mesh:select(g=>!fan(g),[0,0,0])}];
 if(detail)parts.push({id:'FAN',bone:1,mesh:select(fan,pivots[1].slice(2))});
 const identity='<FixupMatrix M00="1" M10="0" M20="0" M30="0" M01="0" M11="1" M21="0" M31="0" M02="0" M12="0" M22="1" M32="0"/>';
 const animation=`<W3DAnimation id="PPPOWER_IDLE" Hierarchy="PPPOWER_SKL" NumFrames="61" FrameRate="30"><Channels><ChannelQuaternion Pivot="1" Type="Orientation" FirstFrame="0">${Array.from({length:61},(_,i)=>`<Frame X="${fmt(Math.sin(i*Math.PI/60))}" Y="0" Z="0" W="${fmt(Math.cos(i*Math.PI/60))}"/>`).join('')}</ChannelQuaternion></Channels></W3DAnimation>`;
 const w3x=`<?xml version="1.0" encoding="UTF-8"?>
<AssetDeclaration xmlns="uri:ea.com:eala:asset">
<Includes><Include type="all" source="ART:PP/PPPower_Texture.xml"/></Includes>
<W3DHierarchy id="PPPOWER_SKL">${pivots.map(p=>`<Pivot Name="${p[0]}" Parent="${p[1]}"><Translation X="${p[2]}" Y="${p[3]}" Z="${p[4]}"/><Rotation X="0" Y="0" Z="0" W="1"/>${identity}</Pivot>`).join('')}</W3DHierarchy>
${detail?animation:''}
${parts.map(p=>meshToXml(p.id,p.mesh)).join('\n')}
<W3DCollisionBox id="PPPOWER_SKIN.COLLISION"><Center X="${fmt(allBounds.center[0])}" Y="${fmt(allBounds.center[1])}" Z="${fmt(allBounds.center[2])}"/><Extent X="${fmt((allBounds.max[0]-allBounds.min[0])/2)}" Y="${fmt((allBounds.max[1]-allBounds.min[1])/2)}" Z="${fmt((allBounds.max[2]-allBounds.min[2])/2)}"/></W3DCollisionBox>
<W3DContainer id="PPPOWER_SKIN" Hierarchy="PPPOWER_SKL"><SubObject SubObjectID="COLLISION" BoneIndex="0"><RenderObject><CollisionBox>PPPOWER_SKIN.COLLISION</CollisionBox></RenderObject></SubObject>${parts.map(p=>`<SubObject SubObjectID="${p.id}" BoneIndex="${p.bone}"><RenderObject><Mesh>PPPOWER_SKIN.${p.id}</Mesh></RenderObject></SubObject>`).join('')}</W3DContainer>
</AssetDeclaration>`;
 const report={artVersion:1,building:'Straight-Pipe Diesel Generator',faction:'Pasadena',intendedStockSlot:'GDIPowerPlant',detail,triangles:mesh.triangles.length,vertices:mesh.vertices.length,parts:parts.map(p=>({id:p.id,bone:p.bone,triangles:p.mesh.triangles.length})),bounds:allBounds,pivots,materialAtlas:'4x4; see powerplant_materials.js',state:'Standalone art, not wired into live building states'};
 return {mesh,parts,pivots,report,w3x};
}
function exportAssets(outDir=path.resolve(__dirname,'../src/Art/PP'),detail=2){
 fs.mkdirSync(outDir,{recursive:true});const result=build(detail);
 const art=path.resolve(__dirname,'../src/Art/PP');writeMaps(art);
 if(path.resolve(outDir)!==art)for(const n of ['Atlas','Normal','Spec','House'])fs.copyFileSync(path.join(art,'PPPower'+n+'.tga'),path.join(outDir,'PPPower'+n+'.tga'));
 fs.writeFileSync(path.join(outDir,'PPPower_Model.w3x'),result.w3x);
 fs.writeFileSync(path.join(outDir,'PPPower_Model.report.json'),JSON.stringify(result.report,null,2)+'\n');
 const m=result.mesh;let obj='# Pasadena power plant: world coordinates, +X front / +Z up\nmtllib PPPower.mtl\n';
 obj+=m.vertices.map(v=>'v '+v.map(fmt).join(' ')).join('\n')+'\n';obj+=m.uvs.map(v=>'vt '+fmt(v[0])+' '+fmt(1-v[1])).join('\n')+'\n';obj+=m.normals.map(v=>'vn '+v.map(fmt).join(' ')).join('\n')+'\n';
 let group='';m.triangles.forEach((t,i)=>{if(group!==m.groups[i]){group=m.groups[i];obj+='g '+group+'\nusemtl ObjectsGDI\n';}obj+='f '+t.map(v=>`${v+1}/${v+1}/${v+1}`).join(' ')+'\n';});
 fs.writeFileSync(path.join(outDir,'PPPower.obj'),obj);fs.writeFileSync(path.join(outDir,'PPPower.mtl'),'newmtl ObjectsGDI\nKd 1 1 1\nKa .2 .2 .2\nKs .1 .1 .1\nNs 28\nmap_Kd PPPowerAtlas.tga\nbump PPPowerNormal.tga\n');
 console.log(`Power plant detail ${detail}: ${m.triangles.length} triangles, ${m.vertices.length} vertices, ${result.parts.length} rigid parts.`);return result;
}
if(require.main===module)exportAssets(process.argv[2]?path.resolve(process.argv[2]):undefined,Number(process.argv[3]??2));
module.exports={build,exportAssets,pivots};
