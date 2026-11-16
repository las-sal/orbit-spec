## MODIFIED Requirements

### Requirement: Output contract and read-only guarantee beyond the emit

On success the surface SHALL print the written path to stdout. With `--json`, stdout is
instead EXACTLY ONE structured JSON object — `{path, emit, render?}`: `path` the written
file, `emit` the complete composed emit, `render` present only when `--render` applies —
never a plain-text line preceding or following the object (automation consumers parse one
document, no split heuristics). Without `--json`, for proposal/system review emits `--render`
additionally prints
the engine report render (the `orbit status --change <name> --report` output) after the
path — persist-first and run-and-paste collapse into one invocation. For architecture-mode
review emits `--render` is a no-op with a one-line stderr note (the report render is a
change-scoped surface; no architecture report surface exists — D4's architecture exemption). The surface writes EXACTLY one file (the emit,
atomically, for every class) and modifies nothing else — no artifact,
no metadata, no baseline — with one exception: a seam emit whose reading halts also writes each `tripwire` stop record
`orbit-tripwires`' `A halting reading writes a tripwire stop` requires, into the change's `decisions/` folder, only
after the emit has passed its write gate and before the emit itself is written.

#### Scenario: Render in the same breath

- **WHEN** `orbit emit review --change foo --render` succeeds
- **THEN** stdout carries the written path followed by the engine-rendered report for the just-written pass

#### Scenario: --json is one machine-readable object

- **WHEN** `orbit emit review --change foo --json --render` succeeds
- **THEN** stdout is exactly one JSON object with `path`, `emit`, and `render` keys — no plain-text framing precedes or follows it

#### Scenario: Exactly one file

- **WHEN** any `orbit emit` invocation succeeds and no reading on it halts
- **THEN** the trail gains exactly one new file and no other file in the project changed

#### Scenario: A halting reading adds its stop

- **WHEN** `orbit emit review --change foo` succeeds and its `touchpoints` reading halts on a key no stop names
- **THEN** the trail gains the review emit and one `tripwire` stop record in `decisions/`, and no other file changed

#### Scenario: A refused emit writes no stop

- **WHEN** a review payload that would halt a reading is refused at the write gate
- **THEN** no file is written, the stop included

