# External Review: decision-writing (iteration 1)

**Reviewer**: GPT-6 (Codex)
**Date**: 2026-11-08

## CRITICAL

None.

## WARNING

### The shared reference omits alternatives from the plain-language rule
**File**: src/core/disciplines.ts:176
**Description**: `PLAIN_LIST` is composed from `PLAIN_FIELDS`, which excludes `alternatives`. Consequently, the generated reference lists six plain-language fields and describes `alternatives` only as a non-empty array of strings. The archived `orbit-decision-records` requirement “Decision records are written for a reader who knows only the architecture” explicitly binds `alternatives` too; this change carries that requirement unchanged. An agent following the new reference can therefore write unexplained implementation terminology in alternatives while believing it complies. Separate the write gate’s scalar-string validation list from the complete reader-facing field list, include `alternatives` in the reference’s rule, and correct the delta requirement’s corresponding enumeration.

### Archived-change walks cannot obey the new recording instruction
**File**: src/core/disciplines.ts:55
**Description**: The statement requires qualifying calls and stops to be recorded using `--change <name>`, with an exception only for sessions lacking a change and architecture doc. However, `orbit-address-reviews` explicitly supports archived changes, while `resolveTarget` in `src/core/emit-composition.ts` provides archived fallback only for `address-reviews`, not `ledger`, `stop`, or `resolution`. During an archived-change walk, a qualifying decision or stop therefore requires an emit that will fail with “workstream … not found.” The reference’s advice to fix the named field cannot resolve this target mismatch. Define the archived-session recording policy explicitly and reconcile the owning statement, reference, and engine scope contract. If archived decision writes remain unsupported, document that exception rather than directing agents to an impossible write.

### Stop conditions without a question or ledger entry can go unrecorded
**File**: src/core/disciplines.ts:49
**Description**: The operative stop-writing instruction fires before an AI question. The only additional instruction for a stop without a question is the ledger fallback, limited to `security-unprecedented` and `user-facing-uncovered`. There is no corresponding instruction for an unasked `ruling-amendment`, `outward-act`, or `unresolvable-critical` event. For example, when the user directly requests an amendment to an internal architectural ruling and the AI applies it without asking another question, neither operative branch requires a stop record. The archived event table requires a directly raised stop for `ruling-amendment`, independently of a ledger entry. Add explicit handling for these conditions when today’s flow asks nothing, preserving the existing interaction while recording the event, and extend the normative moment table accordingly.

## SUGGESTION

None.

## Blocks

None.

## Direction

**Disposition**: hold

The shared instruction should cover the events and workflow scopes it claims to cover before shipping. Resolve the mismatch with archived walks, restore the complete plain-language rule, and make recording independent of whether a stop condition happens to produce a question.

## Notes

All listed tasks are checked complete. Static inspection found the shared statement and reference wired into the fourteen epitome-bearing workflow templates, with onboard naming the discipline separately.

The scenario-map structural coverage check was **not run**. Both `node bin/orbit.js status --change decision-writing --scenarios --json` and `node bin/orbit.js validate decision-writing --strict` failed to start because `dist/cli/index.js` is absent. This is an environment limitation, not an observed validation failure. Build and tests were not run in the read-only checkout; scenario coverage was not inferred from test-file searches.

No project file, root convention files, perspectives lens, or critical-paths lens was present at the requested locations. Surface inspection focused on generated workflows, decision-record payloads, scope resolution, exploration movement, archived walks, and the archive boundary.

---

I could **not save, commit, or push** the findings because this environment is read-only. Save the report as `orbit/changes/decision-writing/.orbit-runs/external-system-2026-11-08T15:25:39Z.md` and commit/push it manually.