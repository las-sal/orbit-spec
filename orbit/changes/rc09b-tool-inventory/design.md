## Context

The generated surface (36 files: every SKILL.md and `references/*.md`) is checked for GRAMMAR per recorded tool: `orbit`
against its program (rc05), `git` and `gh` against captured contracts (rc01, rc05b), all through ONE shared extractor,
`test/helpers/surface-snippets.ts`. Each sweep reads only its own tool's lines. Nothing reads the heads the sweeps do
not recognise, so a body can invoke a new tool and every test stays green. That is D6's failure mode: 108 KB written
about `gh` before `gh` was run.

`orbit-cli-grammar`'s `orbit` snippet requirement holds a tool-set TABLE listing the uncovered utilities and
`node`/`sh` as "not covered", with a named limit describing how the table was enumerated (a PATH-filtered pass). The
table is prose. It is already stale: it names seven of the twelve utility heads the surface writes (`rm`, `tail`, `cd`, `[` and
`command` are missing). This change turns it into
a checked record and moves it to a requirement that owns it (R-crc-14).

The exploration settled the domain (see explore.md): D-rc09b-1 reads shell fences plus FLAGGED inline segments.
D-rc09b-2: every `gh` invocation on the surface is inline, so a fence-only inventory would have passed `gh`.
D-rc09b-3: the exemptions are a fenced block in the owning requirement, read by the test. D-rc09b-4: `node`, `sh`
and `command` are declared utilities.

## Goals / Non-Goals

**Goals:**
- A head that is neither a recorded tool nor a declared exemption fails `npm test`, naming surface, line and head
  (exit (2) as revised).
- The exemption list is stated once, in the spec, and held exact both ways: no unused entry, no entry shadowing a
  recorded tool.
- The recorded-tool set is derived from the sweeps' own inputs, never restated.

**Non-Goals:**
- Recording contracts for any new tool. The day-one inventory passes with declarations alone.
- Grammar checks for exempted heads. An exemption says "no contract", not "checked".
- Reading slash commands (`/orbit:review --fresh`). They are not shell heads, and their argument grammar is a separate
  question.
- Engine code, generated bodies, templates. This is a test plus a spec.

## Decisions

**D1 — one head walk over the extractor's own parse.** Add an exported `analyseHeads(surfaces)` to
`surface-snippets.ts` that walks the same markdown-it tokens as `walkText`: shell fences (list-nested and
markdown-nested included), the quote-joining loop of `extractFenceLines`, and single-backtick inline spans through
`tokenize`. It returns `{surface, line, head, source}` per read segment. A refused or open line yields no head and no
failure of its own: a refused SHELL-FENCE line is already reported by every sweep, because `extractFenceLines` fails it
whatever its first word; a refused INLINE span is reported only by the sweep whose tool it begins with, so a refused
span of an unrecorded tool is reported by none — the requirement's named limit. Two walks over one parse could
drift, so `walkText` gains a visitor rather than being copied. *Alternative:* a separate markdown pass in the new
test. Rejected: it would be a second grammar of the places table, which is the Q-crc-15 pattern.

**D2 — the exemption block is read from the requirement as it stands.** The reader follows
`test/core/canonical-examples.test.ts`'s `requirementSource`. Exactly one active change whose delta ADDs or MODIFIes
the requirement supplies the block; two fail, naming both; with none, the baseline does. It locates the requirement
by its heading, outside fences. It takes the requirement's fences of info `inventory` through markdown-it and parses
each line by `^(utility|placeholder|prose): (\S+( \S+)*)$`. During apply the block lives in this change's delta.
After archive it lives in the baseline, and the test needs no edit at archive.

**D3 — recorded tools derived.** The set is `['orbit', ...recordedTools().map(t => t.tool)]`. `recordedTools()`
(`test/helpers/recorded-sweep.ts`) is the list the recorded-contract sweep already iterates, so a tool gains standing
by gaining a contract file and a sweep entry. Nothing in the inventory is edited.

