# External Review: orbit-spec user-facing rename (openspec → orbit) — system mode

You are reviewing a large, **behavior-preserving mechanical rename** as an independent second pair of
eyes. Your value is your independent take — be thorough; flag anything that looks wrong, inconsistent,
incomplete, or unsafe. Do **not** be charitable to the authoring AI's reasoning. The rename touched
~180 files; the two classic failure modes you are hunting are:

1. **Missed references** — something that *should* have been renamed `openspec`/`opsx` → `orbit` but
   wasn't (a functional bug: code reads/writes the wrong path, or a user sees a stale name).
2. **Wrongly-changed keeps** — something that *should* have stayed `openspec` (a deliberate
   "keep" — see the boundary below) but got renamed (a functional bug or a broken
   migration/data-format/compat contract).

A third, subtler failure mode: **tautological test updates** — where a test expectation was edited to
match new code output without actually verifying the new behavior is correct (the test still "passes"
but no longer proves anything). Call these out.

## Repo

https://github.com/las-sal/orbit-spec  (branch `main`)

## What this project is

`orbit-spec` is a **self-contained hard fork of `@fission-ai/openspec@1.3.1`**. Commit `d665f12`
(tag `upstream/v1.3.1`) is the pristine upstream tree; orbit's work lands as ordinary commits on top.
The tool has two halves: (1) a spec-lifecycle **engine** (manages a project dir of specs + changes);
(2) a **prompt-generation pipeline** that emits per-AI-tool "skills" and "slash commands" from
TypeScript template modules. Read `CLAUDE.md` for orientation.

## What the rename was trying to do (the intent)

A deliberate, **surgical, user-facing-only** rename of the structural surface from `openspec` to
`orbit`, done **before** a later content-relocation phase (B1). Four things were renamed:

| Surface | Before | After |
|---|---|---|
| CLI bin | `openspec` | `orbit` (`bin/orbit.js`, `.name('orbit')`) |
| Project working dir | `openspec/` | `orbit/` (holds `specs/`, `changes/`, `config.yaml`) |
| Skill dir prefix | `openspec-*` | `orbit-*` (e.g. `.claude/skills/orbit-explore/`) |
| Command namespace | `/opsx:<cmd>` | `/orbit:<cmd>` (`.claude/commands/orbit/<id>.md`) |

**Crucially, the rename was deliberately scoped — these were KEPT as `openspec` on purpose** (renaming
them would break migration, data formats, or upstream-merge legibility; they are deferred to a later
"Tier-C" branding scrub):

- **Global user config/data dir** — `GLOBAL_CONFIG_DIR_NAME` / `GLOBAL_DATA_DIR_NAME = 'openspec'`
  (`~/.config/openspec`, `~/.local/share/openspec`). Renaming would orphan existing global config.
- **Data-format tags** — `format: 'openspec'` and `format: 'openspec-change'` (in parsers, zod
  schemas, JSON output). Renaming is a breaking data/API change.
- **Legacy-cleanup detection** — paths/globs that detect *old openspec installs* to clean up:
  `openspec/AGENTS.md`, `openspec/project.md`, `.claude/commands/openspec/`,
  `.<tool>/.../openspec-*.md` glob patterns, `.cospec/openspec/commands` (costrict). These intentionally
  still point at the OLD tool's leftovers.
- **`OpenSpec` branding prose** (capitalized) in help text, comments, success messages.
- **`.openspec.yaml`** per-change metadata filename (engine-coupled; not user-typed).
- The `/opsx:` rename to `/orbit:` was a separate follow-up change (also complete).

The full intent is documented verbatim in two archived change proposals (read these first — they are
the spec of intent):

- `orbit/changes/archive/2026-06-08-rename-user-facing-to-orbit/proposal.md` + `tasks.md`
  (bin + working dir + skill prefix)
- `orbit/changes/archive/2026-06-08-rename-command-namespace-to-orbit/proposal.md` + `tasks.md`
  (the `/opsx:` → `/orbit:` namespace)

Design rationale lives in `orbit/explore/fork-and-orbify/explore.md` (decision **D13** governs the
"rename now, before content relocation" sequencing).

## Cycle context

- Iteration: 1 (first external review of the rename).
- Tests: `npm test` reports **1369/1369 passing** on the reviewed HEAD. Treat green tests with healthy
  suspicion for a rename — green can mean "expectations were updated to match", not "behavior is right".
- Do not push back on stale findings — pushback discipline is enforced on resolution, not review. Just
  flag what you observe.

## What to read for THIS review

- The two archived proposals + tasks listed above (the rename's intent + the explicit keep/rename
  boundary).
- `CLAUDE.md` (current-state section documents the post-rename surface).
- **The complete rename diff**: `git diff 0abfca7..HEAD` (baseline `0abfca7` is the last commit before
  the rename began; HEAD is `aa6654b`). This is the whole surface under review.
- Code paths most worth walking: `src/core/config.ts` (the `OPENSPEC_DIR_NAME` constant) and every
  call site; `src/core/global-config.ts` (the KEPT global dir); `src/core/legacy-cleanup.ts` (the KEPT
  legacy detection); `src/core/command-generation/adapters/*.ts` (27 adapters, the `orbit/` command
  dir + hyphen variants); `src/core/templates/workflows/*.ts` (skill `name`/`instructions` + command
  `content`/`name`, which reference `orbit/` paths and `/orbit:` commands); `src/core/completions/**`
  (shell completions tied to the bin name); `src/commands/spec.ts` (`SPECS_DIR`).
