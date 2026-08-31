# Pasadena custom-art exemplar

**Current size correction: truck-size/wheel fix v1.** The F-250 now uses artScale **0.66**, 25% smaller than the earlier 0.88 export, including every rigid pivot. Its simulation box is **54 x 24 x 25**; the existing wheel driver, combat settings and locomotor are retained. Material/art revisions below are preserved history. See [paired comparison and candidate evidence](../../../docs/unit-art/truck-size-wheels-v1/README.md). Use `launch_truck_fix.bat` for this isolated candidate; the regular release is unchanged.

This folder contains the complete source trail for the **Lifted F-250 “Rolling Coal”** exemplar. The in-game object remains `GDIPitbull` for stable C&C 3 behavior, while every model condition and both UI image fields are redirected to the custom assets.

## Files

- `Concept/PasadenaRollingCoal_concept.png` — visual/modeling reference.
- `Portrait/PasadenaRollingCoal_portrait.png` — high-resolution source for the production portrait.
- `PVDually_Model.obj` and `.mtl` — generated interchange geometry for Blender or another DCC.
- `PVDually_Model.w3x` — generated game model and hierarchy.
- `PVDuallyAtlas.tga` and `PVDually_Texture.xml` — generated weathered material atlas.
- `PVDuallyPortrait.tga` and `PVDually_Portrait.xml` — generated C&C 3 packed UI image.
- `PVDually_Model.report.json` — geometry, bounds, bone, and output summary.

The generated files are rebuilt by `tools/generate_pasadena_dually.js`; make persistent geometry changes in `tools/dually_geometry.js` and serialization/material changes in the generator, then run `build.bat`.

## Current art pass 3

**Current rendering revision: 3.4.** The dark hood triangle was caused by the 0.88 slope cutoff excluding one face with Z-normal 0.87793. All 50 stamped-panel triangles now use an explicit smoothing group, with tests covering every shared vertex and the missed corner. Installed shader inspection also confirmed 3x specular gain and exponent 50: the former preview materially understated glare. Paint-only highlight ceilings now account for that gain (red 14, ivory/door 10, hood 12, roof 10, tailgate 14, armor 16). Glass, steel and rubber settings are unchanged. Diffuse/normal/team/portrait TGAs, positions, topology, UVs, skeleton and scale are unchanged from 3.3.

The preview renderer now uses measured highlight/normal-strength constants and includes `Preview/dually-v3-sun-check.png`, an intentionally aligned highlight stress view. It reproduced both defects on the old source and removes them on the new one. It still does not simulate every part of the game renderer. Full evidence and reproduction commands: `build/render-diagnostics/INVESTIGATION.md`. The user-tested 3.3 package/source are backed up in `build/baselines/art-pass-3-surface`.

**Surface artwork revision: 3.3 (retained).** A focused texture/shading pass keeps the 3.2 geometry and 0.88 scale. Hood top normals are corner-angle weighted across the stamped contour; side walls retain hard edges. The diffuse artwork removes the bright painted hood/roof frames, and the hood's artificial perimeter normal-map groove is removed (the roof groove is reduced). Geometry positions and triangle topology are unchanged.

`Textures/dually-panels-v3-3.png` is the selected built-in image-generation edit of the preserved `dually-panels-v3.png`; the full prompt and provenance are in `Textures/dually-panels-v3-3.prompt.txt`. It adds localized dusty paint, lower-door mud, rubbed hardware and tire wear. UVs now place lower-body dirt by panel height, map wheel sidewalls/rims continuously and expose more of the ammunition-box and gun-breech artwork. Steel wheel faces sample the rubbed steel region so hardware does not disappear into an oily dark patch.

Revision 3.3 retained the original low-glare ceilings; 3.4 lowers paint ceilings based on the installed shader. Lower body dirt and the oily centers of gunmetal/bed surfaces receive additional highlight suppression. The user-tested 3.2 package and source are in `build/baselines/art-pass-3-detail`. Both compiler streams and compiled vertex/DDS checks pass, but sunny-map appearance still needs user confirmation.

**Current geometry revision: 3.2 (detail and proportions).** The hood now has an integrated stamped center contour, visible sloping cowl louvers, edge seams and side latches. Cab gutters/window sills and continuous fender shoulders improve the panel construction. Four exposed wheels have open eight-spoke steel dishes, recessed brake drums, hub caps, lugs and sidewall beads; all six tires have shoulder-spanning tread lugs with side walls. The gun mount has a braced pedestal, smaller bearing ring, separate elevation cradle/trunnions, strapped ammunition boxes and segmented feed chutes.

