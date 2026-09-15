> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: rc07-artifact-lint

## Premise

Reviews keep spending CRITICALs and WARNINGs on a class a machine should own: a figure restated in
prose that disagrees with its source. The charter's rule is ONE VOICE FOR FACTS — a computed number
lives in exactly one generated place and prose POINTS AT IT.

This is the first stage proposed under **R-crc-10**, ratified hours ago out of two stages that
shipped nothing by trying to make the engine judge what it cannot see. So the first move is that
ruling's own test: NAME THE INPUTS, before anything else.

## Mechanism

### R-crc-10 applied FIRST — naming the inputs

The charter bundles two deliverables. Under the ruling they are different KINDS of work, and
separating them is the whole design.

**(B) The payload-reference round-trip** — every shipped schema reference round-trips through its
own emit surface, proven by execution.

| input | what it is | engine can observe? |
|---|---|---|
| the shipped reference's documented field set | text in a generated `references/*.md` | YES |
| the emit surface's payload table | `COMMANDS[cmd].payloadFields` in TypeScript | YES |
| whether a payload built from the reference is ACCEPTED | the emit surface's own return | YES — by RUNNING it |

Every input is an artifact the engine owns. **This half is a CHECK**, and it is buildable today.

**(A) One voice for facts** — a restated figure that disagrees with its source fails validation.

| input | what it is | engine can observe? |
|---|---|---|
| the SOURCE value | a computed fact (a count, a version, a test total) | YES, where it is computed |
| the RESTATEMENT in prose | a number inside a sentence | the NUMBER yes; that it is a restatement, NO |
| which source a given number restates | authorial intent | **NO** |

The third row is the stage. Finding "a figure restated in prose" by scanning prose for numbers is
asking the engine to infer intent, which is exactly what R-crc-10 forbids — and it is what two
stages died doing.

**The resolution is already in the charter's own wording: prose POINTS AT IT.** A restatement that
is MARKED is observable; an unmarked one is not, and never will be. So (A) is a RECORD the author
writes — a reference from prose to a named source — and a CHECK the engine runs against it. The
engine never decides what is a restatement; it verifies the ones declared.

That also fixes the exit criterion honestly. "A restated figure that disagrees with its source fails
validation" is unachievable as stated: an UNMARKED restatement cannot fail anything. What is
achievable: a MARKED one that disagrees fails, and an unmarked figure is invisible — which must be
said out loud rather than discovered.

### Case 1 — count the instances this day actually produced (2026-09-15)

**Input**: every restated-figure defect found in this session, and how each was caught.

| restatement | source | caught by |
|---|---|---|
| `CLAUDE.md`: "spec-driven is **version 3**" | `schemas/spec-driven/schema.yaml: version: 4` | a hand-run project-wide audit |
| `CLAUDE.md`: "rulings R-crc-1..8" | the rulings index (9, then 10) | a human reading during an architect session |
| `CLAUDE.md` + arc doc: "fifteen small stages" | `grep -c '^### Stage '` (17) | a hand count during an architect session |
| arc doc: "4C/7W/0S" for the blind pair's external half | the archived findings file (4C/6W/0S) | verifying a number before reusing it in prose |

**Output — four in one day, zero caught by a check, and every one was a number that HAD a
computable source.** Three were in CLAUDE.md, which no validator reads at all. The audit found one;
a human found three. None was found by the artifact that owns the fact.

**And the sharpest datum is that the sources were all trivially computable**: a YAML field, a grep
count, a grep count, a file. Nothing here needed judgment — only a link from the prose to the
source, which is precisely what did not exist.

### Case 2 — design the marker by running the four real defects through it (2026-09-15)

**Input**: the four restated-figure defects this session produced, exactly as they were written, and
the strings their sources emit today.

**Procedure**: propose a marker form, run each defect through it, and reject any form that requires
the engine to infer.

**The obvious form dies on R-crc-10.** A comment placed BESIDE a figure —
`seventeen small stages <!-- src:stages -->` — requires the engine to find "the number near the
marker" in arbitrary prose. The four defects are a numeral inside bold, a range endpoint inside an
identifier, an English WORD, and a compound of three numbers: any rule for "the number near" is
inference about which token the author meant, which is what two stages died doing.

**The form that survives is a DELIMITED SPAN.** The author declares the boundary; the engine does
string containment inside it and nothing else:

```
<!-- src:stages -->18 small stages<!-- /src -->
```

The registry maps `stages` to a command; the command emits a STRING; the check is "does the span
contain that string". No inference about which token, because the author drew the box.

**Output — all four defects, run through it:**

| defect as written | source emits | span contains it? | verdict |
|---|---|---|---|
| `version 3` | `4` | no | **FAILS** ✓ |
| `R-crc-1..8` | `10` | no | **FAILS** ✓ |
| `seventeen small stages` | `18` | no ("seventeen" is not "18") | **FAILS** ✓ |
| `4C/7W/0S` | `4C/6W/0S` | no | **FAILS** ✓ |

