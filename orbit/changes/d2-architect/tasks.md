# Tasks: d2-architect

Order: engine first (the tier the bodies and CLI consume), then metadata + lifecycle plumbing,
then the retrofit (first live instance), then bodies, then the verification sweep against the
arc's four exit criteria. Every lifecycle transition is user-invoked; R-d-9 handoff audits run
by hand at the phase seams.

## 1. Architecture engine (`src/core/architecture/`)

- [ ] 1.1 `parser.ts`: fence-aware parse of `orbit/architecture/<name>.md` — stage headings
      (`### Stage <id> — <title>`, kebab id), `Depends-on:` / `Complete:` slot lines
      (`[ ]` | `[x] <YYYY-MM-DD> (<who>)`), section boundaries (heading-to-next-same-or-higher);
      slot omission semantics (absent = no-deps / unratified); the near-miss rule — stage-like
      headings/slot lines failing the exact grammar yield an explicit MALFORMED result naming the
      line, distinct from LEGACY (zero `### Stage `-prefixed headings outside fences → explicit
      legacy/opaque result, never an error)
- [ ] 1.2 `state.ts`: computed stage state — citation scan over `orbit/changes/*/`,
      `orbit/changes/archive/*/`, `orbit/explore/*/` metadata; precedence in-change > exploring >
      quiescent > premised; completion composition (quiescent AND ratified → complete;
      quiescent + unratified → awaiting-ratification; ratified + ANY non-quiescent observation —
      live work OR premised/no-citing-artifacts → inconsistency surfaced, never honored); pure
      function, no caching
- [ ] 1.3 `validate.ts` + `src/commands/architecture.ts` + `src/cli/index.ts` registration:
      `orbit architecture status|show|validate` (all `--json`); status = per-stage computed
      state + citing artifacts, eligibility-framed, with legacy docs listed as opaque and
      near-miss docs listed as MALFORMED (bucketed --json: parseable/legacy/malformed); show =
      one stage section (or stage index); validate = structure, slot syntax, id uniqueness,
      Depends-on resolution, near-miss detection (errors name the offending line)
- [ ] 1.4 Tests (`test/core/architecture/`): parser incl. fenced look-alikes + duplicate ids +
      legacy docs + MALFORMED near-miss fixtures (mistyped stage heading; bad slot syntax) +
      slotless-stage omission defaults; state incl. precedence, re-exploration flip, completion
      composition, falsified-mark surfacing (incl. the ratified+premised fixture — a marked
      stage with zero citing artifacts); CLI status/show/validate against fixture docs
      (incl. malformed listing + bucketed --json); NO imperative labels in output (grep)

## 2. Citation + lifecycle plumbing

- [ ] 2.1 `ChangeMetadataSchema` gains optional `architecture: {doc, stage}` (Zod object);
      round-trip tests alongside `base_fingerprints`/`schema_version`/`consent_era_from`;
      `orbit validate <change>` gains two-level citation resolution (error names the dangling
      level) with a dangling-citation test each way
- [ ] 2.2 `explore.ts` body: Mode B/C scaffolding writes the minimal `.openspec.yaml` (citation
      offered when a stage is indicated; omitted otherwise); resume adds it add-only to pre-D2
      staging dirs
- [ ] 2.3 `propose.ts` body: explicit staged-metadata MERGE step before the bulk move (citation
      carries forward via helpers; fresh schema/created/schema_version win; staged file
      discarded); no-staged-metadata path unchanged
- [ ] 2.4 `archive-change.ts` body: stage-line garnish in the completion readout (computed
      post-archive position for the cited stage; uncited changes byte-identical)

## 3. Retrofit (exit criterion 1, first live instance)

