# Command & Conquer 3: The Battle for Maryland (Pasadena vs. Columbia)

> **A Satirical Faction Mod for Command & Conquer 3: Tiberium Wars (Base Game)**

## Custom-model guides

- [Agent playbook](MODEL_CREATION_AGENT_PLAYBOOK.md): a step-by-step, lower-cost workflow for creating and refining custom in-game vehicles, with source locations, tested contracts, commands, troubleshooting, and handoff checks.
- [Technical learning guide](HOW_THE_CUSTOM_UNIT_PIPELINE_WORKS.md): how this project's geometry, textures, shaders, skeleton, collision, compiler, and launcher work together; the defects we diagnosed and the work still outstanding.

Welcome to **The Battle for Maryland**, a full-featured satire mod for *Command & Conquer 3: Tiberium Wars* pitilessly parodying the cultural stereotypes of two iconic Maryland localities: **Pasadena** ("The 'Dena") and **Columbia**.

## Playable Build

The current runnable release is a safe Tiberium Wars 1.09 overhaul: choose **GDI for Pasadena** or **Nod for Columbia** in Skirmish. Most units still reuse the original game's models, animations, weapons, AI, and production trees while the custom-art pipeline is developed one unit at a time.

The first complete custom-art exemplar is now playable: the GDI Pitbull slot has become the **Lifted F-250 “Rolling Coal”** with an original low-poly truck model, weathered material atlas, animated dually wheels, rotating/pitching twin-gun assembly, collision box, weapon/FX hardpoints, and custom production portrait. Its proven Pitbull movement, targeting, AI, weapon, upgrade, and production logic remain underneath the replacement art.

The older experimental XML for fully separate factions remains under `src/Data` as design material, but it is not packaged: it referenced nonexistent art, UI, audio, and faction infrastructure and could not produce a stable game. The build manifest contains only complete SDK game-object overrides.

### Rolling Coal art preview (pass 3)

Exit C&C 3 completely, then run **`launch_art_preview.bat`** to test the new truck materials in `build/art-v3`. This corrects the flipped texture UVs and adds dedicated panel artwork, normal/specular/reflection maps, team-color accents, and smoother wheel shading. No `enable_mod` or `disable_mod` step is needed. The regular `launch_game.bat` still selects the prior user-tested package as a fallback; it has not been replaced while the game is running.

The art-preview package is compiled and checked, but its final in-game appearance is not yet approved. See `src/Art/PV/README.md` for the art sources, material contract and compiled-output tests.

The current preview also includes **behavior pass 1: footprint correction**. The truck's unchanged ~69 x 30 model now has a 70 x 32 simulation footprint instead of the stock Pitbull's 28 x 14. Speed, health, weapons, movement tuning and artwork are unchanged. The prior 3.4 preview is backed up in `build/baselines/art-pass-3-render-fixed`.

For this pass, start a fresh skirmish and test 6–8 trucks leaving the factory, moving/stopping as a group, turning around buildings, and tracking ground/air targets. Wheel/turret bindings and muzzle alignment passed offline checks; live motion and crowding still need confirmation. The truck still fires Pitbull missiles: the described machine guns and smog ability are not implemented by this pass. Full checks and current archive hash are in `build/art-v3/ART_PASS_3.md`.

Persistent footprint changes belong in `tools/dually_behavior.ps1`, not the generated SDK overrides or the unused legacy unit XML. The build runs `tools/test_dually_behavior.ps1` on the staged object before compiling. The version-specific `node tools/test_dually_footprint_package.js` acceptance test compares the packaged result against the saved 3.4 baseline and permits only the four collision-geometry changes.

---

## Factions Overview

### 1. The 'Dena Dominion (Pasadena, MD)
* **Theme**: Working-class Chesapeake Bay waterman grit, high-horsepower diesel trucks, crab shacks, lawncare guerrilla warfare, and copious amounts of Old Bay seasoning.
* **Playstyle**: Aggressive kinetic brawler, high physical armor, all-terrain mobility, heavy area-of-effect suppression, and devastating artillery bombardment.

