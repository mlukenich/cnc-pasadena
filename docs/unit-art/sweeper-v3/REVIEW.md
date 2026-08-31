# Columbia Autonomous Street Sweeper — revision 3

2026-08-30. Slot: NODFlameTank. Assets: CSSWEEPER_SKIN, CSSWEEPER_SKL, CSSWEEPER_SCRUB. A white commercial sanitation truck with stainless tank, twin curb brushes, and paired roof spray banks. Existing FlameTank weapons/effects remain: no new chemical ability is implied.

## Finished model changes

- Roof-mounted yaw assembly with separate pitch trunnion and nozzle FX bones. Both banks rotate above the cab, lightbar and tank, instead of sweeping through the cab as revision 2 did. Fixed feed lines enter the pedestal; rotating parts are grouped separately.
- Full-yaw clearance is established by vertical separation over elevation 0–90 degrees, sampled each degree: minimum 0.789 world units. The banks also clear the center drive and outer forks throughout that pitch range.
- Four distance-linked wheel bindings use TruckDraw. Two opposite brush quaternion channels form a compiled looping animation. Stock tread-state subobjects/scripts remain compatible. These are implemented bindings, not claims of observed runtime animation.
- Rounder tire shoulders, dark continuous sidewall material, cleaner cylindrical tank mapping, and reduced metal/glass reflection. Cab framing, mirrors, steps, guards, utility hardware, ladder, fan, hose connections and labels remain real geometry or mapped surfaces.

Actual-model software renders were inspected from front, rear, side, highlight-stress, and RTS-scale views. They approximate game lighting. No generated illustration substitutes for asset evidence. Revision 3 has not yet received user visual approval.

## Source and compilation checks

17,588 unique / 17,660 exported triangles; 39,792 exported vertices; 14 meshes; 17 bones. The extra 72 triangles are alternate skirt state copies. Neutral bounds: X −20.795 to 24.1795, Y ±18.6795, Z 0.2 to 24.2.

Passing checks cover 3,382 independently defined exterior directions, nondegenerate geometry/UVs, atlas containment, tangent frames, exact rigid/OBJ reconstruction, wheel and brush axes/envelopes, body/weapon clearance, FX mouth placement, material channels and retained stock combat XML. The staged XML comparison normalizes only the build script's known id assignment on stock's unnamed WeaponSetUpdate; combat contents remain compared.

Both main and LowLOD builds succeeded. LowLOD is compiled against the main manifest and reuses the unchanged Sweeper assets; this is not a separately decimated mesh. Compiled checks identify all four texture assets and compare RGBA samples, retaining the prior RGB DXT tolerance; all 39,792 vertex records, UV conversion, tangent frames, shader references, and presence of the brush animation asset are verified. Army-scale performance is not established.

Simulation box changed from the original 44×30×22 to 50×38×26 (revision 2 was 50×38×22). This covers the neutral body and spinning brushes and increases spacing/pathing/targeting bounds. Elevated nozzle tips can extend above the body box. Weapon, economy, armor, locomotor and other combat behavior remain stock. Other units' existing workspace edits were preserved.

## Candidate and runtime status

Package: `build/sweeper-v3/MDShowdown.big`, 57,607,997 bytes.

SHA-256: `470CB27A1C175949FCECB2545873A19D45686FC49C96FB7BA203947E3F3CF481`.

Launcher: `tools/launch_mod.ps1 -SweeperPreview`; matching configuration is `build/sweeper-v3/MDShowdown_1.0.skudef`. The launcher selects this exact candidate. No install or regular-release promotion was performed. The six existing root build archives retained their pre-build hashes.

Live test was attempted twice. CNC3.exe returned code **100010** immediately, with no surviving game process/window. EA also failed to expose a usable window when launched directly. No authentication or launcher protections were bypassed. Therefore driving/turning, wheel/brush motion, aiming/firing/FX, damage/death, factory exits, group spacing, low settings and many-unit performance remain **unverified**. Stock damaged-state particles remain, but this model has no dedicated scorched texture or wreck mesh.

Original baseline: `build/baselines/sweeper-repair-20260830-184855/`. Accepted earlier checkpoints were preserved, including `build/sweeper-review/finished-v2/`. Revision 3 frozen source/art/renders and hash manifest: `build/sweeper-review/finished-v3/`. Package/logs remain in the separate candidate directory above.

## Reproduce

```powershell
node tools/generate_columbia_sweeper.js
node tools/test_sweeper_geometry.js
powershell -NoProfile -ExecutionPolicy Bypass -File tools/test_sweeper_material.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File tools/test_sweeper_behavior.ps1
node tools/render_sweeper_preview.js build/sweeper-review/v3-final 16 11 --no-export
node tools/render_sweeper_preview.js build/sweeper-review/v3-gameplay-scale 5 11 --no-export
powershell -NoProfile -ExecutionPolicy Bypass -File tools/build_mod.ps1 -OutputDirectory build/sweeper-v3
node tools/test_sweeper_compiled.js
powershell -NoProfile -ExecutionPolicy Bypass -File tools/launch_mod.ps1 -SweeperPreview
```

Only rebuild when no other task uses shared SDK staging and no game uses this candidate. `--no-export` renders the current geometry with the existing maps without rewriting source art; compiled verification confirms the final geometry/maps match the package.
