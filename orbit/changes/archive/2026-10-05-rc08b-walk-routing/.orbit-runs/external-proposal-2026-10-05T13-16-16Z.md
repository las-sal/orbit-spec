# External Review: rc08b-walk-routing (iteration 1)

**Reviewer**: GPT-6 Codex  
**Date**: 2026-10-05

## CRITICAL

### Verbatim carry-forward can prevent a resumed walk from being emitted
**File**: orbit/changes/rc08b-walk-routing/specs/orbit-address-reviews/spec.md:197  
**Description**: Requiring earlier resolved entries to be copied verbatim conflicts with the existing walk write gate. Historical resolved entries without `sweep`, or using only legacy `status`, are accepted when reading existing logs but refused in newly emitted logs. Even a modern entry can fail when its recorded `sweep.introduced` text has subsequently been legitimately revised. The resumed walk therefore cannot necessarily write the complete replacement record this requirement demands. Define carry-forward semantics compatible with write-time validation—for example, rechecking previously closed findings and recording stale-with-evidence where appropriate—and cover historical entries and superseded sweep text explicitly. Leaving old files untouched does not exempt entries copied into a new payload.
**Reproduction**: Construct active change `foo` with an unresolved proposal pass containing WARNING findings A and B. Its latest historical walk records A as `outcome: "resolved"` without `sweep`, and B as `outcome: "deferred"`. Invoke `/orbit:address-reviews foo`, resolve B with valid current sweep evidence, and apply line 197: copy A verbatim into the new log. Expected: the resumed walk emits a complete log and clears the pass’s unresolved findings. Observed under the proposed rule plus the existing write-gate contract: emission refuses A with `resolutions[0].sweep is required on a resolved entry`, writes no replacement log, and leaves the pass unresolved. A read-only probe of the existing validator confirmed this refusal; legacy `status`-only entries are also refused.

## WARNING

### The openPair cardinality rule disagrees with the predicate it must expose
**File**: orbit/changes/rc08b-walk-routing/specs/orbit-engine-gates/spec.md:301  
**Description**: “Exactly one pairable member stands” and “Absent otherwise” exclude a trail containing two pairable fresh passes and no external pass. The existing engine reports `openPair: {missing: "external"}` for that trail, and design D1 explicitly requires copying that computed fact. Implementing the spec’s cardinality condition would omit the field, allowing discovery to walk both fresh passes despite the engine’s instruction to obtain their missing partner first. Define this field directly through the existing predicate, without an exactly-one-pass restriction, and add the multiple-same-class case.

### Per-source emission conflicts with invocation-wide batch semantics
**File**: orbit/changes/rc08b-walk-routing/specs/orbit-address-reviews/spec.md:195  
**Description**: This requirement demands writing each source’s log before beginning the next source. The unchanged baseline `Walk-mode by default with --batch opt-in` requires resolving all findings before one final aggregated cascade; the carried batch-log scenario also places cascade records at the end of the batch. With two discovered sources and `--batch`, the first log cannot contain completed sweep evidence before that final cascade, yet processing the second source first violates the new ordering. Decide whether batching is per source or per invocation, reconcile the affected baseline requirements, and specify the corresponding emission and interruption behavior.

### Converged findings are marked stale even when their earlier counterpart remains open
**File**: orbit/changes/rc08b-walk-routing/specs/orbit-address-reviews/spec.md:199  
**Description**: The rule unconditionally resolves a converged finding in the earlier log and marks later copies stale. It has no branch for an earlier finding that is deferred, excluded by triage scoping, or escalated for an essential redesign. For example, two passes identify the same missing mechanism; the earlier entry is correctly escalated under the redesign table, but the later entry must nevertheless become stale under this paragraph. The engine then considers the later pass resolved and stops discovering it, although its claim remains valid. Make stale treatment conditional on evidence that the shared finding is actually closed; preserve an open disposition when the earlier entry remains open. Add a converged essential-redesign scenario.

