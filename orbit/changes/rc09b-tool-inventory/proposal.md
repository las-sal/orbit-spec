## Why

D6 wrote 108 KB about `gh` before anyone ran `gh`. rc01 and rc05b gave `gh` and `git` recorded contracts, and rc05 gave
`orbit` its program. Nothing yet makes a contract the price of a NEW tool: a body can start invoking a tool the
surface never recorded, and no test notices. rc09's charter asked for a spike precondition on proposals that touch an
external tool. The engine cannot observe which tools a proposal's prose touches (R-crc-10), so exit (2) was revised to
an inventory test over the generated surface (D-rc09-12, see explore.md).

That test as chartered read only shell fences. Re-measured on 2026-10-11, every one of the surface's `gh` invocations
is an inline code span (D-rc09b-2). A fence-only inventory would have passed the tool that motivated it. The inventory
therefore also reads inline segments that carry a flag (D-rc09b-1).

## What Changes

- A new test, the TOOL INVENTORY, reads every command head on the generated surface: each segment of a shell-fence
  line (list-nested and markdown-nested fences included), and each segment of a single-backtick inline span whose head
  is a lowercase bare word and which carries a flag token. A head that is not a recorded tool and not on the declared
  exemption list FAILS the suite, naming the surface, the line and the head.
- The recorded tools are DERIVED, never listed: `orbit` (its program) plus every tool the recorded-contract sweep
  validates (`git`, `gh` today).
- The exemptions are stated ONCE, as a fenced block in the new requirement, which the test reads (D-rc09b-3):
  utilities and builtins (`mv`, `mkdir`, `grep`, `rm`, `rmdir`, `head`, `tail`, `cd`, `[`, `command`, `sh`, `node` —
  `node`, `sh` and `command` declared rather than recorded, D-rc09b-4), the runner placeholder `<argv[0]>`, and four
  prose heads, message templates that carry a flag (`argument`, `reach`, `skipped`, `unknown`).
- The `orbit` snippet requirement's tool-set table, which lists the utilities as "not covered", is stale today (it
  names five of the twelve). It is replaced by a pointer to the new requirement. Its named limit, which described an
  enumeration method the inventory supersedes, is replaced by the inventory's own BOUNDED limit.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `orbit-cli-grammar`: ADDED `Every command head on the generated surface is a recorded tool or a declared
  exemption`. MODIFIED `Every \`orbit\` snippet on the generated surface parses against that program`: its tool-set
  table and that table's named limit become a pointer to the new requirement.

## Impact

- `test/helpers/surface-snippets.ts` — a head walk over the same markdown-it parse and tokenizer the extractor uses.
- A new test under `test/core/cli-grammar/` — the inventory sweep, the exemption-block reader, and an injection case
  per row.
- `orbit/specs/orbit-cli-grammar/spec.md` at archive. No engine code, no generated body, no template changes.
