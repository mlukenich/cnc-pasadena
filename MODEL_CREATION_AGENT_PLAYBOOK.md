# Custom C&C 3 models: implementation reference

**Start with [UNIT_MODEL_WORKFLOW.md](UNIT_MODEL_WORKFLOW.md).** The user adopted the Monster Mud Tank revision 2 render process as the project standard on 2026-08-30. That document governs new/refined unit work, render evidence, shared-workspace coordination and completion stages. This older playbook remains a technical reference for Rolling Coal; its example commands, dimensions, bones and baseline hashes are not universal defaults or current release status.

Originally verified on 2026-08-30. Audience: an implementation agent working on one unit at a time.

This is a project manual, not a new Codex skill or permission to change the game installation. Follow the user's current request, applicable agent instructions, and available tool/skill requirements first. A request to explain or review does not authorize implementing a change.

For the reasoning behind this workflow, read [HOW_THE_CUSTOM_UNIT_PIPELINE_WORKS.md](HOW_THE_CUSTOM_UNIT_PIPELINE_WORKS.md). All paths below are relative to the project root unless explicitly absolute.

## 1. Rolling Coal historical state and safety boundaries

The playable exemplar is the Lifted F-250 "Rolling Coal," occupying the stock `GDIPitbull` object slot. It has custom truck geometry, four-map materials, separate wheel/turret/gun parts, and a custom UI portrait. It retains stock Pitbull weapons and production logic. The twin-.50-caliber description and smog ability are design intentions, not implemented behavior.

At the original checkpoint, the package combined art revision 3.4 with behavior pass 1, which fits the collision footprint to the existing truck. User screenshots showed substantial visual improvement; a short video showed movement, turning, and independent idle turret rotation. That video did **not** validate combat effects, wheel rotation speed, factory exits, or multi-unit spacing. The idle turret sweep looked abrupt. Inspect current source before assuming this historical package or tuning remains current.

Keep these boundaries:

- Keep the working exemplar and its backups. Do not restart the pipeline from scratch.
- Keep the runtime mod identifier `MDShowdown`. The SDK documents startup crashes for mod names longer than 15 characters.
- Use the preview output for experiments. Do not promote a candidate over the regular playable build without authorization.
- Do not run `enable_mod.bat`, inject archives into the base game, or rewrite the game's SKU definitions as part of normal art work.
- Do not change weapons, economy, health, locomotor, faction infrastructure, or other units while solving an art-only issue.
- Collision corrections are simulation changes: disclose their effects on movement, target size, and route choices even if numerical combat stats are unchanged.
- Do not package stock textures extracted for inspection or the SDK's preview-specific vehicle shader.
- Do not claim compilation proves visual quality, animation, combat behavior, performance, or stock-art parity.
- Do not weaken a test just to make it pass. Explain intentional contract changes and replace obsolete expectations with equally useful checks.

### Historical Rolling Coal baseline facts

| Item | Verified value |
| --- | --- |
| Playable GameObject | `GDIPitbull` |
| Model/container | `PVDUALLY_SKIN` |
| Hierarchy | `PVDUALLY_SKL` |
| Portrait image | `Portrait_PasadenaDually` |
| Shader | `ObjectsGDI.fx` |
| Geometry | 11,952 triangles; 26,264 exported vertices; seven rigid meshes |
| Art scale | 0.88, applied to vertices, part offsets, and pivot translations |
| Render bounds | X −33.836 to 34.980; Y ±14.960; Z approximately 0.014 to 32.575 |
| Simulation box | Half-length 35; half-width 16; height 33; `IsSmall=false` |
| Preview | `build/art-v3/MDShowdown.big` and `MDShowdown_1.0.skudef` |
| Historical package SHA256 | `3566608E641CE5E4294039C2C72031617ED325A7071DC0295016D62F90F41DAC` |
| Previous art-3.4 backup | `build/baselines/art-pass-3-render-fixed` |

The hash identifies this exact candidate, not a hash every future build should have. Update the handoff after an intentional change. Current statistics are an exemplar budget, not a documented engine-wide maximum.

## 2. Spend context and tools where they matter