### A partial audit walk permanently removes its remaining findings from discovery
**File**: orbit/changes/rc08b-walk-routing/specs/orbit-address-reviews/spec.md:17  
**Description**: Audit discovery tests only whether any log names the audit’s basename. Consider an audit with two WARNINGs: a scoped or interrupted walk resolves one and leaves the other deferred. Its log now names the audit, so subsequent discovery excludes the entire source and can report “Nothing to walk.” The new rediscovery rule repairs this for reviewed passes but does not cover audits, which have no reviewed-gate list to restore them. Specify how audits with omitted, deferred, or escalated findings remain reachable automatically, or explicitly surface their outstanding work and required `--from-file` route instead of reporting a clean discovery result.

### Essential-redesign routing assumes an active change in a command supporting other scopes
**File**: orbit/changes/rc08b-walk-routing/specs/orbit-address-reviews/spec.md:227  
**Description**: The new remedy requirement applies to walk entries generally, but its essential-redesign route always records `orbit/changes/<name>/explore.md` and promises that `/orbit:explore <name>` resumes there. Address-reviews also supports archived changes, project-wide audits, and architecture findings. An archived `foo` has no active directory at that path; the existing explore re-entry table creates or resumes a staging exploration instead. Project and architecture walks may have no change name at all. Scope this route explicitly to active changes and define the other supported cases. For active changes, defer to the full re-entry table rather than promising unconditional resume: simultaneous staging and active directories are refused.

### The T0 handoff describes a walk where the engine can recommend verification
**File**: orbit/changes/rc08b-walk-routing/specs/orbit-run-summary-emit/spec.md:22  
**Description**: The new sentence says that after saving the return, the eligibility line names the missing pair member or otherwise the change-scoped walk. A completed blind pair with no substantive findings needs no walk. With cadence `[blind-pair, in-context]`, the engine instead recommends `/orbit:review --as system foo` for the remaining slot. A read-only probe confirmed that result, and this change deliberately leaves that branch unchanged. Replace the incomplete enumeration with a pointer to canonical-next computation, or explicitly qualify the walk case by unresolved findings. Include a clean-return handoff scenario.

### Suggestion entries have conflicting remedy obligations
**File**: orbit/changes/rc08b-walk-routing/explore.md:137  
**Description**: The mechanism table makes `remedy` optional for SUGGESTION entries, while the delta at `specs/orbit-address-reviews/spec.md:220` requires it on every resolved entry, without a severity exception. Design’s mechanism-to-artifacts mapping presents this rule as carried forward without identifying that policy change. A resolved suggestion can therefore be conforming under the exploration and nonconforming under the spec. Choose the intended obligation, record the amendment, and align the generated reference examples and tests.

## SUGGESTION

### The discovery table’s empty-result row is unreachable under first-match semantics
**File**: orbit/changes/rc08b-walk-routing/specs/orbit-address-reviews/spec.md:20  
**Description**: Rows 3, 5, 6, and 7 exhaust the invocation shapes before row 8, while the fence declares “first match wins.” An active change with an empty union matches row 5 and never reaches “nothing discovered.” The scenarios clarify the intended output, but the normative table should make the empty-result check a postcondition of discovery, rather than another competing row.

### The recorded scenario totals are stale
**File**: orbit/changes/rc08b-walk-routing/design.md:92  
**Description**: The design reports 66 delta scenarios, eight covered, and 58 needing declarations; its risks section repeats 58. The current scenario map reports 72 delta scenarios, eight text-covered, and 64 uncovered, with no orphan or malformed entries. Refresh both statements from the current artifact set so the implementation workload and close-out evidence agree.

## Blocks

None.

## Direction

**Disposition**: hold

The engine-owned discovery list is a sound direction, but the proposed resume contract cannot consistently coexist with the shipped write gate. Resolve that incompatibility and settle the multi-source disposition, batching, and routing rules before implementation. Otherwise an implementation can follow individual requirements faithfully while failing the combined workflow.

## Notes

Reviewed the local `d-arc` checkout at `c71692af` as a proposal. Strict validation succeeded with informational scenario-coverage notices only, and all modified baseline fingerprints matched. The marker sweep found documentation references rather than unresolved inline review requests.

Read-only probes exercised the existing sweep validator, open-pair computation, per-pass resolution predicate, and clean-pair recommendation. The principal risk is the interaction between newly prescribed workflow behavior and unchanged engine contracts; ordinary two-pass happy-path coverage would miss these cases.