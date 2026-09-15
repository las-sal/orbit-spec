# Draft stage charter — rc03a-blind-prompt

Drafted in explore 2026-09-14, ratified in chat by Sal as the direction. NOT YET DECLARED:
writing a stage into `orbit/architecture/clean-up-review-cycle.md` is an ARCHITECT act, and
declaring it from an explore session would leave a stage in the program with no architect emit
behind it. Paste-ready in the doc's grammar so the architect session is cheap.

---

### Stage rc03a-blind-prompt — a blind reviewer is told nothing

Depends-on: rc02-gate-semantics
Complete: [ ]

SPLIT 2026-09-14 from rc03-review-genres (the rc02 → rc02b/rc02c precedent), because the conflict
below must be resolved BEFORE rc13's own system review runs a blind pair, and rc03 entire is three
capabilities that would displace rc13 and reverse a same-day ordering decision.

Charter: rc02 added `blind-pair` to the cadence and left standing a requirement that contradicts
it. `orbit-review-external`'s `Cycle context populated from prior runs` SHALL-includes "prior
findings (open and resolved)" in every external prompt, with a scenario requiring "counts and short
titles" of open internal findings. That requirement was written when every external review was a
SEQUENTIAL ITERATION reviewing what the last one found, where telling the reviewer what is open is
correct. A blind-pair member must receive NOTHING. Because the gate's blindness predicate checks
only for a WALK between the two tokens, a pair anchored through its prompt is certified blind, and
the capture-recapture residual estimate rc04 depends on silently stops meaning anything. The engine
makes this the DEFAULT path: an empty `blind-pair` slot renders `--fresh` first
(`gates.ts:113`), so the fresh half lands, and the external prompt then reads it. rc02's own pair
escaped only because it happened to run external-first — 24 minutes before the fresh pass existed.

This stage makes the cycle-context section CONDITIONAL ON PASS GENRE rather than unconditional:
a pass filling a `blind-pair` slot gets no prior-findings context of any kind; a sequential
iteration keeps today's content, which is correct for it. That is rc03's genre split, scoped to the
one requirement that is actively wrong, and rc03 inherits the resolved conflict instead of
re-deciding it. Goal G1. Touches: orbit-review-external. Exit: (1) a blind-pair member's prompt
carries no prior-findings context, grep-tested on the generated surface; (2) the cycle-context
requirement reads as genre-conditional, and a sequential external iteration still receives its
iteration history; (3) rc13's own system-review pair runs under this stage and its external prompt
is verifiably findings-free — blind by construction, not by ordering luck.

---

## Open, for the architect session

- **rc03's `Depends-on:` should gain `rc03a-blind-prompt`** — rc03 inherits the resolved conflict;
  today it reads `Depends-on: rc02-gate-semantics`.
- **rc03's exit criterion 3** currently says "review prompts contain no resolved-since list
  (grep-tested)". That targets the ADJACENT bullet. Once rc03a lands, rc03's criterion should
  either absorb or defer to it rather than restate a narrower version.
- **Ordering**: rc03a runs before rc13 reaches system review. Whether it runs before rc13 STARTS
  is open — rc13's propose/apply do not need it; only its review phase does.
