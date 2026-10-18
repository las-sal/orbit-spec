## Why

Stage `read-obligation` of `propose-reads-specs` (issue #29). In orbit's own record, 30% of the capabilities a
proposal lists as modified had their baseline spec unread before `proposal.md` was written, and the misses that cost
review cycles were baseline contradictions: MODIFIED blocks that dropped baseline scenarios, a new rule contradicting
an unmodified requirement, a spec that restates a rule left unlisted. The propose and ff bodies tell the agent to read
the change's own dependency artifacts and nothing of the baseline (see explore.md). This change puts the read where
the agent decides what to read, and releases it as v2.0.2 so Sal's other projects can run it (R-prs-1).

## What Changes

- Upstream step 4a of the propose and ff bodies (`src/core/templates/workflows/propose.ts`, `ff-change.ts`) gains two
  lines, a named in-place edit (D-ro-1), right after "Read any completed dependency files for context":
  - before the proposal artifact: list the capabilities the change will modify, read each one's whole baseline spec,
    and grep `orbit/specs/` for the rule the change alters, listing any spec that restates it;
  - before the specs artifact: copy each MODIFIED requirement whole, as the schema's MODIFIED requirements workflow
    says, because a scenario left out is dropped from the baseline at archive (D-ro-3).
- `orbit-propose-modifications` gains the requirement that owns both edits (D-ro-4) and fences the two lines, which a
  test holds each generated body to. Its standalone-mode requirement names its exceptions, this edit among them,
  instead of claiming the body behaves exactly as upstream; its Purpose is edited in place to match.
- orbit moves to 2.0.2: `package.json`, `package-lock.json`, a CHANGELOG entry, and the install pins in `README.md`
  and `docs/installation.md`.

No artifact section and no validation or emit check is added (G3).

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `orbit-propose-modifications`: ADDED `Propose-shaped bodies read the baseline before writing proposal.md`; MODIFIED
  `Upstream propose behavior preserved in standalone mode`, which names the orbit edits that apply without an
  exploration.

## Impact

- `src/core/templates/workflows/propose.ts`, `src/core/templates/workflows/ff-change.ts` — step 4a.
- `test/core/templates/skill-templates-parity.test.ts` — both bodies' function and generated-skill hashes move.
- A new test of the two lines in both generated bodies, held to the requirement's fence.
- `package.json`, `package-lock.json`, `CHANGELOG.md`, `README.md`, `docs/installation.md` — the 2.0.2 bump.
- After merge, Sal cuts the release tree (`npm run release:tree`) and pushes `v2.0.2`; each other project then
  installs it and runs `orbit update`.
