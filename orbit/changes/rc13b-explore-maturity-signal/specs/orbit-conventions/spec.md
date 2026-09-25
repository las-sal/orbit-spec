## MODIFIED Requirements

### Requirement: Decision entry identity and classification

Each entry in `explore.md`'s Decisions section SHALL be a top-level list item whose opener is the ID slot: `- **<YYYY-MM-DD> — <ID>: <title>**` with `<ID> ::= D-[a-z0-9]+-[0-9]+`, unique within the file. This is the opener every exploration on record already writes, formalized rather than replaced; a Decisions entry without a well-formed ID is a format violation the explore body corrects on next touch. An ID is WELL-FORMED when the FIRST line of the entry's list item matches the opener PREFIX `- **<YYYY-MM-DD> — <ID>: ` — the closing `**` of the bold title may fall on a later line, so ordinary line-wrapping of a long title is never a format defect; an entry whose first line carries no such prefix has no well-formed ID.

**The ENTRY is the key: one claim under obligation per entry.** A Decision is a RULE when it PRESCRIBES or CONSTRAINS how something must be done across a SET of situations — the test is "in which situations does this apply?", applied to the claim's NORMATIVE force, never to its grammar. A quantified EMPIRICAL claim ("heading count has never correlated with readiness under any conditions") has a logical domain and is a FACT: it describes one world and is falsifiable by evidence. A SCOPE choice (in / out / deferred) is one-off. The test applies PER CLAIM as an authoring rule: an entry that carries more than one claim under obligation is SPLIT by the author; there are no claim-level identifiers.

Each entry carries slot LINES with FIXED vocabularies, stated as a production so a parser can be written from it (the counter's `Standing recommendation:` precedent: a slot is matched anywhere within the lines that belong to the entry's list item — a lazy-continuation line or a nested bullet both qualify; the ` — ` in the opener is the literal em-dash separator):

```
- **<YYYY-MM-DD> — <ID>: <title>** <prose…>            the opener; the ID slot; <ID> ::= D-[a-z0-9]+-[0-9]+, unique within the file
  Kind: rule | fact | scope                               ^\s*(?:[-*+]\s+)?Kind:\s*(rule|fact|scope)\s*$
  Disposition: live | superseded <ID or pointer> | assigned <stage-id>     same optional bullet prefix as Kind:
  Re-entry: <what would reopen it>                        concluded entries only; exactly one LIVE entry carries it
```

`Disposition:` and `Re-entry:` are matched with the same optional bullet prefix as `Kind:`; the prefix is what admits the nested-bullet form.

- `Kind: rule | fact | scope` — **absent means `rule`.** The demanding default converts an omission into a rule that owes a Mechanism entry (rendered as open by ID once a reader parses it) rather than an invisible escape; opting out is WRITTEN. A rule the author never entered at all remains outside every reader's sight — the stated residual, owned by `orbit-explore-modifications`' maturity-signal successor.
- `Disposition: live | superseded <ID or pointer> | assigned <stage-id>` — absent means `live`. The slot means ONE thing for every entry: `live` says the entry's claim STANDS; `superseded` and `assigned` say it does not, and point to what does. Two consequences follow: a RULE is IN the accounting obligation only while its Kind is rule (or absent) AND its Disposition is live (or absent); a CONCLUDED entry's `Re-entry:` slot is the live one only while its Disposition is live (or absent).

#### Scenario: A rule entry owes a Mechanism entry

- **WHEN** a Decisions entry's `Kind:` is `rule` or absent, and its `Disposition:` is `live` or absent
- **THEN** the Mechanism section carries an entry keyed by the same ID (per the Mechanism entry grammar); its absence is an OPEN domain, named by that ID

#### Scenario: A fact with a logical domain is not a rule

- **WHEN** a Decision states a quantified empirical claim and the author writes `Kind: fact`
- **THEN** it owes no Mechanism entry; the situations-test is applied to normative force, so the claim's logical domain does not make it a rule

#### Scenario: A mixed entry is split

- **WHEN** one Decisions entry carries a finding AND a rule clause that governs situations
- **THEN** the author splits it into two entries with distinct IDs; the rule entry owes a Mechanism entry and the finding carries `Kind: fact`

#### Scenario: Leaving the obligation is a named act

- **WHEN** a rule is replaced or handed to another stage
- **THEN** its entry carries `Disposition: superseded <ID or pointer>` or `Disposition: assigned <stage-id>`; an entry left `live` with a bare prose note ("overtaken", "moot") is still in the obligation

#### Scenario: A wrapped title keeps its ID

- **WHEN** an entry opens `- **2026-09-25 — D-foo-7: a long title that` and the closing `**` falls on the next line
- **THEN** its ID is well-formed (`D-foo-7`); an entry whose first line is `- **Decision:** …` has none