Four for four, and the fourth matters most: its source emits a COMPOUND STRING, not a number, and
containment handles it without a special case. **The check never parses a number.** It compares two
strings inside a boundary the author drew.

**One constraint falls out, and it is the honest cost.** Case 3's prose was "seventeen"; containment
of `18` requires the marked span to use NUMERALS. Word forms would need a numeral-to-word table —
cheap, and deferred rather than built, because the day's lesson is that the minimal thing that works
ships and the elaboration does not. Marked spans use numerals; `eighteen small stages` becomes
`18 small stages` in the one place it matters.

**And the residual narrows to something small enough to state.** With the span delimited, the hole
is no longer "prose drifts from its marker" — there is no separate marker value to drift from. The
hole is only an UNMARKED figure, which is D-rc07-4's residual and unchanged.

## Decisions

- **2026-09-15 — D-rc07-7: the registry is `orbit/sources.yaml`, and v1 exposes ENGINE SOURCES ONLY**
  (ratified in chat by Sal, 2026-09-15). A separate file rather than a key in `orbit/config.yaml`:
  this is project DATA, not tool config.
  **The name lines up with the marker's own vocabulary** — the span says `src:stages`, the file holds
  the sources, and a reader who meets one can find the other without being told. `facts.yaml` was
  rejected as vague; `project.yaml` was considered and set aside because `orbit/project.md` is an
  established convention (referenced in 10 places across baseline specs and workflow bodies as
  "project goals + stack"), and two files sharing a stem with different purposes read like one thing
  in two formats.
  **NO SHELL, and this reversed my own first proposal.** The obvious entry shape was
  `command: grep -c …`, which is flexible and wrong: orbit is a PUBLISHED PACKAGE, so someone who
  clones a project using it and runs `orbit validate` would execute whatever sits in that file —
  arbitrary code execution from repo data, in a command that reads as read-only. That is not a
  residual to state; it is a bad default. v1 exposes a CLOSED SET of engine sources and nothing else.
  **The engine already computes every fact that went stale today**: stage counts and the rulings index
  (`architecture status`'s parse), capability counts (`orbit/specs/*/`), the schema version (the
  schema loader). Safe by construction, no new trust boundary, and it is the R-crc-10-preferred
  form — the engine reads what the engine already owns instead of shelling out to rediscover it.
  **The source-name domain is SOURCED over the engine's own table**, exactly as the payload table is
  the authority in rc07b. Adding a fact means EXPOSING it from the engine — a code change with a
  test — not dropping a line into YAML.
  **Deferred, with kind and method** (D-bcs-2): the fourth defect — the arc doc restating `4C/7W/0S`
  from an archived findings file — has NO engine source today, so v1 covers three of this session's
  four. KIND: a fact computable only by parsing a specific file the engine does not already
  summarise. METHOD: it surfaces when an author marks a figure and finds no source name for it.
  A shell escape hatch is the obvious answer IF the need recurs, with its trust boundary designed
  then rather than assumed now. The honest alternative is that restating a RECORD's contents in
  living prose is the defect, and the fix is not to restate it.


- **2026-09-15 — D-rc07-6: the marker is a DELIMITED SPAN, and the check is string containment**
  (settled under R-crc-3, by Case 2). `<!-- src:<name> -->…<!-- /src -->` around the figure; the
  registry maps `<name>` to a command; the command emits a STRING; the check asks only whether the
  span contains it.
  **The adjacent-comment form was rejected on R-crc-10, not on taste.** A marker BESIDE a figure
  requires the engine to find "the number near the marker" in prose that — across the four real
  defects — is a numeral inside bold, a range endpoint inside an identifier, an English word, and a
  compound of three numbers. Any rule for "the number near" infers which token the author meant. The
  span moves that judgment to the AUTHOR, where R-crc-10 says it belongs, and leaves the engine a
  string comparison inside a boundary it was given.
  **It is a string test, never a number test**: the fourth defect's source emits `4C/6W/0S`, and
  containment handles a compound with no special case. Four of four real defects fail correctly.
  **Cost, stated**: a marked span must use NUMERALS, so `eighteen small stages` becomes `18 small
  stages`. A numeral-to-word table would lift the constraint and is DEFERRED, not built — the
  minimal thing that works ships, and the elaboration is how the last two stages died.


