# Pasadena Straight-Pipe Diesel Generator

First custom Pasadena building, selected from the existing faction roster. Intended stock slot: GDIPowerPlant. This is a finished revision-1 **art asset**, not a replacement of the live power-plant object.

## Deliverables

- `Concept/PasadenaPowerPlant-HD.png`: original HD design concept, generated with the built-in Image Generation tool.
- `PPPower.glb`: portable editable model with embedded diffuse atlas, separate fan mesh, 16 approximate PBR materials and a looping fan animation. Import into Blender or another glTF editor. glTF root converts the project's +Z-up coordinates to +Y-up.
- `PPPower.obj` / `PPPower.mtl`: full world-space mesh with named geometry groups and TGA material references.
- `PPPower_Model.w3x`: engine-native model, hierarchy, collision box and fan animation.
- `PPPower{Atlas,Normal,Spec,House}.tga`: 2048×2048 ObjectsGDI material maps. Original generated atlas is preserved in `Textures/powerplant-atlas-source.png`.
- [HD model renders and creation record](../../../docs/unit-art/pasadena-power-v1/REVIEW.md).

The GLB's standard PBR shading approximates the appearance. W3X, the four-map ObjectsGDI contract and the actual-model software previews are the game-art reference. Software lighting is still an approximation of the game.

## Editable source and reproduction

Architecture and mechanical components: `tools/powerplant_details.js`. Primitive collection and continuous UVs: `tools/powerplant_geometry.js`. Exporter: `tools/generate_pasadena_powerplant.js`. Material response: `tools/powerplant_materials.js`. The renderer is a building-local copy of the proven vehicle renderer with HD dimensions; shared vehicle code was not changed.

From the project root:

```powershell
# Format conversion only; retain original generated artwork unchanged.
powershell -NoProfile -ExecutionPolicy Bypass -File tools/convert_jpg_to_tga.ps1 -SourceJpg src/Art/PP/Textures/powerplant-atlas-source.png -TargetTga src/Art/PP/PPPowerAtlas.tga -TargetWidth 2048 -TargetHeight 2048
node tools/generate_pasadena_powerplant.js
node tools/powerplant_glb.js
node tools/test_powerplant_geometry.js
node tools/test_powerplant_materials.js
node tools/test_powerplant_glb.js
node tools/render_powerplant_preview.js build/pasadena-power-review/final-HD 2 9 --hd
powershell -NoProfile -ExecutionPolicy Bypass -File tools/compile_powerplant_art.ps1
node tools/test_powerplant_compiled.js
```

Do not run the SDK compiler concurrently with another project build. Importing the building generator has no write side effects. `build(0)` reproduces the saved first blockout exactly. `build(2)` is the final design. Detail=1 is a development stage, not an approved LOD: the accepted tank layout corrections are in detail=2.

## Engine integration boundary

IDs: `PPPOWER_SKIN`, `PPPOWER_SKL`, `PPPOWER_IDLE`. Bone 1 is the fan on the X axis; EXHAUST01/02 are stack-mouth attachments, not currently bound smoke effects. No fuel, power, health, costs, team data or pathing settings were changed.

Both isolated art streams compile and their exported records are checked. A live GDIPowerPlant replacement still needs building-specific construction/sale, damage/collapse/wreck, low-power/upgrade states, exhaust FX, placement and simulation geometry, UI portrait, and gameplay testing. Do not substitute the stock animated states blindly: their skeletons do not match this building. LowLOD currently references the same art; distance reduction and performance remain unverified.
