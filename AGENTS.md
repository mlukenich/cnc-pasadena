# Project working instructions

## Custom unit art

For creating, improving, rendering, rigging, texturing, or integrating a unit model, read `UNIT_MODEL_WORKFLOW.md` first and follow it as the project's standard start-to-finish process. The user selected the Monster Mud Tank revision 2 render as the visual benchmark on 2026-08-30. Reference images are preserved under `docs/unit-art/reference/`.

- Improve the real editable model and render its actual geometry/materials. Concept art is not proof of the finished asset.
- Preserve working units, existing source, and gameplay settings outside the requested scope. Correct collision bounds when needed and disclose simulation effects.
- Keep exterior-facing geometry, UV, material, rig/clearance, compilation, and runtime checks distinct. Do not weaken a failing check to claim completion.
- Keep accepted renders and source/package evidence identifiable. Visual approval does not establish in-game behavior or authorize replacing the regular release.
- Do not edit the same unit or run shared SDK staging/builds concurrently with another task. If overlapping edits appear, preserve the work, resolve ownership, and continue only nonconflicting work. An alternate output directory does not isolate SDK staging.
- Scope the workflow to the request: a review is read-only; a render request does not require a game install or release promotion. Do authorized reversible work without adding approval stops at every phase.

`MODEL_CREATION_AGENT_PLAYBOOK.md` supplies the older Rolling Coal implementation details; its dimensions, bones, hashes, and commands are reference examples, not defaults for every unit. The standard workflow takes precedence over its older process/completion guidance, subject to the user's current request and higher-priority instructions.