- **2026-09-15 — D-rc07-5: half (B), the payload round-trip, SPLITS into its own stage**
  (ratified in chat by Sal, 2026-09-15). The two halves share a charter sentence and nothing else —
  different inputs, different mechanism, different capabilities (rc07 keeps the validator and
  `orbit-conventions`; the round-trip takes `orbit-audit-drift` and `orbit-emit-composition`).
  Bundling them is how the previous stage reached four capabilities without noticing.
  **What is different about this split is WHEN it happened.** R-crc-9's first application came after
  two proposal passes and 48 findings had proved a change too wide. This one is preventive: the
  ruling applied at exploration, before anything was written, on a charter that had carried both
  halves since it was drafted. A ruling that only fires in post-mortem is a ruling that costs a stage
  every time; this is the first evidence it can fire early.
  A paste-ready charter is drafted at `sketches/rc07b-reference-roundtrip-charter.md`. THE
  DECLARATION IS AN ARCHITECT ACT and has not been performed — declaring a stage from an explore
  session would leave it in the program with no architect emit behind it.


- **2026-09-15 — D-rc07-1: the lint's domain is the WHOLE PROJECT, not `orbit/`** (ratified in chat
  by Sal, 2026-09-15). `orbit/` is the package's working directory, not the boundary of what must
  stay true. THREE of the four restated-figure defects this session produced were in `CLAUDE.md`,
  which no validator reads — a lint scoped to `orbit/` would have caught one of four and reported
  itself clean.

- **2026-09-15 — D-rc07-2: the file domain is SOURCED over `git ls-files '*.md'` minus a DECLARED
  exclusion list** (settled under R-crc-3, and the first real use of the closure vocabulary settled
  in `bounded-closure-semantics`). Git's tracked-file list is the authority, so the domain closes by
  construction rather than by a directory list somebody remembers — which is precisely the error the
  previous stage's residue sweep made twice. 61 files today.
  **The exclusions are DECLARED and each has a stated reason**, because an undeclared exclusion is
  the blank cheque D-bcs-2 forbids:
  - **RECORDS** — `orbit/changes/archive/**`, `**/.orbit-runs/**`. A figure in a record was TRUE
    WHEN WRITTEN; linting it would demand rewriting history to match the present, which inverts what
    a record is for.
  - **FIXTURES AND GOLDENS** — `test/**`. Their numbers are test data; a golden that tracked live
    counts would fail on every unrelated change.
  - **TEMPLATES** — `schemas/*/templates/**`. Placeholders, not claims.
  - **GENERATED** — `.claude/**`. Regenerated from source; the source is what must be true.
  - **HISTORICAL** — `README_OLD.md`, `adopter-report-*.md`. Superseded by their own names.
  The organising principle underneath: **the lint reads LIVING documents, never RECORDS** — and both
  categories are decidable by PATH, so no judgment is asked of the engine (R-crc-10).

- **2026-09-15 — D-rc07-3: a marker points at a NAMED SOURCE in a registry, and the registry is the
  source domain's authority** (settled under R-crc-3). Prose carries a marker naming a source; the
  registry maps each name to the command that computes it. The domain of "what a marker may point
  at" is therefore SOURCED over the registry file, and adding a fact is adding an entry — closed by
  construction. Four entries are already earned by this session's defects: `stages`
  (`grep -c '^### Stage '`), `rulings` (`grep -c '^- \*\*R-crc-'`), `capabilities`
  (`ls -1d orbit/specs/*/`), `schema-version` (a YAML field). Each is a one-line command whose output
  the engine reads — no judgment anywhere, which is what makes this half buildable where the
  previous stage's was not.

- **2026-09-15 — D-rc07-4: the residual is that an UNMARKED restatement is invisible, and that is
  stated rather than papered over** (settled under R-crc-3, per D-bcs-2's kind-and-method rule).
  KIND: a figure written into living prose that nobody marked. METHOD by which one is found: a human
  or a review pass notices it — today's status quo, unchanged. The lint claims to verify DECLARED
  links, never to find undeclared ones, and exit criterion 1 must be restated to say so: "a MARKED
  figure that disagrees with its source fails validation", not "a restated figure". Asking the engine
  to detect an unmarked restatement is inferring authorial intent, which is what R-crc-10 forbids
  and what two stages died attempting.
  MITIGATION, and it is a RECORD not a check: the lint reports per-source marker COVERAGE — `stages
  = 17 (2 markers)` — so a human can see a fact nobody points at. It judges nothing; it counts.


## Open questions

## Considered & out

## References

- `orbit/architecture/clean-up-review-cycle.md` — rc07's charter (both halves, including the
  payload round-trip added 2026-09-14) and R-crc-10.
- `test/core/emit-schema-parity.test.ts` — the existing instrument and its `KNOWN_DIVERGENCE`
  exemption, which is half (B)'s starting point.
- `src/core/emit-composition.ts` — `COMMANDS[cmd].payloadFields`, the authority half (B) checks against.
- GitHub issue #12 (las-sal/orbit-spec) — the delta-scope report; adjacent, not this stage.