An art-only uniform scale of **0.88** reduces the oversized footprint seen beside the stock buggy in the user's screenshot. This is a conservative visual adjustment, not a claim of exact stock-model dimensional matching. Vertices, rigid offsets and all skeleton translations scale together; GameObject scale, simulation geometry and gameplay stats are untouched. Source tests reconstruct every rigid mesh in world space and check wheel/muzzle alignment. Compare size, turning wheels and firing in-game before accepting this scale.

**Low-glare material history.** Revision 3.1 used paint ceilings red 55 / ivory 40; revision 3.4 replaces those as described above. Paint environment reflections remain disabled. Glass is 80/35 (specular/reflection); exposed steel is 95/15. Rubber and rust are nearly matte. Revision 3.2 preserved the maps; revision 3.3 changed diffuse artwork, hood/roof normal detail and local grime masks. Global game lighting is unchanged.

The last user-tested low-glare package and source are backed up in `build/baselines/art-pass-3-low-glare`; the earlier glossy version is in `build/baselines/art-pass-3-glossy`. Revision 3.2 passes material-mask limits, both compiler streams and compiled-output checks. Actual mesh previews were inspected from three angles, but the new size/details still require an in-game check.

Use `launch_art_preview.bat` after fully closing C&C 3. It loads `build/art-v3/MDShowdown_1.0.skudef` without modifying the prior playable package. Rebuild this candidate with Windows PowerShell: `tools/build_mod.ps1 -OutputDirectory build/art-v3`. Running normal `build.bat` instead publishes the current source to the regular build; close the game first.

This pass uses the stock **ObjectsGDI.fx** four-texture vehicle shader, following EA's `ModSDK/Documentation/Art_Textures.htm`. The unit remains the existing Pitbull-based exemplar; no gameplay behavior or base-game file was changed.

- `Textures/dually-panels-v3-3.png`: current built-in image-generated diffuse artwork edit, sixteen tiles with dedicated hood, door, roof, tailgate, bed and armor-panel regions. Full prompt: `Textures/dually-panels-v3-3.prompt.txt`. Original `dually-panels-v3.png` and its prompt are preserved.
- `PVDuallyAtlas.tga`: runtime format conversion of the source artwork; consistent planar UVs cover entire panels, including triangulated roof faces.
- `PVDuallyNormal.tga`: tangent-space detail derived from an independently authored technical height field, **not** from diffuse brightness. `Textures/dually-height-v3.tga` is its inspectable height field; `tools/dually_surface_pipeline.js` is the editable mathematical source.
- `PVDuallySpec.tga`: R controls highlights, G controls environment reflections, B is restrained house-color glow. Rubber stays matte, glass reflects, metal catches light, and muddy lower door panels have reduced highlights.
- `PVDuallyHouse.tga`: grayscale luminance plus alpha mask; team color is restricted to narrow trim regions rather than tinting the whole truck.
- `Preview/dually-v3-front.png`, `dually-v3-rear.png`, `dually-v3-side.png`: actual mesh renders with all four maps. These approximate lighting/reflections; they are **not game screenshots** or proof of final appearance.

The mesh has **11,952 triangles and 26,264 exported vertices**, below the existing 12,000-triangle ceiling. Redundant cap triangles and hidden ring caps were removed, with lower subdivisions on hidden inner tires, to make room for the new detail. Tire, pipe and barrel normals are smoothed without blending across hard tread edges. Each vertex has a tested tangent/binormal frame. Broad bed ribs remain in the surface maps.

### Verified UV convention

The old mesh wrote image-top-origin V directly to W3X. BinaryAssetBuilder converts W3X V to `1 - V`, while the DDS retains the TGA's top-to-bottom color order. That swapped red paint with glass and rubber with amber in the user's screenshot. Internal UVs remain top-origin, but **W3X and OBJ now both emit bottom-origin V**. Compiled vertex-buffer checks confirm the resulting game UVs select the intended rows.

The original art pass 2 package/source are preserved in `build/baselines/art-pass-2`. The normal launcher still selects the old package until this candidate is tested and promoted. Damage variants, dedicated reduced-poly LOD meshes, custom exhaust animation and further silhouette/art tuning remain future work; this is not a claim of finished stock-art parity.

