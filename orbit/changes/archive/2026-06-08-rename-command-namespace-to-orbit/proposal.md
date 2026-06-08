## Why

A2 renamed the user-facing surface to orbit (bin `orbit`, working dir `orbit/`, skill dirs `orbit-*`)
but **deliberately kept the `/opsx:` command namespace** as a parked decision. `opsx` is openspec-
derived (op-s-x), so it is now the lone naming incongruity in an otherwise cohesive orbit surface.

This completes the user-facing rename **before B1** — the same sequencing logic that drove A2. B1
relocates all the workflow body prose, which references the command namespace heavily (`/opsx:propose`,
`/opsx:apply`, …). Renaming now means B1 authors `/orbit:` from the start instead of being re-swept
later. After this change the surface is fully cohesive: bin `orbit` · dir `orbit/` · skills `orbit-*` ·
commands `/orbit:*`.

`opsx` is **unambiguous** (unlike `openspec`, which overloaded working-dir / global-config / data-format
/ branding). Every occurrence is our command namespace, so this is a clean mechanical sweep with no
keep-exceptions in code.

## What Changes

- **Command namespace `/opsx:` → `/orbit:`** across the generator and prose:
  - All command adapters' file paths: `<tool>/commands/opsx/<id>.md` → `<tool>/commands/orbit/<id>.md`
    (and the flat-file/hyphen variants `opsx-<id>` → `orbit-<id>`).
  - `transformToHyphenCommands` colon→hyphen rewrite now operates on `orbit:` → `orbit-`.
  - `/opsx:<cmd>` invocation references in the 11 workflow template bodies → `/orbit:<cmd>`.
  - Command display-name fields `OPSX: <Verb>` → `ORBIT: <Verb>` (and the "(OPSX)" description tag).
- **No change** to command `id`s (`explore`, `new`, `apply`, …), workflow ids, skill dir names
  (`orbit-*`, from A2), or the engine.

## Capabilities

### New / Modified Capabilities

(none — behavior-preserving rename of the command namespace; no spec deltas. Archived `--skip-specs`.)

## Impact

- **Affected source**: the 27 command adapters (`command-generation/adapters/*.ts`), the 11 workflow
  template modules (`/opsx:` body refs + `OPSX:` name fields), `command-generation/types.ts` doc.
- **Affected tests**: command-generation/adapter tests, template/body assertions, parity hashes
  (command + skill bodies and name fields changed). Must return to 1369 green.
- **Out of scope / left as-is**: design-doc prose under `orbit/` (explore.md, architecture.md) that
  references `/opsx:` historically — descriptive, not the generation mechanism; a Tier-C doc pass.
- **Sequencing**: lands on its own branch with green checkpoints, merged **before B1**.
- **Backward compat**: fork-internal; orbit now emits `/orbit:` commands. (No external consumers.)
