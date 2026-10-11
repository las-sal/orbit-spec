# External Review: rc05-executable-references (iteration 1)

**Reviewer**: GPT-6 (Codex)
**Date**: 2026-10-08

## CRITICAL

None.

## WARNING

### Neutralising every command changes the grammar being checked
**File**: orbit/changes/rc05-executable-references/design.md:49
**Description**: D2 installs `action(noop)` on every command, including command groups that have no production action. Commander uses action presence to decide whether to provide an implicit `help` command and whether a missing subcommand is an error. Consequently, production accepts `orbit help status`, but the prescribed neutralised build rejects it; production rejects a shell-fenced `orbit architecture` for its missing subcommand, but the neutralised build accepts it. This contradicts the claim that the sweep and CLI cannot disagree. Replace only existing action handlers, preserving actionless groups. Add differential cases for implicit help, missing subcommands and unknown subcommands, and explicitly accept only successful help/version exits. These branches are confirmed in [Commander 14.0.3’s source](https://raw.githubusercontent.com/tj/commander.js/v14.0.3/lib/command.js).

### The guard predicate contradicts its required untagged-fence scenario
**File**: orbit/changes/rc05-executable-references/specs/orbit-cli-grammar/spec.md:65
**Description**: The guard fails a line starting with `orbit` followed by a flag. The scenario at lines 130–133 instead requires it to reject `orbit validate --strict`, where the next token is the subcommand `validate`. Under the literal predicate, that line is neither extracted nor rejected. The same gap allows `orbit status --frobnicate` in an untagged fence to escape. Define whether the guard means an immediate flag, a flag anywhere after `orbit`, or any invocation-shaped line beginning with `orbit`; then align the requirement, scenario, proposal, design and task 5.2. Include cases with a subcommand before the flag and an argument-bearing invocation without flags.

### Unterminated quotes have no specified failure or joining boundary
**File**: orbit/changes/rc05-executable-references/specs/orbit-cli-grammar/spec.md:74
**Description**: The tokenizer joins lines until an open quote closes, but specifies neither what happens when it never closes nor whether joining can cross a fence or snippet boundary. For example, a shell fence ending with `orbit status --change "demo` has no valid argument vector. An implementation could discard it, strip the unmatched quote and pass it, or consume subsequent documentation looking for a closing quote. None has a specified outcome, although the sweep is intended to detect invalid snippets. Require joining to remain within the same shell-fence content and require an unterminated quote to fail extraction with the original surface, line and snippet. Define escape handling sufficiently to distinguish an escaped quote from a closing quote, and add failure tests.

## SUGGESTION

### Enumerate installed workflows rather than every template getter
**File**: orbit/changes/rc05-executable-references/design.md:55
**Description**: D3 equates “every generated surface” with each `get*SkillTemplate()`, but `skill-templates.ts` also exports `getFeedbackSkillTemplate()`, which is deliberately excluded from generation under the baseline’s Generated-file disposition requirement. Conversely, the existing `ALL_SURFACE_SKILLS` test list omits architect, so copying it would miss a generated workflow. Specify enumeration from the production workflow registry, or assert that the helper’s workflow set exactly matches it, including architect and excluding feedback.

### The refactor baseline needs a reproducible verification strategy
**File**: orbit/changes/rc05-executable-references/tasks.md:5
**Description**: Task 1.3 calls for tests comparing output with task 1.1’s scratch captures, while task 1.1 explicitly says those captures are not committed. A persistent test depending on them cannot run in a clean checkout. Distinguish a one-time before/after refactor measurement from committed regression tests. Either retain reviewed fixtures for persistent comparisons or record the one-time comparison separately and make committed tests independent of private scratch files.

### Explicitly falsify flag parity as well as command parity
**File**: orbit/changes/rc05-executable-references/tasks.md:29
**Description**: Task 5.3 demonstrates missing and surplus commands, but never mutates a flag. A parity implementation that compares commands correctly while omitting flag comparison could pass these demonstrations. Add missing-program-flag and surplus-registry-flag injections, plus mutations of the compared short name and `takesValue` fields, so the declared flag checks are independently shown able to fail.

## Blocks

None.

## Direction

**Disposition**: hold

The shared production builder is a sound direction, but the proposed neutralisation procedure changes the grammar it is supposed to preserve. The guard also has incompatible written outcomes, and malformed quoting leaves an implementation decision at a consequential extraction boundary. Resolve those contracts before implementation so the new instrument can be trusted to accept and reject the same documented forms consistently.

## Notes

The change contains the required proposal artifacts, one new capability, three ADDED requirements and twelve scenarios. Static inspection found no unresolved inline review markers in the change and no existing baseline capability with the new capability’s name. The archived `gh` contract remains separately owned, consistent with the declared split.

The recurring risk is at the instrument boundary: handler replacement, extraction predicates and malformed-input handling can change what reaches Commander or what Commander accepts, even when both production and tests start from the same builder.

Runtime validation was attempted but could not execute because `dist/cli/index.js` is absent; Commander dependencies are also unavailable in this checkout. This is an environment verification limit, not an observed proposal validation failure.

---

The environment is read-only. I could **not write the findings file or commit/push** it. Save this report as `orbit/changes/rc05-executable-references/.orbit-runs/external-proposal-2026-10-08T20-44-24Z.md` and commit it manually.