# Pasadena Straight-Pipe Diesel Generator

First custom Pasadena building: the early-game power plant. The faction README already establishes this building and its exposed, un-muffled diesel theme. Its silhouette will anchor a family of Chesapeake salvage-industrial buildings.

Scope: generate an HD concept image; build a real editable model and game-format art asset; refine front/rear/side/stress renders; check geometry, UVs, materials and mechanical clearances. No release replacement or gameplay rebalance. A building requires construction, sale, damage and collapse integration beyond the vehicle workflow; a new art asset alone does not prove those states work.

Identity: two tall hollow exhaust stacks; an exposed red/black V12 diesel and alternator; red corrugated switchgear shed and fuel tank. Dirty concrete, painted steel, galvanized metal, restrained warm lights. Small team-color panels are separate from the cream DENA POWER sign. The sign is faction identity, not a claim about real infrastructure.

Coordinates: +X front, +Z up; provisional foundation 64×52. Stock target slot GDIPowerPlant, but the legacy PasadenaPowerPlant design XML is not the live object. Establish final measured bounds before integration.

Owned files: new src/Art/PP, tools/powerplant_*.js, tools/generate_pasadena_powerplant.js, tools/render_powerplant_preview.js, tools/test_powerplant_*.js, docs/unit-art/pasadena-power-v1, build/pasadena-power-review. Existing Sweeper, Roundabout, vehicle sources and normal release remain untouched. No concurrent SDK staging/builds.

Baseline: new building; preserve first blockout and source before adding mechanical detail. The established Monster Mud Tank image is a visual-quality benchmark, not the building's dimensions or rig.