- [ ] 3.1 Retrofit `orbit/architecture/d-arc-arbitered-flow.md`: stage headings normalized with
      ids (d1-explicit-lifecycle-consent … d6-pr-lifecycle), `Depends-on:` + `Complete:` slots
      added (D1's mark `[x] 2026-07-13 (Sal)` — confirm with the user at apply), ALL
      `*State (manual until D2):*` lines DELETED (the R-d-4 subtraction); status log untouched;
      `orbit architecture validate` passes and `status` matches reality; backfill the archived
      D1 change's `.openspec.yaml` with `architecture: {doc: d-arc-arbitered-flow, stage:
      d1-explicit-lifecycle-consent}` so d1's ratified `Complete:` mark composes with an
      observable quiescent state (external iter 1, option A); in the SAME commit,
      update CLAUDE.md's position-pointer sentence ("Position lives in the arc doc's stage-state
      lines + status log") to point at `orbit architecture status` — it breaks the moment the
      state lines are deleted (apply-seam fix, not archive-time)
- [ ] 3.2 Stamp this change's own citation
      (`architecture: {doc: d-arc-arbitered-flow, stage: d2-architect}`) into its
      `.openspec.yaml`; `orbit validate d2-architect` resolves it (exit criterion 2 live)

## 4. Workflow bodies

- [ ] 4.1 NEW `architect.ts` (skill + thin launcher): create/resume with scaffolded format;
      rulings/stages/considered-out capture; render-never-author state (flags legacy state lines
      for deletion); R-d-8 residency sweep; completion-ratification AskUserQuestion (ratify /
      not-yet → writes the `Complete:` mark); never-a-gatekeeper statement; emit
      `architect-<TS>.json` to the architecture trail with `doc`, `stages_touched`,
      `rulings_captured`, `completions_ratified`, and the R-d-9(b) `handoff` section. Register
      in EVERY registry (grep-enumerate by an existing body's name first — B3 lesson)
- [ ] 4.2 `review.ts` body: `--as architecture` mode — doc-targeted resolution (never inferred),
      the six passes, no-gate final assessment, emit to
      `orbit/architecture/.orbit-runs/review-architecture-<TS>.json` with `doc` + `handoff`;
      findings ingestible by address-reviews unchanged
- [ ] 4.3 `audit-drift.ts` body: architecture staleness check (computed-vs-prose contradiction;
      falsified `Complete:` mark CRITICAL; hand-written state line WARNING; dangling citations
      CRITICAL; clean skip with no parseable docs; flow-entry rule — origin never flagged)
- [ ] 4.4 `onboard.ts`: identity enumeration gains the program-architecture layer AND the
      quick-reference table gains the `/orbit:architect` row; sweep ALL surface-count mentions
      15→16 (profiles.ts comment, generated-surface expectations, any "15 workflows/skills"
      pins — the D1-cycle contradiction class, swept proactively); AUDIT + SYNC the README's
      install/update sections for the 16th workflow (counts, file lists, CLI invocations — the
      triggered `orbit-conventions` install-documentation baseline; record no-edit-needed only
      if the audit proves no count/list/invocation is affected)
- [ ] 4.5 `address-reviews.ts` body: cascade OUT table's audit-trail row gains the explore +
      architecture trails (all four `.orbit-runs/` locations, per the orbit-address-reviews
      delta); resolution-log destination list gains the architecture route (`--from-file` into
      the architecture trail → the log lands there, `change: null` + `doc` carried)
- [ ] 4.6 Parity hashes re-pinned (+ architect joins the hash maps); fidelity markers for the
      new body + edited bodies; on-disk generated-surface test expects 16 commands/skills

## 5. Verification sweep (arc §D2 exit criteria) + surface refresh

- [ ] 5.1 Exit-criteria as tests where mechanical: retrofitted arc doc parses + validate passes +
      status matches reality (fixture-level assertion against the real doc); dangling citation
      fails change validation naming the level; single-stage `show` returns only that section;
      review-architecture emit path exercised
- [ ] 5.2 Full suite green (baseline 1670 + new coverage);
      `node bin/orbit.js validate d2-architect --strict` passes;
      `orbit fingerprint d2-architect --check` all verified
- [ ] 5.3 `npm run build && node bin/orbit.js update --force` — regenerate the local surface;
      spot-check the new orbit-architect SKILL.md + review's architecture mode on disk; if 4.4's
      README audit edited install/update sections, run the fresh-sandbox verification the
      install-documentation baseline requires (mktemp -d + orbit init; counts/files match the
      README; the on-disk generated-surface e2e test doubles as the sandbox check for skill/command
      counts)
- [ ] 5.4 Arc sync (R-d-7): D2 stage section updated THROUGH the retrofit (its own state line is
      gone — `orbit architecture status` is the position source from here on); status log entry;
      R-d-9 handoff audit at the post-apply seam. CLAUDE.md archive-time notes: surface 15→16,
      baseline 14→16, the architecture tier paragraph. Archive-time Purpose updates (sync
      carries requirements only): orbit-review's Purpose gains the third mode; 
      orbit-run-summary-emit's Purpose emitter list gains architect
