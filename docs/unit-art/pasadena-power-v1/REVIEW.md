# First Pasadena building: Straight-Pipe Diesel Generator

Created 2026-08-30. Chosen from the project's existing Pasadena roster because the early power plant can establish a consistent building language: marina salvage, red sheet steel, exposed diesel machinery, tall straight exhausts and practical yellow service rails.

## Creation and improvement record

1. **Brief and isolation.** Read the faction roster, legacy power-plant XML, stock GDI power-plant model states and the standard unit-art workflow. Reserved only the new PP art/tools/docs and an isolated SDK art project. Existing vehicle work, gameplay XML and release packages were preserved.
2. **HD concept.** Generated the whole building as a detailed design image: shed, exposed twin-bank diesel, radiator, tall twin stacks, fuel tank, switchgear and service deck. Saved the original 1448×1086 PNG. It is concept art, separate from model evidence.
3. **Material atlas.** Generated a dedicated flat 4×4 atlas, inspected all sixteen cells, and retained the original 1254×1254 PNG. Converted it to a 2048×2048 game-compatible TGA without repainting the source. That conversion does not add original image detail. Normal/specular/team maps are code-authored technical fields; color is not treated as a height map.
4. **Blockout.** Built and saved a 1,522-triangle foundation, shed, roof, engine, tank, radiator frame and stacks. `build(0)` still reproduces its W3X byte for byte. This captures the proportions before refinement.
5. **First detailed render.** Added wall/roof ribs, skids, engine heads, injectors, turbo housings, intake/exhaust runs, fan and guards, tank fittings, electrical cabinets, walkways, rails, steps and labels. Front/rear/side renders exposed a tank/shed intersection and a sparse radiator assembly.
6. **Corrective pass.** Moved the tank fully outside the shed, moved the service door onto the unobstructed side walkway, rerouted fuel plumbing, and added a proper radiator core/covers/feet. Rounded the intake elbows and added crankcase covers, filters, access plates, flange bolts, a shutoff valve, gauge, gutter and switchgear hardware. All changes were made in editable geometry.
7. **Validation and export.** Verified surfaces, UVs, material packing, clearances and the rigid fan. Exported W3X, OBJ/MTL and animated GLB. Compiled isolated main and LowLOD art streams without suppressing any errors; checked actual compiled vertex/texture data.
8. **Final review.** Inspected front/rear/side/highlight-stress renders and normal RTS-size framing. Final model renders are 2200×1520 pixels, from the same geometry and four maps used by W3X. Lighting and reflections approximate the game. User visual approval has not yet been recorded.

## Model and test evidence

25,836 triangles / 61,982 exported vertices / two rigid meshes / four bones. The building remains below the selected 30,000-triangle and per-mesh 65,536-vertex limits. Broad equipment shapes remain distinct at small viewing scale. No separately simplified distance LOD or performance claim is made.

Final visible bounds: X −32 to 32, Y −30.16 to 26, Z 0 to 46.13. The foundation is 64×52, with steps extending its near edge. A final ground-plane check raised the stair supports slightly so no geometry protrudes below ground. No GameObject simulation box was changed.

Passing source checks: 646 externally defined surface-direction checks; finite vertices and unit normals; winding agreement; nonzero geometry and UV areas; texture-cell containment; orthonormal tangent frames; tank/shed and side-walkway separation; 296 fan vertices with analytic clearance over a full X-axis revolution; exact rigid partition and world-space OBJ reconstruction; 61 unit quaternions and matching loop endpoints.

Material checks cover 400 samples across four 2048 maps. Rubber and concrete stay matte; steel differs from paint; only dedicated team plates recolor. Labels, yellow rails and warning lights are preserved. The generated atlas has shallow wear; silhouette and rib relief are modeled.

Compiled checks verify four identified DDS textures with 576 RGBA samples, all 61,982 vertex records including normals/UVs/tangents/binormals, shader references, named skeleton pivots, fan animation asset and both stream outputs. GLB checks verify binary bounds, geometry counts, exact local vertices and pivots, texture embedding and the animation target. These are offline checks, not runtime observations.

## Saved files

- Concept: `src/Art/PP/Concept/PasadenaPowerPlant-HD.png`.
- Model: `src/Art/PP/PPPower.glb`, with W3X and OBJ/MTL siblings.
- Final HD actual-model views: this directory's `powerplant-v1-*.png`.
- Original stages: `build/pasadena-power-review/{blockout,pass1,pass2,final-HD,RTS-scale}`.
- Frozen art/source/views, validation transcript and SHA-256 evidence: `build/pasadena-power-review/finished-v1`.
- Isolated compiled art: `build/pasadena-power-art` (PowerPlantArt project, not a playable release).
- Built-in image-generation prompts and provenance: `PROMPTS.md` in this directory.

## What is and is not complete

**Complete:** requested HD concept, editable detailed model, improvement/render loop, portable exports, engine art compilation and offline checks.

**Not claimed:** live building integration, construction/sale/damage/collapse animations, smoke effects, an in-game portrait, gameplay placement/pathing/power behavior, distance-LOD optimization or runtime performance. The stock GDIPowerPlant and normal release remain unchanged. Its existing simulation geometry must be reviewed against this different footprint before a future art replacement is installed. The new W3X collision bounds alone do not change simulation behavior.

No game launch was needed for this art-creation scope. The earlier launcher failure was not treated as proof that this building runs or fails in-game.
