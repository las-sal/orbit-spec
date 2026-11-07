> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: decision-layer

## Premise

Stage `decision-layer` of `automate-dev-flow`: the judgement ledger (one record per AI judgement that affects the
end user or involves security, with a closed qualifying rule) and the stop record (naming which of R-adf-3's six
conditions fired), both written through `orbit emit` beside the existing records. Every later stage consumes them.
Exit: both validated by the engine with tests shown able to fail; the qualifying rule written in the owning spec as
a closed set with its residual stated; G0 holds.

Existing ground: `orbit-run-summary-emit`'s `The judgement record — one spine, two kinds` already records CADENCE
judgements (`continuation | readiness`), qualified by POSITION, admitted on apply, review-external T0 and archive
only (`Where a judgement record may appear`), with `formed_against` citations the engine checks; it explicitly
excludes method calls, scope calls and process notes.

## Mechanism

### D-dl-1 — records are written for a reader who knows only what architect decided
Domain: every place a record's prose reaches the user
| member | covered by |
|---|---|
| ledger entry: what was decided, the alternatives, why | the plain-language fields, bound by this rule |
| ledger entry: where (files, requirements) | a detail field, allowed to be technical; never the only statement |
| stop record: which condition, and what it is about | the plain-language fields, bound by this rule |
| the question put to Sal at a stop | rendered from the stop record's plain-language fields |
| resolution record: Sal's answer and its effect | the plain-language fields, bound by this rule |
| the program brief (stage program-brief) | composed from the plain-language fields, so it inherits the rule (G5) |
Closure: BOUNDED — the record fields are not yet designed, so a prose field added later is not on this list
Residual kind: a prose field a later stage adds to a record, or a new surface that renders record prose to the user
Residual method: when a field or surface is added, ask whether its text reaches the user; if it does, it joins this table
Moves:
- READ: applied — the reader's baseline is the architecture doc's content (automate-dev-flow.md: Premise, Goals G0–G7, R-adf-1..8, stage charters), read this session
- ENUMERATE: applied — this table
- COHERE: applied — "where" is necessarily technical, so records split into plain-language fields the rule binds and detail fields it does not; the detail never stands alone
- EXECUTE: applied — Case 1: this session's own chat failed the rule before it existed
- FALSIFY: applied — a record can define every term and still be unclear (long, buried); the rule covers assumed knowledge, and the cold-reader check below catches the rest
- CONFORM: applied — R-adf-7 and G5 (the brief must be enough to sign off on, and it is built from these fields); R-crc-10 (whether prose is clear is a reader's judgement, so the engine checks form only)
- FEASIBILITY: not applied — a sentence or two per record
- CONSUME: applied — Sal at a stop and the program brief consume the plain fields; if they are not self-contained, G5 fails downstream
- INVOKE: applied — binds every record write; the cold-reader check's trigger is an open question below

### D-dl-2 — three records, one job each
Domain: every event in a run that must leave a record under this stage
| member | covered by |
|---|---|
| an AI judgement that affects the end user or involves security | ledger entry |
| stop condition (1): security call with nothing approved to rely on | ledger entry finding nothing, then a stop record it points at |
| stop condition (2): user-facing call no approved goal covers | ledger entry finding nothing, then a stop record it points at |
| stop condition (3): amending an approved ruling or goal | stop record, raised directly |
| stop condition (4): an outside or irreversible act the settings do not grant | stop record, raised directly |
| stop condition (5): a tripwire firing | stop record, raised by orbit (stage tripwires) |
| stop condition (6): a critical review finding with no fix inside the change | stop record, raised directly |
| Sal answers a stop | resolution |
Closure: SOURCED — R-adf-3's six conditions are a closed set ratified by Sal; the ledger's own events are bounded by the qualifying set (the open question below), not by this rule
Moves:
- READ: applied — R-adf-3's six conditions, read from automate-dev-flow.md's rulings index
- ENUMERATE: applied — this table, one row per condition
- COHERE: applied — (1)/(2) are the only conditions with a ledger entry, because they are the only ones about the user or security; a stop raised by (3)/(4)/(6) during a user-facing call would also carry that call's ledger entry, written on its own merits
- EXECUTE: not applied — no record exists yet
- FALSIFY: applied — a run could resume on a stop nobody answered; the resolution gate (continue only once a resolution exists) is the guard
- CONFORM: applied — R-adf-3 (closed set), D-dl-1 (each record's plain fields), G2 (every condition leaves a stop record)
- FEASIBILITY: not applied — one record per event
- CONSUME: applied — seam-chaining and the driver halt on a stop record and resume on its resolution; the program brief lists all three
- INVOKE: applied — the ledger and stops fire on the AI's own judgement in every mode, (5) fires from orbit; what makes the AI write them reliably is the stage's open question on record placement

### D-dl-3 — a ledger entry names what it relies on, and orbit checks that it exists
Domain: the approved things a ledger entry may rely on
| member | covered by |
|---|---|
| a requirement in a baseline spec | resolves by capability and requirement title |
| a ruling in an architecture doc | resolves by ruling ID |
| a goal in an architecture doc | resolves by goal ID |
| a resolution Sal wrote at an earlier stop | resolves by its record |
| a Decisions entry Sal made in the change's own exploration | resolves by decision ID |
| nothing found | no citation; the entry raises a stop (D-dl-2) |
Closure: BOUNDED — other approved sources may exist (a project's CLAUDE.md rule, a convention file)
Residual kind: an approved source a ledger entry relies on that is not one of these kinds
Residual method: such a citation is refused at write, which surfaces the kind; adding it is a change to the requirement
Moves:
- READ: applied — the existing judgement record's citation checks (`src/core/emit-composition.ts`, ~line 1754: a citation that resolves to nothing is refused)
- ENUMERATE: applied — this table
- COHERE: applied — a resolution is both the end of a stop (D-dl-2) and a citable precedent here; one record, two roles, no conflict
- EXECUTE: not applied — no record exists yet
- FALSIFY: applied — an entry can cite something that exists but does not cover the decision; existence is form, coverage is judgement, left to the closing review (G4)
- CONFORM: applied — R-crc-10 (the engine checks form only), G4 (completeness is reviewed, not checked)
- FEASIBILITY: not applied — one lookup per citation
- CONSUME: applied — the brief shows what each decision rested on; the driver needs a resolution to be findable as precedent
- INVOKE: applied — fires at every ledger write

### D-dl-4 — a fixed list of eighteen areas decides what goes in the ledger
Domain: the areas in which an AI judgement is recorded in the ledger
| member | covered by |
|---|---|
| What the user sees or does | screens, messages, command output, how a feature behaves |
| Defaults | what happens when the user sets nothing |
| When things go wrong | error handling the user meets: retries, fallbacks, failing loudly or quietly |
| The user's data | how it is stored, kept, changed between versions, or deleted |
| Things others build on | interfaces, file formats, anything another system depends on |
| Docs | what the user is told |
| Who can get in | logins, passwords, sessions, who may do what |
| Secrets | keys, tokens and credentials, and where they are kept |
| Exposure to the network | what is reachable, and from where |
| Trusting input | what outside input is believed without checking |
| New dependencies | adding someone else's code |
| Permissions and sandboxing | what the software is allowed to touch |
| Encryption | how data is protected |
| Personal data and privacy | what is collected about people, and who sees it |
| Cost | anything that spends money: paid APIs, cloud resources |
| Licensing | a dependency's licence constraining what can be done with the result |
| Accessibility | whether some users cannot use it |
| Performance the user feels | responsiveness, speed and limits a user notices |
Closure: BOUNDED — the list is Sal's choice of what matters, not derived from a structure; calls that affect the user or security can fall outside it
Residual kind: a judgement that affects the end user or involves security and falls in none of the eighteen areas
Residual method: G4's closing review classifies a run's changes against the list; a qualifying call in no area adds its area, as a change to the requirement
Moves:
- READ: applied — the stage charter and G4 in automate-dev-flow.md; the AI's first cut and five candidates, all accepted by Sal
- ENUMERATE: applied — this table
- COHERE: applied — "the user's data" and "personal data and privacy" overlap; a call in both gets one entry, and either area qualifies it
- EXECUTE: applied — Case 2: the home-control examples each land in exactly one area or the overlap above
- FALSIFY: applied — a list misses calls nobody anticipated; the residual slots and the closing review are the guard, and a catch-all test was rejected (Considered & out)
- CONFORM: applied — R-adf-3 (conditions 1 and 2 are security and user-facing calls, so this list is also what can raise them), G4, R-crc-10 (whether a call falls in an area is the AI's judgement; the engine checks only that an entry names an area on the list)
- FEASIBILITY: not applied — a lookup against eighteen names
- CONSUME: applied — a ledger entry names its area, so the brief can group by area and the closing review can count per area
- INVOKE: applied — consulted at every judgement the AI takes; the record-placement question decides what makes it reliable

### Case 2 — the home-control examples, 2026-11-07
"Show 'unknown' when the door sensor is offline" (what the user sees); "lights off after 10 minutes" (defaults);
"queue commands for 30 seconds when the hub is unreachable" (when things go wrong); "keep 90 days of sensor
history" (the user's data); "sessions expire after 7 days" (who can get in); "the hub token in the OS keychain"
(secrets); "web UI on the local network only" (exposure to the network); "run as root to reach GPIO" (permissions
and sandboxing). Each lands in one area. "Store camera clips for a week" lands in both the user's data and personal
data and privacy.

### D-dl-5 — the records are written through orbit's record command into the history beside the work
Domain: every place a judgement or stop can arise, and the history it is written to
| member | covered by |
|---|---|
| during a change (propose, apply, review, a walk, archive) | the change's history, `orbit/changes/<name>/.orbit-runs/` |
| during an exploration, before any change exists | the exploration's history, `orbit/explore/<name>/.orbit-runs/`, moved into the change at propose |
| during an architect session on a program | the architecture history, `orbit/architecture/.orbit-runs/`, with the doc named |
| a resolution Sal gives to a stop | the same history as the stop it answers |
Closure: SOURCED — these are the three history locations orbit's record command writes, by its scopes (change, doc); project-wide records are not a place a judgement arises
Moves:
- READ: applied — `src/core/emit-composition.ts` `COMMANDS`: each command declares change and/or doc scope; `orbit emit explore --change <name>` writes into a staging directory's history (observed this session)
- ENUMERATE: applied — this table
- COHERE: applied — an exploration's history moves into the change at propose, so a change's records include what was judged while exploring
- EXECUTE: applied — the explore records this session wrote landed in `orbit/explore/measure/.orbit-runs/` and `orbit/explore/decision-layer/.orbit-runs/`
- FALSIFY: applied — a record written to the wrong history would be invisible to its change's brief; the record names its change or doc, and the command refuses an unknown one
- CONFORM: applied — the existing judgement record's three-moment rule is left untouched (G0); `orbit-emit-composition`'s payload allowlist means each new record's fields must be listed
- FEASIBILITY: not applied — one file per record, as today
- CONSUME: applied — the brief and the closing review read these histories; archive moves the change's with it
- INVOKE: applied — the AI writes a record when it takes a judgement, raises a stop, or receives Sal's answer

### D-dl-6 — D-dl-1 is held by structure and by a reader
Domain: the ways a record could fail D-dl-1, and what catches each
| member | covered by |
|---|---|
| a plain-language field left empty | orbit's shape check refuses it |
| a new term used in a plain field with no definition | the term list: a listed term without a definition is refused; an unlisted term is caught by the reader |
| a plain field that relies on implementation detail | the reader |
| a plain field that is correct but unclear | the reader |
Closure: DERIVED — a failure is either a missing field (form), an undefined term (form if listed, reading if not), or unclear prose (reading); every case reaches one of the two checks
Moves:
- READ: applied — D-dl-1 and its Mechanism entry above
- ENUMERATE: applied — this table
- COHERE: applied — orbit checks form and the reader checks meaning; neither claims the other's job
- EXECUTE: not applied — no record exists yet
- FALSIFY: applied — an AI could leave a coined term off the list to dodge the definition check; the reader is the guard
- CONFORM: applied — R-crc-10 (the engine checks form, prose clarity is a reader's judgement)
- FEASIBILITY: not applied — a field check per record, one reading pass per change
- CONSUME: applied — the program brief inherits records that passed both
- INVOKE: applied — the shape check fires at every write; the reading step runs in the change's review after implementation, when every record the change will hold has been written

### D-dl-7 — everything is recorded in every mode
Domain: the settings a run can be under, and what a stop record does in each
| member | covered by |
|---|---|
| supervised (today's default) | recorded; the AI asks Sal as now; the record marks "would have stopped" |
| seam-chained | recorded; the run halts until a resolution exists |
| autonomous | recorded; the run halts until a resolution exists |
Closure: SOURCED — the three regimes named in automate-dev-flow's Premise; the settings that realise them are stage seam-chaining's
Moves:
- READ: applied — automate-dev-flow.md Premise (the regimes), R-adf-1 (defaults are today's behaviour), G3
- ENUMERATE: applied — this table
- COHERE: applied — in supervised mode the AI already asks Sal, so the record adds nothing to what Sal sees; it only remembers
- EXECUTE: not applied — no record exists yet
- FALSIFY: applied — recording under supervised settings must not change what Sal sees, or G0 fails; the record is written beside the existing behaviour, never in place of it
- CONFORM: applied — G0, R-adf-1, G3
- FEASIBILITY: not applied — one record per stop
- CONSUME: applied — G3's one-in-four check reads the supervised "would have stopped" records first
- INVOKE: applied — the halting half fires only once seam-chaining's settings exist; until then every stop is a supervised one

### Case 1 — the AI's own chat, 2026-11-07
Explaining this stage, the AI used "cadence position", "formed_against", "BOUNDED", "R-crc-10" and "walk" without
defining them — terms from orbit-spec's internal history, not from automate-dev-flow's architecture doc. Sal raised
the rule from that pattern.

## Decisions

- **2026-11-07 — D-dl-1: records are written for a reader who knows only what architect decided** (Sal) Every
  record this stage defines — a ledger entry, a stop record, a resolution — is written so that a reader who knows the
  program's architecture doc (Premise, Goals, Rulings, stage charters) and nothing else understands it. Any other
  term is defined where it is used, or not used; implementation detail the AI knows and the user does not (internal
  names, file layouts, mechanisms invented during the work) is never the only statement of what was decided.
  Rationale (Sal): the AI describes problems from its own context, including definitions it coined and
  implementation details it alone holds; the user's knowledge stops at what was decided in architect.
  Kind: rule

- **2026-11-07 — D-dl-2: three records, one job each** (Sal) A LEDGER ENTRY is written for each AI judgement that
  affects the end user or involves security: what was decided, the alternatives, why, and what it relies on. A STOP
  RECORD is written whenever one of R-adf-3's six stop conditions arises: which condition, what it is about, and the
  question for Sal. A RESOLUTION is written when Sal answers a stop: the answer and what happens next; an automated
  run continues past a stop only once its resolution exists. Conditions (1) and (2) begin as a ledger entry that
  finds nothing to rely on, and that entry points at the stop it raised; (3), (4) and (6) are raised directly with no
  ledger entry; (5) is raised by orbit itself (stage tripwires). Rationale: a merged record would put calls that are
  not about the user — amending a ruling, an unfixable review finding — into the ledger, which is what Sal reads at
  sign-off; separate records keep "every user and security call" and "every time the AI needed Sal" each honest.
  Kind: rule
- **2026-11-07 — D-dl-3: a ledger entry names what it relies on, and orbit checks that it exists** (Sal) A ledger
  entry cites the approved thing its decision rests on, or says it found none (and so raised a stop). orbit
  confirms each citation exists, the way the existing judgement record's citations are confirmed; a citation that
  points at nothing is refused. A resolution, once written, is itself citable, so a question Sal has answered does
  not stop a run twice. orbit cannot confirm every qualifying judgement was recorded; that is G4's closing review,
  stated as a named limit in the requirement.
  Kind: rule

- **2026-11-07 — D-dl-4: a fixed list of eighteen areas decides what goes in the ledger** (Sal) A judgement goes
  in the ledger when it falls in one of these areas, and only then: what the user sees or does; defaults; when things go wrong; the user's data; things others build on; docs; who can get in; secrets; exposure to the network; trusting input; new dependencies; permissions and sandboxing; encryption; personal data and privacy; cost; licensing; accessibility; performance the user feels.
  Everything else — internal structure, naming, algorithms, code organisation, test approach, refactoring — the AI
  decides without a ledger entry. The list alone decides; no catch-all test. A user-affecting or security call that
  falls in no area goes unrecorded, and that gap is stated in the requirement: G4's closing review finds such calls
  and adds their area to the list, as a change to the requirement.
  Kind: rule

- **2026-11-07 — D-dl-5: the records are written through orbit's record command into the history beside the
  work** (Sal) Ledger entries, stop records and resolutions are written through `orbit emit`, which checks their
  shape, into the history folder of the work they belong to: the change's, the exploration's, or (for a session on
  a program's architecture doc) the architecture history. They move with a change when it is archived. Rejected: a
  new kind inside the existing judgement record, which covers only three review moments; a plain notes file, which
  nothing checks.
  Kind: rule
- **2026-11-07 — D-dl-6: D-dl-1 is held by structure and by a reader** (Sal) Structure: each record has
  plain-language fields D-dl-1 binds, a technical detail field it does not, and a list of any new terms with their
  definitions; orbit checks the plain fields are present and every listed term is defined. Reading: a review step in
  which a reader given only the architecture doc and the record judges whether the record makes sense.
  Kind: rule
- **2026-11-07 — D-dl-7: everything is recorded in every mode** (Sal) Ledger entries, stop records and resolutions
  are written under every setting, today's supervised flow included. Under supervised settings a stop record means
  "I would have stopped here": the AI asks Sal as it does now, and the records show whether stops would have been
  warranted (G3) before anything runs unattended. A stop halts a run only when a setting says so.
  Kind: rule

## Open questions

## Considered & out

- **2026-11-07 — A catch-all test ("would the user notice, or is anything put at risk?") beside the list:** out
  (Sal). It makes every call arguable, and the AI is the one applying it; the list alone decides, and the closing
  review grows it.

## References

- `orbit/architecture/automate-dev-flow.md` — R-adf-3 (the six stop conditions), G2–G4, the stage charter.
- `orbit/specs/orbit-run-summary-emit/spec.md` — `The judgement record — one spine, two kinds`, `Where a judgement record may appear`.
- `src/core/emit-composition.ts` — the `COMMANDS` payload allowlist (~line 77) and the judgement citation checks (~line 1754).
