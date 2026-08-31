# Monster Mud Tank — art revision 2 with truck-size/wheel fix v1

Current source uses **artScale 1.10**, 25% larger than approved revision 2, with all rigid pivots scaled together. The `GDIPredator` visual module now uses **TruckDraw** and four explicit tire-bone bindings instead of TankDraw. The simulation box is **62 x 36 x 31**; combat settings and locomotor are retained. This changes spacing, pathing and targeting/contact bounds.

The isolated candidate and actual same-scale renders are documented in [truck-size-wheels-v1](../../../docs/unit-art/truck-size-wheels-v1/README.md). Both compiler streams and compiled-asset checks pass. Live wheel movement remains unverified: game launch returned error 100010 before a window appeared. `launch_truck_fix.bat` selects this candidate; the regular release is unchanged. The following revision-2 evidence is historical and remains preserved.

The user approved the finished render on 2026-08-30 and selected its process as the project standard. Follow [UNIT_MODEL_WORKFLOW.md](../../../UNIT_MODEL_WORKFLOW.md) for future units. The approved [front](../../../docs/unit-art/reference/monster-truck-approved-front.png) and [rear](../../../docs/unit-art/reference/monster-truck-approved-rear.png) images are frozen references, separate from regeneratable previews. This approval establishes visual acceptance only.

Actual model renders are in `Preview/mudtank-v2-front.png`, `mudtank-v2-rear.png`, `mudtank-v2-side.png` and `mudtank-v2-sun-check.png`. These render the generated model, UVs and material maps with approximate game lighting. They are not concept images or in-game screenshots.

## Changes

- Corrected inward-facing windshield, grille, doors, bed sides, wheel faces and lathed surfaces.
- Enlarged tires, widened the axles, lifted the chassis and added modeled chevron tread blocks and curved steel wheel guards.
- Raised the cannon assembly above the cab on a braced pedestal; placed four floodlights around a clear center channel and aligned the muzzle hardpoint with the barrel end.
- Replaced per-triangle texture repetition with component projections; mapped tire sidewalls/rims radially and cropped the door artwork to the actual door panel.
- Preserved the Maryland flag; team recolor is a narrow beltline stripe. Fixed chrome material names that silently fell back to burgundy paint.
- Applied smoothing to the actual geometry groups before export. The old per-mesh smoothing never matched the intended group names.
- Fixed OBJ export: rigid parts are placed at their world pivots, and V is converted to the OBJ convention.

The original diffuse atlas and portrait remain unchanged. Geometry and material source files are `tools/mudtank_geometry.js`, `tools/generate_pasadena_mudtank.js`, and `tools/mudtank_surface_pipeline.js`.

## Verification

Run `node tools/test_mudtank_geometry.js` for mesh, UV, exterior-facing surface and neutral cannon/cab clearance checks. Run `node tools/render_mudtank_preview.js` to regenerate the art and four previews. The preview and W3X share the same smoothed normals and geometry. The model has 13,812 triangles across seven rigid meshes.

`tools/test_mudtank_material.ps1` checks the shader/maps and `tools/test_mudtank_behavior.ps1` checks object integration. No live gameplay verification is claimed. The inherited object still uses TankDraw; spinning/steering wheel behavior is not established by offline rotation math. Full turret motion, damage states and factory exits need in-game checks.

The model requires a 50 x 28 x 25 simulation box (previously 50 x 23 x 19.5). The wider footprint affects spacing and pathing, and the taller box affects targeting/contact geometry. Weapon settings, speed, health, cost and upgrades are retained. The regular playable archive and Prius preview were not replaced by this render task.

Recovery art/source: `build/baselines/mudtank-repair-20260830-160401/`. The initial broken-model renders are in `build/mudtank-review/before/`. Concurrent roundabout work is outside this art pass; no changes to that unit belong to this task.
