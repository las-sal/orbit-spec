> **Status**: concluded 2026-11-07.

# Exploration: measure

## Premise

Stage `measure` of `propose-reads-specs`: grade G1 (no more than 10% of modified capabilities unread before
`proposal.md`, against a 30% baseline) and G2 (no proposal-review CRITICAL that is a baseline contradiction) over
the next 8 proposals in Sal's other projects whose loaded propose skill carries v2.0.2's baseline-read lines, read
from the transcript itself. Under R-prs-1: read only, nothing written into a measured project. The stage writes no
code; its exit criteria are the two grades with counts and named proposals in the status log, a ruling on any
failure, and the probe's method written down for issue #32.

## Mechanism

## Decisions

- **2026-11-07 — D-msr-1: the precondition stood at 0 of 8 on Fedora** Read 2026-11-07: no other project's
  propose skill carries v2.0.2's baseline-read lines (`chat_mover` `generatedBy: "2.0.1"`, `overtime` `"1.3.1"`,
  no `home-env` checkout under `~/code`), and no session has run in chat-mover, home-env or overtime since
  2026-10-17, before the release. The Mac was not read.
  Kind: fact
- **2026-11-07 — D-msr-2: the measurement is deferred to issue #32; nothing is built here** (Sal) The stage cannot
  be graded: the fix has not reached any measured project, and nothing in the program makes it arrive (an update
  is a manual `orbit update` per project). Rather than hold a program open on it, the grading moves to #32, the
  cross-project measurement instrument that already names this stage as its first consumer. A comment on #32
  carries G1, G2, the window, R-prs-1 and the open items below. The concluded exploration is what ends the
  stage: the engine renders it `ended-from-explore`, so no `Complete:` mark is written.
  Kind: scope
  Re-entry: the orbit projects on both machines run a propose skill of v2.0.2 or later and 8 proposals have run with it, or #32 is taken up
- **2026-11-07 — D-msr-3: issue #29 closes with a pointer to #32** (Sal) The fix shipped in v2.0.2; the open
  question (did it work) lives in #32.
  Kind: scope

## Open questions

## Considered & out

- **2026-11-07 — Keeping the stage open until the projects are updated:** out (Sal). With no trigger in the program
  and the other projects idle since 2026-10-17, it would hold the program open indefinitely.
- **2026-11-07 — A new issue for the measurement:** out (Sal). #32 already exists for it and names this stage as
  its first consumer; a second issue would duplicate it.
- **2026-11-07 — The four questions opened this session, carried to #32 rather than answered here:** what triggers
  the fix's arrival in a measured project (leaning: Sal runs `orbit update` in each, the update date starts the
  window); whether that update breaches R-prs-1 (leaning: no, if the updating session's proposal is not counted);
  which orbit projects the Mac has, at which version (no leaning); whether 8 proposals is the right window (no
  leaning; a grade-by date was suggested).

## References

- `orbit/architecture/propose-reads-specs.md` — G1, G2, R-prs-1, the measure charter, and the 2026-10-17 probe's method in its status log.
- Issue #29's investigation comment (2026-10-17) — the baseline scan of 55 proposals.
- Issue #32 — the cross-project effectiveness instrument this stage's method feeds.
- `~/.claude/projects/-home-sal-code-{chat-mover,home-env,overtime}/` — the Fedora transcripts; newest session in each is 2026-10-17.