#### Structures
* **Crab Shack Command HQ (`PasadenaConYard`)**: Operational base with neon crab signage; coordinates construction and deploys waterman tech.
* **Straight-Pipe Diesel Generator (`PasadenaPowerPlant`)**: Loud, un-muffled twin-turbo diesel generator producing high power and black exhaust.
* **Crab Steamer & Scrap Depot (`PasadenaRefinery`)**: Resource processing facility; deploys the *Bayside Scrap & Crab Dredger*.
* **VFW Hall & Bait Shop (`PasadenaBarracks`)**: Recruits and trains militia, snipers, and commandos.
* **Bayside Custom Garage (`PasadenaWarFactory`)**: Fabricates lifted trucks, mud buggies, pontoon barges, and monster trucks.
* **Seaplane & Cropduster Dock (`PasadenaAirfield`)**: Wooden pier deployment bay for carpet-bombing cropdusters.
* **Speedboat Tuning & Speed Shop (`PasadenaTechCenter`)**: Researches lift kits, straight pipes, and Old Bay weapon infusions.
* **Crab Pot & Potato Cannon (`PasadenaDefenseTurret`)**: Pneumatic heavy turret launching cast-iron crab pots and frozen potatoes.
* **Duck Hunter Blind (`PasadenaAA`)**: Camouflaged marsh blind with 10-gauge flak cannons.
* **Old Bay Industrial Silo (`PasadenaSuperweapon`)**: Launches the **Old Bay Cataclysm**, unleashing a blinding, corrosive aerosol seasoning storm.

#### Units
* **Heavy Duty Flatbed Rig (`PasadenaMCV`)**: Massive commercial flatbed truck that unpacks into the Crab Shack HQ.
* **Bayside Scrap & Crab Dredger (`PasadenaHarvester`)**: Heavy-duty diesel truck equipped with hydraulic dredging claws.
* **Mullet Militia (`PasadenaInfantryMilitia`)**: Swarm infantry armed with 12-gauge shotguns and oak crab mallets.
* **Lawncare Guerilla (`PasadenaInfantryLeafblower`)**: Armed with commercial 2-stroke backpack leafblowers that blast wind shockwaves and deflecting gas fumes.
* **Waterman Sniper (`PasadenaInfantryWaterman`)**: Veteran Chesapeake oyster shucker firing high-velocity pneumatic harpoons.
* **Captain 'Salty Bob' (`PasadenaInfantryCommando`)**: Legendary waterman hero dual-wielding sawed-offs and throwing fiery Natty Boh molotovs.
* **Lifted F-250 'Rolling Coal' (`PasadenaVehicleDually`)**: Fast technical with twin .50 cals and the **Rolling Coal** smog ability.
* **Chesapeake Mud Buggy (`PasadenaVehicleBuggy`)**: Agile rollcage buggy firing dual bottle rockets.
* **Pontoon Battle Barge (`PasadenaVehiclePontoon`)**: Amphibious floating fortress with dual heavy crabpot mortars.
* **The Monster Mudder Juggernaut (`PasadenaVehicleMonster`)**: 66-inch tractor tires that crush vehicles, equipped with a 5,000-watt tailgate subwoofer shockwave.
* **Rusty Cropduster (`PasadenaAircraftSeaplane`)**: Low-altitude seaplane that carpet-bombs targets with incendiary fuel barrels.

---

### 2. The Columbia Planned Collective (Columbia, MD)
* **Theme**: Master-planned HOA paradise, whisper-silent EV swarms, code compliance stun lasers, aggressive bicycle pelotons, organic co-op delivery drone carriers, and orbital zoning foreclosures.
* **Playstyle**: High-tech precision, energy shielding, crowd control, drone swarms, and devastating economic/zoning lockdown.

#### Structures
* **Master HOA Community Center (`ColumbiaConYard`)**: Pristine modern hub managing all neighborhood infrastructure.
* **Solar Farm & Kinetic Gym Hub (`ColumbiaPowerPlant`)**: Eco-friendly power generated from rooftop solar panels and synchronized spin bikes.
* **Organic Co-op Distribution Hub (`ColumbiaRefinery`)**: Revenue processing facility; deploys the *Zero-Emission Co-op Cargo Rover*.
* **Fitness & Yoga Studio (`ColumbiaBarracks`)**: Trains Peloton cyclists, Pilates operatives, and HOA code compliance officers.
* **Clean Tech EV Fabrication Plant (`ColumbiaWarFactory`)**: High-tech manufacturing facility for Priuses, sweepers, and drone platforms.
* **Drone Logistics Skyport (`ColumbiaAirfield`)**: Automated flight deck for autonomous precision air drones.
* **Urban Planning & Zoning Commission (`ColumbiaTechCenter`)**: Researches Kevlar Spandex, Solid-State Lithium batteries, and Roundabout Gridlock.
* **Automated HOA Citation Laser (`ColumbiaDefenseTurret`)**: Precision diode laser that vaporizes unauthorized paint colors and intruders.
* **Noise-Complaint Acoustic Battery (`ColumbiaAA`)**: High-decibel directional sound battery enforcing quiet hours on hostile aircraft.
* **Zoning Board Orbital Foreclosure Array (`ColumbiaSuperweapon`)**: Fires the **Mandatory HOA Foreclosure** orbital particle beam, deconstructing structures and issuing instant fines.

