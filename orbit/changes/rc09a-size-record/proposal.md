## Why

R-crc-1 sets a size ceiling for a design-heavy change: at most 3 capabilities, about 12 requirements, about 40 KB of
changed delta, under 20 tasks. A proposal over it is split before review or declared. Nothing in the engine knows the
ceiling exists. Every one of the ten preventive splits on the program's record was caught by hand, and eleven
rc-stages went over on at least one dimension, every one split or declared and ratified (see explore.md, D-rc09-2).
The figures were always computable: the exploration computed all four for 37 archived changes from artifacts the
engine already reads (D-rc09-1). R-crc-1's 2026-09-23 clarification says the byte figure counts CHANGED bytes, not
the requirement text a MODIFIED block must carry whole. The exploration settled that as the NEW side: 14.1K for rc04c,
against the clarification's own estimate of about 14K (D-rc09-3).

This is the size half of rc09-propose-hygiene, split at its exploration (D-rc09-13). The external-tool half is
`rc09b-tool-inventory`.

## What Changes

- The engine computes four figures for a change: capabilities touched, requirements touched, new-side changed bytes,
  and tasks. Changed bytes are ADDED blocks whole plus, for each MODIFIED block, the bytes of its lines absent from the
  baseline block, counted as a MULTISET of lines. That matched git's diff on 221 of 227 archived blocks and was never
  more than 1.3% off (D-rc09-3, D-rc09-14).
- An opt-in `size_ceiling:` map in `orbit/config.yaml` holds the maxima, four optional positive integers. A breach is
  a figure STRICTLY GREATER than its maximum. With the key absent, nothing is compared. This repo opts in with
  R-crc-1's figures as exact maxima: 3, 12, 40960, 19 (D-rc09-5).
- A breach is DECLARED in a `## Size` section of `proposal.md`, one list item per breached dimension:
  `- <dimension>: <reason>`. The engine checks that each breached dimension is named, and never reads the reason
  (D-rc09-7).
- `orbit validate <change>` reports an undeclared breach at WARNING and a declared one at INFO. Non-strict validation
  never fails on size; `--strict` fails exactly an undeclared breach. The engine names each breached dimension with
  its figure and maximum; where to split stays the author's judgement (D-rc09-4).
- `orbit status --change <name>` carries the figures: always as a JSON field, because effort is recorded
  (R-crc-11(h)), and as a human line when `size_ceiling` is configured. The propose body reads them after generation
  and briefs any breach before review (D-rc09-6).
- The size PROXIMITY computation that R-crc-4's near-ceiling proposal pair depended on is dropped. The 2026-10-05
  amendment made the blind pair the default preference for every proposal. `orbit-engine-gates`' sentence promising
  it "until it ships" is repointed at the size requirement (D-rc09-8).

## Capabilities

### New Capabilities

- `orbit-change-size`: the four figures and how each is counted; the opt-in `size_ceiling:` key; the `## Size`
  declaration grammar; the validate issue table; the status field and line (D-rc09-1, -3, -4, -5, -7, -14).

### Modified Capabilities

- `orbit-propose-modifications`: one ADDED requirement. After generation, the propose body reads the size figures and
  briefs any breach before review, and offers the `## Size` declaration as a checked mirror of the owner's grammar
  (D-rc09-6, D-rc09-7).
- `orbit-engine-gates`: `spec-driven v1 gates and cadence` drops the "the size computation belongs with rc09 … until
  it ships" sentence and points at `orbit-change-size`. The proposal gate's cadence stays unconditional (D-rc09-8).

Size: three capabilities, at R-crc-1's ceiling, measured at exploration; 6 ADDED and 1 MODIFIED requirements. No
`## Size` section is owed: no dimension is over.

## Impact

- New `src/core/change-size.ts`: the four figures, the multiset byte count, and the `## Size` parse.
- `src/core/project-config.ts`: `resolveSizeCeiling`, read alone like `resolveReviewPreference`.
- `src/core/validation/validator.ts`: the size issues on `orbit validate <change>`.
- `src/commands/workflow/status.ts` and the change-status composition: the `size` JSON field and the human line.
- `src/core/templates/workflows/propose.ts`: the post-generation size brief and the grammar mirror.
- `orbit/config.yaml`: opts in, with a documented comment block.
- `orbit/specs/orbit-engine-gates/spec.md`: one sentence, at sync.
- No migration: an archived change is never validated, and the check is off wherever the key is absent.
