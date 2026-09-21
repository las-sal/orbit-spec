# External Review: rc04a-judgement-record (iteration 1)

You are reviewing an OpenSpec change as a second pair of eyes. Your value is
your independent take — be thorough; flag anything that looks wrong,
inconsistent, or unclear. Don't be charitable to the authoring AI's reasoning.

This is a **post-apply system review**: the change is implemented, committed, and
its 19 tasks are complete.

## Repo

https://github.com/las-sal/orbit-spec — branch `d-arc`, HEAD `d75155b`.

## What this change does

orbit runs a review cadence on each change: independent passes (a `fresh`
clean-context reviewer and an `external` cross-vendor one), walks that resolve
findings, then archive. Decisions made *about findings* during a walk already had
structured records. Decisions made *about the cadence itself* did not — they lived
as prose in a narrative `final_assessment` or a free-text `warnings` array.

This change adds the **judgement record**: a top-level `judgements` ARRAY on
exactly three emits (`apply`, `review-external`, `archive`). Each entry carries
`kind` (`continuation` | `readiness`), `formed_against` (a non-empty list of
independent pass `<TS>` tokens), `disposition`, `reasoning`, `ratified_by`, plus
kind-specific extras.

**The one computed rule** is an ordering refusal at the emit write gate: every
cited token must be STRICTLY earlier than the emit's own `<TS>`, and must resolve
to an independent pass on the change's trail. The premise is that belief is not
observable but ordering is — so the engine refuses a claim that *could not have
been informed* by the evidence it names, and judges nothing else.

