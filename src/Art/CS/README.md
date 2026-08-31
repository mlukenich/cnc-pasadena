# Columbia Street Sweeper — revision 3

Current candidate: **source checked, render reviewed, both streams compiled; runtime blocked, not released**. See [revision 3 evidence](../../../docs/unit-art/sweeper-v3/REVIEW.md). The previous revision below is retained as history, not a description of the current rig.

Revision 3 moves the twin spray banks to a roof-mounted yaw/pitch assembly that clears the cab and tank, adds a real brush animation clip and TruckDraw wheel bindings, rounds the tire shoulders further, cleans the tank/rubber UV crops, and restrains metal/glass reflection. The 17-bone model has 17,660 exported triangles and 39,792 vertices. Simulation bounds are now 50×38×26.

Launch the isolated candidate with `powershell -NoProfile -ExecutionPolicy Bypass -File tools/launch_mod.ps1 -SweeperPreview`. This does not replace the regular release. The launcher currently exits with code 100010 before a game window appears, so live behavior has not been verified.

## Revision 2 history

NODFlameTank replacement / `CSSWEEPER_SKIN`. A commercial front-control sanitation truck with a white framed cab, stainless boiler, paired curb scrubbers and side-mounted chemical spray nozzles. The existing FlameTank weapons, effects and movement remain stock: the sanitizer concept is visual equipment, not newly implemented chemical gameplay. Preview blue is example player color; amber/cyan lenses retain their original colors.

## Revision and evidence

This pass follows `UNIT_MODEL_WORKFLOW.md`, using real editable geometry, the existing atlas and portrait, and repeated actual-model renders. It does not use a generated illustration as a finished-model substitute.

- Rebuilt the cab with inset glazing, structural pillars, doors, seams, handles, wipers, mirrors, grille bars and separate lights.
- Added rounded tire shoulders, recessed rims, tread relief and complete curved fenders. Moved the bumper and scrubber support linkages clear of the front wheels.
- Rounded boiler ends, added retaining bands, hatch hardware, inspection gauges, utility bays, rear fan and a properly connected ladder.
- Replaced solid brush cones with an underlying bristle core and individual wire bundles. Static motors, spray rings, arms and supply hoses now belong to the body; only brush heads follow brush pivots.
- Replaced face-by-face texture resets with continuous component mapping, radial rim/fan faces, cylindrical tank/shroud/tread projections, and deliberate atlas crops. Labels are upright and readable. Hoses route around the cab instead of through its rear wall.
- Corrected ObjectsGDI map packing: specular R = highlight, G = reflection, B = house-color glow; recolor RGB = diffuse luminance, A = team mask. The old maps incorrectly used grayscale specular plus reflection alpha and put the team mask in RGB with zero alpha. Badge text, white chevron gaps and warning lights are preserved.
- Moved both FXFire origins to the actual nozzle mouths at X 19.25, Y ±11, Z 12.2. Kept the existing skeleton and stock tread-state subobjects. OBJ retains world pivots and bottom-origin V.

The first baseline render was blocked by a zero-area top placard. Its repeated points were corrected to a real rectangle before capturing `before/`; the untouched original remains in the baseline backup. No renderer checks were bypassed.

Final budget: **17,000 unique triangles / 17,072 exported triangles / 38,500 exported vertices / 13 mesh definitions / 16 bones**. The extra 72 triangles are three copies of the 24-triangle skirt geometry for mutually exclusive stock tread states. Preview renders show one copy. The first detailed pass had 20,256 exported triangles; tread and bristle detail was reduced while retaining the visible silhouette. Distance LOD and army-scale cost remain untested.

Bounds: X -20.795 to 24.1795; Y ±18.6795; Z 0.2 to 20.35. The old **44×30×22** simulation box did not cover the existing brushes. The override now specifies **50×38×22**, including the full brush rotation envelope. This will increase spacing/pathing/targeting bounds when compiled and used. No weapon, economy, armor, locomotor or other unit settings changed.

## Reproduce

From the repository root (rendering regenerates Sweeper art; one writer at a time):

```powershell
node tools/render_sweeper_preview.js build/sweeper-review/final-views 16 8
node tools/render_sweeper_preview.js build/sweeper-review/gameplay-scale 5 8
node tools/test_sweeper_geometry.js
powershell -NoProfile -ExecutionPolicy Bypass -File tools/test_sweeper_material.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File tools/test_sweeper_behavior.ps1
```

Editable geometry: `tools/sweeper_details.js`, with mesh/UV helpers in `tools/sweeper_geometry.js`. Exporter: `tools/generate_columbia_sweeper.js`. Materials: `tools/sweeper_surface_pipeline.js`. The shared software renderer approximates game lighting and reflections, with backface culling enabled.

Reviewed front, rear, side, highlight-stress and small-scale views. Checks pass for 3,126 independently defined exterior directions, nonzero geometry and UV area, atlas-cell containment, orthonormal tangent frames, exact rigid/OBJ reconstruction, explicit tread-state duplication, wheel/brush-axis invariants, analytic full-turn brush bounds, neutral fender/bumper/linkage/cannon clearance, nozzle FX placement, shader bindings, map channel packing, recolor preservation, simulation containment and unchanged stock behavior XML. Old finite-pose samples remain labeled arithmetic smoke tests, not rig clearance evidence.

## Saved state and remaining integration

Baseline: `build/baselines/sweeper-repair-20260830-184855`. Iteration images: `build/sweeper-review/{before,pass1,pass2,final-views,gameplay-scale}`. Frozen final source/art/maps/views and SHA-256 manifest: `build/sweeper-review/finished-v2/`. Persistent review images: `docs/unit-art/sweeper-v2/` (pending user visual approval).

Status: **source checked and render reviewed**, not compiled, runtime verified or released. No SDK staging, package, launcher or regular release was changed.

The inherited stock Turret can yaw: these side-mounted banks are clear in the neutral pose but their full sweep through the cab is unresolved. The draw lacks a declared pitch bone despite weapon settings allowing pitch; the old cannon-pitch arithmetic test does not establish elevation behavior. Brush/wheel bones alone do not make TankDraw animate them. A playable pass needs an explicit aiming/animation solution, an isolated main/LowLOD build, compiled channel/UV verification, and live movement, firing, damage, tread-state visibility, factory-exit and group-spacing checks. These limits are not concealed by the finished still renders.
