# Proposal: bounded-closure-semantics (stage rc13a-explore-mechanism-convention, second attempt)

## Why

A rule authored in explore reaches propose with its domain open, and nobody notices until an
independent pass finds a member the author never handled. rc02 spent nine of its first ten
CRITICALs on mechanism that did not exist when its exploration closed; rc03a ran three passes,
fifteen CRITICALs, zero repeats, and shipped nothing. rc13a's FIRST attempt built the convention
that would make an open domain visible and archived without shipping on one contradiction: it
required every rule to carry a CLOSED enumeration while defining one of its three closure forms,
BOUNDED, as "the domain is open". An author could name a partial list plus "there may be others"
and satisfy the obligation that exists to forbid exactly that sentence.

The hinge is settled in `explore.md` (D-bcs-1): the obligation is **ACCOUNTED**, not CLOSED —
no domain may be open SILENTLY. Two outcomes discharge it: **CLOSED** (DERIVED or SOURCED) and
**OPEN-DECLARED** (BOUNDED, whose residual NAMES ITS KIND AND METHOD). Tested against every
bounded claim on the record, the test passed rc02's same-state limit and REJECTED one of the first
attempt's own two residuals. This change ships that semantics inside the machine-readable format the
first attempt was told it lacked, plus the outcome Sal added to the charter on 2026-09-15: an
exploration may CONCLUDE in nothing, and the workflow has the words for it.

Every mechanism here was executed once in the exploration (R-crc-7), and the exploration
CONFORMS to the grammar it proposes: twelve decisions carry `Kind:`, nine rules carry Mechanism
entries with nine dispositions each (the ninth, D-bcs-12, added on the system walk — the BOUNDED
exemplar). Writing the third entry found a defect in its own rule (a
residual carried only in `design.md` dies at archive), which is the argument for the format.

## What Changes

- **Closure becomes ACCOUNTED.** `Closure:` keeps three tokens. DERIVED and SOURCED mean CLOSED;
  BOUNDED means OPEN-DECLARED and REQUIRES two slots, `Residual kind:` and `Residual method:`.
  "There may be others" discharges nothing. The tier difference is VISIBILITY, never blocking.