- `package.json` (bin key), `bin/orbit.js`.

## What to look for (7 passes)

0. **Build/structural sanity** — does `npm run build` succeed; is `bin/orbit.js` wired in `package.json`;
   does `orbit init` produce a coherent `orbit/` tree + `.claude/skills/orbit-*` + `.claude/commands/orbit/`?

1. **Missed references (functional)** — any remaining `openspec` that refers to the *working dir*, the
   *bin/command*, or the *skill/command namespace* but was NOT renamed? Especially: slash-form path
   strings (`'openspec/specs'`), error/log messages that display a path, template-body prose, shell
   completion scripts, help/usage text. A miss here means code looks in the wrong place or a user is
   told the wrong path.

2. **Wrongly-changed keeps (functional / contract)** — verify each KEEP above is intact. Did the global
   config/data dir stay `openspec`? Did `format: 'openspec'` / `'openspec-change'` survive everywhere
   (parsers, schemas, JSON converters)? Does legacy-cleanup still detect the OLD `openspec/AGENTS.md`,
   `.claude/commands/openspec/`, and `.<tool>/.../openspec-*.md` globs? Is `.openspec.yaml` still the
   metadata filename the engine reads/writes? Any keep that was renamed is a bug.

3. **Disambiguation soundness** — the literal `openspec` was overloaded (working-dir vs global-config
   vs data-format vs branding vs legacy-detection vs skill-prefix). Audit whether each occurrence was
   classified into the RIGHT bucket. Look hard at files that legitimately contain *both* a renamed and a
   kept use (e.g. `legacy-cleanup.ts`, `resolver.ts`, `update.ts`, `config.ts`, and the test files for
   each). Flag any misclassification even if tests pass.

4. **Test integrity (anti-tautology)** — for the renamed surface, are tests actually exercising
   behavior, or were expectations merely string-swapped to match new output? Specifically: are there
   tests that would *fail* if a keep had been wrongly renamed (i.e., do tests assert the global dir is
   `openspec`, the format tag is `openspec`, legacy `openspec-*` detection works)? Are the regenerated
   `skill-templates-parity` baseline hashes legitimately derived (not hand-faked)? Did any test lose
   coverage by being reverted wholesale?

5. **Completions + multi-tool adapters** — the bin rename must propagate into shell completion scripts
   (bash/zsh/fish/powershell): function names, `#compdef`, `complete -c orbit`, `compdef`, `orbit
   __complete`, installed completion file names. And the 27 command adapters must emit `commands/orbit/`
   (and correct hyphen variants `orbit-<id>` for flat-file tools) with `transformToHyphenCommands`
   operating on `orbit:`. Walk a few non-Claude adapters for correctness, not just Claude.

6. **Migration / cross-reference integrity** — would a user with an *existing* old openspec project
   experience anything broken or surprising (e.g., global config silently not found)? Are there now
   incoherent states — e.g., a user-facing message that says `openspec` while the dir is `orbit/`, or
   docs/paths that point to moved locations? Note doc-prose under `orbit/` (explore.md, architecture.md)
   that still says `/opsx:`/`openspec/` was intentionally left for a later doc pass — flag only if it
   would actively mislead, not as residue.

## Output format — write to:

`orbit/.orbit-runs/external-rename-system-<TS>.md`

(Where `<TS>` is today's timestamp in ISO format, hyphenated, e.g. `2026-06-08T20-15-00Z`. Pick a fresh
timestamp so this file doesn't overwrite the prompt or prior reviews.)

Use this exact markdown structure:

```markdown
# External Review: orbit-spec rename (iteration 1)

**Reviewer**: <your model name>
**Date**: <YYYY-MM-DD>

## CRITICAL

### <Finding title>
**File**: <path>:<line>
**Description**: <what's wrong + specific recommendation>

(For each additional CRITICAL finding, repeat the `### <Title>` + `**File**:` + `**Description**:` triple. Use `None.` as a single-word body if there are no findings at this severity.)

## WARNING

### <Finding title>
**File**: <path>:<line>
**Description**: <what's wrong + specific recommendation>

(Same shape as CRITICAL. Use `None.` if no findings.)

## SUGGESTION

### <Finding title>
**File**: <path>:<line>
**Description**: <what's wrong + specific recommendation>

(Same shape. Use `None.` if no findings.)

## Notes

<Optional: overall impression of the rename's completeness + safety. Omit the whole section if nothing to add.>
```

If your environment doesn't support file writes (chat-only interface), output the markdown directly and
the user will save it.

## After completing the review

1. **Output the full findings markdown in chat** — in addition to writing the file, output the COMPLETE
   findings markdown in this chat (every severity section, every `### Title`, every `**File**:` /
   `**Description**:`). Do NOT abbreviate — the chat output is the immediately-visible read.

2. **Commit and push the findings file** (if your environment supports git):

   ```bash
   git add orbit/.orbit-runs/external-rename-system-<TS>.md
   git commit -m "External review (system, iter 1): orbit-spec rename

   <one-line summary: severity counts + headline finding if any>"
   git push
   ```

If you don't have git access, output the findings markdown in chat and the user will commit it.
