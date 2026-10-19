## 1. The test first (design D2, D3)

- [x] 1.1 Write `test/core/templates/propose-reads-baseline.test.ts`: read the fence of `Propose-shaped bodies read the baseline before writing proposal.md` through `ownerText('orbit-propose-modifications', …)` and `fencedProduction`, and for `getOrbitProposeSkillTemplate()` and `getFfChangeSkillTemplate()` assert that the two lines after `- Read any completed dependency files for context`, trimmed, equal the fence's two lines, and that the next line begins `- Create the artifact file using`; a failure names the body and the line.
- [x] 1.2 Declare the two ADDED scenarios on it: `@scenario text orbit-propose-modifications :: Propose-shaped bodies read the baseline before writing proposal.md :: Both generated bodies carry the two lines in step 4a`, and `:: A body missing a line fails` on an assertion that a body with one line removed, and one with the lines moved below `- Create the artifact file using`, each fail naming the body and the line.
- [x] 1.3 Before the edit lands, run `npx vitest run test/core/templates/propose-reads-baseline.test.ts` and confirm it fails on both bodies.
- [x] 1.4 Declare `@scenario text orbit-propose-modifications :: Upstream propose behavior preserved in standalone mode :: Standalone mode` on an assertion that the propose body's standalone section falls through to upstream Step 1 and excepts the orbit steps that run in both modes, naming the step 4a baseline read (the sentence task 2.1 rewrites), under the heading `## Standalone mode`.

## 2. The edit (design D1)

- [x] 2.1 In `src/core/templates/workflows/propose.ts` and `src/core/templates/workflows/ff-change.ts`, add the fence's two lines immediately after `      - Read any completed dependency files for context`, each indented six spaces as that line is, backticks escaped as the template's others are; and in `propose.ts`'s standalone section retitle the heading `## Standalone mode (unchanged from upstream)` to `## Standalone mode` and replace ``Upstream behavior is otherwise unchanged, with ONE addition: the generated `design.md` still carries the `## Touchpoints` section`` with ``Upstream behavior is otherwise kept, apart from the orbit steps that run in both modes — among them the step 4a baseline read and the `## Touchpoints` section``, keeping the parenthetical after it (backticks escaped in the source, as above).
- [x] 2.2 Move both bodies' function and generated-skill hashes in `test/core/templates/skill-templates-parity.test.ts`, and add the act to its header comment in the form its earlier entries use.
- [x] 2.3 Run `npx vitest run test/core/templates/` and confirm the new test and the parity test pass.
- [x] 2.4 Edit `orbit/specs/orbit-propose-modifications/spec.md`'s Purpose in place: upstream's propose is preserved when no exploration exists apart from the orbit steps that run in both modes (design D3).

## 3. The release bump (design D4)

- [x] 3.1 Run `npm version 2.0.2 --no-git-tag-version`.
- [x] 3.2 Add `## 2.0.2` to `CHANGELOG.md` above `## 2.0.1`: one user-facing bullet (propose and ff now read the baseline spec of each capability they modify, and search the specs for the rule they change) and the issue #29 link.
- [x] 3.3 Move the five version sites to 2.0.2: `README.md` lines 64 and 68, `docs/installation.md` lines 14, 17 and 30.
- [x] 3.4 Run `npm run build && npm test`, confirm the full suite passes with the `Test Files` count up by one, and `node bin/orbit.js --version` prints `2.0.2`; then `node bin/orbit.js update --force` and confirm `.claude/skills/orbit-propose/SKILL.md` and `.claude/skills/orbit-ff-change/SKILL.md` carry the two lines.
- [ ] 3.5 (User-validation) After merge, Sal runs `npm run release:tree` on `main` and pushes `v2.0.2`; install from the pushed tag (`npm install -g github:las-sal/orbit-spec#v2.0.2`), confirm `orbit --version` prints `2.0.2`, and run `orbit update` in one other project and confirm its generated propose skill carries the two lines.
