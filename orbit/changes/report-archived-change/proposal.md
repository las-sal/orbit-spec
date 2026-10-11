## Why

`orbit status --change <name> --report` cannot render a review pass once its change is archived. It resolves the change through `validateChangeExists`, which looks only at the active `orbit/changes/<name>/`, so `orbit status --change rc10-apply-closure --report` fails with `Change 'rc10-apply-closure' not found`. The archived trail is where a report is most useful — reconstructing how a change converged — and the repository holds over thirty archived changes whose passes no reader can render. Opened as Q-crc-26 (found 2026-09-22 by rc04c's external proposal pass); this change also carries the first real run of the D6 PR lifecycle (`pr: per-proposal`), the dogfood D-rc12-1 records.

## What Changes

- `--report` resolves its change ACTIVE FIRST, then falls back to the lexically greatest `orbit/changes/archive/<YYYY-MM-DD>-<name>/` — the resolution the emit surface already performs for `address-reviews` (one helper, shared, not a second copy).
- A miss in both places fails with a clean error naming both locations it checked.
- The report of an ARCHIVED change renders its findings, header, iteration, trend and pass genre exactly as before, from the archived trail. Its ENGINE TAIL is one computed line, `Archived: <repo-relative archived directory>`, in place of the gate line, position readout and eligibility line: no live gate computation runs for an archived change, because today's schema would grade a trail written under an earlier schema version's rules.
- Every other `orbit status` form (bare, `--full`, `--change` without `--report`, `--boot`, `--scenarios`) is unchanged: they still resolve active changes only.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `orbit-report-rendering`: the status-gateway requirement gains the archived fallback and its miss error; the render-time computed context requirement gains the archived tail; the report grammar requirement's tail list names the archived line.

## Impact

- `src/commands/workflow/status.ts` — the `--report` branch resolves through the new resolution instead of `validateChangeExists`.
- `src/core/report-render.ts` — `renderReport` takes the resolved change directory and whether it is archived; `buildReportContext` composes the archived tail instead of the live gate computation.
- `src/core/emit-composition.ts` — `findArchivedDir` moves to a shared module so the emit surface and the report read one resolver.
- Tests: `test/core/report-render.test.ts` (resolution, the archived tail, the miss error, read-only), with a golden for the archived tail.
- No schema, config, workflow-body or generated-surface change.