**D4 — exact both ways.** Failures come in four kinds, all collected and reported together: an unknown head, an
unused exemption, an exemption that is a recorded tool, and a malformed block. The second and third keep the list
from silently growing into a pass-everything set.

**D5 — the head production.** The head is the first token after assignment-prefix tokens (`^[A-Za-z_][A-Za-z0-9_]*=`).
An inline segment is read when its head matches `^[a-z][a-z0-9._-]*$` and a later token matches `^--?[A-Za-z0-9]`.
The digit admits `head -1`, which a letter-only rule misses (Case 2). In a fence every segment head is read, whatever
its shape: a `$ ` prompt there (head `$`) fails unless declared, which catches one member of the places table's
residual; a path-prefixed head (`./bin/orbit.js`) fails too, a member of the retired tool-set limit. The places
residual's assignment-prefix member (`VAR=1 orbit --frobnicate`) is NOT caught: the prefix is skipped by design, and the
head read is the recorded `orbit`.

**D6 — every scenario asserts its own outcome.** Each scenario of the ADDED requirement gets a test that injects into a
COPY of a real surface (the `injections.test.ts` pattern) or into a synthetic block, and asserts what that scenario's
THEN says, by outcome: the two passing scenarios (today's surface; a flagless inline span) assert the sweep passes
and, for the second, that no head is read from the span; an unknown head (a fence, a flagged inline span, an
assignment prefix, a markdown-nested fence) asserts surface, line and head; an unused exemption asserts head and kind;
an exemption naming a recorded tool asserts the head; a malformed block asserts the requirement and the offending line, or the requirement's heading line for an absent
block. The day-one sweep also asserts a non-vacuity floor: at least the Case 2 heads are read.

## Mechanism → artifacts

the proposing AI's reading of the file; no engine record

| rule | closure / state | owner's state | destination |
|---|---|---|---|
| D-rc09b-1 | BOUNDED | live rule | `Every command head on the generated surface is a recorded tool or a declared exemption` — its read table (a normative TABLE) and its named limit, both residual lines verbatim |
| D-rc09b-2 | — | fact | not carried |
| D-rc09b-3 | — | scope | not carried |
| D-rc09b-4 | — | scope | not carried |

## Risks / Trade-offs

- **D-rc09b-1's residual** → stated once, as the named limit of `Every command head on the generated surface is a
  recorded tool or a declared exemption`.
- [Prose heads drift: a new message template with a flag, such as `retry with --force`, fails the suite] → that
  failure is the intended price. The author declares it under `prose` in one line, and the both-ways rule removes it
  when the template goes.
- [The flag discriminator reads a prose span as a command, or misses a flagless command] → the first is the item
  above; the second is the named limit. Case 2 measured both on today's surface: four prose heads, and no tool head
  outside the read set that is not also read elsewhere in flagged form.
- [D2's reader resolves the wrong source while a change is active] → the two-holders failure, plus a test running the
  reader against an active delta, a baseline, and two deltas (the canonical-examples precedent).

## Alternatives considered

From explore.md's Considered & out:
- **The charter's fence-only domain (D-rc09-12)**: it passes every `gh` invocation unrecorded (D-rc09b-2).
- **Every multi-word inline span with a lowercase head**: about 35 prose heads to declare, and every new
  code-formatted phrase fails the suite.
- **Moving every inline invocation into a shell fence**: rewrites some 250 inline spans to fit the domain to the tool.
- **Recorded contracts for `node`, `sh`, `command`** (D-rc09b-4): a contract is the price for a tool the surface
  drives, not for the shell's own furniture.
- **A test-side data file for the exemptions** (D-rc09b-3): a second statement beside the spec's table.

## Touchpoints

- `test/helpers/surface-snippets.ts` — `analyseHeads`; `walkText` gains a visitor.
- `test/core/cli-grammar/tool-inventory.test.ts` — the day-one sweep, the block reader, the injection cases.
- `test/core/cli-grammar/surface-snippets.test.ts` — the visitor refactor's regression cases, if any move.