Start with this guide and the user's latest request. Do not reread the entire chat, SDK, generated W3X, or every old script.

Use a narrow reading route:

| Task | Read first | Edit the lasting source here |
| --- | --- | --- |
| Shape, proportions, visible details | Model report; relevant geometry groups | `tools/dually_geometry.js` |
| Part membership, pivots, UVs, serialization | Relevant generator functions | `tools/generate_pasadena_dually.js` |
| Shading, normals, highlight masks | Material functions; rendering investigation | `tools/dually_surface_pipeline.js` |
| Diffuse painted appearance | Selected PNG and its prompt; UV layout | New versioned source image, then generator input path |
| Footprint or playable object integration | `tools/dually_behavior.ps1`; staged unit | `tools/dually_behavior.ps1` and its tests |
| Build/staging | `src/mod.xml`; `tools/build_mod.ps1` | Those source files, not generated output |
| Launch | `tools/mod_runtime.ps1`; `tools/launch_mod.ps1` | Only the relevant launcher source |

Useful focused searches:

```powershell
rg -n 'hood-top|gun-muzzle|tire-front' tools/dually_geometry.js
rg -n 'faceUvs|wheelBindings|pivots|makeMeshXml' tools/generate_pasadena_dually.js
rg -n 'smoothNormals|materialResponses|responseAt' tools/dually_surface_pipeline.js
rg -n 'TurretTurnRate|WeaponLaunchBone|Geometry' ModSDK/Mods/MarylandShowdown/data/GeneratedOverrides/GDI/Units/GDIPitbull.xml
```

Cost-control rules:

1. Write a one-sentence symptom, one hypothesis, and the cheapest discriminating check before changing code.
2. Change one subsystem per pass. For example, fix hood normals without repainting the truck or changing the shader.
3. Run a focused test before a full build. Inspect compact reports rather than dumping megabytes of XML or compiler logs.
4. Reuse the selected concept, atlas, shader, exporter, and tests. Generate a new image only when the defect really is in the painted source.
5. For an image edit, request one constrained revision of the existing atlas; inspect it before requesting alternatives.
6. If two passes fail to improve the same symptom, stop blind parameter changes. Reproduce it under fixed conditions, inspect the compiled asset, or ask for stronger evidence.
7. Use an expensive agent only for a precise unresolved question, such as an unfamiliar binary layout or unexplained shader behavior. Supply a small reproduction and the evidence already collected. Do not spawn agents unless the user or applicable instructions authorize that.
8. Persist findings in the build report so the next agent does not repeat the investigation.

Suggested task card:

```text
Unit and active object:
Requested change:
Observed evidence:
Current package hash:
Hypothesis:
Files I intend to edit:
Things that must stay unchanged:
Smallest test that distinguishes success from failure:
Backup location:
Runtime checks still needed:
```

## 3. Know which files actually drive the game

The playable pipeline is:

```text
Geometry code + source PNG + technical material code
    -> generator -> W3X, TGA, texture/portrait XML, OBJ/MTL, report
    -> build script stages art and complete stock-derived object overrides
    -> src/mod.xml selects the staged objects and custom art
    -> BinaryAssetBuilder compiles main and LowLOD streams
    -> source/compiled checks -> MakeBig -> MDShowdown.big
    -> MDShowdown_1.0.skudef -> launcher -modConfig -> installed game
```

Important distinctions:

- `src/Data/Pasadena/...` contains older experimental design XML. It is **not** the current playable unit source. Editing a convincing-looking legacy unit file can have no effect in the game.
- `ModSDK/Mods/MarylandShowdown/data/GeneratedOverrides/...` is generated staging. Inspect it to confirm integration, but never put your only fix there; rebuilding replaces it.
- `src/Art/PV/PVDually_Model.w3x`, the TGAs, OBJ/MTL, portrait XML, and report are generated. Editing only these outputs loses the change on the next generator run.
- `tools/generate_pasadena_dually.js` has top-level generation side effects. Requiring it from Node, including through `test_dually_geometry.js`, regenerates art. These are not read-only inspection commands.
- The selected diffuse source is `src/Art/PV/Textures/dually-panels-v3-3.png`; its sibling `.prompt.txt` records the actual image-generation instructions.
- An edited OBJ does not automatically round-trip into this generator. An importer would be a separate implementation task.

