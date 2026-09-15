# External Review: rc13-explore-mechanism (iteration 1)

**Reviewer**: GPT-5 Codex
**Date**: 2026-09-15

## CRITICAL

### The per-claim rule model has only per-entry identifiers and dispositions
**File**: orbit/changes/rc13-explore-mechanism/specs/orbit-conventions/spec.md:7
**Description**: The rule test explicitly applies per CLAIM and permits one Decisions entry to contain several claims, but the format gives only the Decisions ENTRY one ID and one `Disposition:`. A fact plus an incidental rule, or two live rule claims in one entry, therefore has no distinct key per rule and no way to give the claims different dispositions; both would collide on the same Mechanism identifier. This makes the central format unparseable under its own cardinality. Require exactly one rule claim per Decisions entry (and require authors to split mixed entries), or introduce claim-level IDs and claim-level dispositions and define their exact mapping to Mechanism entries.

### The purported machine-readable Mechanism grammar does not define parseable boundaries
**File**: orbit/changes/rc13-explore-mechanism/specs/orbit-conventions/spec.md:11
**Description**: “Opens with the rule's identifier”, `Domain:`, `Closure:`, and “one line per move” do not specify a Markdown container, an exact identifier line, where one entry ends, how domain members are encoded, how a BOUNDED residual is delimited, or the syntax/vocabulary of a move-disposition line. The fixed `Disposition:` vocabulary at line 13 governs Decisions-entry lifecycle, not the nine move results. A fresh rc13b implementer cannot write an unambiguous parser from this spec, and the future body exemplar is not a normative grammar. Add a normative fenced grammar with entry boundaries and exact slot productions, plus scenarios for multiple adjacent rules, multiline domains, BOUNDED residuals, all move states, malformed/duplicate IDs, and fenced lookalikes.

### BOUNDED declares an open domain closed and defeats the core obligation
**File**: orbit/changes/rc13-explore-mechanism/specs/orbit-conventions/spec.md:15
**Description**: The requirement says every live rule carries a CLOSED enumeration, then defines BOUNDED as “the domain is open” and treats the token as one of the three closure forms. An author can therefore name any partial list plus an unconstrained residual and satisfy the closure obligation that is supposed to prevent an open domain from reaching propose. This directly contradicts design goal 1 and gives rc13b no honest basis for treating `Closure: BOUNDED` as closed. Either make BOUNDED explicitly remain open for maturity/enforcement purposes, or define a residual as an exhaustive partition member with its own required disposition and make clear what evidence closes it; the taxonomy itself may honestly be bounded without making an open rule domain closed.

### The situation-set test misclassifies quantified facts as rules
**File**: orbit/changes/rc13-explore-mechanism/specs/orbit-conventions/spec.md:7
**Description**: “A SET means rule” does not distinguish normative rules from descriptive predicates. This change's own D-rc13-2 says heading count “has never correlated … under any conditions” (`explore.md:610-618`): asking which situations that empirical claim applies to yields a set of runs/conditions, so the proposed test classifies it as a rule even though the artifact calls it a fact. The same problem applies to any factual claim of the form “the system does X when Y”. Define a rule by normative force—e.g. a claim that prescribes or constrains behavior across possible situations—and explicitly keep quantified empirical/descriptive claims in the FACT class even though they have a logical domain.

### Re-entry is contradictory when both authoritative and staging explorations exist
**File**: orbit/changes/rc13-explore-mechanism/specs/orbit-explore-modifications/spec.md:47
**Description**: The new scenario covers an active-change `explore.md` only when the staging directory does not exist. The carried Mode B resume scenario at lines 98-101 still says that whenever the staging `explore.md` exists it is resumed, with no “no active change” guard. Thus the exact double-truth state this requirement is meant to contain resolves back to the staging copy. An active change that exists without `explore.md` is also unspecified. Replace the overlapping prose with a complete precedence table for active-with-file/staging-with-file combinations: active must win or the command must halt on both-present, and the active-without-file case must say whether to create in place or fail.

### This change does not task the conformance its own exit criterion requires
**File**: orbit/changes/rc13-explore-mechanism/tasks.md:59
**Description**: Section 6 only adds Decision IDs/dispositions and annotates two old cases. It never converts the current case-oriented Mechanism section into one entry per live rule carrying `Domain:`, `Closure:`, and all nine move dispositions. Worse, the current live set decision still says EIGHT (`explore.md:403-420`), there is no successor Decision recording INVOKE, and no actual `@review:` marker records the set growth required by the new requirement. The artifact would still fail rc13a exit criterion 2 after every listed task was completed. Add tasks to enumerate every live rule claim, write a conforming Mechanism entry for each, record the INVOKE growth through the stated trail mechanism, and supersede D-rc13-16 with a nine-move decision.

