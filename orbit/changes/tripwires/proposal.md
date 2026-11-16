## Why

Stage `tripwires` of `automate-dev-flow` owes G6's first half: orbit must notice when a run has gone sideways, so that a
run with nobody watching can stop (R-adf-3's fifth stop condition, `tripwire`). Earlier stages left room for it: the
`tripwire` stop condition exists and is refused from a payload because orbit raises it itself, and the brief says
"tripwires are not installed". The stage ships as four changes (see `explore.md`, D-tw-19). This first one builds the
contract every later sensor plugs into, and one sensor that runs on it: Touchpoints, which watches whether the code a
change edits is the code its design said it would edit.

## What Changes

- **A sensor contract.** A tripwire is a sensor: it measures something about the change now, compares it with a
  reference fixed before the run it watches, and returns a READING with one of three outcomes: `fired`, `quiet` or
  `cannot-read`. "Cannot read" counts as fired, so silence is never a pass. A reading carries the sensor's id, its
  outcome, a key naming the deviation, its reference and its evidence (D-tw-1, D-tw-3). Sensors plug in behind the
  contract; this change ships one.
- **The fixed point.** A sensor's reference, and its settings, are read as they stood just before the change's first
  apply commit, so a run cannot widen what watches it (D-tw-3).
- **Readings ride the seam emits.** Each change-scoped `apply`, `review` (proposal or system), `address-reviews` and
  `archive` emit carries an engine-computed `tripwires` field listing every sensor's reading, quiet ones included.
  The payload may not supply it (D-tw-6).
- **Halt is a setting.** `tripwires: {<sensor>: {on_fire: halt}}` in `orbit/config.yaml` makes a fired reading write a
  `tripwire` stop record to the change's `decisions/` folder, written by orbit. A granted chain already stops on an
  open stop. A key the user has already answered is not asked again (D-tw-6, D-tw-14).
- **The Touchpoints sensor.** It fires on unpredicted source:
  - any one file with more than 40 changed lines, or unpredicted lines making up more than 20% of the change's source
    lines;
  - paths in an exempt set are never counted: `orbit/`, tests and docs by default;
  - the exempt set and both tolerances are settings (D-tw-17).
- **The brief shows the readings.** The brief's Tripwires section lists each fired reading and each sensor's latest
  reading. A change whose emits carry no readings says tripwires were not installed when it ran, never that none
  fired (D-tw-5).
- **Docs:**
  - `docs/customization.md` gains the `tripwires` key;
  - `docs/cli.md`'s `orbit brief` text drops "tripwires are not installed".

At the defaults nothing the user sees or is asked changes (G0, D-tw-5):
- readings are recorded and rendered nowhere but the brief;
- no gate, readout, chain or generated body reads them;
- no stop is written unless a sensor is set to halt.

## Capabilities

### New Capabilities

- `orbit-tripwires`: the sensor contract and its reading, the fixed point, the readings field on the seam emits, the
  halt setting and the `tripwire` stop orbit writes, late declarations, and the Touchpoints sensor.

### Modified Capabilities

- `orbit-program-brief`: `A brief tells the user what a change or a program did, from the trail`. The tripwires row
  stops saying tripwires are not installed and lists the change's readings, and its scenario changes with it.
- `orbit-emit-composition`: `Output contract and read-only guarantee beyond the emit`. The surface writes exactly one
  file, except for a halting reading's `tripwire` stop, written beside the emit.

## Impact

- **New code:**
  - `src/core/tripwires.ts`: the contract, the sensor list, readings, the fixed point and stop composition;
  - `src/core/tripwire-touchpoints.ts`: the Touchpoints sensor.
- **Changed code:**
  - `src/core/emit-composition.ts`: computes the field on the four seam emits, refuses it in a payload, and writes a
    halting reading's stop. The file's pin in `test/core/rc03b-untouched-modules.test.ts` moves.
  - `src/core/project-config.ts`: the `tripwires` key and its resolver.
  - `src/core/program-brief.ts`: the Tripwires section.
- **Tests:**
  - new tests for the contract, the sensor and the emit field;
  - the brief's golden files change, because they carry the "not installed" line.
- **Docs:** `docs/customization.md`, `docs/cli.md`.
- **No generated workflow body or skill reference changes** (D-tw-5: no text whose effect at the defaults changes what
  the AI does).
- The other three changes of the stage (`tripwire-sensors`, `tripwire-steward`, `tripwire-project-sensors`) build on
  this contract and are proposed after it lands.