## 4. Establish a recovery point before implementation

For a documentation-only or review-only task, do not rebuild, generate art, or change gameplay files. For implementation, inspect the current files and save a uniquely named baseline before modifying them.

Run commands from the project root. Use Windows PowerShell 5.1 for the legacy SDK build. Do not repurpose `$HOME` or `$CODEX_HOME` as task variables.

```powershell
Set-Location 'C:\Users\mluke\antigravity-workspace\cnc-pasadena'
$duallyBaseline = Join-Path (Get-Location) ('build\baselines\candidate-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
if (Test-Path -LiteralPath $duallyBaseline) { throw 'Do not overwrite a baseline.' }
New-Item -ItemType Directory -Path $duallyBaseline | Out-Null
Copy-Item -LiteralPath 'build\art-v3' -Destination (Join-Path $duallyBaseline 'PreviewBuild') -Recurse
Copy-Item -LiteralPath 'src\Art\PV' -Destination (Join-Path $duallyBaseline 'Art') -Recurse
Copy-Item -LiteralPath 'src\mod.xml' -Destination $duallyBaseline
Copy-Item -LiteralPath 'tools\build_mod.ps1','tools\dually_behavior.ps1','tools\dually_geometry.js','tools\generate_pasadena_dually.js','tools\dually_surface_pipeline.js','tools\test_dually_geometry.js','tools\test_dually_material.ps1','tools\test_dually_behavior.ps1','tools\test_dually_compiled.js' -Destination $duallyBaseline
Get-FileHash -LiteralPath 'build\art-v3\MDShowdown.big' -Algorithm SHA256
```

Save any additional source you intend to edit. Record the directory and hash in the task card. Do not delete older baselines to save time. A baseline is a recovery copy, not necessarily a separately launchable installation; inspect its SKU/archive paths before using it directly.

Before rebuilding or replacing a package, check for a running game:

```powershell
if (@(Get-Process -Name CNC3,cnc3game.dat -ErrorAction SilentlyContinue).Count) {
    throw 'Exit C&C 3 before replacing its preview package.'
}
```

Do not kill the user's game. If it is running, source work may continue where safe, but coordinate the package replacement. The build script itself is not a substitute for this process check.

## 5. Make a model look good in the game, not just in a concept image

Work in this order and keep a checkpoint at each stage.

### A. Visual identity and silhouette

Write a brief from the unit description: role, chassis type, signature equipment, dominant materials, faction accents, and scale relative to neighboring units. Separate visible features from unimplemented abilities.

For Rolling Coal, the useful identifying features are a lifted pickup cab, open bed, rear dual tires, tall exhaust stacks, and a twin-gun mount. Those features must read at normal RTS zoom before adding small bolts.

Use a concept image for reference, not as evidence that the in-game mesh looks good. If source art already exists and the user has accepted it, preserve that direction.

### B. Functional geometry

Use the established code-generated primitives for hard-surface vehicles: beveled boxes, shaped plates, beams, cylinders, and lathed profiles. Build large masses first, then readable secondary details.

- Sloped windshields, tapered cabs, fender arches, open beds, and restrained bevels contribute more than random extra triangles.
- Model details that affect silhouette or motion: tire shape, brush guard, stacks, gun barrels, gun cradle.
- Put shallow ribs, small grooves, and material wear in surface maps where appropriate.
- Avoid coplanar surfaces that flicker, paper-thin parts that vanish from one side, buried vents, and needless hidden caps.
- Preserve intentionally hard panel edges. Smooth curved tires, pipes, and barrels selectively.
- Inspect front, rear, side, and normal gameplay views. Close-up beauty is insufficient.

The current test requires more than 5,000 and fewer than 12,000 triangles for this exemplar. That lower bound is a regression check for this specific asset, not a minimum quality requirement for another unit. Reassess budgets for new units and army-sized scenes.

### C. Geometry groups are functional interfaces

