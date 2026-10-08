> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: rc05-executable-references

## Premise

rc05's charter (declared 2026-09-11, before rc01 shipped): every copyable command in a generated reference is a
claim about a tool's grammar, and claims are tested, not reviewed. A documented step that cannot be executed is a
failing test, not a reviewer's finding. Exits: (1) the extractor covers 100% of invocation-shaped snippets in the three
PR references; (2) a grammar defect injected into a reference fails the suite; (3) the next blind pair finds zero
grammar or selector defects.

This exploration's first job is to find out what of that rc01 already shipped, what remains, and whether the charter's
scope (the three PR references, `git` and `gh`) is still the right one now that the review, external and blind-pair
references carry invocations too.

## Mechanism

### D-rc05-13 — fences are located by a CommonMark library, with `markdown` fences re-parsed
Domain: every Markdown construct the grammar must classify as a shell fence, another fence, or not a fence
| member | covered by |
|---|---|
| a top-level fenced block, backtick or tilde | the library's fence token, with its info string |
| a fence nested in a list item (four today, D-rc05-12) | the library's fence token: CommonMark measures it from the item's content column |
| a longer fence enclosing shorter fence lines (the four-backtick prompt template) | the library's single outer token; its inner lines are content |
| a shell fence inside a `markdown`- or `md`-tagged fence | reached by re-parsing that fence's content, the one recursion rule; re-parsed content is classified by this same table |
| an indented code block (four spaces, no fence) | the library's code-block token: not a fence, and not a shell fence; its lines fall to the guard |
| a fence inside a blockquote | the library's fence token within the quote |
| an HTML block | the library's HTML token: not a fence; its lines fall to the guard |
| inline code spans | the library's inline code tokens, the extractor's inline source (D-rc05-11) |
Closure: SOURCED — CommonMark's block and inline constructs as the library implements them; the one deliberate departure, re-parsing `markdown` fences, is stated as its own row
Moves:
- READ: not applied — no library is installed yet; which one, its version, and its CommonMark conformance are the proposal's to read
- ENUMERATE: applied — this table, from CommonMark's container and leaf block kinds plus the recursion
- COHERE: applied — the extractor and the guard read one parse, so a line cannot be inside a shell fence for one and outside for the other
- EXECUTE: not applied — nothing is built
- FALSIFY: applied — an info string naming a shell other than `bash`, `sh` or `shell` (`zsh`, `console`) would read as data; none appears today, and the guard still catches a command there that starts a line
- CONFORM: applied — Q-crc-15 (no new fence grammar is hand-written), R-crc-14 (one grammar, the library's, serves both consumers), D-rc05-11
- FEASIBILITY: applied — a devDependency is test-only and never reaches an adopter's install; the surfaces are a few hundred KB of text, parsed once per run
- CONSUME: applied — fence tokens feed the extractor and the guard; nothing in the shipped engine reads them
- INVOKE: applied — `npm test`, every build

### D-rc05-11 — the extractor reads shell-tagged fences and inline spans; a guard covers every other place
Domain: every place a copyable command can sit in a generated Markdown surface
| member | covered by |
|---|---|
| a line in a top-level shell-tagged fence | extracted, one argv per line |
| a line in a list-nested shell-tagged fence (four today, D-rc05-12) | extracted, given a fence grammar that sees list containers (open question) |
| a shell-tagged fence inside a markdown-tagged fence (the external prompt template) | extracted: the outer block is a document whose reader runs its commands |
| a quoted argument spanning lines (the template's three-line `git commit -m "…"`) | the tokenizer joins lines until the quote closes |
| an inline single-backtick span beginning `<tool> ` | extracted, every one, bare commands included |
| a line in an untagged fence | not extracted; the guard fails it when it starts with a tool and a flag |
| a line in a data-tagged fence (`json`, `yaml`, prose `markdown`) | not extracted; guarded the same way |
| a prose line outside every fence | not extracted; guarded the same way |
| a line whose first token is a placeholder (the runner launch, `'<argv[0]>'`) | not extracted: not a covered tool |
Closure: BOUNDED — Markdown has containers this table does not name
Residual kind: a command in a container not listed: a blockquote, an indented code block, an HTML block, a table cell, or mid-line after `&&`, `$ ` or `|`
Residual method: the guard itself reads every line whatever its container, so a residual member that starts a line fails it; a member mid-line is found by splitting candidate lines on `&&`, `;` and `|` and rerunning the guard
Moves:
- READ: applied — the 48 distinct fenced lines and the inline spans naming a covered tool, listed 2026-10-08; the tracker's opening rule at `markdown-fence.ts:31`
- ENUMERATE: applied — this table, from those lines plus Markdown's block structure
- COHERE: applied — the tokenizer's placeholder rule and D-rc05-9's parser agree: a placeholder passes as an argument or option value, as a real value would
- EXECUTE: applied — the guard was run over today's surface with a naive tracker; its five hits were all commands inside shell fences it could not see (D-rc05-12), which is the case table rows two and three exist for
- FALSIFY: applied — the guard keys on a line START; a command mid-line in prose or after a prompt sigil escapes it, stated in the residual
- CONFORM: applied — D-rc05-4 (every surface), rc01's precedent (extraction by shape, the parser decides), R-crc-10 (a check over observable text)
- FEASIBILITY: applied — the shared tracker cannot see list-nested fences and no CommonMark parser is a dependency (D-rc05-12); the grammar the extractor uses is open
- CONSUME: applied — each extracted argv goes to D-rc05-9's parser, each guard hit to a failure naming the surface and line
- INVOKE: applied — `npm test`, every build

### D-rc05-10 — `COMMAND_REGISTRY` is held to the builder's program by a parity test
Domain: every field of the registry's types (`src/core/completions/types.ts`) and every kind of entry the program holds that the registry might not
| member | covered by |
|---|---|
| command name, including nested `subcommands` | compared both ways: every visible program command is in the registry, and every registry command is in the program |
| flag long name, including negatable `--no-<x>` forms (the registry spells them `no-interactive`) | compared both ways, per command, the negated name as the program declares it |
| flag `short` | compared both ways |
| flag `takesValue` | compared: true exactly when the program's option declares a `<value>` or `[value]` |
| `acceptsPositional` | compared: true exactly when the program's command declares an argument |
| `positionalType` | not compared: completion metadata the program does not carry (which live ids to offer) |
| flag `values` | not compared: completion metadata; the program declares no `.choices()` (D-rc05-9) |
| `description` | not compared: prose |
| hidden program commands (`experimental`, `__complete`) | excluded from the comparison: deliberately absent from completion |
| commander's automatic `--help` and `--version`, and the root `--no-color` | excluded by rule, named in the test, so a later automatic option is a visible decision rather than a silent pass |
Closure: DERIVED — the registry's fields from its two interfaces, each either compared or named as not comparable, plus the three kinds of program entry the registry deliberately omits
Moves:
- READ: applied — the two interfaces in `types.ts`; `experimental` and `__complete` are `{ hidden: true }` (`index.ts:100`, `:488`); the registry spells negatable flags `no-<x>`
- ENUMERATE: applied — this table, from the interfaces' fields
- COHERE: applied — the comparison reads the SAME builder as the snippet sweep (D-rc05-9), so the two instruments and the CLI see one program
- EXECUTE: not applied — no builder or test exists yet
- FALSIFY: applied — parity cannot say whether a `positionalType` offers the right ids, or whether a `values` list is still true; both stay hand-maintained, a named limit
- CONFORM: applied — R-crc-14's mirror corollary (a checked copy that says so), D-rc05-9 (one builder)
- FEASIBILITY: applied — the registry is 77 entries over 463 lines; the missing nine commands are filled by hand once
- CONSUME: applied — `orbit completion` reads the registry (`src/commands/completion.ts:117`, `:132`); the shell scripts it generates are the user-visible output, unchanged in shape
- INVOKE: applied — `npm test`, every build

### D-rc05-9 — the `orbit` check is commander's own parser over a factory-built program
Domain: every commander 14 setting the CLI uses that alters a parse or produces an effect (grepped in `src/cli/index.ts` and the three `register*Command` modules, 2026-10-08)
| member | covered by |
|---|---|
| `.action()` handlers (they call `process.exit`, write output, touch the repo) | replaced by no-ops in the sweep's build |
| `.hook('preAction', …)` on the root (sets `NO_COLOR`), `change` and `spec` | neutralised by the factory: commander has no public API to remove a hook, so the builder takes the option that skips registering them |
| commander's own exits (parse errors, `--help`, `--version`) | `exitOverride()` on every command, recursively; a help or version exit counts as accepted |
| commander's error and help output | `configureOutput` captures it on every command, recursively, so a failure names commander's own message |
| `.allowUnknownOption(true)` on `show` (`index.ts:409`) | not covered: any flag passes there; a named limit, or closed as an aside |
| option VALUES (no `.choices()` anywhere) | not covered: values are checked in action code a grammar check never runs; a named limit |
| async actions | `parseAsync`, so a rejected promise is not an unhandled one |
| module-level work in `index.ts` (version read, `AI_TOOLS` import, `program.parse()`) | the builder holds everything but `parse()`; `index.ts` keeps only the call |
| the three `register*Command(program)` modules | called inside the builder, so their commands are in the sweep's program |
Closure: SOURCED — commander 14's Command settings that change parsing or cause effects (action, hook, exitOverride, configureOutput, allowUnknownOption, allowExcessArguments, passThroughOptions, enablePositionalOptions, help, version), each grepped against the CLI's source
Moves:
- READ: applied — commander is 14.0.3 (`node_modules/commander/package.json`), which rejects excess arguments by default; the hooks, exits and the `show` hole read at their lines
- ENUMERATE: applied — this table, by grepping each setting in the CLI and its three registration modules
- COHERE: applied — a builder shared by production and the sweep is the condition for "cannot disagree"; a sweep that rebuilt the program its own way would reintroduce the second copy D-rc05-9 rejects
- EXECUTE: not applied — no builder exists yet
- FALSIFY: applied — the parser accepts a valid argv for a command that no longer means what the body says (a flag renamed to a different meaning); grammar cannot see meaning, D-rc05-6's residue
- CONFORM: applied — R-crc-14 (one statement of the grammar, the code), D-rc05-6 (grammar only), rc01's precedent (one validator shared by every consumer)
- FEASIBILITY: applied — exitOverride and configureOutput are per command and must be applied recursively; hook removal has no public API, hence the builder option
- CONSUME: applied — the failure must carry commander's own message plus the snippet and its surface, so a reader sees the rule the CLI enforces
- INVOKE: applied — `npm test`, every build

### D-rc05-6 — every snippet check proves grammar only, against one contract per tool
Domain: every tool a copyable snippet invokes on the generated surface (D-rc05-8)
| member | covered by |
|---|---|
| `orbit` (164) | grammar against a contract derived from the in-repo commander program; this stage first (D-rc05-5) |
| `git` (100) | grammar against a recorded contract, in the child stage `rc05b-git-grammar` (D-rc05-15) |
| `gh` (34) | grammar against rc01's recorded contract today; the move onto the shared extractor and the bodies' six snippets are the child stage's (D-rc05-15) |
| POSIX utilities: `mv`, `grep`, `mkdir`, `head`, `rmdir` (12) | not covered: upstream's archive steps, propose's move and pipeline fragments, a coreutils grammar contract buys little |
| `node` (1), `sh` (1) | not covered: `node -p` evaluates a script; `sh` appears only inside a prohibition |
Closure: BOUNDED — the enumeration filtered first tokens by what resolves on the measuring machine
Residual kind: a tool invoked by a snippet the enumeration did not see: one not installed on the measuring machine, one written path-prefixed (`./bin/orbit.js`, `node bin/orbit.js`), or one following `&&`, `|` or `;` mid-line
Residual method: rerun the enumeration without the PATH filter, splitting each candidate on `&&`, `|` and `;`, and classify every unrecognised token by reading its line
Moves:
- READ: applied — `orbit-pr-lifecycle`'s owner says "SHALL prove grammar only (execution is a separate instrument)"; the phase-1 harness runs real `git` for the propose seam (CLAUDE.md's D6 record, 33 cases)
- ENUMERATE: applied — this table, from D-rc05-8's first-token enumeration
- COHERE: applied — the rule contradicts the charter's prose ("runs each against the real `git` … in a disposable repo"), but not its exits (1) and (2), which a grammar check can measure; the rule and rc01's owner agree
- EXECUTE: not applied — no `orbit` contract or extractor exists yet
- FALSIFY: applied — a snippet that parses but is wrong for its moment (a commit before the file it names exists, a push before the commit, a stale token) passes grammar; those stay review's and the phase-1 harness's
- CONFORM: applied — R-crc-10 (the `orbit` grammar is in-repo code the engine can observe), R-crc-14 (the contract derives from the program, never a second copy, which `COMMAND_REGISTRY` breaks), rc01's owner
- FEASIBILITY: applied — the program is built at module scope and parsed on import (D-rc05-7), so in-process introspection needs an exported factory; the completion registry cannot stand in
- CONSUME: applied — the consumer is the suite's failure, read by an author; it must name the snippet, its surface and the rule, as rc01's sweep does
- INVOKE: applied — runs in `npm test` on every build, unlike the source lint, which nothing triggers (Q-crc-14)

## Decisions

- **2026-10-08 — D-rc05-1: rc01 already ships the `gh` half of exits (1) and (2), as grammar, for the three PR references**
  Kind: fact
  `test/core/templates/orbit-content-fidelity.test.ts` ('D6 PR lifecycle surface') extracts every inline-backticked
  `gh` snippet from `pr-choreography.md`, `pr-archive-tail.md` and `pr-resolution.md` by shape (the contract decides
  copyable versus prose) and validates each through the ONE validator the harness stub loads
  (`test/integration/pr-lifecycle/gh-contract-validate.cjs`), with nine negative fixtures run through the extractor.
  It proves grammar, never execution, by its owner's own words.
- **2026-10-08 — D-rc05-2: what no instrument checks today, measured over every generated SKILL.md and reference**
  Kind: fact
  Counted as inline + fenced invocation-shaped snippets (a tool name followed by at least one token), 2026-10-08,
  from `dist/core/templates/skill-templates.js`:
  - `git`: NO coverage anywhere. PR references 16 + 11 + 2 (all inline); `external-handoff.md` 17 + 7;
    `blind-pair.md` 7 + 7; the review SKILL.md 10; archive SKILL.md 3; propose, ff and address-reviews 1 each.
  - `orbit` (our own CLI): NO coverage. About 150 snippets across every body and most references, the most-cited
    tool on the surface.
  - `gh` in BODIES: architect 3, archive 2, onboard 1, outside rc01's sweep, which reads references only.
  - FENCED blocks: never extracted by any instrument; `external-handoff.md` and `blind-pair.md` carry their
    launch, save and commit steps in fences.
  - `codex`, `node`, `npm`: one `node` snippet (external-handoff's temp-dir resolution); the runner's `codex` argv is
    printed by the engine, not written in a body.
- **2026-10-08 — D-rc05-3: the sweep's owner is `orbit-pr-lifecycle`, not `orbit-skill-generation`**
  Kind: fact
  `orbit-pr-lifecycle`'s `Test instruments derive from a recorded real-CLI contract` owns the contract, the stub and
  the sweep ("SHALL prove grammar only (execution is a separate instrument)"; the contract's command set is "exactly
  the commands the references invoke plus the availability probe"). The charter's "Touches: orbit-skill-generation"
  predates rc01. Widening the sweep beyond `gh` or beyond the PR references therefore lands in a requirement whose
  title and scope name the GitHub CLI and the PR references, or in a new one.
- **2026-10-08 — D-rc05-4: rc05 covers every generated surface, inline and fenced**
  Kind: scope
  Sal: "every generated surface". Every SKILL.md and every `references/*.md` file the generator emits, for every
  workflow, inline backticked snippets and shell-fence lines alike. The charter's "three PR references" is superseded
  by this scope.
- **2026-10-08 — D-rc05-5: `orbit` first; `git` and the bodies' `gh` snippets follow**
  Kind: scope
  Sal: "orbit first". `orbit` is the most-cited tool (D-rc05-8) and its grammar lives in this repo. Whether `git` lands
  in this stage or a split child is the size check's to say (R-crc-1, R-crc-9).
- **2026-10-08 — D-rc05-6: every snippet check proves GRAMMAR only, against one contract per tool; nothing is executed**
  Sal: "grammar only". A snippet passes when its argv is accepted by its tool's contract, and the sweep never runs
  the tool. The same holds for `orbit`, `git` and `gh`. Execution stays the separate instrument `orbit-pr-lifecycle`
  already names, and the charter's "runs each against the real `git` … in a disposable repo" is superseded.
- **2026-10-08 — D-rc05-7: `orbit`'s grammar cannot be read from code today, and its only second copy has drifted**
  Kind: fact
  `src/cli/index.ts` builds the commander program at module scope and calls `program.parse()` on import (line 609),
  so no test can introspect it without running it. `src/core/completions/command-registry.ts`'s `COMMAND_REGISTRY`
  is a hand-written grammar beside the program, inherited from upstream, and it already lacks `architecture`, `emit`,
  `external`, `fingerprint`, `instructions`, `status`, `templates`, `schemas` and `new` (measured 2026-10-08). That
  registry feeds shell completion, so users' tab completion is missing those commands too.
- **2026-10-08 — D-rc05-8: the tools invoked on the generated surface, enumerated**
  Kind: fact
  The first token of every argument-carrying inline snippet and shell-fence line, across every generated SKILL.md and
  reference, kept when it resolves to an executable (2026-10-08): `orbit` 164, `git` 100, `gh` 34; POSIX utilities
  `mv` 4, `grep` 3, `mkdir` 2, `head` 2, `rmdir` 1 (upstream's archive steps, propose's move, and pipeline
  fragments); `node` 1 (`node -p "require('os').tmpdir()"`); `sh` 1 (the prohibition "never hand a recorded string to
  `sh -c`"). Words that resolve by accident — `pr`, `command`, `what`, `then`, `at` — are prose.
- **2026-10-08 — D-rc05-9: the `orbit` check is commander's OWN parser, over a program built by an exported factory with every effect neutralised**
  Sal: "B". The CLI's program moves into an exported builder that `src/cli/index.ts` imports and then parses; the
  sweep builds the same program, replaces every action with a no-op, neutralises hooks, exits and output, and hands
  each snippet's argv to `parseAsync`. No contract is derived or recorded: the production parser is the validator, so
  the sweep and the CLI cannot disagree. Rejected: a walked contract with our own validator (a second grammar engine),
  parsing `--help` text (formatting-anchored), and a recorded capture (a third copy that drifts, as D-rc05-7's
  registry has).
- **2026-10-08 — D-rc05-10: `COMMAND_REGISTRY` stays hand-written and is held to the builder's program by a parity test**
  Sal: "B". The registry keeps the completion metadata commander does not carry (`positionalType`, flag `values`,
  descriptions), and a test over D-rc05-9's builder fails whenever the program and the registry disagree on a command
  or a flag. The missing commands are filled by hand in the same stage. Rejected: leaving the drift as a recorded
  question (A) and generating the registry from the program (C, a larger rewrite of its generator input). No spec owns
  shell completion today, so this rule needs a new home; it counts toward the stage's size.
- **2026-10-08 — D-rc05-11: the extractor reads shell-tagged fences and inline spans, and a guard keeps commands out of every other place**
  Sal: "C". A command is extracted from a line in a fence whose info string is `bash`, `sh` or `shell` (one argv per
  line), and from an inline single-backtick span beginning with a covered tool followed by a space. Every other place
  (an untagged fence, a data-tagged fence, a prose line) is not extracted, and a GUARD test fails when a line there
  starts with a covered tool followed by a flag, so a command written in the wrong kind of fence fails rather than
  escaping. The tokenizer is quote-aware, takes a `<…>` placeholder as ONE token even with spaces inside, drops a
  trailing ` # …` comment outside quotes, drops `…` and `...`, and joins lines until an open quote closes. Rejected:
  shell fences only, with no guard (A: a command in an untagged fence escapes silently), and every fence line (B:
  needs a prose classifier, the heuristic rc01 retired).
- **2026-10-08 — D-rc05-12: the engine's fence tracker cannot see half the shell fences on today's surface**
  Kind: fact
  `src/core/markdown-fence.ts` opens a fence only at zero to three spaces of indentation (line 31), with no notion of a
  list container. Four ` ```bash ` blocks sit five spaces deep inside nested list items (continue, ff, propose and
  verify, each `orbit instructions …` or `orbit status … --scenarios`), and CommonMark measures their indentation from
  the list item's content column, so they are fences. A fifth case is a ` ```bash ` block inside the ```` ````markdown ````
  block that holds the external review prompt template: correct CommonMark makes it body text of the outer block, yet
  its lines (`git add`, a three-line `git commit -m "…"`, `git push`) are commands the external AI runs. No CommonMark
  parser is a dependency (2026-10-08). Measured by a throwaway guard that toggled on every fence line and reported all
  five as prose lines starting with a tool and a flag: the naive tracking the engine's tracker exists to avoid.
- **2026-10-08 — D-rc05-13: the extractor and the guard locate fences with a CommonMark library, a dev-only dependency, re-parsing `markdown`-tagged fences**
  Sal: "C". A CommonMark parser (for example `markdown-it`) is added as a devDependency, used only by the test, never
  shipped. Its fence tokens give each fence's info string and content, list-nested fences included. A fence whose info
  string is `markdown` or `md` has its content parsed again, so a shell fence inside a document shown verbatim is
  reached. The same parse decides what the guard treats as outside a shell fence, so the extractor and the guard
  cannot disagree. Rejected: extending the shared tracker (A: a behaviour change on the report renderer and the
  external-findings parser, on Q-crc-15's ground) and an extractor-local grammar (B: a third hand-written fence grammar,
  Q-crc-15's disease).
- **2026-10-08 — D-rc05-14: exit (3) is restated, scoped to the stage's own claim**
  Kind: scope
  Sal: "B". Exit (3) reads: the stage's own system blind pair finds zero grammar defects in a snippet invoking a tool
  the stage covers. It keeps the one check on the sweep's coverage claim made from outside the sweep. "Selector" goes,
  because `gh`'s selector rules are part of its grammar; "the next blind pair" becomes the stage's own; and a defect in
  a tool the stage does not cover cannot fail it. The revision is R-crc-12's first case, recorded in the charter when
  the change revises it.
- **2026-10-08 — D-rc05-15: `git` splits into a child stage, `rc05b-git-grammar`, which depends on rc05**
  Kind: scope
  Sal: "B". rc05 keeps `orbit`: the builder, the parser harness, the registry parity, and the shared extractor, guard and
  CommonMark dependency, which land here because `orbit` is their first consumer. The child takes `git`'s recorded
  contract and validator, the move of rc01's `gh` sweep onto the shared extractor, and the six `gh` snippets in bodies.
  It touches `orbit-pr-lifecycle`'s contract requirement; rc05 does not. R-crc-9 applied preventively at exploration,
  the program's tenth such split (rc17d was the ninth). Declaring the child in `clean-up-review-cycle.md` is a doc edit with its own
  marker update. Rejected: keeping `git` here (A: two independent instruments reviewed at once) and leaving the `gh`
  sweep on rc01's extractor (C: two extractors in the repo).
- **2026-10-08 — D-rc05-16: one NEW capability owns the CLI's grammar, the snippet sweep and the registry parity**
  Kind: scope
  Sal: "a". The three rules share one subject, the program, and no existing capability states it: the builder is the
  one statement of the grammar (D-rc05-9), and the snippet sweep (D-rc05-11, D-rc05-13) and the completion registry
  (D-rc05-10) are the two things checked against it. rc05 is ONE capability, three ADDED requirements, no MODIFIED
  blocks. The working name is `orbit-cli-grammar`; the proposal settles it. Rejected: splitting the sweep into
  `orbit-skill-generation` (B: two capabilities, one pointing across for what "parses" means) and widening
  `orbit-pr-lifecycle` (C: the child stage's requirement, and a PR capability owning the whole CLI). Whether `git`'s
  contract later joins this capability is the child's to decide.
- **2026-10-08 — D-rc05-17: exits (1) and (2) are restated as measurements of escapes and of checks shown able to fail**
  Kind: scope
  Sal: "ratify". (1) On the generated surface at the stage's apply commit, the guard finds zero lines outside a shell
  fence that start with `orbit` and a flag, and every extracted `orbit` snippet parses against the builder's program;
  real defects the sweep finds on today's surface are fixed in the stage, and the extracted count is stated as a figure.
  (2) Each of these, injected into a copy of the surface, fails the suite naming the snippet's surface and line: an
  unknown flag, an unknown subcommand and an extra positional, each in a SKILL.md inline span, a reference, a
  list-nested shell fence, and the shell fence inside the `markdown` fence; an `orbit` command in an untagged fence; a
  program command or flag with no registry entry; and a registry entry with no program command. (3) is D-rc05-14.
  Propose may tighten the wording and may not drop an injection site. The charter's "100% of invocation-shaped
  snippets" was circular once the extractor defines a snippet; this is R-crc-12's first case, recorded in the charter
  when the change revises it.

## Open questions

## Considered & out

- **A walked contract with orbit's own validator** (2026-10-08) — a second grammar engine beside commander's; rejected for D-rc05-9.
- **Parsing `orbit … --help` text** (2026-10-08) — anchors the instrument to a help formatter, the class of rc01's external CRITICAL.
- **A recorded `orbit` capture file** (2026-10-08) — a third copy that drifts, as the completion registry has (D-rc05-7).
- **Leaving the completion registry's drift as a recorded question** (2026-10-08) — Sal took the parity test (D-rc05-10); generating the registry from the program was also out, as a larger rewrite.
- **Extracting every fence line, with a prose classifier** (2026-10-08) — the heuristic rc01 retired; the guard closes the escape instead (D-rc05-11).
- **Extending the shared fence tracker, or a third hand-written fence grammar** (2026-10-08) — the first changes two shipped readers on Q-crc-15's ground; the second is Q-crc-15's disease (D-rc05-13).
- **Keeping `git` in rc05** (2026-10-08) — two independent instruments reviewed at once; split to `rc05b-git-grammar` (D-rc05-15).
- **Executing documented commands in a disposable repo** (2026-10-08) — the charter's original wording; grammar only (D-rc05-6), execution stays the phase-1 harness's.

## References

- `orbit/architecture/clean-up-review-cycle.md` — Stage rc05-executable-references (the charter) and rc01's archive note
- `test/core/templates/orbit-content-fidelity.test.ts` — 'D6 PR lifecycle surface': the `gh` extractor and sweep
- `test/integration/pr-lifecycle/gh-contract.json`, `gh-contract-validate.cjs` — the recorded contract and its one validator
- `orbit/specs/orbit-pr-lifecycle/spec.md` — `Test instruments derive from a recorded real-CLI contract` (the owner)
- `src/cli/index.ts` — the commander program (module-scope build, `program.parse()` at line 609, `emit <emit-command>` at 280, `show`'s `allowUnknownOption` at 409)
- `src/core/completions/command-registry.ts`, `types.ts` — the hand-written completion registry and its two interfaces
- `src/core/markdown-fence.ts` — the shared fence tracker (opens only at 0–3 spaces, line 31)
- Q-crc-15 in `orbit/architecture/clean-up-review-cycle.md` — the engine's two fence grammars
