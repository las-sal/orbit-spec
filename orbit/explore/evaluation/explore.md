> **Status**: concluded 2026-11-18.

# Exploration: evaluation

## Premise

Phase 1 of `reduce-orbit-phase1` is built: stages `conditional-steps`, `once-per-session-detail` and `tighten-bodies`
are archived and ratified. This stage measures what they produced and decides what follows (the stage's charter).
Its exit criteria: the measures are written down (body and reference sizes, the compaction results, what real sessions
on the new bodies showed), and each decision the charter lists is recorded as a ruling or as considered and out.

Measured at `409c7ad8` with `npm run size:report`: the bodies total 363,848 characters (434,449 at the brief's
`b5dac0dd`, a 16% cut), the references 425,459 in 64 files. Eight bodies are still over the 5,000 tokens Claude Code
keeps of a skill after a compaction: explore (12,513 tokens), address-reviews (11,529), review (10,210), propose
(8,829), archive (7,650), bulk-archive (6,700), onboard (5,630) and audit-drift (5,332). Apply, the longest-running
session, is within it (4,560).

The decisions the charter names, with what each phase-1 stage carried to here:

- the rest of the brief's stage D (R-rop-2): mode-only sections to references (about 26,000), folding ff into propose,
  the engine printing readouts (program P2);
- the one-line decision-writing bullet (R-rop-7, about 24,000 beyond stage C);
- reads named by a command's output (R-rop-4), with the apply gate's missing-account report beside it;
- whether every body must fit what survives a compaction (R-rop-12);
- whether decision records are written by default at all;
- bulk-archive's future: kept, folded into archive, or retired (R-rop-2);
- carried from `tighten-bodies`: 115 provenance forms its patterns could not remove, and explore's and onboard's own
  text (the brief's S12).

## Mechanism

### D-eval-3 — decision records are written only when a setting that reads them is on
Domain: every reader of a change's or doc's `decisions/` folder, found in `src/core` at `409c7ad8`
| member | covered by |
|---|---|
| the chain end step's open-stop check (`chain.ts`) | read under `chain:` — records written when it is configured |
| the program brief's ledger and stops (`program-brief.ts`) | shown to the user under `signoff: change` or `program` — records written then; at the defaults the saved copy carries none, and nobody is asked to read it |
| the tripwires' stop coverage (`tripwires.ts`) | read under `tripwires:` — records written when it is configured |
| the review's reading step (`orbit decisions brief`) | reads what was written: at the defaults nothing, so the step selects nothing and is skipped as it already is when nothing is selected |
| the walk's replacements of a record (`address-reviews`) | fixes what the reading step found: nothing to fix at the defaults |
| the autonomous driver (`automate-dev-flow`'s `driver`, not built) | will read stops when it runs, under its own setting |
Closure: SOURCED — the readers are the modules in `src/core` that read a `decisions/` folder (grep for the folder name at `409c7ad8`), plus the one declared stage that will add a reader
Moves:
- READ: applied — each module's use of the folder read at its lines (chain.ts 115-122, program-brief.ts 243 and 572, tripwires.ts 254-265, account.ts 14 keeps the account outside it)
- ENUMERATE: applied — this table; the first briefing named the reading step alone and missed the brief and the tripwires, corrected before capture
- COHERE: applied — "a setting that reads them" and the table name the same three settings, the driver to come
- EXECUTE: not applied — the change that builds it decides the body text and the setting test; nothing runs here
- FALSIFY: applied — a reader added later under no setting would read an empty folder at the defaults; the closure's grep is the place it shows
- CONFORM: applied — amends automate-dev-flow's G0 ("every record today's flow writes is still written") and leaves R-adf-11's reading exception with nothing to read at the defaults (stop-2026-11-18T00-27-46Z.json and its resolution); R-adf-12 already allows setting-dependent text
- FEASIBILITY: not applied — a body pointer and a setting test; sized by the change that builds it
- CONSUME: applied — the reading step and the brief already handle an empty selection; the chain and the tripwires read only under their settings
- INVOKE: applied — fires on every call the decision-writing rule covers today, now only when one of the three settings is on

## Decisions

- **2026-11-18 — D-eval-1: the evaluation rules now on what needs no replay, and leaves the two evidence-gated cuts to a phase 2**
  Sal's choice (C) of the three shapes weighed at the session's opening. Rule now on the questions that turn on
  judgement and on measures already taken (bulk-archive's future, decision records by default, whether every body must
  fit a compaction, reads named by a command's output, the provenance patterns, explore's and onboard's own text). The
  two cuts the brief gated on the replay set S15 (stage D's mode-only sections moved to references, and the one-line
  decision-writing bullet) are recorded as out of phase 1, for a phase 2 that starts by building S15. Chosen over
  ruling on every question from this session's evidence alone (it would take the brief's riskiest cuts on one
  witness) and over building a replay set inside this stage (S15 names work outside this repository, R-rop-11).
  Kind: scope
- **2026-11-18 — D-eval-2: bulk-archive becomes a thin loop over archive's own steps, built when parallel lanes first need it**
  Sal's choice (D). Bulk-archive keeps what only it does (selecting several changes, detecting and resolving spec
  conflicts between them, the batch table) and runs archive's steps for each change, so archive's per-change steps stop
  being mirrored in a second body (20 template edits since June kept the two in step; bulk-archive has never run in
  this repository). It is built when `automate-dev-flow`'s `parallel-lanes` stage first archives changes in parallel,
  against real parallel changes; until then bulk-archive stays as it is. Chosen over keeping it as it is with no
  direction, over folding it into archive (which grows the busiest body), and over retiring it (adopters arriving from
  OpenSpec know the command, and `parallel-lanes` would rebuild it).
  Kind: scope
- **2026-11-18 — D-eval-3: decision records are written only when a setting that reads them is on** Sal's choice (B),
  answering `stop-2026-11-18T00-27-46Z.json` (resolution `resolution-2026-11-18T00-29-27Z.json`). The AI writes ledger
  entries, stop records and resolutions only when chaining, a sign-off setting (`change` or `program`) or the tripwires
  are configured, and later the autonomous driver; at the defaults the decision-writing rule leaves the bodies, a
  pointer to `references/decision-records.md` standing in its place, and the review's reading step finds nothing to
  read. About 38,000 characters leave the bodies. Amends `automate-dev-flow`'s G0, whose "every record today's flow
  writes is still written" was meant to keep supervised trails complete for a first run to learn from; a later change
  builds it. Chosen over keeping records in every mode (the bodies pay 11% for a reader that only checks the records
  themselves) and over keeping them with no default reader (the body cost stays).
- **2026-11-18 — D-eval-4: every body is to fit what survives a compaction — phase 2's size goal** Sal's choice (A), the
  decision R-rop-12 left to this stage. Phase 2 brings every generated skill body under the 5,000 tokens Claude Code
  keeps of a skill after a compaction, as `npm run size:report` estimates them (eight bodies are over at `409c7ad8`:
  explore by 7,513, address-reviews 6,529, review 5,210, propose 3,829, archive 2,650, bulk-archive 1,700, onboard 630,
  audit-drift 332), so a long session that compacts keeps every body's closing steps. Its cuts wait for the replay set
  (D-eval-1); explore's and onboard's own text, left alone in phase 1, comes into scope; D-eval-3 and D-eval-2 bring
  part of the way (about 740 tokens a body from the decision-writing rule; bulk-archive's thin loop). Chosen over
  making it a goal for the two longest-running bodies only (explore and address-reviews) and over measuring with a
  trigger and no goal (a lost closing step fails quietly: the commit or the chain step simply does not run).
  Kind: scope
- **2026-11-18 — D-eval-5: the body keeps directing every read (R-rop-4 stands), and the apply gate reports no missing account**
  Sal's choice (A). No command's output names a reference file, and the apply gate does not report a change that
  completed apply without writing its account. Neither failure has been observed: from the system review of
  `tighten-bodies` on, a session on the new bodies followed every body-directed read and the apply session wrote its
  account from the cue, and each fix would change an engine readout at the defaults. Both are recorded in Considered &
  out with the observation that would reopen them. Chosen over engine-named reads, over the missing-account report, and
  over both together.
  Kind: scope
- **2026-11-18 — D-eval-6: the provenance `tighten-bodies` left goes to phase 2's rewording, graded by the replay set**
  Sal's choice (A). The 115 forms in `tighten-bodies`' account (six in-kind members blocked by a suffix or prefix,
  about 60 owner-only or author-aimed sentences, about 50 history and era words) are, all but six, rewording, which the
  brief holds for the replay set; the account's list is that pass's input, and no pattern is widened meanwhile.
  Chosen over widening the patterns in a small change now (it removes three of the six; the `pre-` cases need words)
  and over dropping the concern (it discards a list already made).
  Kind: scope
- **2026-11-18 — D-eval-7: ff stays its own command, as it is** Sal's choice (A). ff and propose keep separate bodies.
  The two differ in more than consume mode: ff lacks propose's Touchpoints authoring (Step 0c.5) and its size brief, so
  an ff change has no predicted Touchpoints for the divergence check and is never measured against the change-size
  ceiling. That difference is recorded here as a known one, not fixed; ff has never run in this repository (none of 76
  archived changes has an ff emit). Chosen over making ff a launcher for propose's standalone mode, over retiring it,
  and over mirroring the two missing steps into it.
  Kind: scope
- **2026-11-18 — D-eval-8: the records change runs next, then automate-dev-flow, then phase 2** Sal's choice (C),
  answering `stop-2026-11-18T13-57-16Z.json` (resolution `resolution-2026-11-18T13-58-20Z.json`). D-eval-3 is built as
  one small change, a new stage of this program after `evaluation`, on its branch and program PR; then
  `automate-dev-flow` resumes; phase 2 (the replay set, then the cuts it grades, the 5,000-token goal, the rewording)
  follows it. Moving mechanical steps into the engine, the brief's program P2 (the engine printing readouts among it),
  stays a later program of its own. Amends R-rop-2's list of stages and R-rop-9's resume point, both written at the
  next architect session. Chosen over phase 2 first (it leaves `automate-dev-flow` paused behind a replay set nobody has
  scoped) and over resuming `automate-dev-flow` now with D-eval-3 inside it (its stages would keep paying the body cost
  the records change removes).
  Kind: scope
- **2026-11-18 — D-eval-9: the phase-1 measures** The bodies total 363,848 characters (434,449 at `b5dac0dd`, 16% less),
  the references 425,459 in 64 files; apply's body 18,238 (27,124 after `conditional-steps`); eight bodies over 5,000
  tokens (the Premise lists them). No session in the program was seen to compact, in three stages' sessions, so
  R-rop-12's compaction results are none observed. One session ran every command from `tighten-bodies`' system review
  to this exploration on the new bodies (the blind pair, two walks, a verification pass with its reading step, the
  archive, the architect session) and followed every read its basic contents direct, with no instruction found missing;
  its apply ran on the earlier bodies, and its witness is the same AI that wrote them.
  Kind: fact
- **2026-11-18 — D-eval-10: the evaluation concludes; nothing is built from it** Sal's word. Its output is decisions:
  D-eval-1 to D-eval-8 become rulings, considered-and-out entries and one new stage of `reduce-orbit-phase1` (the
  records change, D-eval-3), written in the next architect session, and D-eval-9 is the measures the stage's exit
  criteria ask for. No change is proposed from this file: the records change opens its own exploration once its stage
  is declared.
  Kind: scope
  Re-entry: the replay set S15 is built, or a real session on the new bodies is seen to compact and lose a step or to skip a read its body directed

## Open questions

## Considered & out

- **2026-11-18 — ff as a thin launcher for propose's standalone mode:** it would end 28 edits of mirroring and give ff
  changes Touchpoints and the size brief, but it changes what ff does; Sal kept ff as it is (D-eval-7). Re-entry: the
  first real `/orbit:ff` run, or a change reaching review without predicted Touchpoints because it was started by ff.
- **2026-11-18 — Each gating command naming its reference file in its output (R-rop-4's alternative):** an engine
  change to every gating readout, defending against an agent that runs a command and forgets what its result asks;
  no session has shown that (D-eval-5). Re-entry: a real session on the new bodies seen running a gating command and
  not reading the reference its result called for.
- **2026-11-18 — The apply gate reporting a change that completed apply with no account:** an engine change to one
  readout at the defaults; every apply session so far wrote its account from the body's cue (D-eval-5). Re-entry: an
  archived change found with no account, or a sign-off that finds the program brief missing a change's account.

## References

- `orbit/architecture/reduce-orbit-phase1.md` — the program, its rulings and the three Shipped-as paragraphs
- `orbit/architecture/reduce-orbit-phase1-brief.md` — section 4.4 (stage D), section 7 (how to verify), section 9
- `orbit/changes/archive/2026-11-17-tighten-bodies/.orbit-runs/account/account-2026-11-17T22-35-17Z.json` — the
  residual provenance forms, in its `detail`
- `skill_body_convention.md` — the rules the bodies now follow