The generator routes groups into moving parts:

- `tire-...` groups -> one of four wheel assemblies.
- `turret-...` and `ammo-box...` groups -> yawing turret.
- `gun-...` groups -> pitching gun assembly.
- Other groups -> fixed body.

A renamed group can move a part onto the wrong bone without producing a compiler error. Every tire group must also match one of the four wheel-binding prefixes. The tests check that no triangles disappear or are duplicated when parts are split.

### D. Local coordinates and skeleton

This model uses +X forward and +Z up. Wheels spin around their local Y axis. The following translations are author-space values **before** multiplying by 0.88:

| Index | Bone | Parent | Local translation | Role |
| --- | --- | --- | --- | --- |
| 0 | `ROOTTRANSFORM` | −1 | 0, 0, 0 | Body/root |
| 1 | `Tire01` | 0 | 24, 12, 8.2 | Front left |
| 2 | `Tire02` | 0 | 24, −12, 8.2 | Front right |
| 3 | `Tire03` | 0 | −22, 12, 8.2 | Rear-left dual assembly |
| 4 | `Tire04` | 0 | −22, −12, 8.2 | Rear-right dual assembly |
| 5 | `Turret` | 0 | −16, 0, 29 | Yaw |
| 6 | `B_ Gun` | 5 | 3, 0, 2 | Gun pitch; preserve the space in this name |
| 7 | `FXWEAPON01` | 6 | 21.5, 2.2, 0 | First muzzle |
| 8 | `FXWEAPON02` | 6 | 21.5, −2.2, 0 | Second muzzle |
| 9 | `mortortube` | 6 | 10, 0, 4 | Stock upgrade attachment; preserve spelling |
| 10 | `B_SPOTLIGHT` | 0 | 29, 0, 19 | Stock spotlight attachment |

At rest, the muzzle world positions before scaling are `(8.5, ±2.2, 31)`. After scaling they are `(7.48, ±1.936, 27.28)`.

Each rigid part's vertices are stored relative to its binding pivot. Scale the mesh, the part offset used to make those local coordinates, and the skeleton translations together. Scaling only the body can leave floating wheels or misplaced muzzle effects.

Preserve bone names, hierarchy parents, and W3D subobject indices together. Two rear tires share each rear wheel assembly. Do not treat six visible tires as six independent stock wheel bones.

Do not attach stock animation clips merely because their names seem appropriate. A clip can overwrite a custom skeleton's translations. This exemplar currently uses TruckDraw and turret AI, with no active Animation nodes in its TruckDraw states.

### E. UVs and diffuse art

The current atlas is 1024 x 1024 with sixteen equal cells. Keep this ordering unless you intentionally update every mapping and test:

| Row | Column 1 | Column 2 | Column 3 | Column 4 |
| --- | --- | --- | --- | --- |
| 1 | Red paint | Ivory paint | Rubber | Steel |
| 2 | Glass | Rust | Amber lens | Gunmetal |
| 3 | Hood | Door insert | Roof | Tailgate |
| 4 | Bed | Armor/team trim | Tread | Headlamp |

Dedicated panel UVs must continue across all the triangles forming that panel. Repeating one tiny swatch per polygon produces disjointed grain and borders. Keep UVs inset within cells; verify cell edges under mipmapping and normal gameplay zoom.

**Critical convention:** internal UVs use image-top-origin V. Export W3X V as `1 - internalV`. The SDK then converts the compiled V again. OBJ uses bottom-origin V too. Do not flip the source image as an additional guess. The compiled tests confirm the current convention.

If raster art must change, use the available image-generation/editing workflow and load its required skill. Do not assume a lower-tier agent has that tool; if unavailable, reuse existing art or request the missing asset/capability instead of pretending to generate it.

Prompt constraints for an atlas edit:

```text
Edit the existing texture atlas, not a vehicle illustration.
Preserve its exact 4x4 layout, cell order, panel identity, and muted palette.
Use flat, neutrally lit diffuse color: no directional highlights or cast shadows.
Keep localized dirt in recesses/lower panels, rubbed edges, and broad readable wear.
No text, logos, watermarks, extra margins, white panel frames, or shifted tiles.
Change only [specified surfaces]; preserve [accepted surfaces].
```

