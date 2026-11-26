## Why

`/orbit:explore` and `/orbit:onboard` are the last two bodies over the 5,000 estimated tokens Claude Code keeps of an
invoked skill after a compaction: explore at 11,904 and onboard at 5,610 by `npm run size:report` at `9a122611`.
Explore is the second most-run command on this repository's trails (D-inv-6). A long named exploration that compacts
loses the steps at the end of the body: the emit timing, the boundary detection and the crystallization warning.
`reduce-orbit-phase2`'s stage `cut-explore-onboard` applies the inventory's cut lists for both bodies
(`orbit/explore/inventory/sketches/explore-propose-archive-onboard.md`) and Sal's removal of explore's illustrative
upstream text (R-rop2-13). Both bodies then fit (G1), their ceilings come down (G2), and every removal and every other
edit is named (G0). At this propose Sal also brought in the shortening of the epitome's decision-writing bullet, which
the inventory decided once for every body carrying it (D-inv-2) and which no earlier cut stage took.

## What Changes

- **explore's body** keeps the stance, the epitome, the three modes, the re-entry table, the six-section scaffold, the
  status header and Decisions-entry productions, the capture types and the offer rules. It moves five procedures to
  references read at the moment each serves:
  - D-inv-5: the Mechanism-entry grammar, the closure outcomes, the nine moves and the two exemplar entries go to
    `references/mechanism-entries.md`, read when a session captures a rule or writes a Mechanism entry. Concluding and
    reopening go to `references/concluding.md`, read on the user's word to conclude or reopen.
  - E1: the crystallization flow, with its four-consequence warning and its confirmation gate, goes to
    `references/crystallization.md`. It is read when the user asks to name a bare exploration or accepts the Mode C
    prompt, before any file is written. The "substantive decision" test stays in the body, because the Mode C prompt
    fires on it.
  - E2: explore's emit step joins the other eleven under `orbit-run-summary-emit`'s read rule. Its payload detail, what
    the engine owns and its rationale go to `references/run-summary-emit.md`, read before the session's first emit,
    and the body carries the shared read cue. When each emit fires stays in the body, as that rule's table requires:
    the BEGIN emit, the conversation boundary, the residency sweep before it and bare mode's non-emission.
  - E3: the minimal `.openspec.yaml` and the citation offer go to `references/new-exploration.md`, read when a new
    named exploration is scaffolded.

  "Composition with `/orbit:propose`" becomes one sentence (R2), and the prose that stays is tightened, with no step
  removed (R3).
- **REMOVED (G0, R-rop2-13): explore's illustrative upstream text.** The following go: the four "Handling Different
  Entry Points" dialogues with their heading; the ASCII box under "Visualize" with its label (the stance's "Visual"
  bullet says to use diagrams); "Ending Discovery"'s summary template, whose one-line point stays; and the six
  Guardrails lines that repeat the opening's "don't implement" or a stance bullet. These are edits to explore's upstream
  portion, so the delta names each one, as `orbit-conventions`' `Generated-file disposition` requires.
- **onboard's body** fits by rewording in place:
  - its execution-disciplines list becomes one line each (R1);
  - its stage tags go;
  - its two PR-layer paragraphs and the longest phase paragraphs are tightened, every fact `orbit-onboard` requires kept;
  - its stale "15 commands" becomes 14, residue of bulk-archive's removal.

  The inventory's O1, moving the PR-layer paragraphs to a reference, is not taken. `orbit-onboard` teaches the PR
  layer in the propose and archive paragraphs whatever the project's `pr:` says (design D4).
- **The decision-writing bullet** (the epitome's fifth bullet, `DECISION_WRITING_BASIC`, in thirteen bodies) is shortened
  with its three branches and its link kept (D-inv-2, Sal's ruling at this propose).
- **The ledgers.** The cut ledger records the bodies this stage edits: explore, onboard and the twelve other carriers of
  the bullet. It names every edit as a pair, the bullet as one `shared` pair. The tighten-bodies ledger follows the
  bullet's new text. Each edited body's character ceiling comes down, and explore's line ceiling goes, since the body
  falls under the 500-line limit (G2).

No cut list entry is postulated to change significantly what a session does, so none is replayed (R-rop2-10). The
replay set's `explore` case breaks the body's emit section, so its `break:` follows E2 (design Risks).

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `orbit-explore-modifications`: `Upstream explore stance preserved` names the upstream text R-rop2-13 removes and
  states that the stance is unchanged. `Nine moves applied per rule in the Mechanism section` says the shipped skill's
  `references/mechanism-entries.md` carries the two exemplar entries, where it said the body.
- `orbit-run-summary-emit`: `A body reads its run-summary detail before the session's first run-summary emit` brings
  explore into scope as the twelfth body. Its crystallization subsection leaves the emit section for its own reference,
  and the "Explore is left as it is" scenario is replaced.
- `orbit-emit-composition`: `The explore grammar has one source in code` says the explore skill's template interpolates
  the Mechanism production in its `references/mechanism-entries.md` and the other two in its body, and that the parse's
  fixtures are the exemplar entries that reference carries.
- `orbit-conventions`: `Decision-writing discipline`'s basic-content fence takes the shortened bullet.

## Impact

- `src/core/templates/workflows/explore.ts` (body and five new references), `onboard.ts`; `src/core/disciplines.ts`
  (`DECISION_WRITING_BASIC`), which the thirteen carrying bodies interpolate.
- `replay/cases/explore/case.yaml` (its `break:`).
- Tests that read the moved, removed or reworded text follow it (listed in design.md's Touchpoints); the cut ledger and
  the tighten-bodies ledger; `skill-body-budget`'s ceilings; `skill-templates-parity`' hashes.
- An adopter's explore skill gains five reference files at the next `orbit update`. Nothing in engine behaviour changes.

## Size

- capabilities: One stage, one change (the program's stage rule). The fourth capability, `orbit-conventions`, is the decision-writing bullet Sal brought in at this propose, which the inventory decided once for every body carrying it (D-inv-2). Declared by Sal at propose, 2026-11-25.