- **The Mechanism grammar is PARSEABLE.** Rule entries are `### <ID> — <title>` blocks under
  `## Mechanism`, ending at the next H1–H3; `Domain:` plus a table; `Closure:`; the residual slots
  iff BOUNDED; `Moves:` with nine lines, each move exactly once; `### Case <n>` blocks as sibling
  evidence; any other H3 is prose. A grammar failure is MALFORMED naming the line (the
  architecture parser's near-miss rule).
- **The Decisions ENTRY is the key.** The opener every exploration on record already writes —
  `- **<date> — D-<tag>-<n>: <title>**` — is the ID slot (zero migration). One claim per entry;
  a mixed entry is split; there are no claim-level IDs. `Kind: rule | fact | scope` defaults to
  **rule**, so opting out is written and an omission renders as an open rule rather than escaping.
  `Disposition: live | superseded <ptr> | assigned <stage>` defaults to live; `illustrative` is dropped.
- **The rule test has NORMATIVE force.** A Decision is a rule iff it PRESCRIBES or CONSTRAINS
  across a set of situations; a quantified empirical claim is a FACT though it has a logical
  domain (the first attempt's D-rc13-2 is the worked counter-example).
- **Nine moves per rule, declared BOUNDED with a kind-and-method residual**, the growth path
  (`@review:` marker + a finding against the requirement), the boundary test with RESOURCES in its
  IN list, and TWO conforming exemplars in the shipped body (D-bcs-3, closed; D-bcs-12, bounded).
- **An exploration may CONCLUDE.** On the user's word, inside explore: a CONCLUDED entry with a
  `Re-entry:` slot and the header token `> **Status**: concluded <date>.`, THEN the final boundary
  emit. Nothing is written to metadata (the helpers strip unknown keys — measured); the citation
  is kept unchanged. The directory stays IN
  PLACE — moving it would defeat rc13b's fifth rung, which orientation renders from the trail in
  that directory. No new command; the surface stays at 15.
- **Re-entry is one DERIVED table** over staging-dir × concluded × active-change × change-carries-explore.md:
  nine cells, four refused (a name resolving to BOTH a staging directory and an active change is the
  second-claim-on-one-truth condition propose already refuses). The fourth fact was added on the
  system walk (2026-09-25): without it, one input had two results. A concluded name REOPENS only on
  the user's word, by the inverse edit plus a dated entry.
- `explore.md` goes to SIX sections (Premise, **Mechanism**, Decisions, Open questions, Considered
  & out, References). The retained requirement titles say "five-section": a RENAMED delta exists,
  but renaming pulls three pointer sites in two other capabilities into scope, so the rename is
  DEFERRED, not impossible; the text says six.

## Capabilities

**New Capabilities**: none.

**Modified Capabilities** — exactly the charter's two:

- `orbit-conventions` — OWNS the format (R-crc-14): the six-section order and status tokens
  (MODIFIED `explore.md` five-section format); a concluded exploration remains in place (MODIFIED
  `orbit/explore/<name>/` staging directory); and three ADDED requirements — Decision entry
  identity and classification, the Mechanism entry grammar with ACCOUNTED closure, and the
  concluded outcome record.
- `orbit-explore-modifications` — how the BODY applies it: the nine moves and the exemplar
  (ADDED); re-entry resolution and the conclude verb (ADDED); and three MODIFIED requirements
  that carried the second copy — `explore.md five-section convention` (six sections; points to
  the owner), `Three invocation modes supported` (Mode B's guards; the table pointer), and
  `Boundary residency sweep before emits` (Mechanism slots).

**DECLARED HANDOFFS, named so R-crc-9 is honoured rather than an unnamed residual:**

- **rc13b-explore-maturity-signal** (Depends-on this stage) owns the parse, the FORM predicate
  over six entry states (D-bcs-10), the top rung that REPORTS instead of asserting (R-crc-13), the
  fifth rung reading the header token and the `Re-entry:` slot, and the two engine strings that
  still say "five-section" (`emit-composition.ts:1127`, `explore-counter.ts:12`). Its charter
  sentence "closed enumeration for every LIVE rule" is wrong by one word under D-bcs-1 — an
  architect edit, carried by this change's archive tail.
- **Propose consumption is NOT this change's**: `orbit-propose-modifications`' mapping has no
  Mechanism row and its validation scenario names five sections. Under D-bcs-3 the residual
  TRAVELS at propose (spec row owns, design Risks points); until a propose stage lands, the
  proposing AI reads the whole `explore.md` as authoritative and the transfer is an instruction,
  not a checked mapping. The charter's Touches is two capabilities; a third is a scope change for
  Sal, recorded as a proposed follow-on stage (`rc13c-propose-consumes-mechanism`) in the
  architect handoff, never folded in silently. That follow-on also owns the one transition the
  re-entry table cannot see: propose keys on `explore.md`'s presence and reads no header token,
  so a concluded name can be promoted without reopening today — the follow-on refuses it or
  treats it as the reopen.
- **Q-crc-11** gains its engine-readable input: the `concluded` header token in the staging
  directory the kept citation locates. Until that stage teaches `state.ts`, a stage cited only by
  a concluded exploration renders `exploring`. KNOWN.

**KNOWN AND ACCEPTED**: until rc13b lands the convention is ADVISORY — an author can ignore it and
no readout notices. The interval, stated.

## Impact

- `src/core/templates/workflows/explore.ts` — the convention text, the grammar block, the nine
  moves, the exemplar, the re-entry table, the conclude flow, the sweep slots.
- `test/core/templates/orbit-generated-surface.test.ts` — generated-surface assertions, including
  that the shipped exemplars match the grammar's productions and that the body's mirrors are
  byte-equal to the owning specs.
- `test/core/templates/skill-templates-parity.test.ts` — the hash pins for orbit-explore and, after
  the system walk, orbit-onboard.
- `src/core/templates/workflows/onboard.ts` — the Phase 1 sentence's section list (system walk).
- `orbit/changes/bounded-closure-semantics/explore.md` — this change's own artifact, conformed.
- No engine change. No schema bump. No migration: the counter ignores unknown H2 sections and
  nested slot lines (verified); existing staging directories parse unchanged.
- Size at proposal: 2 capabilities, 10 requirements (5 MODIFIED, 5 ADDED), 16 tasks — 15 after
  apply, where 6.2 became an at-archive note.