Save the selected image under a new versioned filename and retain the complete prompt/provenance. Inspect the actual output: a prompt is not proof that the grid or padding is correct. The built-in PNG reader requires non-interlaced 8-bit RGB/RGBA. Its conversion center-crops to square and uses nearest-neighbor sampling, so start with a suitable square source rather than relying on it to repair layout.

### F. Materials: copy the contract, not unrelated shader constants

All seven current meshes use `ObjectsGDI.fx` with these exact bindings:

| Shader slot | Asset | Meaning / compiled format |
| --- | --- | --- |
| `DiffuseTexture` | `PVDuallyAtlas` | Painted color; DXT1 |
| `NormalMap` | `PVDuallyNormal` | Tangent-space surface direction; A8R8G8B8 |
| `SpecMap` | `PVDuallySpec` | R highlights, G environment reflection, B house-color glow; DXT5 |
| `RecolorTexture` | `PVDuallyHouse` | Grayscale luminance plus team-color alpha mask; DXT5 |

The source TGAs are uncompressed 32-bit, top-origin, with BGRA byte order. Logical RGB channel names are not byte offsets in a TGA.

This is a legacy shader contract, **not** a modern metallic/roughness workflow. Do not pack roughness into a channel because a different engine does that. Do not derive height from the generated diffuse image: dirt, paint color, and highlights are not reliable surface relief.

Technical maps are authored by `heightAt`, `responseAt`, and `writeMaterialMaps` in `tools/dually_surface_pipeline.js`. Normal-mapped meshes also require valid normals, tangents, and binormals; a blue texture alone does not provide a correct tangent frame.

Retain the current calibrated limits unless evidence supports a specific change:

- Paint specular ceilings: red 14, ivory 10, hood 12, door 10, roof 10, tailgate 14, armor 16. Paint environment reflection: zero.
- Steel: 95/15; glass: 80/35; gunmetal: 50/3; bed: 35/2, expressed as highlight/reflection bytes.
- Rubber/tread: 2/0; rust: 5/0. Do not brighten them globally to fix paint.
- Team color belongs only in designated trim; the alpha mask must not recolor tires or the entire body.

Local shader inspection found a 3x specular gain and exponent 50 in relevant installed shader variants. Thus even a modest specular mask can wash out paint. These values explain this project, not every C&C shader or render configuration.

### G. Simulation footprint and model states

The model's W3X collision box is not a substitute for the GameObject simulation geometry. Our visible truck was about 69 x 30 while the inherited simulation footprint was 28 x 14.

The current correction is a BOX with `MajorRadius=35`, `MinorRadius=16`, `Height=33`, `IsSmall=false`. Major/minor radii here are half-extents. Keep the root-centered fit and small padding; do not enlarge global formation spacing as a substitute.

In `tools/dually_behavior.ps1`, all five truck model states point to `PVDUALLY_SKIN`: default, damaged, really damaged, dying, and formation preview. Reusing the same model prevents a stock vehicle appearing in those states; it does **not** create genuine damage art or a destroyed wreck.

Validate factory exits, tight routes, settled formations, and targeting after changing geometry. Enlarging the shape also enlarges physical/contact geometry; it is not a purely cosmetic adjustment.

## 6. Test from cheap to expensive

Run these from the project root. The source-generation tests write generated art; do not use them during a promised read-only review.

### Source and material checks

```powershell
node tools/test_dually_geometry.js
& 'C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe' -NoProfile -ExecutionPolicy Bypass -File tools/test_dually_material.ps1
& 'C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe' -NoProfile -ExecutionPolicy Bypass -File tools/test_dually_behavior.ps1
```

These check geometry, budget, UV islands, normal/tangent frames, rigid offsets, muzzle rings, material response, bone references, and permitted object changes. The geometry test also samples spinning/steering wheel poses and nested turret/gun poses. Those mathematical transforms do not reproduce the game's animation or physics implementation.

To inspect the actual mesh in approximate lighting:

```powershell
node tools/generate_pasadena_dually.js --preview
```