### The residue sweep is impossible as written and leaks across the two-capability boundary
**File**: orbit/changes/rc13-explore-mechanism/tasks.md:43
**Description**: The declared member set is the unfiltered grep over all `src/`, yet the task explicitly exempts `propose.ts`; that file contains two matching strings today, so the required rerun can never return zero. The same grep orders edits to `audit-drift.ts` and the runtime warning in `emit-composition.ts`, whose baseline capabilities still say “five-section”, while the proposal claims exactly two touched capabilities and the design says no engine change. Make the acceptance command match the intended scope and list explicit justified exemptions, or add the affected capability deltas and re-evaluate the R-crc-1/R-crc-9 split. Do not use a zero-hit assertion whose own excluded member guarantees failure.

## WARNING

### The proposal's Impact section still instructs implementers to change the descoped engine half
**File**: orbit/changes/rc13-explore-mechanism/proposal.md:87
**Description**: Impact still names `explore-counter.ts`'s top rung and `emit-composition.ts`'s explore extensions, then says existing staging directories “parse unchanged”. Those are rc13b's engine responsibilities after the split and contradict the two-capability list and design lines 105-119 (“There is no engine change in this stage”). Remove both engine files and parse/migration language from rc13a's Impact, and replace them with the actual generated-surface test touchpoint.

### The design still states pre-descope goals, capability count, and migration behavior
**File**: orbit/changes/rc13-explore-mechanism/design.md:14
**Description**: Goals 1 and 3 promise unnoticed open domains cannot reach propose and that the engine stops asserting readiness, although D5 and the arc explicitly defer enforcement to rc13b and accept an advisory interval. The Risks section still says the change has three capabilities and an undroppable emit change (lines 84-86), while the current change has two, and the Migration Plan still specifies top-rung behavior (lines 97-101). It also says “20” tasks are inside an “under 20” ceiling even though the actual checklist has 19. Rewrite these sections around rc13a's format-only outcome and move future enforcement claims to the rc13b dependency.

### The missing-move boundary test omits the resource class it was created to admit
**File**: orbit/changes/rc13-explore-mechanism/specs/orbit-explore-modifications/spec.md:23
**Description**: The test's exhaustive-looking IN list names facts, domain, parts, computation, output, consumer, purpose, context, and trigger—but omits resources. FEASIBILITY at line 15 exists specifically because Case 10's `assignCadence` resource blowup did not fit the earlier set. Applying the stated test to that canonical evidence now classifies it OUT even though the move table classifies it IN. Add resources to the boundary test and keep the test's vocabulary mechanically aligned with every move-table row.

### The unconsumed Mechanism section has no declared follow-on stage
**File**: orbit/changes/rc13-explore-mechanism/proposal.md:80
**Description**: The proposal correctly admits that propose's section-to-artifact mapping ignores Mechanism and still validates five sections, but assigns both defects only to “a follow-on stage”. No such stage or dependency is declared in the arc; rc13b owns parsing/readout, not proposal consumption. R-crc-9 permits a split of the correct mechanism across declared stages, not an unnamed residual. Name and declare the owning stage with dependencies, or explain and specify why preserving `explore.md` unchanged is sufficient for Mechanism content to govern generated proposal/design/spec artifacts.

### The design's claimed full derivation omits the evidence that produced three moves
**File**: orbit/changes/rc13-explore-mechanism/design.md:10
**Description**: Cases 6-9 yield the executed-case rejection, the six-move derivation, and the closure/rule tests. FEASIBILITY and CONSUME arise only in Case 10, while INVOKE arises in the subsequent review trail and is not recorded as a successor decision in `explore.md`. Calling Cases 6-9 the “Full derivation” makes the provenance of one third of the bounded set disappear. Cite Case 10 and the exact review finding, or add a worked Case 11 that records and classifies INVOKE under the same method.

## SUGGESTION

None.

## Notes

Strict validation passes, every base fingerprint verifies, and the four MODIFIED blocks retain their baseline scenarios. I also checked the two untouched emit capabilities and found no rc13a delta requirement there; the engine-semantics descope itself is sound, but the proposal/task residue still points back across that seam. I pressed for a tenth move against Cases 1, 7, and 10 and did not promote a speculative class; the concrete failure is earlier and reproducible—the boundary test excludes its own FEASIBILITY/resource evidence. No unresolved inline `@review:` marker remains in the change; the occurrences are prose describing the proposed growth protocol.
