# Columbia Prius Patrol EV — art revision 2

The Prius occupies the stock Nod Raider Buggy (`NODScorpionBuggy`) production slot. Run `launch_prius_preview.bat` from the repository root, start a fresh Nod skirmish, and build the Prius from the War Factory. The regular package and game installation are unchanged. This candidate is saved separately from concurrent mud-tank work.

## Screenshot defect and repair

The submitted screenshot showed the patterned floor pan with a partial car above it. The same defect reproduced in the backface-culling preview renderer. The lofted body triangles faced inward; authored normals also faced inward, so the old normal/triangle consistency test passed. Mirrored tire surfaces and X/Z-axis lathed parts had related winding errors.

Revision 2 corrects the shell and lathe winding, cuts wheel openings into the actual body, separates side windows and white roof rails from the solar roof, adds pillars and door seams, and smooths the shell while keeping sharp creases. Panel UVs use continuous projections instead of restarting the atlas patch per triangle. The retained atlas is cropped to keep painted panels away from its gray presentation background. Carbon is sampled at a smaller scale. OBJ export now declares its material and uses bottom-origin V.

Existing source texture artwork, portrait, shader, material response values, skeleton, wheel/turret bindings, simulation footprint, weapons, stats, and locomotor are retained. This art pass does not implement new laser or shielding abilities. The existing centered weapon FX hardpoint is retained; it does not become two independently firing emitters.

## Editable source

- `tools/prius_geometry.js`: body, wheel openings, hardware, and outward surface winding.
- `tools/generate_columbia_prius.js`: UVs, rigid meshes, skeleton, W3X/OBJ serialization.
- `tools/prius_surface_pipeline.js`: shell smoothing and unchanged material-map generation.
- `tools/render_prius_preview.js`: generate front/rear/side/highlight-stress previews using the shared renderer.
- `tools/test_prius_geometry.js`: geometry, external orientation, cabin glass, and rig regression checks.

Run from the repository root:

```powershell
node tools/test_prius_geometry.js
powershell -NoProfile -ExecutionPolicy Bypass -File tools/test_prius_material.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File tools/test_prius_behavior.ps1
node tools/render_prius_preview.js
# Exit the game before replacing the preview package.
powershell -NoProfile -ExecutionPolicy Bypass -File tools/build_mod.ps1 -OutputDirectory build/prius-v2
```

## Verification and limits

Revision 2 has 4,812 triangles, 13,964 vertices and seven rigid meshes. Geometry/material/behavior checks and both SDK streams passed. Compiled verification compared every exported vertex (position, normals, tangent frame and UVs) across all seven meshes, and sampled all four compiled texture maps. The existing truck's checks passed and its tracked art files did not change.

Front, rear, side and highlight-stress images under `Preview/` render the actual generated mesh and material maps. They approximate game lighting; they are not game screenshots. Fresh-skirmish appearance, movement, steering, turret tracking, combat and factory exits still require runtime verification. The low-LOD stream still uses the same custom geometry; this pass does not add simplified distance meshes.

Recovery copy: `build/baselines/prius-repair-20260830-140433/` contains the previous Prius art, source files and preview package. Reproduced before/fix-only renders are under `build/prius-review/`.

Verified candidate: `build/prius-v2/MDShowdown.big`, 22,046,341 bytes, SHA256 `F840A3A5F36FB1F4CB0836FA53138A72173173E5FCE30E8DDA56198C333842CE`. This package includes the existing truck and revised Prius, not the concurrent mud-tank addition. A later rebuild includes whatever is in the current manifest; this hash identifies this specific tested candidate.
