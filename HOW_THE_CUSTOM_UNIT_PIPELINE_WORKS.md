# How we built and debugged the custom C&C 3 unit

A technical learning guide for the project owner. Written against the project as it exists on 2026-08-30.

This explains the work behind the Lifted F-250 "Rolling Coal": how an idea became a real in-game model, why several early versions looked wrong, how we found the causes, and which parts remain unfinished. It is not a claim that the exemplar already matches every aspect of the original game's production quality.

For instructions to hand to another AI agent, use [MODEL_CREATION_AGENT_PLAYBOOK.md](MODEL_CREATION_AGENT_PLAYBOOK.md). File paths in this guide are relative to the project root unless explicitly absolute. The current root on your machine is `C:\Users\mluke\antigravity-workspace\cnc-pasadena`.

## Contents

1. [The big idea: a unit is several systems](#1-the-big-idea-a-unit-is-several-systems)
2. [Making the mod launch reliably](#2-making-the-mod-launch-reliably)
3. [Turning a description into real geometry](#3-turning-a-description-into-real-geometry)
4. [How textures find their place on a model](#4-how-textures-find-their-place-on-a-model)
5. [How the four-map material works](#5-how-the-four-map-material-works)
6. [Why the black model, glare, and dark triangle happened](#6-why-the-black-model-glare-and-dark-triangle-happened)
7. [Making wheels and guns move correctly](#7-making-wheels-and-guns-move-correctly)
8. [Why a visible truck can still have a tiny footprint](#8-why-a-visible-truck-can-still-have-a-tiny-footprint)
9. [What building the mod actually does](#9-what-building-the-mod-actually-does)
10. [Testing and evidence](#10-testing-and-evidence)
11. [What AI did, and why some work was expensive](#11-what-ai-did-and-why-some-work-was-expensive)
12. [What is finished and what comes next](#12-what-is-finished-and-what-comes-next)
13. [How to explore the project yourself](#13-how-to-explore-the-project-yourself)
14. [Glossary](#14-glossary)

## 1. The big idea: a unit is several systems

The most important thing to understand is that a game unit is not one model file. It is a collection of linked systems:

| System | What it answers | Example in our truck |
| --- | --- | --- |
| Gameplay object | What can this unit do? | Cost, health, movement, target selection, weapons, upgrades |
| Mesh | What is its physical-looking shape? | Cab, hood, tires, bed, gun mount |
| Materials | How does its surface respond to light? | Red paint, rubber, steel, glass |
| UV coordinates | Where does each surface read its texture? | Hood triangles sample the hood region of the atlas |
| Skeleton and attachments | What moves, and around which point? | Wheel axles, turret yaw, gun elevation, muzzle locations |
| Simulation geometry | How much space does the game think it occupies? | Collision/spacing shape separate from visible mesh |
| UI assets | How is it represented in menus? | Production button and selected-unit portrait |
| Packaging and launcher | Which version actually gets loaded? | Compiled BIG archive selected by a SKU definition |

This separation explains much of our debugging. A truck can be buildable but black. It can look correct but fire from the wrong place. It can move properly while overlapping another truck. It can be perfect on disk while the launcher loads an older copy.

Our approach was to preserve a functioning gameplay object and replace its presentation incrementally. The underlying object is still `GDIPitbull`. Its displayed name and description identify Rolling Coal, and its model references point to our custom art.

This avoided rebuilding production buttons, AI behavior, upgrades, movement, and faction dependencies at the same time as learning the art pipeline. It also means that changing the appearance to twin machine guns did not automatically replace the Pitbull's missile weapon. Descriptions, appearances, and actual weapon logic are independent.

## 2. Making the mod launch reliably

### The original project contained more design than working infrastructure

The older experimental files under `src/Data` described separate custom factions and units, but their references were not all backed by valid art, UI, audio, or other assets. A convincing unit XML file is not enough if its dependencies cannot resolve.

The working build instead starts from complete stock SDK objects and applies controlled overrides. `src/mod.xml` is the inclusion list that selects those staged objects and the custom art.

That distinction is why "edit the file with the truck's name" is not a reliable instruction. The legacy file may not be included at all. The current playable override is created by `tools/build_mod.ps1`, with the truck-specific changes in `tools/dually_behavior.ps1`.

### Separate a normal mod from changes injected into the base game

Earlier workflows had placed mod data into the game's own loading setup. An old injected archive or SKU reference can conflict with a new mod package.

The current launcher detects the known old-injection conditions and stops with an explicit error instead of silently mixing two builds. That explains the message asking you to run `disable_mod.bat` during recovery. It was a cleanup step for an old installation state, not something you should do before every art test.

The normal route now is an external mod configuration:

```text
CNC3.exe -modConfig "...\build\art-v3\MDShowdown_1.0.skudef"
```

That configuration identifies the mod archive without needing to inject the candidate into the base game. Routine development does not require `enable_mod` or repeated base-game edits.

### A short name fixed a surprisingly small but serious compatibility problem

The SDK's `ModSDK/Documentation/Common_Issues.htm` says that mod names longer than 15 characters can crash the game during startup. Our runtime identifier is therefore `MDShowdown`, independent of the longer title shown to people.

`tools/mod_runtime.ps1` enforces a short alphanumeric name and derives the archive/config names from it. This prevents an innocuous-looking rename from reintroducing a silent startup crash.

### There are two useful launch targets

- `launch_art_preview.bat` selects the candidate under `build/art-v3`.
- `launch_game.bat` selects the regular playable build, currently an older fallback.

The launcher prefers the package paired with this checkout when available. That avoids accidentally using an old installed copy in another Windows Documents or redirected OneDrive location. Its `-CheckOnly` option verifies path and configuration preconditions without starting the game.

There was also a legacy build-tool environment issue: the old .NET compiler could fail when its environment contained both `PATH` and `Path`. The wrapper/child-process setup normalizes the environment. This is unrelated to the truck mesh; it belongs to tool compatibility.

## 3. Turning a description into real geometry

### What image generation did—and did not do

Image generation helped create a concept reference, a production portrait, and painted texture sheets. It did not produce the final animated 3D vehicle or automatically export a game-ready model.

The actual mesh is built by JavaScript code. `tools/dually_geometry.js` describes its components, and `tools/generate_pasadena_dually.js` turns those descriptions into geometry and game assets.

This route was useful because the SDK's original art-export workflow was tied to obsolete 3ds Max versions. Rather than depending on that toolchain, we wrote the XML-based W3X asset representation directly and used the SDK compiler to turn it into runtime data.

### A mesh is points connected into triangles

A vertex is a point in three-dimensional space, such as `(x, y, z)`. A triangle references three vertices. Thousands of these triangles form the visible surface.

For this model:

- X runs forward/backward; positive X is the truck's front.
- Y runs left/right.
- Z runs up/down.

The first model used simple box-like masses. That proved the loading and rendering path, but a working blockout is not an attractive vehicle. Later iterations replaced crude shapes with a tapered cab, sloped glass, integrated hood contours, fender arches, rounded tires, open rims, structural rails, and a more credible gun mount.

### Procedural does not have to mean random

"Procedural geometry" here means reproducible construction from code, not an algorithm randomly inventing a vehicle. The dimensions, profiles, and placements are deliberately authored.

Some of the construction tools are:

- **Beveled boxes:** boxes with small angled edge surfaces, giving light an edge to catch.
- **Plates:** polygon outlines given thickness, useful for panels and guards.
- **Beams and cylinders:** rails, barrels, axles, braces, and exhaust pipes.
- **Lathed profiles:** a cross-section swept around an axis, useful for tires and hollow circular openings.

The generator can rebuild the same asset after a small source change. That is valuable for AI collaboration: it creates a reproducible source trail rather than a collection of unexplained exported binaries.

### Detail belongs in different places depending on its purpose

A fender's outline needs geometry because it changes the silhouette. A shallow bed-floor rib may be represented by a normal map because its main purpose is to change lighting. A patch of soot belongs in the color texture because it does not necessarily change shape.

The practical priority is:

1. Recognizable silhouette.
2. Credible proportions and large forms.
3. Consistent surface shading and material separation.
4. Readable secondary details.
5. Small decorative details only where they remain visible in play.

Adding thousands of triangles before fixing the first three items would not have made the original blockout look like a stock-quality asset.

The current truck has 11,952 triangles and 26,264 exported vertices. More vertices than you might expect are needed because two triangles meeting at the same position may need different normals or UV coordinates. A shared spatial point is not always a shared complete render vertex.

These counts fit the project's current budget. They are not proof of good army-scale performance, and the budget is not a universal C&C 3 engine limit.

### We exported an inspection copy too

The generator also writes OBJ/MTL files. These let us inspect the geometry in other 3D tools, while W3X remains the game-facing export.

There is an important limit: editing the OBJ does not automatically update the procedural source or W3X. A reliable import/round-trip workflow would need to be implemented separately. Today, the lasting model edits belong in the geometry/generator code.

## 4. How textures find their place on a model

### An atlas is a sheet of several surface regions

The truck uses a 1024-square texture atlas divided into a 4-by-4 grid. Some cells are general materials, such as rubber or glass. Others are dedicated panels, such as the hood, roof, and door insert.

Instead of giving every part a separate image, the model's UV coordinates say where to look on that shared sheet. U and V are two-dimensional coordinates on the texture, usually described from 0 to 1.

A hood vertex has a 3D position and a UV coordinate. Across each triangle, the renderer interpolates those UV coordinates, which determines the color sampled at every visible pixel.

### A good texture can still look wrong with poor UVs

If every polygon samples a tiny unrelated part of a generic swatch, grain and scratches break at triangle boundaries. If a painted panel border is repeated or placed poorly, it can look like a stack of separate plates rather than one piece of metal.

We introduced continuous panel projections so the hood, roof, and other major surfaces read as coherent sheets. Wear was placed deliberately: more grime near lower doors and recesses, rubbed areas on exposed metal, and appropriate sampling for tire sidewalls and rims.

We also inset UVs within atlas cells. At small sizes, texture filtering and mipmaps blend neighboring pixels; sampling too near the boundary can pull the wrong material into an edge. Insets help, but actual distant views still need checking.

### The texture-flip bug was an exporter/compiler disagreement

One screenshot showed obviously wrong surface colors, including tires sampling an amber-looking region. The cause was not simply "bad art." Different stages disagreed about which end of the texture counts as the start of V.

The verified convention is:

```text
Internal V: measured from the image top
W3X V:      1 - internal V
Compiled V: 1 - W3X V = internal V
```

BinaryAssetBuilder performs the second flip. The texture's decoded row order did not need another flip.

For example, if an intended sample has internal `V = 0.10`, the exporter writes `0.90`. The compiler turns that back into `0.10`. Writing `0.10` directly into W3X would instead produce a compiled `0.90`, selecting a different atlas row.

We verified this in compiled vertex data rather than only looking at our own source. That distinction matters: the source can be internally consistent while the compiler transforms it into something different.

## 5. How the four-map material works

The mesh tells the renderer where the surfaces are. The shader tells it how to shade them. The current material uses the stock `ObjectsGDI.fx` shader and four texture inputs.

| Input | Our asset | What it contributes |
| --- | --- | --- |
| `DiffuseTexture` | `PVDuallyAtlas` | Base painted color and visible wear |
| `NormalMap` | `PVDuallyNormal` | Small apparent changes in surface direction |
| `SpecMap` | `PVDuallySpec` | Separate masks for highlights, reflections, and team-color glow |
| `RecolorTexture` | `PVDuallyHouse` | Luminance plus a mask defining where player color applies |

### Diffuse color is the paint, not the lighting

The source atlas is generated as flat, neutrally lit artwork. We ask it not to paint strong sunlight, specular glints, or cast shadows into the texture. Otherwise the painted lighting would remain fixed while the real game light changes, producing contradictory cues.

Weathering still belongs there: faded paint, grime, soot, scuffs, and dirt can help surfaces read as materials rather than flat colored polygons. The trick is to place these deliberately rather than covering everything with tiny uniform noise.

The chosen source is `src/Art/PV/Textures/dually-panels-v3-3.png`. The full prompt is preserved next to it. Recording the prompt and selected file is essential: "AI generated this texture" is not enough information to reproduce or safely edit it later.

### Normal maps change lighting without adding triangles

A normal is a direction perpendicular to a surface. The renderer uses it to determine how that surface faces the light.

A normal map stores local variations in that direction. It can make a flat panel appear grooved or ribbed when lit, without adding matching physical geometry. It does not change the silhouette, wheel collisions, or actual depth of a hole.

Our technical normal map comes from an independently authored height field. The code defines where a rib or seam should rise or fall, measures how that field changes horizontally and vertically, and turns those changes into a direction.

Conceptually:

```text
normal direction ≈ normalize(-horizontal height change,
                             -vertical height change,
                              1)
```

That vector is encoded into RGB values. A locally flat surface is approximately `(128, 128, 255)` in logical RGB.

We did not turn the diffuse image's brightness directly into height. A black oil stain is not necessarily a hole; white paint is not necessarily raised. Treating color as physical relief would invent incorrect geometry cues.

### Tangents tell the shader how the normal map is oriented

The normal map's "left" and "up" are texture-local directions, not global world directions. To interpret it correctly, each render vertex needs a local coordinate frame:

- The vertex normal points outward.
- The tangent follows one texture direction.
- The binormal/bitangent provides the other direction.

The generator derives those directions from both triangle edges and UV changes. It normalizes them and makes the tangent perpendicular to the normal. Tests check that the frame is valid.

This is why adding a normal-map texture without correct tangents can create strange lighting. The texture and the vertex frame must agree about orientation.

### The specular map is not a roughness map

C&C 3's material contract differs from the metallic/roughness workflow common in newer tools. In our shader setup:

- Red controls specular highlight intensity.
- Green controls environment reflection.
- Blue controls house-color glow.

Rubber has almost no highlight or reflection. Steel retains more of both. Glass retains restrained reflection. Paint has low highlights and no environment reflection.

These are independent controls. Removing environment reflection does not remove the bright sun highlight. That distinction was central to the glare investigation.

### Team color is a controlled overlay

The recolor map uses grayscale luminance and alpha to identify the trim that should take the player's color. Most of the truck is masked out. This lets the truck retain its red/ivory identity while showing ownership in a narrow colored stripe.

The normal map, highlight/reflection masks, and team mask are deterministically produced by code, not left to an image generator to guess exact technical channel values.

### Source image format and compiled format are different

The generator writes 32-bit, top-origin TGA files. Pixel bytes are stored BGRA, although we discuss their meanings in logical RGB order. Confusing those two descriptions is an easy way to inspect the wrong channel.

The SDK then compiles textures according to their declarations. Our diffuse atlas uses DXT1; the specular and recolor maps use DXT5; the normal map uses A8R8G8B8. The separate 128-square UI portrait is uncompressed A8R8G8B8 with mipmap generation disabled.

Compression and resampling can change pixel values. Accordingly, the compiled texture test uses a tolerance rather than requiring every compressed color to equal the source byte exactly.

## 6. Why the black model, glare, and dark triangle happened

These failures were useful because each exposed a different layer of the rendering system.

### The black model: material settings belonged to a specific shader

The early material setup used `Simple.fx`. In that setup, a texture-multiplying emissive value needed to be white for the texture to appear; using the wrong value could make the surface black.

The next lit-material stage used `BasicW3D.fx`, with a different arrangement of ambient, diffuse, emissive, and specular values. The current four-map vehicle material uses `ObjectsGDI.fx` instead.

The lesson is not "always turn emissive up." It is that shader parameters have shader-specific meanings. Copying values from another material can be wrong even when the names sound familiar. An emissive hack might reveal a texture while making it ignore scene lighting, which would not solve the actual quality problem.

The historical material contracts are recorded in `src/Art/PV/README.md`, and the `black-material` baseline preserves an earlier state.

### Excessive sun glare: the real shader was stronger than our preview

The truck's hood and roof became pale under sunlight even after reducing reflection. We needed to determine whether the cause was the diffuse texture, the normal map, a mesh normal, or the runtime shader response.

We inspected the installed stock Pitbull material and shader locally, without changing the game files. The material bindings matched the four-map setup. Shader disassembly revealed relevant lit variants with a specular exponent of 50 and a 3x gain on the specular red channel before later lighting modulation.

The old preview had understated that response. As a result, something that looked restrained in the preview could still wash out in the game.

The useful simplified comparison was:

```text
Old paint mask 55 -> peak white contribution about 3 × 55 / 255
New hood mask 12 -> peak white contribution about 3 × 12 / 255
```

Those values describe an intermediate highlight contribution, not a guarantee of final screen brightness. Sun direction, light strength, cloud modulation, and other shader operations still matter.

The correction lowered paint-specific highlight masks while keeping glass and exposed steel distinct. It did not darken the entire atlas, remove all highlights, or change the game's global sunlight.

We also corrected the software preview's constants and added an aligned-sun stress view. A good diagnostic preview should reproduce the bug in the old version and improve it in the corrected version under the same conditions.

Full evidence is preserved in `build/render-diagnostics/INVESTIGATION.md`.

### The dark hood triangle: our first test shared our first mistake

The hood contains a stamped contour made from multiple triangles. To smooth its top surface, an earlier rule included faces whose normal's Z component was greater than 0.88.

One legitimate top triangle had Z approximately 0.87793—just below the cutoff. It stayed flat shaded while its neighbors were smoothed. That made a triangle-shaped lighting discontinuity on what should read as one continuous sheet.

Worse, the original test used essentially the same cutoff, so it also excluded the faulty triangle. The test passed because it repeated the implementation's assumption.

The fix was to label all 50 intended top triangles explicitly as `hood-top`, then smooth within that group while retaining hard side walls. Corner-angle weighting reduces unwanted influence from uneven triangulation.

Conceptually, each shared normal is formed from neighboring face normals weighted by the corner angles:

```text
shared normal = normalize(sum(face normal × corner angle))
```

The new regression checks include every shared top vertex and the specific previously missed corner. No texture repaint or shape change was needed for that defect.

This is a general engineering lesson: a test should challenge the assumption most likely to be wrong, not just reproduce the same selection rule in a second file.

## 7. Making wheels and guns move correctly

### A bone is a coordinate system, not necessarily an organic skeleton

Vehicles use bones/pivots too. A wheel needs an axle coordinate system. A turret needs a yaw pivot. A gun needs an elevation pivot. A muzzle effect needs a point and direction at the barrel opening.

Our W3X contains a hierarchy and seven rigid mesh subobjects:

```text
ROOTTRANSFORM
├── BODY (fixed mesh)
├── Tire01 -> front-left wheel mesh
├── Tire02 -> front-right wheel mesh
├── Tire03 -> rear-left dual-wheel mesh
├── Tire04 -> rear-right dual-wheel mesh
├── Turret -> turret mesh
│   └── B_ Gun -> gun mesh
│       ├── FXWEAPON01
│       ├── FXWEAPON02
│       └── mortortube
└── B_SPOTLIGHT
```

BODY is a mesh bound to the root, not an extra bone. The two rear tires on each side belong to one rear wheel assembly, giving six visible tires but four driven wheel meshes.

### Parent-child transforms explain why attached parts stay together

Each part is stored relative to its own pivot. Its world position is obtained by applying its local transform and its parents' transforms.

In general:

```text
world point = parent transform × local transform × local point
```

At our identity-rotation rest pose, pivot translations can simply be added. Once the turret rotates or gun elevates, proper rotation-and-translation composition is required.

For example, the unscaled turret pivot is `(-16, 0, 29)`. The gun pivot is `(3, 0, 2)` relative to it. A muzzle is `(21.5, 2.2, 0)` relative to the gun. Adding the rest translations gives `(8.5, 2.2, 31)`, exactly where that modeled barrel opening belongs.

Because the muzzle is a child of the gun, it should move with elevation; because the gun is a child of the turret, both should turn with yaw.

This is also why scaling matters. We reduced the art to 0.88 of its authored dimensions. Vertices, part offsets, and bone translations had to scale together. Shrinking only the mesh would leave correctly named attachment points in the wrong places.

### C&C drives the pivots through named interfaces

The stock `TruckDraw` refers to `Tire01` through `Tire04`. Turret settings reference `Turret` and `B_ Gun`. Weapon draw settings reference muzzle/upgrade bones. These names connect gameplay-side instructions to the model hierarchy.

A missing or misplaced bone can compile yet behave incorrectly. A rigid part accidentally assigned to the body can look right when parked but fail to turn with its wheel or weapon.

We therefore check the exported hierarchy, the subobject binding indices, and the actual staged object's references together. The geometry tests reconstruct every part in world space and sample wheel and gun transforms against real vertices and muzzle rings.

Those are structural/math checks. They cannot establish actual wheel rotation rate, steering response, recoil, or particle timing inside the engine.

### What the video showed

The nine-second phone recording supplied on 2026-08-30 was decoded locally and inspected through sampled frames. The truck remained visually assembled through its move and turn; the turret changed direction independently during idle scanning.

The turret's idle sweep looked abrupt. The staged object still uses the stock `TurretTurnRate="2000"`, making that setting a sensible target for a future controlled investigation. We have not yet tuned it, and changing aiming rate can affect combat responsiveness—not just appearance.

The recording did not show combat, a factory exit, or multiple trucks together. Screen-recording artifacts and limited wheel detail also prevent a confident judgment of exact wheel speed/direction. We should not label those unobserved behaviors "fixed."

## 8. Why a visible truck can still have a tiny footprint

The rendered mesh and the GameObject's simulation geometry are separate. Changing the visible vehicle does not automatically change how much space it occupies for gameplay systems.

The truck's visible bounds are approximately 69 long by 30 wide. The inherited Pitbull shape was only 28 by 14: its BOX had `MajorRadius=14` and `MinorRadius=7`, which are half-extents.

That was a plausible cause of trucks crowding into each other's visible bodies. The latest behavior pass changed the shape to:

```xml
<Geometry IsSmall="false">
  <Shape Type="BOX"
         MajorRadius="35.0"
         MinorRadius="16.0"
         Height="33.0"
         ContactPointGeneration="VEHICLE" />
</Geometry>
```

This produces a 70-by-32 ground footprint with height 33, covering the existing model with modest padding. The visual mesh itself did not change.

The lasting implementation is in `tools/dually_behavior.ps1`, not the generated object file. Its checks reject unexpected source structure rather than silently failing to apply the correction.

This correction can affect collisions, contact/selection geometry, route choices, and physical target size. Speed, health, armor, weapons, and build cost remained unchanged, but it would be misleading to describe a collision change as having no gameplay consequences.

We verified the compiled fields. The group-spacing result still needs a multi-truck in-game test. An accurate bounding box also does not guarantee that every movement algorithm will prevent all visual overlap during turns.

## 9. What building the mod actually does

Here is the data's path from editable source to the screen:

```text
Authored geometry + selected painted PNG + technical material functions
    ↓
Node generator: W3X, TGA, XML declarations, OBJ/MTL, report
    ↓
Build staging: custom art + complete stock-derived GameObjects
    ↓
BinaryAssetBuilder: main and LowLOD compiled streams
    ↓
Compiled-data checks
    ↓
MakeBig: MDShowdown.big
    ↓
SKU definition + launcher -modConfig
    ↓
C&C 3 loads mod data alongside installed stock dependencies
```

### Source, staging, and runtime output have different jobs

Source files describe what we want. Staging files arrange the exact input the compiler should see. Runtime files are optimized representations the game consumes.

The build recreates generated SDK art/override/cache directories. Editing only a staged XML file or a generated W3X is temporary: the next build can overwrite the edit. That is why reproducible fixes belong in the generator, material source, or override helper.

The override helper also redirects all five truck model conditions and both portrait references. Changing only the normal-state model could cause an old stock model to reappear when damaged, dying, or shown in formation preview.

### The SDK compiles more than XML text

BinaryAssetBuilder resolves asset relationships and compiles meshes, textures, objects, and supporting data into a stream. A stream includes:

- A manifest describing assets and their relationships.
- Binary instance data containing the compiled payloads.
- Import/relocation data used when resolving references and loading the stream.

The build uses precompiled stock dependencies where appropriate. That is why missing raw stock art can generate known notices even though the installed game supplies the assets. However, an arbitrary compiler error is not safe just because some expected notices exist.

The current script distinguishes expected stock-art messages from unexpected errors and refuses to package a failed build.

### LowLOD support is not the same as a low-poly model

The build compiles a LowLOD stream against the main stream. The current candidate has no separate low-detail instance payload beyond its stream header and reuses the main assets through that setup.

We have not authored dedicated reduced-polygon truck variants. Successful LowLOD compilation therefore means the stream setup is accepted, not that distant trucks are optimally cheap to render. Actual low-setting appearance and many-unit performance remain tests to perform.

### The archive and SKU work together

`MakeBig` packages the runtime streams and supporting files into `MDShowdown.big`. The small `MDShowdown_1.0.skudef` names the game version and archive. The launcher passes that configuration path to C&C 3.

The preview build command writes to `build/art-v3`. The normal `build.bat` instead builds the regular package and uses `-Install`, copying it into the Documents mod directory. Using the wrong build command could unintentionally replace the fallback you meant to preserve.

## 10. Testing and evidence

We used several layers of validation because each catches a different kind of mistake.

### Layer 1: source geometry and material checks

`tools/test_dually_geometry.js` checks finite coordinates, valid indices, non-degenerate triangles, expected winding, normalized normals, valid UV islands, tangent frames, bone contracts, and rigid-part reconstruction. It also includes the hood-triangle regression and sampled wheel/muzzle poses.

`tools/test_dually_material.ps1` checks the seven shader assignments, four texture slots, texture declarations and formats, material-channel samples, matte rubber/rust, controlled paint response, and isolated team color.

These checks are cheap compared with manually loading the game after every small change. They are still assertions about specific properties, not automatic art critics.

### Layer 2: actual staged-object checks

`tools/test_dually_behavior.ps1` checks the object the build will compile. It verifies that the footprint covers the exported bounds, model states point to the custom asset, references resolve, and unrelated values remain unchanged.

One especially useful test reverses the allowed edits and compares the resulting object to the original stock source. If the two do not match, something outside the intended change set was modified.

### Layer 3: compiled data checks

`tools/test_dually_compiled.js` reads the compiler's output rather than trusting the exporter. It checks samples from five compiled textures, including the portrait, and every compiled vertex across the seven meshes.

For the current material, the observed vertex record is 60 bytes:

| Data | Bytes |
| --- | --- |
| Position | 12 |
| Normal | 12 |
| Packed vertex color | 4 |
| Tangent | 12 |
| Binormal | 12 |
| UV | 8 |

The tests verify the SDK's V conversion and require packed-white vertex color rather than an unintended tint or alpha. This record layout is specific to the inspected material/export path; it is not a universal mesh decoder for every asset.

### Layer 4: differential package comparison

For the footprint-only pass, we compared the new archive with the saved art-3.4 baseline. Of 60 compiled assets, 59 were byte-identical. The truck's GameObject differed in just four fields: `IsSmall`, half-length, half-width, and height.

`tools/test_dually_footprint_package.js` captures that exact comparison. It pins the old archive's SHA256 and the known binary locations. This is strong evidence for a narrow change, but a deliberately version-specific test—not a general-purpose check for future art revisions.

A SHA256 hash identifies exact file contents. It helps answer "Did I test this build or another copy?" Matching a hash does not by itself prove a model is correct; it proves the file is the same one previously identified.

### Layer 5: real in-game evidence

Your screenshots showed things compilation could not: black surfaces, implausible blockout proportions, wrong material sampling, too much glare, and the remaining hood triangle. Your video added evidence about movement and independent turret motion.

For useful comparisons, keep map lighting, zoom, orientation, and nearby stock reference units consistent. Change one subsystem at a time. A phone recording can show broad behavior, but fine wheel motion and surface detail can be obscured by moiré, blur, exposure, and frame sampling.

We extracted frames locally from the supplied recording using an FFmpeg decoder. The original video was not changed or uploaded for that inspection. Diagnostic frames are under `build/video-review-20260830`; they are not part of the mod package.

### Recovery copies turn experiments into reversible work

The project keeps milestones under `build/baselines`, including the black-material stage, colored blockout, art pass 2, glossy and low-glare versions, detail and surface revisions, and the rendering-corrected art-3.4 build.

The newest package's identity is:

```text
Art 3.4 + behavior pass 1
build/art-v3/MDShowdown.big
11,854,273 bytes
SHA256 3566608E641CE5E4294039C2C72031617ED325A7071DC0295016D62F90F41DAC
```

The immediately preceding art-only 3.4 archive is preserved under `build/baselines/art-pass-3-render-fixed`, with SHA256 `F59AE02FA28B2C2DC059988B7277C8D0A27BE9A46D4782696BDBCCD3FB60691F`.

These are dated facts. Future legitimate changes will produce new hashes and should get new notes and recovery points.

## 11. What AI did, and why some work was expensive

This was a combination of art direction, programming, asset-format integration, debugging, and testing—not a single image-generation operation.

The AI-assisted work included:

- Translating the unit description into a readable vehicle design.
- Writing deterministic geometry and W3X serialization code.
- Creating and refining painted source artwork and a portrait.
- Authoring technical surface maps and UV projections.
- Connecting the custom model to stock gameplay and animation interfaces.
- Building launch guards and handling legacy tool compatibility.
- Inspecting compiled vertices, texture data, and shader instructions to test hypotheses.
- Turning discoveries into repeatable tests and maintaining recovery copies.

The local stock-asset inspection was diagnostic. It compared material contracts and decoded selected data; it did not mean copying the stock model's art into the truck or redistributing extracted game assets.

The expensive part was establishing facts that were initially unknown: how this compiler handles V, which material parameters the runtime uses, why one triangle escaped smoothing, and which files actually feed the playable build. Repeated aesthetic adjustments are also costly when their underlying cause has not yet been isolated.

Now those facts are recorded in source, tests, and the companion playbook. A lower-tier agent should not need to rediscover them. It can usually:

1. Identify the subsystem from the symptom.
2. Read the relevant small source file or function.
3. Make a narrow change.
4. Run the cheap regression checks.
5. Build once and request one focused live test.

Higher-capability reasoning is still useful for unfamiliar file formats, new skeleton types, or ambiguous defects that survive controlled tests. There is no guarantee that a cheaper model will have the same tool access or artistic judgment, but a precise contract reduces how much judgment it must invent.

## 12. What is finished and what comes next

The project has a functioning custom-vehicle pipeline and a much-improved exemplar. It is not yet a complete production-quality replacement for every stock-unit feature.

| Area | Current evidence/status |
| --- | --- |
| Custom unit appears and is buildable | Confirmed in your gameplay reports/screenshots |
| Custom color/material rendering | Strongly improved through screenshot-driven revisions |
| Export, shaders, texture slots, UV conversion | Covered by source and compiled checks |
| Wheel/turret/gun attachment structure | Covered by source/staging checks and offline transforms |
| Body stays assembled during movement | Supported by the supplied short video |
| Independent idle turret rotation | Visible in the supplied video; sweep looks abrupt |
| Correct collision fields in package | Verified by differential binary comparison |
| Multi-truck spacing and factory exits | Not established by the single-truck video |
| Accurate wheel speed, steering details, combat elevation and muzzle FX | Need clearer motion/combat tests |
| Twin machine-gun weapon and Rolling Coal ability | Not implemented; stock missiles remain |
| Dedicated damage/wreck art and reduced-poly LODs | Not authored |
| Full stock-art parity and army-scale performance | Not demonstrated |

The sensible next motion pass is a controlled turret-behavior investigation while preserving the visual baseline. The next gameplay implementation would be a separately scoped weapon/effects change. Neither is performed merely by writing this guide.

For the remaining validation, a short recording of several trucks leaving the factory, moving/stopping together, and attacking ground and air targets would answer more than another parked screenshot.

## 13. How to explore the project yourself

You do not need to read the entire generated model to understand it. Start with these files in order:

1. `src/Art/PV/PVDually_Model.report.json`: a compact inventory of counts, bounds, IDs, source artwork, and bones.
2. `tools/dually_geometry.js`: where the physical truck parts are constructed.
3. `tools/generate_pasadena_dually.js`: look for `faceUvs`, `wheelBindings`, `pivots`, and `makeMeshXml`.
4. `tools/dually_surface_pipeline.js`: look for `smoothNormals`, `heightAt`, `materialResponses`, and `tangentFrame`.
5. `tools/dually_behavior.ps1`: the small bridge between the custom art and the playable stock-derived object.
6. `tools/build_mod.ps1`: how those inputs become a package.
7. The test files: these show which properties we consider important enough to enforce.

Useful read-only commands from the project root:

```powershell
Get-Content src/Art/PV/PVDually_Model.report.json
rg -n 'hood-top|gun-muzzle|turret-trunnion' tools/dually_geometry.js
rg -n 'materialResponses|shaderResponse' tools/dually_surface_pipeline.js
Get-Content tools/dually_behavior.ps1
Get-FileHash -LiteralPath build/art-v3/MDShowdown.big -Algorithm SHA256
```

Some apparently diagnostic commands are not read-only. Running `node tools/test_dually_geometry.js` imports the generator, which rewrites generated art. Running the generator with `--preview` also regenerates assets. Back up before experimenting; do not casually run the build while the game is using that package.

Good learning exercises before changing anything:

- Find the muzzle coordinates in the hierarchy and add their parent translations. Check that the result matches the modeled muzzle location.
- Compare the report's X/Y bounds to the BOX half-extents. Work out why a radius of 14 gives a length of 28.
- Look at the four texture maps and identify which one should change for paint color, shallow grooves, sunlight glare, and team ownership.
- Read the `hood-top` regression and ask what would happen if a new top triangle were not assigned that group.
- Follow the custom model ID from the generator into the staged object and then the manifest inclusion path.

The SDK references most useful for this work are `ModSDK/Documentation/Art_Textures.htm`, `Art_Assets.htm`, `Art_Pipeline.htm`, and `Common_Issues.htm`, plus the schemas under `ModSDK/Schemas/xsd`. Local documentation and working examples were more useful than guessing newer-engine conventions.

## 14. Glossary

- **Asset:** Any game-consumable item, such as a mesh, texture, object definition, or sound.
- **Atlas:** One image containing multiple texture regions.
- **Bone/pivot:** A named local coordinate system to which parts or effects attach.
- **Diffuse:** Base surface color before the shader applies its lighting response.
- **Draw module:** The game-side configuration connecting an object to its models and visual behaviors.
- **GameObject:** The unit's gameplay definition, separate from its visible mesh.
- **LOD:** Level of detail; alternate representations intended for different rendering demands.
- **Mesh:** Vertices and triangles defining a visible surface.
- **Mipmap:** A smaller version of a texture used when rendering it at reduced screen size.
- **Normal:** A direction used to describe which way a surface faces.
- **Normal map:** Texture-encoded variations of local surface direction.
- **Rigid binding:** An entire mesh part follows one bone, rather than deforming across several bones.
- **Shader:** The rendering program that combines geometry, textures, and lighting into pixels.
- **Specular:** The concentrated highlight produced by a surface's lighting response.
- **Tangent frame:** The local directional basis needed to interpret a tangent-space normal map.
- **UV:** Two-dimensional texture coordinates assigned to mesh vertices.
- **W3X:** The XML-based art representation compiled by the C&C 3 SDK.
- **BIG:** The archive format used to package runtime game data.
- **SKU definition:** The small configuration file used here to select the mod archive/game version.
- **Regression test:** A check designed to prevent a previously fixed defect from returning.

The central lesson is that quality came from making all these systems agree: the shape, its surface coordinates, its lighting contract, its moving parts, its simulation size, and the exact package the game loaded.