## Previous art pass 2 (historical)

The second pass replaces the box blockout with a tapered cab and sloped windshield, inset side windows, a beveled hood, wheel arches, rounded six-wheel dually tires with modeled treads and rims, pickup-bed wheel tubs, open cargo rails, exhaust heat shields and hollow stack mouths, a smaller tubular brush guard, and detailed lamps/grille/steps. The elevated gun mount clears the cab roof; muzzle attachment points match its barrel tips.

The mesh contains 10,720 triangles across the same seven rigid subobjects. Hidden wheel-face detailing was removed to reduce cost. This is an improved exemplar, not a finished production asset: dedicated reduced-poly LOD meshes, normal/specular maps, team-color masks and damage variants remain future work.

- `Textures/dually-materials-v2.png` — source material sheet generated with the built-in image-generation tool; eight patches in a 4-column, 2-row grid.
- `Textures/dually-materials-v2.prompt.txt` — full generation prompt and provenance.
- `PVDuallyAtlas.tga` — 1024-square runtime format conversion of that source; face UVs use consistent texel density and inset patch borders.
- `Preview/dually-v2-front.png`, `dually-v2-rear.png`, `dually-v2-side.png` — software renders of the **actual generated geometry and texture**, not concept illustrations. Generate with `node tools/generate_pasadena_dually.js --preview`. Preview lighting is approximate, not the game renderer.

The prior user-tested colored blockout, its source generator and art are preserved under `build/baselines/colored-blockout-v1`. The new art build still requires an in-game visual test.

## Previous material contracts (historical)

Art pass 2 uses EA's existing **BasicW3D.fx** lit shader, following `ModSDK/Art/W3/W3XViewLight.w3x`: ambient and diffuse RGB are white, emissive RGB is zero, depth writes/culling are enabled, alpha testing is disabled, and BlendMode is 0 (opaque). Specular is a restrained 0.08 with shininess 16. The stock game supplies the shader; do **not** package the SDK's preview-specific compiled shader.

This contract differs from the first-pass **Simple.fx**, where `ColorEmissive` multiplied the texture directly and therefore had to be white to avoid black surfaces. Do not transfer one shader's constants to the other.

Current tests: `tools/test_dually_material.ps1` checks the seven ObjectsGDI materials, four texture slots and channel semantics. `tools/test_dually_geometry.js` checks winding, normals, tangent frames, UV patch boundaries and W3X V conversion, polygon budget, bones and muzzle coordinates. `tools/test_dually_compiled.js` then checks DDS pixels and **every compiled vertex's position, normal, tangent, binormal and UV** across all seven meshes. Packaging stops if those compiled checks fail.

## Runtime contract

The model exposes `ROOTTRANSFORM`, `Tire01`–`Tire04`, `Turret`, `B_ Gun`, `FXWEAPON01`, `FXWEAPON02`, `mortortube`, and `B_SPOTLIGHT`. These names match the stock `TruckDraw`/weapon modules inherited by `GDIPitbull`. The body, four wheel assemblies, turret, and gun assembly are separate W3D subobjects bound to the appropriate pivots.

## Image-generation prompts

Concept reference:

> Production concept sheet for a fictional lifted heavy-duty diesel dually pickup used as a C&C 3 RTS unit; exaggerated suspension lift, six oversized mud tires, battered Chesapeake working-class improvised armor, crab-pot wire and scrap-metal details, twin heavy machine guns, tall soot stacks, rusty red/faded cream/gunmetal palette, front three-quarter view and side inset, neutral background, readable mid-2000s RTS silhouette, no logos, people, text, or watermark.

Production portrait, using the concept as its reference image:

> Square C&C 3-style production-button portrait of the same rusty-red and faded-cream lifted dually technical, tight dramatic front three-quarter crop, twin guns and soot stacks readable, dark smoky industrial background, amber rim light, strong silhouette and high contrast at 64–128 pixels, no logo, people, border, text, or watermark.

## Reusing the pipeline

For the next vehicle, keep the process in this order: establish the visual target, model separate functional pieces, reproduce the inherited object's exact bone contract, emit an OBJ inspection copy, compile both normal and LowLOD streams, then verify every model state and UI image reference in the staged override. Infantry will additionally require a compatible skeleton and animation set, so another vehicle is the lower-risk second exemplar.
