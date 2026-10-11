# Body inventory — the six heaviest generated bodies, tagged by kind

Per D-d5-1's four kinds: **(1) mechanical → engine**, **(2) rarely-needed → references/**,
**(3) judgment → stays (the product)**, **(4) duplication → delete into one home**.
Token figures are bytes/4 estimates from the generated surface (2026-07-30, post-D4,
surface v16). Six bodies total ≈ **40.6k tokens**; every skill invocation loads its full body.

## orbit-address-reviews (9.8k) — the heaviest, and the most engine-absorbable

| Section | tok | Kind | Note |
|---|---|---|---|
| preamble | 649 | 3 | orientation; lean |
| Four disciplines | 673 | **4** | the ×16 block |
| Steps/1 Discover (or ingest) | 1636 | **1** | discovery priority order, scope resolution, auto-discovery recency+tie-break, format sniff — a resolver spec taught as prose; `orbit findings <scope> --json` returning the work-list would delete most of it |
| Steps/2 Triage | 309 | 1/3 | list rendering mechanical; the preview protocol stays |
| Steps/3 Walk + batch triggers | 577 | 2/3 | batch-trigger table → reference; walk default stays |
| Steps/3b Classify | 441 | 3 | classification judgment — the product |
| Steps/3b.5 Decision lane | 1565 | 3 + 1/2 | the lane PROTOCOL stays (~750); fork DETECTION machinery (structured/heuristic rules, malformed handling ~600) is mechanical; recording shape (~200) → reference |
| Steps/3d Ripple cascade | 732 | 1/3 | IN/OUT category tables + reason codes are engine-classifiable policy (~400); cascade judgment stays |
| Steps/3e Remove marker | 261 | 1 | mechanical transform rules |
| Steps/5 Report | 447 | 1/2 | resolution-log render — the D4 report pattern applies verbatim (engine render of the walk log) |
| Steps/6 Persist | 204 | **1** | emit composition (see work-list #1) |
| Marker syntax | 184 | 2 | table |
| Constraints | 205 | 3 | stays |
| Worked examples ×2 | 899 | **2** | classic references/ material |
| Graceful degradation | 795 | 1/2 | error-path enumeration; if discovery moves to engine these become engine errors and the prose dies |

**≈4.5k engine-absorbable · ≈1.6k references · ≈0.7k delete (disciplines) · ≈3k judgment core**

## orbit-review (8.3k) — pass definitions are the core; the plumbing around them is not

| Section | tok | Kind | Note |
|---|---|---|---|
| preamble | 553 | 3 | |
| Four disciplines | 679 | **4** | |
| Steps/1–3 mode/target/flag resolution | 949 | **1** | mode inference is checkbox arithmetic the gate engine already does; flag table → engine validation or reference |
| Steps/4 Load context | 311 | 1/2 | contextFiles already come from the CLI |
| Steps/5 Inspect prior runs | 205 | **1** | iteration counting is ALREADY engine (report ordinal); prose residue |
| Disjunctive recommendations | 567 | 3/2 | emission judgment stays; shape → reference |
| Pass definitions (9+7+6) | 2250 | **3, mode-split 2** | THE editorial core — but only ONE mode's passes are needed per run; splitting per-mode into references/ makes ~⅔ lazy per invocation without losing a word |
| Scorecard mappings | 314 | 2 | tables |
| Steps/8 Commentary | 187 | 3 | |
| Steps/9 Persist FIRST | 446 | **1** | emit composition + deterministic facts the engine could compose (it already validates them — D4 built the rejector; the composer is the other half) |
| Steps/10 Render/paste | 259 | 3 | already lean post-D4 |
| Steps/11–13 (--mark/--parallel/--focus) | 518 | 2 | rarely used flags |
| Special cases / output / example | 648 | 2 | |

**≈1.9k engine · ≈3.4k references (incl. the mode-split ⅔ of passes) · ≈0.7k delete · ≈2.3k judgment resident**

## orbit-explore (7.1k)

Upstream stance (~2.4k) = judgment, the product — stays. Four disciplines 477 = **4**.
Modes/convention/capture tables (~1.9k) = protocol (3) with format shapes (~0.6k) → 2.
**Run-summary emit section 2115 = kind 1**: begin/boundary rules, same-second collision,
and the maturity grid — the grid is literally computable (decisions × open-questions counts
the engine can read from explore.md; it would compose `next_recommended` itself).

**≈1.7k engine · ≈0.8k references · ≈0.5k delete · ≈4.1k judgment**

## orbit-audit-drift (5.9k)

Steps (~2.6k) = check procedures, mixed 3 with mechanical sweep specs (~0.8k → 1).
Output format 744 → 2. Worked example 440 → 2. Emit section 915 → **1**.
Disciplines 595 → **4**.

**≈1.7k engine · ≈1.2k references · ≈0.6k delete · ≈2.4k judgment**

## orbit-onboard (4.8k)

Narrative teaching body — judgment/reference blend; the canonical-flow walkthrough (2.1k)
is reference-shaped but IS the lesson. Lowest priority; revisit only after the heavy three.

## orbit-archive-change (4.7k)

Upstream preamble 1.0k = 3/2. Disciplines 424 = **4**. Consent step 627 = protocol (3)
with provenance rules partly table-izable. The three anomaly-check steps (gate 372 +
fingerprint 679 + audit 392 ≈ 1.4k) = **the checks are already engine-computed**
(status/fingerprint); a single `orbit archive --preflight --json` returning all check
states would collapse three prose steps into one call + the prompt judgment (~0.9k → 1).
Summary/stage-line/edge cases ~0.9k = 2/3 mix.

**≈1.1k engine · ≈0.9k references · ≈0.4k delete · ≈2.3k judgment**

## Totals across the six (≈40.6k)

| Destination | ≈tokens | share |
|---|---|---|
| **Engine (kind 1)** | **≈11k** | 27% |
| references/ (kind 2, incl. mode-split passes) | ≈8k | 20% |
| Delete duplication (kind 4, disciplines ×6 here; ×16 ≈7.5k surface-wide) | ≈3.5k | 9% |
| Judgment — stays resident | ≈18k | 44% |

A successful D5 pass over these six ≈ **halves the resident token cost** while the judgment
prose survives verbatim.

## Engine work-list (kind-1 candidates, ranked by D4-shape-similarity)

1. **Emit composition** — `orbit emit`-style surface: engine composes the spine + deterministic
   facts (D4 already REJECTS drift in them; composing is the other half of that move), AI
   supplies narrative fields only. Deletes emit sections from review/address/explore/audit
   bodies (~4k across the surface) and closes the hand-composition error class.
2. **Findings resolver** — `orbit findings <scope> --json`: discovery priority, format sniff,
   recency/tie-breaks, virtual-marker construction. Deletes ~2.4k from address-reviews.
3. **Archive preflight** — one `--json` call returning gate/fingerprint/audit/marker states;
   collapses three prose steps.
4. **Review mode inference + iteration arithmetic** — both already computed elsewhere in the
   engine; prose re-states them.
5. **Maturity grid** — explore's next_recommended computed from counts the engine can read.
6. **Resolution-log render** — the D4 report pattern applied to the walk log (later; needs the
   log shape to settle first).

## The ×16 disciplines block (kind 4)

~350–680 tok per body, ≈7.5k surface-wide. Options to weigh (open question, not decided):
single shared reference loaded by all bodies vs. a much shorter per-body epitome (2–3 lines)
pointing at one canonical home vs. keep as-is where duplication is load-bearing (D1's
"self-contained reliability" rationale). Interacts with how skills load references.

## After — D5 apply measurement (2026-08-05, task 7.3; bytes/4 on the template instructions literals)

| Body | before | after | what moved |
|---|---|---|---|
| orbit-address-reviews | 9.8k | 5.4k | epitome; Step-1 discovery compacted; batch table + fork machinery + recording shape + worked examples ×2 + degradation → `references/resolution-detail.md`; Step 6 → `orbit emit address-reviews`; pushback procedure moved in-situ to Step 3a |
| orbit-review | 8.3k | 4.4k | (6.2 mode-split already −2.5k) epitome; Steps 1–2/5 compacted; disjunctive compacted; `--mark`/`--parallel`/`--focus` → `references/flags-detail.md` |
| orbit-explore | 7.1k | 5.7k | epitome; emit section (grid/JSON/collision) → `orbit emit explore`; capture formats → `references/capture-formats.md`; crystallization sketch trimmed. Upstream stance (~2.4k) untouched per D14 |
| orbit-audit-drift | 5.9k | 3.9k | epitome; emit + all four `next_recommended` combos → `orbit emit audit-drift`; worked example → `references/worked-example.md`; disjunctive compacted |
| orbit-onboard | 4.8k | 4.7k | 7.4 re-teach ADDED (emit surface, merged `--reviewer external`, boot render, touchpoints; table 16→15); Phases 3–4 deduplicated against the owning skills |
| orbit-archive-change | 4.7k | 4.5k | epitome; Step 5.5 → `orbit emit archive`; Step 5.6 trimmed. Consent + gate + fingerprint protocol stays (archive preflight = deferred engine work-list #3) |
| **Six-body total** | **40.6k** | **28.5k** | **−30%; target ≤20k NOT met** |

Other bodies (7.1/7.2 sweep): apply 4.1→3.2, propose 4.5→3.9, verify 3.0→2.0, architect 2.2→2.1,
continue 2.4→1.9, ff 2.1→1.7, new 1.6→1.0, sync-specs 1.5→1.4, bulk-archive 3.1→3.1.
Full-surface total ≈ 49.4k (was ~63k).

**Why the ≤20k target is missed**: the inventory's ≈18k-judgment projection priced in engine
work-list items #2 (findings resolver — would delete ~2.4k of address-reviews discovery/degradation
prose) and #3 (archive preflight — ~1.4k of archive check prose), which D5 scoped OUT (only #1 emit
composition and #5 maturity grid shipped). What remains resident is protocol/judgment prose:
consent + gate inflection protocols, the decision-lane protocol, discovery priority order, upstream
explore stance (D14-protected), and onboard's walkthrough lesson. Reaching ≤20k requires the
deferred engine items, not further prose compression — flagged for the review-system pass and the
arc exit-criterion-1 reading.
