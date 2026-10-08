import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * rc03b-pass-genres, task 1.4 — exit (1)'s "no engine code" clause, as a content HASH pin (the
 * hash-pin pattern of `templates/skill-templates-parity.test.ts`, over files rather than templates).
 *
 * The pass-genre table is a SPEC statement the bodies point at; computing the genre is
 * rc03c-verification-record's. These hashes were recorded at the proposal commit (46a43e00) and
 * hold the gate model, the trail reader, the emit composer, the renderer and the schema unchanged
 * through this stage. The listing is pinned too, so a NEW file under a pinned directory is a red,
 * not a silent pass. Moving a hash is a deliberate act: record why here when you do.
 *
 * MOVED at rc03c-verification-record apply (2026-10-04) — a recorded second act, not a regression:
 * rc03c is the stage chartered to COMPUTE the genre. Its exit (1) requires `gates.ts` and `trail.ts`
 * to carry NO diff and the schema's cadence tokens to stay unchanged, so every other hash here is
 * KEPT and now holds that clause too. Moved: `src/core/emit-composition.ts` (the payload table, the two
 * computed extensions, the verification write gate) and `src/core/report-render.ts` (the header word,
 * the Verification section, both marks, the read-side twin). Added to the listing:
 * `src/core/artifact-graph/pass-genre.ts`, the new module (pinned at its apply-time content).
 * MOVED AGAIN at rc03c's system walk 1 (2026-10-04): the same two files — the collision bump now clears a
 * token against every trail file (external C1, Sal: B), and the Verification row marks a verdict no walk on
 * the trail carries (external S1). `gates.ts`, `trail.ts`, `pass-genre.ts` and the schema stay unchanged.
 * MOVED a THIRD time at system walk 2 (2026-10-04): `emit-composition.ts` only — the REVIEW-genre refusal
 * now states what the pass owes (fresh W2, Sal: A). `report-render.ts` did not move.
 * MOVED at rc07b-reference-roundtrip apply (2026-10-04) — a PLANNED act (its design D7): `emit-composition.ts`
 * only — audit-drift's `findings_total` / `findings_by_category` are now computed from `findings` and refused
 * in the payload, over refused malformed inputs (`orbit-emit-composition`'s `Audit-drift counts are
 * engine-computed`). Every other hash here is unchanged.
 * MOVED AGAIN at rc07b's system walk 1 (2026-10-04): `emit-composition.ts` only — the counts accumulator is a
 * null-prototype object, so a category named `__proto__` / `constructor` / `toString` counts like any other id
 * (fresh W1; the external half's C1 is the same defect).
 * MOVED a THIRD time at rc07b's system walk 2 (2026-10-04): `emit-composition.ts` only — the `categories_run`
 * refusal message stopped promising the "1".."6" range the gate never checked; it now names the type-only
 * check (external S1, Sal: B).
 * MOVED at rc08a-sweep-evidence apply (2026-10-05) — a PLANNED act (its task 1.3, design D6): TWO files.
 * `src/core/emit-composition.ts` — the walk write gate's first resolution-level checks (`sweep` evidence, the
 * legacy-`status` refusal, the `ripple_miss_of` pointer) and the computed `ripple_misses`. `src/core/artifact-graph/trail.ts`
 * — `stripLineSuffix` EXPORTED unchanged (design D6) and `normalizeDisposition` EXPORTED unchanged (task 1.2: the
 * pointer reads an earlier walk's entry "through the trail reader's disposition"), so the gate and the reader
 * normalize by one rule each. No body of either function changed; every other hash here is unchanged.
 * MOVED AGAIN at rc08a's system walk 1 (2026-10-05): `emit-composition.ts` only — an unresolved `sweep.kept`
 * path is now refused like an unresolved `sweep.scope` path (fresh W1). `trail.ts` did not move.
 * MOVED a THIRD time at rc08a's system walk 2 (2026-10-05): BOTH files. `emit-composition.ts` — the walk checks run
 * on the FROZEN record and `ripple_misses` is counted from it (external C1); the never-read directories are excluded
 * however a path entered the scope (C2); a `kept` element is one file (W1); an unreadable scope member refuses (W2);
 * paths and the pointer key through `stripLineSuffix(toRepoRelative(x))` (W3). `trail.ts` — `toRepoRelative` EXPORTED
 * unchanged (W3), so the gate keys a path exactly as the reader does.
 * MOVED at rc08b-walk-routing apply (2026-10-05) — PLANNED acts (its tasks 1.4 and 2.2): `gates.ts` — the
 * resolution loop COLLECTS every unresolved pass into `unresolvedPasses`, the pair diagnosis rides `openPair`,
 * and the unresolved-pass canonical next names no file (design D1); `instruction-loader.ts` — the gate row
 * carries both fields into `orbit status --change --json`; `emit-composition.ts` — the review-external T0
 * `next_recommended` ends at the save step and names no walk (design D6).
 * MOVED at rc17a-invoked-coverage apply (2026-10-05) — PLANNED acts (its task 1.1 measured them before any
 * code): `schemas/spec-driven/schema.yaml` (version 5, both gates `[invoked, in-context]`, the header rewritten);
 * `types.ts` (the `invoked` cadence token); `trail.ts` (`Trail.launches` from `pair: true` T0s); `gates.ts` (pair
 * membership, the `invoked` slot and its presentation table, the slot-bound pair diagnosis — `foreclosed`
 * retired — the review preference read once, `unwalkedPasses`, and the exported in-memory seam);
 * `instruction-loader.ts` (the `unwalkedPasses` spread on the gate row); `emit-composition.ts` (the T0's `pair`
 * field and its write-gate checks). `schema.ts` did NOT move: the six-token message is `CADENCE_ENTRIES.join`.
 * MOVED AGAIN at rc17a's system walk (2026-10-06): `gates.ts` — "landed" read from membership with a stale
 * member as its own presentation row (fresh W1, Sal: C) and a pass sharing its launch's token neither member
 * nor single (external W2); `emit-composition.ts` — one comment stopped stating the v4 cadence (fresh S3).
 * Every other hash here is unchanged.
 * MOVED at rc17b-blind-pair-command apply (2026-10-06) — a PLANNED act (its task 1.1): `gates.ts` only — the
 * default and unknown review preferences present the pair command (`--reviewer blind-pair`, presented class
 * `blind-pair`), retiring rc17a D6's interim fresh-review row. Every other hash here is unchanged.
 * MOVED at rc17c-short-review-next apply (2026-10-07) — a PLANNED act (its task 5.1, design Touchpoints):
 * TWO files. `emit-composition.ts` — the review composer's change-mode branch names the change-scoped walk
 * (`/orbit:address-reviews <change>`, no path; D1), and `SPINE_FIELDS` / `ENGINE_OWNED_EXTRA` gain `export`
 * so the canonical-example guard subtracts by the engine's own list (D6). `report-render.ts` — the spine-
 * semantics pointer check accepts the closed two-value set on a pass with findings: the short form and the
 * prior generation's self pointer, both computed from the emit itself (D2). Every other hash is unchanged.
 * MOVED AGAIN at rc17c's system walk (2026-10-07): `emit-composition.ts` only — the composer comment stopped
 * claiming the emit always names the gate's canonical next; it names that walk whenever the gate's next is a walk
 * (fresh S1). `report-render.ts` did not move.
 * MOVED at rc18-walk-is-next apply (2026-10-07) — a PLANNED act (its task 4.1, design Touchpoints): TWO files.
 * `gates.ts` — the exported `passedFrontierHoldsUnwalked` predicate sets a passed FRONTIER gate's row to the
 * change-scoped walk when it holds an unwalked pass (D1, D2), and `canonicalNextForReviewed`'s walk step fires on
 * an unwalked pass as well as an unresolved one, after the open pair (D5). `instruction-loader.ts` — the
 * selection loop takes a passed gate's walk on that same predicate, never because the row carries a command.
 * Every other hash here is unchanged.
 * MOVED AGAIN at rc18's system walk (2026-10-07): `emit-composition.ts` only — `systemReviewNext` keeps the gate
 * graph's next when it is the change-scoped walk, and the verify recommendation leads with it (fresh S2 + external W1,
 * converged; Sal: A). `gates.ts` and `instruction-loader.ts` did not move.
 */
const PINNED: Record<string, string> = {
  "schemas/spec-driven/schema.yaml": "21e0ae86532a39be558a2b81d23738a6fbf92fbd32b0d01612a65e83d6a96739",
  "schemas/spec-driven/templates/design.md": "3251f08057d142f6e3c26f65f5f100ab602ee7ce880d5503bfaa45668ba19f59",
  "schemas/spec-driven/templates/proposal.md": "9c554e0dbe918e3dc745dcc143a999e1d102954d75fb6e51e231c4cba78f06f3",
  "schemas/spec-driven/templates/spec.md": "e025078f238dc6e4df552a1e0a140cf9efce0bbdecbeb9f45837d45ed91dca01",
  "schemas/spec-driven/templates/tasks.md": "b2a6a4c08c15f347a1d8c3e2d43e0c8fb066dc5cc0feb795f47555f176f9c421",
  "src/core/artifact-graph/gates.ts": "c25f1c80ca454a96c8ef72e7948814759b57b18cb5746381bcc68c912d9ba25c",
  "src/core/artifact-graph/graph.ts": "3193a3884bb59296dc4ddc177020d3135d99c694109298ac31c3f3a91c45a0ed",
  "src/core/artifact-graph/index.ts": "9dc35ba8e64105fbfd6af821cf99f1fbc5777b74b75311f09fdab279cf12d438",
  "src/core/artifact-graph/instruction-loader.ts": "6e79d8b17fe1140dc98287156253df5e41d4073d0fa5382d1b7fd07c8a02600c",
  "src/core/artifact-graph/pass-genre.ts": "af72ef5bc3b543b79c8c4d1a4678ca667f8e307dd3325110d38bb8319fa26a04",
  "src/core/artifact-graph/outputs.ts": "7a95459becd3831b3cc0416aa473990169d671a1e491a284df4695d1c8008047",
  "src/core/artifact-graph/resolver.ts": "3b10b86eeda7e1264ff6a549e2abcdce8fd3bee3e28cb42441ed49e5ebb3d81b",
  "src/core/artifact-graph/schema.ts": "fb80cfd9a9088ce9dbbd42e43d9525864f7035b51db99aa019489b18f1b1e3b0",
  "src/core/artifact-graph/state.ts": "f59f748b94cd94ca2fe022ec5aa66b3251dd1b2c00bddb9a17cbd9273a04d0f2",
  "src/core/artifact-graph/trail.ts": "39b5d110ef53b7e03f49ddf292e86db598a14f426a02e6d84142e16231e37d69",
  "src/core/artifact-graph/types.ts": "d83e0cc6d7fca7b80618ffbb7ce052ee68e35be79e7949a941e989b2e102392c",
  "src/core/emit-composition.ts": "9004f25281a6ed63b1a6e5726141d5d8ba6e50047054cad7a8fe1d82576709be",
  "src/core/report-render.ts": "ceaf85f5b3254b5dde97b82c94b829de510d1f70669f16d65bd820a55b7ae393",
};

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const walk = (d: string): string[] =>
  fs.readdirSync(path.join(root, d), { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);

describe("rc03b untouched modules: no engine code (task 1.4)", () => {
  it("the pinned listing is exactly the files under the pinned paths", () => {
    const listed = [
      ...fs.readdirSync(path.join(root, "src/core/artifact-graph")).filter(f => f.endsWith(".ts")).map(f => "src/core/artifact-graph/" + f),
      "src/core/emit-composition.ts",
      "src/core/report-render.ts",
      ...walk("schemas"),
    ].map(f => f.split(path.sep).join("/")).sort();
    expect(listed).toEqual(Object.keys(PINNED).sort());
  });

  it.each(Object.entries(PINNED))("%s is byte-unchanged", (file, hash) => {
    expect(createHash("sha256").update(fs.readFileSync(path.join(root, file))).digest("hex")).toBe(hash);
  });
});
