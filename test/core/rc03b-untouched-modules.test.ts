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
 */
const PINNED: Record<string, string> = {
  "schemas/spec-driven/schema.yaml": "be6cda5fa604f105c14c2d5e2fd52ad04ca266ba22e7e438ffec8442641e345d",
  "schemas/spec-driven/templates/design.md": "3251f08057d142f6e3c26f65f5f100ab602ee7ce880d5503bfaa45668ba19f59",
  "schemas/spec-driven/templates/proposal.md": "9c554e0dbe918e3dc745dcc143a999e1d102954d75fb6e51e231c4cba78f06f3",
  "schemas/spec-driven/templates/spec.md": "e025078f238dc6e4df552a1e0a140cf9efce0bbdecbeb9f45837d45ed91dca01",
  "schemas/spec-driven/templates/tasks.md": "b2a6a4c08c15f347a1d8c3e2d43e0c8fb066dc5cc0feb795f47555f176f9c421",
  "src/core/artifact-graph/gates.ts": "d6f086365a5160540a57745e8e06abd4cee017b3fe9cb57e899e9315ccad13ca",
  "src/core/artifact-graph/graph.ts": "3193a3884bb59296dc4ddc177020d3135d99c694109298ac31c3f3a91c45a0ed",
  "src/core/artifact-graph/index.ts": "9dc35ba8e64105fbfd6af821cf99f1fbc5777b74b75311f09fdab279cf12d438",
  "src/core/artifact-graph/instruction-loader.ts": "69707477bfe2b2ad262eaeffe55aaf7a21ab8c7139b0d8c1ad119cb6039f19be",
  "src/core/artifact-graph/pass-genre.ts": "af72ef5bc3b543b79c8c4d1a4678ca667f8e307dd3325110d38bb8319fa26a04",
  "src/core/artifact-graph/outputs.ts": "7a95459becd3831b3cc0416aa473990169d671a1e491a284df4695d1c8008047",
  "src/core/artifact-graph/resolver.ts": "3b10b86eeda7e1264ff6a549e2abcdce8fd3bee3e28cb42441ed49e5ebb3d81b",
  "src/core/artifact-graph/schema.ts": "fb80cfd9a9088ce9dbbd42e43d9525864f7035b51db99aa019489b18f1b1e3b0",
  "src/core/artifact-graph/state.ts": "f59f748b94cd94ca2fe022ec5aa66b3251dd1b2c00bddb9a17cbd9273a04d0f2",
  "src/core/artifact-graph/trail.ts": "a8566c80c599097acb39146010a7aa2ab5b47cf707958f85fd243e05567cbaf1",
  "src/core/artifact-graph/types.ts": "246feb06872594a744233904bc0d3902c90545e23cdf8a38f2b42b80c4a4d10a",
  "src/core/emit-composition.ts": "ddd96ffc4ecb5e0273a1b57562c0b7fd314b0c46cd64962a9699648f8178509c",
  "src/core/report-render.ts": "2cab0af495c99d970c4a9e07ccf7309131c6601afe72ca2ef5ed3c33fc4774e2",
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