Three MODIFIED capabilities: `orbit-emit-composition` (the refusal),
`orbit-run-summary-emit` (the record's shape and its closed carrier set),
`orbit-archive-modifications` (the terminal record and its reader).

## What to read for THIS review (--as system)

```
- orbit/changes/rc04a-judgement-record/proposal.md, design.md, tasks.md, specs/
- The implementation: git diff 14e2161..HEAD -- src/ test/
    src/core/emit-composition.ts          (+214) — the type, the runtime validator,
                                                    the ordering refusal at writeGate
    src/core/templates/workflows/{apply-change,archive-change,review}.ts — the bodies
    test/core/emit-composition.test.ts    (+173) — the refusal suite
    test/core/judgement-record-fixture.test.ts   — the acceptance fixture
- orbit/specs/orbit-emit-composition/spec.md, orbit-run-summary-emit/spec.md,
  orbit-archive-modifications/spec.md  (archived baselines — for compliance checks)
- orbit/lenses/perspectives.md, orbit/lenses/critical-paths.md — ABSENT; skip with a note
```

`orbit/changes/rc04a-judgement-record/explore.md` carries the twenty decisions this
was generated from. Note it is the SHARED source for two sibling stages
(`rc04b-forward-recommendation`, `rc04c-retire-gate-overridden`), so it deliberately
contains material beyond this change's scope — whether the change faithfully
implements what it cites and correctly excludes the rest is a fair question.

## What to look for

0. **verify-change-style structural check** — 19/19 tasks claimed; spec coverage;
   design adhered. Run your own equivalent.
1. **Baseline Compliance** — does this break any archived `orbit/specs/`
   requirement? Two of the three deltas are MODIFIED and reproduce their
   baselines; the third is ADDED-only. **A prior review of this change found a
   MODIFIED block silently dropping four baseline scenarios**, so verifying delta
   fidelity mechanically — scenario-by-scenario against the live baseline — is
   squarely in scope and is a check `validate --strict` and `base_fingerprints`
   structurally cannot perform.
2. **Cohesion** — `emit-composition.ts` gained a new import (`readTrail`) and a
   new refusal path. Callers, ripple, side effects. Does anything that composes an
   emit today behave differently?
3. **Surface Walk** — the payload tables are a literal allowlist that refuses
   unknown keys; the schema references must agree with them (there is a parity
   requirement asserting exactly that). Do the three bodies, the three payload
   tables and the schema-reference blocks actually agree?
4. **Perspective Reviews** — lens files absent; skip.
5. **Critical-Path Scan** — lens files absent. Walk the real lifecycle instead:
   propose → review → address-reviews → apply → review(system) → archive, and ask
   what the new refusal does at each seam.
6. **Drift / Residue** — vocabulary residue, stale references, archive-coherence.

### Claims worth attacking

Stated so you can try to break them, not so you accept them:

- **"No emit that exists today can newly fail."** The check is scoped by presence
  of the `judgements` key. A sweep found 442 existing emits, none carrying it. Is
  the scoping actually airtight in the code, or only in the sweep?
- **The ordering check runs at `writeGate`, not `validatePayload`** — because it
  needs the emit's resolved `<TS>` after the collision bump. Is that the right
  seam, and is the token extraction correct under a bump?
- **Token resolution uses the trail reader's pass set**, which admits
  `external-<mode>-<TS>.md` as a first-class pass. An in-context token is refused
  as "unresolvable". Is that distinction implemented as specified, and is
  refusing in-context right?
- **The coexistence constraint**: a `continuation/proceed` disagreeing with
  `gate_overridden` is refused, because a later stage's retirement argument
  depends on the record being a strict widening of the field. Sound?
- **The acceptance fixture** (`judgement-record-fixture.test.ts`) reads a REAL
  archived emit and asserts a specific sort of six `warnings` entries. Is the sort
  defensible under the change's own qualifying test, or does it beg the question?
- The `not-ready` disposition **records and never blocks**, and is required to be
  `ratified_by: "user"`. Is the reasoning for both sound?

## Practical notes

- CLI is `node bin/orbit.js` from the repo root.
- `npm test` is green at 2229; `node bin/orbit.js validate --all --strict` clean at 26.
- The engine is TypeScript compiled to `dist/`; run `npm run build` after edits.
- **Constructing payloads and running `orbit emit ...` against a scratch project is
  the highest-value thing you can do here** — this codebase's characteristic defect
  is a rule that reads correctly and computes wrongly.

## Output format — write to:

`orbit/changes/rc04a-judgement-record/.orbit-runs/external-system-<TS>.md`

(Where <TS> is today's timestamp in ISO format. Pick a fresh timestamp so this
file doesn't overwrite prior reviews.)

Use this exact markdown structure:

```markdown
# External Review: rc04a-judgement-record (iteration 1)

**Reviewer**: <your model name>
**Date**: <YYYY-MM-DD>

## CRITICAL

### <Finding title>
**File**: <path>:<line>
**Description**: <what's wrong + specific recommendation>

(For each additional CRITICAL finding, repeat the `### <Title>` + `**File**:` + `**Description**:` triple. Use `None.` as a single-word body if there are no findings at this severity.)

## WARNING

### <Finding title>
**File**: <path>:<line>
**Description**: <what's wrong + specific recommendation>

(Same shape as CRITICAL. Use `None.` if no findings.)

## SUGGESTION

### <Finding title>
**File**: <path>:<line>
**Description**: <what's wrong + specific recommendation>

(Same shape. Use `None.` if no findings.)

## Notes

<Optional — rendered VERBATIM into the report's delimited Commentary slot: carry the pattern behind the findings, what you probed, and risk texture; do NOT state finding counts, gate verdicts, or next commands — those exist only in the report's engine-computed sections. Omit the whole `## Notes` section if you have nothing to add.>
```

If your environment doesn't support file writes (chat-only interface), output
the markdown directly and the user will save it.

## After completing the review

1. **Output the full findings markdown in chat** — in addition to writing the
   findings file, output the COMPLETE findings markdown in this chat. Same
   content as the file: every severity section, every `### Title` entry, every
   `**File**:` and `**Description**:` field. Do NOT abbreviate or summarize.

2. **Commit and push the findings file** (if your environment supports git):

   ```bash
   git add orbit/changes/rc04a-judgement-record/.orbit-runs/external-system-<TS>.md
   git commit -m "External review (system, iter 1): rc04a-judgement-record

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

   Then STATE PLAINLY in your chat output that the findings landed —
   `Findings committed (<short-sha>) and pushed`.

If you don't have git access, just output the findings markdown in this chat,
state explicitly that you could NOT commit/push, and the user will commit it
manually.
