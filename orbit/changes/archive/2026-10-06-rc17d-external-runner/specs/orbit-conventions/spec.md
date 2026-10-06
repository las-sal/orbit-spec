## MODIFIED Requirements

### Requirement: Review mode decision framework

The system SHALL define orbit's three reviewer classes (in-context, fresh, external — the `--reviewer` axis on the merged `/orbit:review` surface, D-arc Stage D5; "mode" belongs to `--as proposal|system|architecture`) and its two PASS GENRES — REVIEW and VERIFICATION — and SHALL state ONCE, here, how a pass's genre is determined and what a REVIEW-genre brief may carry. Every other surface (the external prompt, the renderer, the other specs) names this requirement and points; the ONE exception is the review body, which carries the pass-genre table below as a CHECKED MIRROR — it says so, names this owner, and a parity test holds it byte-equal to the fence (R-crc-14's mirror corollary); nothing else restates it. "Pass genre" is a DIFFERENT AXIS from the RENDER genre — internal versus external, the SOURCE of a pass's record — that `orbit-report-rendering`'s `One grammar for internal and external passes` and `orbit-review`'s `Iteration note when prior runs exist` already name; every use here is qualified "pass genre", and a field that ever stores the word is named `pass_genre`. The framework exists because empirical evidence (notably `bootstrap-orbit-status-cli`'s 3-of-3 finding — in-context system review missed all 3 real implementation bugs that external review caught; and the D-arc's ~25 in-context passes yielding one CRITICAL) demonstrates that reviewer class materially affects what a pass finds. WHICH CLASS RUNS NEXT is not a per-change judgement this requirement makes: it is the schema's cadence (per `orbit-engine-gates`' reviewed-gate model), surfaced as the engine's canonical next command and never hard-blocking.

The three classes:

1. **In-context** (default `/orbit:review`) — the current AI session runs the pass against its accumulated context. It is the REACTING class: it holds the context no independent reviewer has, and uses it to react to, push back on and learn from what independent passes returned (R-crc-11(f)). Anchoring risk: it may confirm work it has visibility into — which is why the cadence orders it after the independent slot.
2. **Fresh** (`/orbit:review --reviewer fresh`; `--fresh` remains as shorthand — D-arc Stage D5) — the SAME MODEL in a CLEAN CONTEXT: a subagent spawned within the same process that did not author the artifacts. Loses session-level anchoring; model-level biases remain. One of the two independent classes, and one half of the `blind-pair`.
3. **External** (`/orbit:review --reviewer external` — D-arc Stage D5's merge; the standalone launcher is retired, record vocabulary frozen per `orbit-review-external`) — a DIFFERENT AI in a SEPARATE SESSION, reached by a packaged prompt — launched by the user's recorded runner, or carried across by hand when none is recorded (`orbit-external-runner`; the launch is `orbit-review-external`'s). Maximum independence; cross-AI round-trip cost. The other independent class and the other half of the pair.

**The pass-genre table.** A pass's genre is COMPUTED from three trail facts — its reviewer class, its mode, and whether a QUALIFYING WALK of its mode precedes it on the trail — never declared by the author. A qualifying walk is an address-reviews record whose source resolves to the pass's mode AND whose token lies AFTER the latest ACCEPTED independent pass of that mode (every such walk, when the mode has no independent pass) and BEFORE the pass; a record whose mode cannot be read is MODE-LESS and qualifies for no mode. "Accepted independent pass" is the trail reader's pass set and class rule: a `review-<mode>-*.json` record is `fresh` by its `reviewer_class` field, or — absent that field — by `flags.fresh: true`; an `external-<mode>-*.md` return the trail reader rejects is not a pass. The table is a fenced production — the review body mirrors it byte-equal:

```
| reviewer class | mode | trail position | pass genre |
|---|---|---|---|
| `fresh` or `external` | proposal or system | any | REVIEW — reads the whole artifact and the thesis |
| `in-context` | proposal or system | a qualifying walk of this mode precedes the pass | VERIFICATION — reads that walk and answers landed / regressed per resolution |
| `in-context` | proposal or system | no qualifying walk of this mode precedes it | REVIEW — a reaction with nothing yet to verify; the cadence's slot arithmetic is unchanged by pass genre |
| `in-context` | proposal or system | only MODE-LESS walks precede it | REVIEW — a walk whose mode cannot be read is not evidence of a qualifying walk of this mode |
| `in-context` or `fresh` | architecture | — | REVIEW — the architecture trail carries no change-mode walk records and the mode has no gate |
| `external` | architecture | — | not a member — refused by `orbit-review`'s mode constraint |
```

The pass genre is a RECORD and a header word, never a gate input: the reviewed gate's coverage and resolution clauses (`orbit-engine-gates`) read the class and the findings and nothing of the genre (R-crc-13). This requirement defines the pass genre; it defines no record field for either genre. The in-context body learns its own pass genre from ONE directory fact — the token-ordered listing of the trail's PASS and WALK records — `review-<mode>-*.json` with each record's `reviewer_class` field (or `flags.fresh` when that field is absent), `external-<mode>-*.md` by filename, and `address-reviews-*.json` with each record's `source_path` — read as a LISTING of metadata, never as findings, suppressed lists or resolutions — which is exactly what the qualifying-walk bound needs (the latest ACCEPTED independent pass's token, from the pass records; each walk's mode and token, from the walk records) — and an unreadable listing is REVIEW (the mode-less row). KNOWN LIMIT of that probe: whether the trail reader ACCEPTS an external return cannot be read from metadata, so the body treats every `external-<mode>-*.md` file as a pass; where that differs from the accepted set (a rejected return after a qualifying walk), the engine's computation over the trail reader is authoritative; that bounded METADATA PROBE is not a trail pointer in the sense of the brief rule below, which forbids findings, suppressed lists and resolution content, never filenames and class or source fields.

**A REVIEW-genre brief carries no findings and no pointer at the trail.** Whatever a REVIEW-genre reviewer is handed — the external prompt file, the fresh subagent's launching brief, the in-context pass's own read list — names the change directory's artifacts (`proposal.md`, `design.md`, `tasks.md`, `specs/`, and `explore.md` and `sketches/` when present), the project-context files (`CLAUDE.md`, `orbit/project.md`, `*_convention.md` at the root, when present), the baseline specs under `orbit/specs/`, the lens files, and — in system mode — the apply commit range (its start commit found by a hash-only read, never from commit subjects), and names NO finding (open or resolved), NO prior pass, and NO path under `.orbit-runs/` as something to READ — the destinations a brief tells the reviewer to WRITE to (the findings file it produces and the commit line that lands it) are not reads and are exempt; a commit-range diff it is told to read EXCLUDES the trail directory. This is the ONE statement of what a brief carries; the bodies that compose briefs name it and state only their own observable consequence. ONE exemption, stated here: the architecture body's hand-computed per-doc iteration note (`orbit-review`'s `Iteration note when prior runs exist`) is read by the body as a COUNT over the architecture trail — the mode has no pair and no gate, so no blindness is at stake, and no render surface computes the note for it. The property is stronger than R-crc-4's "blind to each other" and compatible with it: the ruling permits history and does not require feeding it; without a finding in any brief, the pair is blind on every launch order and no ordering rule is needed. Pushback is unaffected — `orbit-review`'s pushback discipline verifies a finding against CURRENT STATE, which needs no prior list; staleness-by-record is the walk's. This rule's domain is BOUNDED and its limit is stated here, once — Residual kind: an instruction outside `review.ts` — another body's prose, the chat invocation snippet, the launching brief — that hands a review-genre reviewer prior findings, including one that asks for them WITHOUT naming the trail path (a reworded read such as "read the previous review summary", which no grep decides); and prior-pass content reaching the reviewer through what a brief legitimately names rather than through an instruction — commit messages it reads on its own (the prompt's commit line writes counts into them by design), the gate reason `orbit status` prints once one half of a pair has landed, and narrative prose in a project-context file such as `CLAUDE.md`. Residual method: the exit (3) grep over the WHOLE generated surface for the trail path and the three finding-list phrasings, plus reading each pair's committed prompt file at the walk (the prompt is on the trail; the brief is not), plus checking at the walk whether either half's findings cite a prior pass. How each body honours the rule is that body's own requirement (`orbit-review`'s review-genre read rule; `orbit-review-external`'s cycle-context and recommended-session requirements), which point here.

#### Scenario: Independent classes are REVIEW genre

- **WHEN** a pass's `reviewer_class` is `fresh` or `external`, in proposal or system mode, at any trail position
- **THEN** its pass genre is REVIEW: the pass reads the whole artifact and its brief carries no finding and no trail pointer

#### Scenario: In-context after a qualifying walk of its mode is VERIFICATION genre

- **WHEN** a pass's `reviewer_class` is `in-context` in proposal or system mode AND a qualifying walk of that mode — an address-reviews record whose source resolves to the mode, with a token after the latest ACCEPTED independent pass of the mode (any such walk when none exists) and before the pass — precedes it on the trail
- **THEN** its pass genre is VERIFICATION: the pass reads that walk record and answers landed / regressed per resolution; its genre changes nothing about which cadence slot the pass satisfies

#### Scenario: In-context with no qualifying walk of its mode is REVIEW genre

- **WHEN** a pass's `reviewer_class` is `in-context` in proposal or system mode AND no qualifying walk of that mode precedes it (none at all, only walks older than the latest ACCEPTED independent pass of the mode, or only MODE-LESS records whose source does not resolve to a mode)
- **THEN** its pass genre is REVIEW, recorded as what it is; the cadence's slot arithmetic is unchanged by the genre

#### Scenario: Architecture mode is REVIEW genre

- **WHEN** a pass runs under `--as architecture` as `in-context` or `fresh`
- **THEN** its pass genre is REVIEW; `--reviewer external` is refused in that mode by `orbit-review` and is not a member of the table; the body's hand-computed per-doc iteration note is the one count it reads from the architecture trail, per the exemption stated above

#### Scenario: A review-genre brief is checked for what it carries

- **WHEN** any surface composes a brief for a REVIEW-genre reviewer — the external prompt file, the fresh launching brief, the in-context read list
- **THEN** the brief names no finding, no prior pass and no `.orbit-runs/` path to READ (its write destinations are exempt), and any commit-range diff instruction excludes the trail directory; the generated surface is grep-tested for the finding-list phrasings and the read pointer — how the output sections are told apart from reads is `orbit-review`'s grep scenario's — and the one brief with no artifact (the fresh launching brief) is held by the rule alone, per the stated residual

#### Scenario: The review body carries the table as a checked mirror

- **WHEN** the review skill is generated
- **THEN** its body carries the fenced pass-genre table byte-equal to this requirement's fence under a heading that names this owner and says it is a mirror; a parity test anchored on the fence's header row (`| reviewer class | mode | trail position | pass genre |`) holds the two equal, and no other surface restates the table

#### Scenario: A user doc stating the framework is held to this requirement

- **WHEN** a user doc (README or `docs/`) states reviewer-class or genre guidance that drifts from this requirement's table (e.g., it claims in-context is the right first pass for a small change, or that an external session should carry its prior findings)
- **THEN** `/orbit:audit-drift` Category 3 (cross-doc consistency) SHALL surface the drift on next run; until such a doc exists the framework is spec-only and there is no second statement to drift

#### Scenario: Framework guidance is gate-surfaced, never gate-enforced

- **WHEN** a change's cadence names an independent pass the user has not run AND the user chooses to archive anyway
- **THEN** orbit's archive flow proceeds via the inflection prompt (per `orbit-engine-gates`): the `review-system` gate computes as unpassed and the archive flow fires the address / proceed-anyway / abort prompt; proceeding records the judgement in the archive emit. The gate NEVER refuses the archive — apply-parity enforcement. orbit's role is to surface the engine-computed recommendation and record the decision, not to refuse archive of changes that skip it.
