> **Status**: exploring. Promoted to proposal/design/specs via /orbit:propose when decisions firm up.

# Exploration: greet-name

## Premise
`greet.js` always greets the world. A user who runs it wants to be greeted by name when they give one.

## Mechanism

## Decisions
- **2026-01-05 — D-gn-1: the name is the first command-line argument** `node greet.js Ada` prints `Hello, Ada!`; with no argument, or an empty one, the script prints `Hello, world!` as before.
  Kind: scope
- **2026-01-05 — D-gn-2: no option or flag is added** Only the one positional argument is in scope.
  Kind: scope
- **2026-01-05 — D-gn-3: the change touches `greet.js` and `README.md` only** The baseline capability `greeting` gains one requirement.
  Kind: fact

## Open questions

## Considered & out
- A `--name` flag (2026-01-05): a positional argument is simpler for a one-argument script.

## References
- `greet.js`, `README.md`, `orbit/specs/greeting/spec.md`