Inspect `src/Art/PV/Preview/dually-v3-front.png`, `dually-v3-rear.png`, `dually-v3-side.png`, and `dually-v3-sun-check.png`. These are software renders of the real mesh, not AI concept images. They still are not the game's renderer.

### Preview build

After confirming the game is closed:

```powershell
& 'C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe' -NoProfile -ExecutionPolicy Bypass -File tools/build_mod.ps1 -OutputDirectory build/art-v3
```

The build generates/tests art, stages the playable object, validates it, compiles main and LowLOD streams, checks compiled assets, and packages the mod. It rebuilds shared SDK staging/cache directories even when an alternate output directory is used; do not run concurrent builds in this workspace.

Do **not** substitute `build.bat` for an experimental preview build: that wrapper builds the regular output and passes `-Install`, also copying it into the Windows Documents mod folder.

Recent builds reported 866 missing raw stock-art notices per stream because the installed game supplies those assets. Treat this as a baseline observation, not a magic safe count. Read unexpected errors; do not suppress all compiler errors. Check `build/art-v3/compile.log` and `compile-low-lod.log` when needed.

`tools/test_dually_compiled.js` verifies DDS sample colors and all 26,264 compiled vertex positions, normals, tangent frames, UVs, and packed-white vertex colors across the seven meshes. Compiled UV checks are especially important because the SDK transforms source data.

`tools/test_dually_footprint_package.js` is a **version-specific** acceptance test for the footprint-only pass. It pins the prior archive hash and four binary offsets, permitting only those geometry changes while the other 59 assets stay identical. Run it for that pass:

```powershell
node tools/test_dually_footprint_package.js
```

Do not use it as a universal future-art test. A new model, texture, or behavior change should make that old comparison fail. Preserve the historical test and create an appropriately scoped new comparison; do not blindly bless changed hashes or offsets.

### Launcher check and user test

```powershell
& 'C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe' -NoProfile -ExecutionPolicy Bypass -File tools/launch_mod.ps1 -ArtPreview -CheckOnly
Get-FileHash -LiteralPath 'build\art-v3\MDShowdown.big' -Algorithm SHA256
```

CheckOnly validates launch-path preconditions; it does not run the game. Ask the user to fully exit C&C 3, run `launch_art_preview.bat`, and start a fresh skirmish, especially after simulation changes. No normal enable/disable step is needed.

Use the smallest relevant live test:

- Surface pass: same map/light, same camera zoom and orientation, compare beside a stock unit.
- Rig pass: side-on driving, turning, idle scanning, and aiming at ground/air targets.
- Footprint pass: 6–8 factory exits, open-ground group movement, stopping, formation turns, and a pass near buildings.
- Weapon pass, only if separately authorized: fire from both sides and elevations; inspect launch points, FX, sound, timing, damage, target filters, and upgrades.
- Production-readiness pass: low graphics settings, damaged/dying states, many units, and performance.

Record the exact build hash and what was visible. A still does not establish wheel motion; a single-truck drive does not establish collision spacing; an idle turret sweep does not establish combat tracking.

## 7. Troubleshooting without expensive trial and error

| Symptom | First discriminating check | Avoid |
| --- | --- | --- |
| Game silently exits before menu | Runtime name length, selected SKU/archive, old injection guard | Remodeling a unit to fix a launch problem |
| New source has no in-game effect | `src/mod.xml`, generated override, launcher-selected path/hash | Editing unused legacy XML or a different Documents copy |
| Entire model is black | Exact shader/material slots and constants; compiled texture presence | Global emissive/lighting hacks |
| Tires orange or body samples wrong material | Atlas row order and compiled V against W3X V | Flipping both image and UVs by guesswork |
| Pale roof/hood in sun | Specular red mask, runtime shader response, aligned-sun preview | Darkening every texture or disabling metal highlights |
| One dark triangle on a smooth panel | Face group, shared normals, winding, regression coverage | More texture noise or smoothing only faces above a slope threshold |
| Wheels/weapon detach | Part-local coordinates, pivot parent, binding index, scale | Moving only a visible mesh while leaving its bones behind |
| Muzzle FX seem misplaced | Real barrel-tip coordinates, FX bone, weapon slot and effect behavior | Assuming a correctly named bone guarantees runtime alignment |
| Trucks visually overlap | GameObject geometry versus render bounds | Changing every unit's formation spacing |
| Turret snaps abruptly | Actual `TurretSettings` plus time-stamped video | Assuming a broken skeleton or changing weapon balance accidentally |
| Looks detailed close up but poor in-game | Normal gameplay scale, silhouette, surface contrast and texel placement | Raising resolution/polygon count indiscriminately |