#### Units
* **Autonomous Modular Capsule (`ColumbiaMCV`)**: Zero-emissions mobile headquarters that unpacks into the HOA Center.
* **Zero-Emission Co-op Cargo Rover (`ColumbiaHarvester`)**: Whisper-quiet autonomous rover collecting resources without disturbing tranquility.
* **Peloton Cyclist (`ColumbiaInfantryCyclist`)**: Hyper-speed scout in Lycra ringing high-frequency titanium bells that disorient targets.
* **HOA Compliance Inspector (`ColumbiaInfantryOfficer`)**: Armed with a clipboard and a citation taser that temporarily immobilizes vehicles and squads.
* **Pilates Spec Ops (`ColumbiaInfantryPilates`)**: Stealth infiltration operative throwing weighted Pilates rings and capturing structures.
* **HOA President 'Karen' (`ColumbiaInfantryCommando`)**: Supreme neighborhood authority using a high-gain megaphone sonic scream.
* **Prius Patrol EV (`ColumbiaVehiclePrius`)**: Silent skirmisher armed with rapid laser diodes and kinetic energy shielding.
* **Roundabout Node (`ColumbiaVehicleRoundabout`)**: Emits electromagnetic waves that disorient enemy pathfinding and trap them in circles.
* **Autonomous Street Sweeper (`ColumbiaVehicleStreetSweeper`)**: High-RPM rotary steel brushes that shred infantry and debris.
* **Whole Foods Delivery Platform (`ColumbiaVehicleDroneCarrier`)**: Hover carrier deploying autonomous drones armed with explosive organic avocados.
* **Organic Co-op Precision Drone (`ColumbiaAircraftDrone`)**: Agile quadcopter with surgical lasers for airspace denial.

---

## How to Build & Install

Requirements: the included C&C 3 Mod SDK files, **Node.js** on `PATH`, and a patched **Tiberium Wars 1.09** installation.

1. Double-click `disable_mod.bat` once if an older version of this project was enabled. Approve the administrator prompt and wait for `[SUCCESS]`. This restores verified original EA SKU/config backups and moves the old injected packages to `build/legacy-recovery-*`. The window displays failures instead of closing silently; details are in `build/restore-vanilla.log`.
2. Double-click `build.bat`. The script validates the real compiler result, creates `MDShowdown.big`, and installs these two files. The shortened runtime name is essential: EA documents a startup crash for mod names longer than 15 characters (`MarylandShowdown` was 16).

   ```text
   <Windows Documents>\Command & Conquer 3 Tiberium Wars\Mods\MDShowdown\MDShowdown.big
   <Windows Documents>\Command & Conquer 3 Tiberium Wars\Mods\MDShowdown\MDShowdown_1.0.skudef
   ```

3. Double-click `launch_game.bat`. It launches the compiled package in this project's `build` folder with a full `-modConfig` path. If no local build exists, it falls back to the Windows Documents installation. This prevents conflicting OneDrive/ordinary Documents copies from selecting the wrong build. No new changes to Program Files are required.
4. Open **Skirmish** and select **GDI for Pasadena** or **Nod for Columbia**.
5. To inspect the exemplar, build a **GDI War Factory** and purchase **Lifted F-250 “Rolling Coal”** from the normal Pitbull production slot.

Build details are written to `build/compile.log` and `build/compile-low-lod.log`. The SDK reports missing raw `ART:` source files while rebuilding stock objects; EA's SDK documentation identifies those notices as expected because the installed game supplies the compiled art at runtime. Any other compiler error now stops the build.

## Custom-art exemplar source

`tools/generate_pasadena_dually.js` deterministically generates the W3X model, hierarchy, collision, weathered TGA material atlas, 128×128 UI portrait atlas, and an OBJ/MTL interchange copy. `build.bat` runs it automatically before compiling, so the obsolete 3ds Max 7/9 exporter bundled with the SDK is not required.

The editable and generated art is under `src/Art/PV`. See `src/Art/PV/README.md` for the file map, bone contract, prompts, and the workflow to use when replacing the next unit.
