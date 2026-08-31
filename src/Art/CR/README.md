# Columbia Roundabout Enforcer — visual revision 2

The NODRaiderTank replacement is a low white armored enforcement vehicle with four covered wheels, twin coil emitters, a LiDAR dome and swept rear uplink mast. This is a visual design; the original stock weapons and movement remain unchanged. Blue trim in the previews is the renderer's example player color; optical lenses retain cyan.

The revision uses the project's `UNIT_MODEL_WORKFLOW.md`: protect the baseline, repair real geometry and UVs, inspect actual-model renders, then freeze source and evidence. No generated illustration stands in for the model.

## Changes and evidence

- Rebuilt the open/inverted hull into armored core panels and wheel fairings. Closed wheel backs; corrected mirrored wheel and X/Z lathe winding. Fairing roofs now clear the tire crowns.
- Added shoulder armor, discrete side badges, front sensor, lights, panel seams, turret cheeks, rear vents, tow fittings and mast conduit/actuator detail.
- Replaced per-triangle texture resets with component projections. Excluded atlas captions; corrected badge orientation; used radial wheel mapping and the emitter artwork on circular faces. Reused the existing source atlas and portrait.
- Fixed the `chrome` material alias; unknown materials now fail. Smoothed actual geometry groups before partitioning. Lowered excessive solar/vent normal and highlight response. Kept the ObjectsGDI four-map contract; recolor preserves badge lettering and dark caution gaps.
- Moved the lightbar behind the neutral mantlet and attached radiator fins to turret yaw. Primary projectile/flash origins now coincide with the right-hand emitter lens; the stock weapon slot remains single-fire. Secondary FX matches its lens in the neutral pose.
- OBJ now reconstructs rigid parts at world pivots and exports bottom-origin V, matching the W3X convention.

9,920 triangles / 27,828 vertices / eight rigid meshes / 17 bones. Art scale 0.88. Neutral bounds: X -18.92 to 22.88; Y ±11.1232; Z 0.176 to 21.577075. The existing 24 × 12 half-extents and 22.5 height still cover the model; no simulation, balance, locomotor, weapon or economy settings changed in this pass.

## Reproduce and validate

Run from the repository root. Rendering regenerates the model/maps, so do not run concurrently with another writer to this unit.

```powershell
node tools/render_roundabout_preview.js build/roundabout-review/final-views 18
node tools/render_roundabout_preview.js build/roundabout-review/gameplay-scale 5
node tools/test_roundabout_geometry.js
powershell -NoProfile -ExecutionPolicy Bypass -File tools/test_roundabout_material.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File tools/test_roundabout_behavior.ps1
```

Reviewed front, rear, side, highlight stress, and small-scale views with backface culling. Lighting, shadows and reflections approximate the game shader. Geometry checks include 2,410 independently defined exterior-facing triangles, finite/nonzero geometry, UV area and caption exclusion, normal agreement, rigid reconstruction, wheel-axis invariance, primary muzzle alignment across pitch/yaw, and neutral lightbar/wheel-roof clearance. Material checks include all eight four-map bindings and actual recolor contrast/lettering preservation. Behavior checks confirm the current simulation box and preserved stock settings. Legacy finite-pose arithmetic is explicitly not treated as collision or gameplay proof.

## Saved evidence and integration limits

Baseline: `build/baselines/roundabout-repair-20260830-162217`. Before/pass1/pass2 renders: `build/roundabout-review/`. Frozen final model/maps, editable tools, views and SHA-256 manifest: `build/roundabout-review/finished-v2/`. Tracked review images: `docs/unit-art/roundabout-v2/`. These are review images, not an accepted benchmark until the user approves them.

This pass is source-checked and render-reviewed, not compiled, runtime-verified or released. No shared SDK staging, archive, launcher, or other unit was changed. Full weapon collision across the stock aiming range remains unresolved: the long barrels can sweep toward the tall rear mast, and depressed poses require hull/shoulder clearance work. The existing TAIL mesh remains on secondary yaw, while its FX descendant has a pitch bone; a separate pitched pod binding is required before claiming secondary aiming correctness. Wheel motion under the inherited TankDraw, upgrades/hiding, damage states, driving, firing and army-scale performance need an isolated compiled candidate and live checks. The still renders and finite-pose smoke tests do not establish those behaviors.