Historical shader trap: the first Simple.fx setup depended on a texture-multiplying emissive value. The subsequent BasicW3D lit setup used a different material contract. Neither set of constants should be pasted into today's ObjectsGDI material. Read the relevant historical section only if diagnosing that specific baseline.

If the launcher reports an older injected mod, do not ignore or remove the guard. Inspect the condition and follow the existing targeted recovery workflow with the user's approval. Normal development must not mutate the installed game to "make the mod load."

For genuinely unresolved rendering problems, the existing read-only-game diagnostics are `tools/inspect_stock_vehicle.js` and `tools/inspect_shader.ps1`; they write local diagnostic outputs under `build/render-diagnostics`. Read the existing `INVESTIGATION.md` before repeating extraction/disassembly. Do not distribute the extracted stock assets.

## 8. Adapting this to a second unit

This implementation is deliberately specific to Rolling Coal. It is not a generic "description to finished game model" tool.

For another rigid vehicle, when the user authorizes one:

1. Choose a stock gameplay template with compatible movement and targeting behavior. Establish exactly which slot changes.
2. Read that template's draw states, bones, weapons, animation dependencies, geometry, and production references. A tracked vehicle, aircraft, or walker needs different assumptions.
3. Make a unit-specific generator/configuration and unique asset IDs/files. Preserve the existing truck's outputs and references. Do not reuse `PVDUALLY_SKIN` for a different unit.
4. Adapt geometry, part groups, pivots, UV layout, materials, portrait, and report. Reuse the proven math and serialization patterns, not hardcoded truck dimensions.
5. Add the new art and complete object override to the active build/staging and `src/mod.xml` path. Declaring files on disk does not automatically include them.
6. Create unit-specific tests. The current tests hardcode seven meshes, the truck's bone order, some triangle groups, asset hashes, and dimensions. Copying them unchanged would either fail legitimately or test the wrong asset.
7. Prove the original truck and unrelated assets did not change. Build one candidate and get an in-game acceptance result before expanding to more units.

Infantry and deforming creatures require skin weights, a compatible animated skeleton, and a much broader animation-state set. That is outside the proven rigid-vehicle exporter. Do not promise a cheap drop-in conversion.

## 9. Completion and handoff template

Use the evidence states in the standard workflow for current work. This older checklist describes a compiled playable candidate; a scoped render request ends with inspected renders/source checks and an explicit statement that runtime testing remains.

Before saying "done," check:

- [ ] Requested change implemented in lasting source, not only generated artifacts.
- [ ] Previous working package and relevant source preserved.
- [ ] Focused regressions pass without weakened assertions.
- [ ] Main and LowLOD compilation pass; unexpected errors investigated.
- [ ] Compiled checks and launcher CheckOnly pass.
- [ ] Actual mesh/texture preview inspected where relevant.
- [ ] Changed files and deliberately unchanged systems recorded.
- [ ] Current package hash, recovery path, and remaining runtime checks documented.
- [ ] User gets a short, precise test request, not a claim of unobserved success.

Suggested final handoff:

```text
Changed: [specific visible/behavioral correction].
Unchanged: [art, combat, other units, as verified].
Validated: [source tests, compilation, compiled checks, and/or observed runtime].
Not yet validated: [specific live checks].
Run: close the game, launch_art_preview.bat, fresh skirmish.
Check: [one small test scenario].
Backup: [directory]. Package SHA256: [hash].
```

The efficient path is a reusable contract, a small change, a discriminating test, and a recorded result—not another broad round of guesses.
