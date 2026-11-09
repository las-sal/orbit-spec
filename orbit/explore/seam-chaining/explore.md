> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: seam-chaining

## Premise

Stage `seam-chaining` of `automate-dev-flow` (depends on decision-layer). Today every lifecycle transition is
typed by the user: `orbit-conventions`' `No-chaining contract` ends each command at the eligibility line, and
`orbit-lifecycle-consent`'s `Invocation-provenance rule` fires a consent prompt when apply or archive is reached any
other way. The charter: the settings R-adf-1 and R-adf-6 name (chaining, sign-off, each outward act, concurrency),
each its own key defaulting to today's behaviour; D1's no-chaining contract, the single-session model and D6's
outward-actions rule amended to hold conditionally on them; with chaining on, a command that ends on a passed gate
runs the engine's next command itself and stops at a configured seam or on a stop record; consent provenance gains a
value for a transition taken by setting. Exit: each amended requirement names its setting with a default test; a
fixture shows a passed gate followed by the next command, and a stop record halting it; G0 holds.

What this exploration must settle: where the settings live, which of them this stage owns, what the chaining
setting's shape is, who decides that a chain may proceed, how a chained arrival records consent, and how G0's
body clause meets a stage whose purpose is to change what the AI does at a seam.

## Mechanism

## Decisions

- **2026-11-09 — D-sc-1: the engine never invokes a command; a chained transition is the AI invoking the engine's next command** Every lifecycle command is a skill the AI runs; the engine computes `next_command` and gates, and prompts for nothing (`orbit-lifecycle-consent`'s `The engine never prompts for consent`). So "chaining on" can only mean that the generated body tells the AI to run the next command itself when a permission the engine computes allows it.
  Kind: fact
- **2026-11-09 — D-sc-2: orbit's project settings are single keys in `orbit/config.yaml`, each read by one resolver with absent meaning today's behaviour** `pr` (`resolvePrMode`, absent = `never`), `review_preference` and `size_ceiling` in `src/core/project-config.ts`; the global config (`src/core/global-config.ts`) holds per-machine values such as the external runner.
  Kind: fact
- **2026-11-09 — D-sc-3: every setting this program adds is a project key in `orbit/config.yaml`, read by one resolver, absent meaning today's behaviour** It follows D-sc-2's precedent (`pr`, `review_preference`, `size_ceiling`). The Premise's "per program at architect" choice is a named limit: no per-program override exists until the driver, which runs a program, needs one. User's word, 2026-11-09 ("go with your recommendations").
  Kind: rule
- **2026-11-09 — D-sc-4: this stage owns chaining and the outward acts a chain needs; sign-off moves to program-brief, concurrency and the single-session amendment to parallel-lanes** A setting nothing reads is a key nothing honours: sign-off is read only at program-brief's seam, concurrency only by parallel-lanes' driver. The charters were edited the same day (user's word: "split them out").
  Kind: scope
- **2026-11-09 — D-sc-5: the chaining setting is a map keyed by the command the AI may run unasked, absent meaning not granted** For example `chain: { review: true, address-reviews: true, apply: false, archive: false }`. Nothing is granted by omission, so no umbrella key exists (R-adf-6), and the seams are exactly the commands not granted.
  Kind: rule
- **2026-11-09 — D-sc-6: the engine decides whether a chain may proceed; the body only obeys** `orbit status --change <name> --json` carries a `chain` object: the next command, whether it may run unasked, and when not, why (gate unpassed, open stop record, command not granted). The body runs the next command only when that object says so, so the judgement stays engine-computed.
  Kind: rule
- **2026-11-09 — D-sc-7: a chained arrival records `consent: "setting"` with the key that granted it, and fires no consent prompt** A granted command is neither user-invoked nor prompted; an ungranted command reached any other way still prompts as today.
  Kind: rule
- **2026-11-09 — D-sc-8: the conditional chaining text is named as a second ratified G0 exception under R-adf-11, at an architect session before propose** Making no-chaining conditional changes every body's text, though not what it does while no command is granted. Amending G0 is a `ruling-amendment` stop, asked at that session.
  Kind: scope
  Disposition: superseded R-adf-12 (the user reworded G0's body clause in general at that session, 2026-11-09)
- **2026-11-09 — D-sc-9: the merge and the return to the default branch become settings now, each its own key; releases and issue filing stay the user's** A chain crossing stages under a per-proposal PR needs both before the next stage's propose; nothing on that path publishes a release or files an issue.
  Kind: scope
- **2026-11-09 — D-sc-10: a chain stops whenever the AI would ask the user anything, and states why** A decision-lane walk, a consent prompt for an ungranted command, an anomaly prompt (gate, fingerprint, audit) or a stop record each halts it. Context growth over a long chained session is a named limit until the driver (R-adf-8).
  Kind: rule

## Open questions

- **What does each rule's Mechanism enumerate?** D-sc-3, D-sc-5, D-sc-6, D-sc-7 and D-sc-10 are rules with no Mechanism entry yet: the settings and their resolvers, the commands the map can grant, the `chain` object's refusal reasons, the consent-scoped seams, and every prompt a chain can meet.
  Standing recommendation: enumerate each from the bodies and the engine (every AskUserQuestion site in the generated surface for D-sc-10; every `next_command` the engine can return for D-sc-5) before propose.

## Considered & out

- **A list of transitions, or a list of seams to stop at, as the chaining setting's shape** (2026-11-09) — a seam list grants every command it omits, so an absent entry would grant; a transition list names pairs where only the arriving command matters. Out for D-sc-5's map.
- **The AI reading config and gates itself to decide a chain** (2026-11-09) — it would put a gate-shaped judgement in the body, against the engine computing gate state. Out for D-sc-6.
- **A per-program setting at architect, now** (2026-11-09) — nothing reads it before the driver runs a program. Out for D-sc-3's named limit.
- **Sign-off and concurrency as this stage's settings** (2026-11-09) — no code in this stage reads either. Moved to program-brief and parallel-lanes (D-sc-4).

## References

- `orbit/architecture/automate-dev-flow.md` — R-adf-1, R-adf-3, R-adf-6, R-adf-8, R-adf-11; stage seam-chaining's charter
- `orbit/specs/orbit-conventions/spec.md` — `No-chaining contract`, `Residual outward-actions rule`
- `orbit/specs/orbit-lifecycle-consent/spec.md` — `Invocation-provenance rule`, `Consent prompts at consent-marked seams`, `Consent recorded in consent-scoped lifecycle emits`
- `src/core/project-config.ts` — the existing settings and their resolvers
