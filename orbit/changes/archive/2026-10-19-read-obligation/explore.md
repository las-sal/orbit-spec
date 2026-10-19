> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: read-obligation

## Premise

Stage `read-obligation` of `orbit/architecture/propose-reads-specs.md`: the propose and ff bodies gain G0's three
read steps — read the whole baseline spec of each modified capability; copy each MODIFIED block whole from the
baseline; grep `orbit/specs/` for the rule being changed, to find specs that restate it — held by a surface test,
released as v2.0.2, with no new artifact section and no new check (G3).

What exists (read 2026-10-17):
- Both bodies carry the same upstream step 4a, "Read any completed dependency files for context"
  (`src/core/templates/workflows/propose.ts:72`, `ff-change.ts:61`); nothing in either body names the baseline.
- The upstream portion of each body is the vendored snapshot: it changes only through a delta that names the edit,
  the step it replaces and the requirement that replaces it (`orbit-conventions`' `Generated-file disposition`;
  both `orbit-propose` and `orbit-ff-change` are listed there).
- The schema's specs instruction already says to copy the ENTIRE requirement block (`schemas/spec-driven/schema.yaml`
  54-60), and until openspec-path-fix (2026-10-17) it pointed at `openspec/specs/`, which an orbit project lacks:
  rc04a's dropped scenarios happened under that broken path.
- No check flags a MODIFIED block that drops baseline scenarios, and G3 forbids adding one.
- `test/core/templates/skill-templates-parity.test.ts` pins both bodies' function and generated-skill hashes.

## Mechanism

### D-ro-5 — the propose-shaped bodies carry the three read steps
Domain: every body that writes `proposal.md` and the specs in one invocation (propose-shaped)
| member | covered by |
|---|---|
| `/orbit:propose` (`src/core/templates/workflows/propose.ts`) | the in-place edit of its step 4a (D-ro-1) |
| `/orbit:ff` (`src/core/templates/workflows/ff-change.ts`) | the in-place edit of its step 4a (D-ro-1) |
Closure: SOURCED — `orbit-run-summary-emit`'s `Propose-shaped and artifact-completion-aware recommendation logic` names the propose-shaped commands as exactly `/orbit:propose` and `/orbit:ff`
Moves:
- READ: applied — both bodies carry the same step 4a text, "Read any completed dependency files for context" (`propose.ts:72`, `ff-change.ts:61`), and neither names `orbit/specs/`
- ENUMERATE: applied — this table; `/orbit:continue` also writes `proposal.md` but one artifact per invocation, and is out by the architecture doc's Considered & out
- COHERE: applied — steps 1 and 3 fire before the proposal artifact, step 2 at the specs artifact (D-ro-2), so the three never compete for one moment; step 2 points at the schema's procedure instead of restating it (D-ro-3)
- EXECUTE: not applied — no body text yet; at apply, the surface test must fail on a generated skill missing a step, and on one carrying steps 1 or 3 after the proposal write
- FALSIFY: applied — an instruction can be present and still ignored; that is G1's and G2's to measure, in other projects (R-prs-1), and the checked record is the named re-entry
- CONFORM: applied — `orbit-conventions`' `Generated-file disposition` (a named in-place edit of the upstream portion); G3 (no artifact section, no check); D11's Claude primacy (no tool-neutral rewording of the body)
- FEASIBILITY: not applied — a few lines per body
- CONSUME: applied — the agent running propose or ff is the consumer; the schema's specs instruction (`schema.yaml:54-60`) is what step 2 points it at, and it names `orbit/specs/` since openspec-path-fix
- INVOKE: applied — fires on every propose and ff run, at step 4a, once per artifact the loop creates

## Decisions

- **2026-10-17 — D-ro-1: the steps are a named in-place edit of upstream step 4a** (Sal, Q1 a). In both bodies,
  at the step where the agent reads context for an artifact. An additions-section step read at the bottom of a long
  body is the weak-prompt shape the study found.
  Kind: scope
- **2026-10-17 — D-ro-2: G0's placement is amended** (Sal, Q2). Steps 1 and 3 (read each modified capability's
  whole spec; grep `orbit/specs/` for the rule being changed) come before `proposal.md` is written; step 2 (copy each
  MODIFIED block whole) comes at the specs artifact. The architecture doc's G0 is edited to say so.
  Kind: scope
- **2026-10-17 — D-ro-3: step 2 points at the schema's MODIFIED workflow** (Sal, Q3). One line at the specs
  artifact that points at the specs instruction's workflow and names the consequence, a dropped scenario lost at
  archive; the four-step procedure is not restated.
  Kind: scope
- **2026-10-17 — D-ro-4: one owner, `orbit-propose-modifications`** (Sal, Q4). One ADDED requirement, `Propose-shaped
  bodies read the baseline before writing proposal.md`, names both bodies' edits and the surface test. One
  capability.
  Kind: scope
- **2026-10-17 — D-ro-5: the propose-shaped bodies carry the three read steps.** Every `/orbit:propose` and
  `/orbit:ff` run reads, before `proposal.md` is written, the whole baseline spec of each capability it will modify,
  and greps `orbit/specs/` for the rule it changes, listing any spec that restates it; at the specs artifact it
  copies each MODIFIED block whole, as the schema's workflow says. G0's rule, made a requirement.
  Kind: rule

## Open questions

## Considered & out

- **2026-10-17 — The steps as an additions-section step that states its position:** the weak-prompt shape (D-ro-1).
- **2026-10-17 — Restating the schema's four-step MODIFIED workflow in the body:** two copies of one procedure
  drift (D-ro-3).
- **2026-10-17 — One requirement per body:** ff's additions have no owning capability, and two owners would state
  one rule twice (D-ro-4).

## References

- `orbit/architecture/propose-reads-specs.md` — Goals G0–G3, R-prs-1, the probe in the status log.
- Issue #29 and its investigation comment; issue #30 (openspec-path-fix); issue #32.
- `orbit/specs/orbit-conventions/spec.md` — `Generated-file disposition`.
- `orbit/specs/orbit-propose-modifications/spec.md` — the propose body's orbit additions.
- `orbit/specs/orbit-cli-name/spec.md` — a precedent table of named in-place edits across several bodies, ff among
  them.
