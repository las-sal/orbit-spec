import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import {
  type SkillTemplate,
  getApplyChangeSkillTemplate,
  getArchitectSkillTemplate,
  getOrbitArchitectCommandTemplate,
  getArchiveChangeSkillTemplate,
  getBulkArchiveChangeSkillTemplate,
  getContinueChangeSkillTemplate,
  getExploreSkillTemplate,
  getFeedbackSkillTemplate,
  getFfChangeSkillTemplate,
  getNewChangeSkillTemplate,
  getOnboardSkillTemplate,
  getOrbitApplyCommandTemplate,
  getOrbitArchiveCommandTemplate,
  getOrbitBulkArchiveCommandTemplate,
  getOrbitContinueCommandTemplate,
  getOrbitExploreCommandTemplate,
  getOrbitFfCommandTemplate,
  getOrbitNewCommandTemplate,
  getOrbitOnboardCommandTemplate,
  getOrbitSyncCommandTemplate,
  getOrbitProposeCommandTemplate,
  getOrbitProposeSkillTemplate,
  getOrbitVerifyCommandTemplate,
  getSyncSpecsSkillTemplate,
  getVerifyChangeSkillTemplate,
} from '../../../src/core/templates/skill-templates.js';
import { generateSkillContent } from '../../../src/core/shared/skill-generation.js';

// rc04a (2026-09-21) — apply and archive moved DELIBERATELY. Their bodies gained the
// judgement-record payload documentation, the archive's readiness-composition instruction and
// its not-ready completion line. This pin exists so a template edit is a conscious act;
// updating it IS that act. The `review` template also changed and is not pinned here.
//
// rc04c (2026-09-24) — apply and archive moved again, DELIBERATELY: the `gate_overridden`
// field retired from both bodies and the shipped archive schema reference; the continuation/
// proceed entry is the sole record, and `formed_against: []` is documented as legal when the
// trail is empty. The archive's `references/` also carry the pr-choreography tail edit. Only
// these two hashes (and their two generated-skill hashes) moved — exactly the bodies the stage
// names. Worth recording: this pin was NOT in the stage's sized test set, because it was sized
// by grepping for the field name and a hash pin never names anything.
// Re-pinned again the same day at the system blind-pair walk: the token-source sentence in
// apply and archive gained the ACCEPTED-as-a-pass qualifier (review's copy moved too; not
// pinned here). And once more at the fresh half's walk: R-crc-14's first application — the
// bodies and the shipped reference NAME the totality rule and point at its owner instead of
// restating its predicate and set.
//
// rc13b (2026-09-25) — explore moved DELIBERATELY, as a SECOND act. Task 1.3 interpolated the grammar
// module's production strings into the body and MEASURED the pin UNCHANGED (the interpolation changed
// no byte; the regenerated SKILL.md was byte-identical to the pre-change snapshot) — that measurement
// stood, and is recorded in the apply emit. THEN the system blind pair (both halves, independently)
// found the persist step's prose still teaching the retired count-only grid (`Early / Mid / Mature /
// Stalled from the counts`); the walk replaced that parenthetical with a pointer to the owning
// maturity requirement (R-crc-14), option B ratified by Sal. Only this one sentence moved the pin;
// the regenerated skill was diffed against the snapshot to confirm it. Moved once more at the
// in-context confirm's walk, same act: the pointer's partial paraphrase of the grid's inputs was
// trimmed to the bare pointer (a four-of-five restatement beside a pointer is the R-crc-14 pattern).
//
// rc16-retirement-sweep (2026-10-01) — explore moved ONCE, in task 2.1, for the retirement sweep: six
// body sentences that named a pending stage ("the maturity-signal stage", "the propose-consumption
// follow-on", three "until … lands" limits) now NAME THE OWNING REQUIREMENT by capability or are
// deleted, in the same tasks as their owning spec sentences (D-rc16-2, D-rc16-3; R-crc-14). The sites,
// by line at HEAD f3bfd0e2: 472 (the `Kind:` bullet's residual → the grammar requirement, R-crc-10),
// 504 (the VISIBILITY clause → run-summary-emit's maturity requirement + propose's Mechanism
// consumption), 534 (the exemplar preamble → emit-composition's one-source grammar requirement), 606
// (the conclude verb's step 4 → the Concluded rung's prose), 610 (the KNOWN paragraph → the delta's
// "Owned, since shipped" paragraph, byte-equal), 657 (the composition section → propose's Step 0c.6
// consumption + the REFUSED-at-propose rule). No fidelity marker pins any of these sentences; the
// task list carries the pairing. Only this hash and the `orbit-explore` generated-content hash moved.
// Moved a SECOND time at the system blind-pair walk (2026-10-01), a second act recorded as such: fresh W1
// re-pointed the "Owned, since shipped" paragraph's middle clause (line 610) at `orbit-orientation`'s
// sourcing requirement — the owner of the ROW's concluded render, where the maturity requirement owns
// only the rung's text — and its closing sentence now says "a limit of concluding" so the referent holds
// on both surfaces (fresh W2, Sal: C); fresh S1 and the external CRITICAL converged on the `Kind:`
// bullet (line 472) restating the grammar requirement's clause beside its pointer — trimmed to the bare
// pointer. Both body sentences moved WITH their delta sentences (D-rc16-3); byte-equality re-checked.
// rc07b-reference-roundtrip (2026-10-04) — archive moved ONCE, a PLANNED act (design D7): its
// `archive-summary-schema.md` reference gained a `json example archived` block, its spine list became a
// pointer to `orbit-conventions`, and the `audit.findings_summary` note was repointed (design D6). The
// skill BODY did not change; the generated-content hashes below did not move.
const EXPECTED_FUNCTION_HASHES: Record<string, string> = {
  getExploreSkillTemplate: '2835cca2ae531f797e0417d14f9bc66e6fd9c1b54558781ea95f3cbaad097583',
  getNewChangeSkillTemplate: '8f68be94db91a147b93d492f6f32ab3c02725a20a001c87602ac8d9741587614',
  getContinueChangeSkillTemplate: '98c49b247140ba301964c1e5a825686485b74a525f65f31a365d19e0aa84923e',
  // rc17a-invoked-coverage apply (2026-10-05), a PLANNED move (its task 4.2): Step 3's all_done clause
  // stopped naming "spec-driven v4" and `blind-pair` as the post-apply slot — under v5 which review comes
  // next depends on the cadence and the review preference, so the body says it is read, not predicted.
  getApplyChangeSkillTemplate: 'a6fee1123aa05f50fb422bea764f5ed3dee8a4a3d85481515b65a693d2c38758',
  getFfChangeSkillTemplate: 'b4411dbfa4c2fe0c02b5b5137006edf50f993d9187153b21e43de680b3f9b148',
  getSyncSpecsSkillTemplate: 'a9672b720eff36fb30f2229d835fd9a9e4cc88e81f1773bc74aff79247aa9809',
  // rc08b-walk-routing (2026-10-05, task 3.3): the command-table row's retired "auto-discovers … when invoked
  // with a change name and no markers found" became the discovery sentence. One re-record, both onboard hashes.
  // rc17b-blind-pair-command (2026-10-06, task 5.1), a PLANNED move: the Identity, Phase 4 cross-AI and
  // command-table sentences stopped enumerating the reviewer values and point at the review skill instead
  // (design D8). One re-record, both onboard hashes.
  getOnboardSkillTemplate: '8021ad74d6f34caaaba48603644e17679ac07218ce998d428aafb1e691100e24',
  getOrbitExploreCommandTemplate: '52892dbd4b5eb72264dc6eb54f8126a09fc903adc1c1654c58e0650df609bfb6',
  getOrbitNewCommandTemplate: '47d97305a2d3abca6eafa8f7ed5fe13fb83ea8ca0b71f007975b217135f5f5aa',
  getOrbitContinueCommandTemplate: 'e1ecd4fffee224e284453be717226824c7567041d7c1676b6b6bca4727e3a9dd',
  getOrbitApplyCommandTemplate: 'e5a4f72b65777d13fdd9d968e3ba50ec3c9d49c890a604a64e8dbb472bf130f8',
  getOrbitFfCommandTemplate: '57607811009ca5ece844affae130fa47efc8e64f2c14c181113f581c81978405',
  getArchiveChangeSkillTemplate: 'f2768acddb1d59448a4a5f948d279afed60923490ca0e7237c83eca937b8f1d6',
  getBulkArchiveChangeSkillTemplate: 'd95ac9d5b2317736ac8395e44ff8eae1ce8d063b6eaa5fe16c225b41eeaa597d',
  getOrbitSyncCommandTemplate: '1067039e869d8dedf7922da46230b53a88253cf3fe27c7a5d60c96bc9a43453f',
  // rc06b-map-readers (2026-10-05) — verify moved DELIBERATELY, the first named edit to an upstream
  // portion under `orbit-conventions`' narrowed `Generated-file disposition`: step 6's test-tracing
  // bullet was replaced IN PLACE by the scenario-map read and its reader table (a checked mirror of
  // `orbit-verify-modifications`), and the implementation check's miss retitled `Scenario not handled
  // in code`. The additions section did not change. Only this hash and its generated skill moved.
  // Moved a SECOND time at the system walk 2 (2026-10-05, external W1, Sal: A) — a second act:
  // verify's `# Orbit additions` gained the Fail-mode classification step (run `orbit validate`,
  // take the first mode by precedence), because the engine composes from the mode verify hands it
  // and classifies nothing; the emit paragraph stopped restating the precedence. Upstream portion
  // unchanged by this second move.
  getVerifyChangeSkillTemplate: '5db552e52e096f65444038e783172a98605d8909cc3499fc843bbbbc27e2ffcb',
  getOrbitArchiveCommandTemplate: '92e3ebad046cbc2a68dfb204cbb3c847498d2cafcdd2065357d744580c05a8fe',
  getOrbitOnboardCommandTemplate: '3a3e98c6a01517896dfdccaba4fa4477edea62fd69dc4189df1dd105bbedcc5b',
  getOrbitBulkArchiveCommandTemplate: '6bc94ce2a406ceb934f461665bdd1e96f5a7149c798172c04f50d83c3630819a',
  getOrbitVerifyCommandTemplate: 'b98377960f7416452e77f6042ffbb037df4c6461619aebe9b595a6883a752a9a',
  // rc13c (propose-consumes-mechanism, 2026-09-28): the orbit-propose body moved ONCE, deliberately — Step 0
  // (the concluded refuse; live-only naming inference; the Regenerate option's refuse sentence), Step 0a (the
  // six-section mirror), Step 0b (the interpolated entry form; the Mechanism read after the last file write),
  // Step 0c (the Mechanism row), NEW Step 0c.6 (the partition table, the four shapes, the record, the
  // pre-move grep), Graceful degradation. Re-recorded in the same task that edited the body (tasks 3.4).
  // Moved a second time at the system blind-pair walk (2026-09-28): the both-exist concluded refuse in
  // Step 0's conflict sub-step, the Mechanism grammar mirror under Step 0b, row 1's record shape and
  // conformance-defined 'accounted' in Step 0c.6 — one re-record for the walk's body edits.
  // rc03b-pass-genres (2026-10-04): moved ONCE, deliberately, by ONE phrase — Step 0's staging-move note said
  // "the `.orbit-runs/` iteration history", a line the review-genre brief test's PHRASE rule (`orbit-review`'s
  // grep scenario: "iteration history" on a line naming the trail path) reads as a hit over EVERY generated
  // skill. The line describes moving files, not a brief; it now says "run trail". Keeping the rule as written
  // beat narrowing it; the hit was measured at task 1.1 (one of the eleven pre-apply reds).
  // rc05's system walk: the Touchpoints example names `src/cli/program.ts` for registration and flags, where
  // rc05's builder moved them (`src/cli/index.ts` only parses now); both propose hashes moved with that one line.
  // rc09a-size-record (2026-10-11, task 5.3): moved ONCE, deliberately — the inserted "Size brief after
  // generation" step (the four-row table, the Split / Declare routes, the `## Size` production interpolated
  // from `SIZE_DECLARATION_PRODUCTION` as a checked mirror of `orbit-change-size`), Step 0d's opener naming
  // the brief, and the completion-prompt override's Split exception. Both propose hashes moved with it.
  getOrbitProposeSkillTemplate: '84fd14cec4b5b997af24e03f6de5a2a89abb9524076c699627bd501ea0a000fe',
  getOrbitProposeCommandTemplate: 'b91222654d5050d7ae7f2f49b5d6c4b34e65638bd8c5ae3e622550eb1329c168',
  getFeedbackSkillTemplate: 'ded61ad85c5050f7bf241870b14bfcdd929f0be68a028c1130fd30a66efbda3b',
  // rc15 (ended-stage-state, 2026-09-29): the orbit-architect body moved ONCE, deliberately — §5 (the
  // ratify / not yet / ended offer; the ended write to `stages_ended`; an ended stage offered nothing; the
  // unprompted route, written on premised/quiescent/concluded + an undated slot and DECLINED on live work or
  // a dated mark; the closing parenthetical naming the engine's table), the §2 scaffold sentence's grammar
  // mirror (the third production), and the emit compose step (`stages_ended`). Re-recorded in task 3.3.
  // Moved a SECOND time at the system blind-pair walk (2026-09-30): external W1 — the §2 scaffold sentence
  // now INTERPOLATES the parser's `COMPLETE_SLOT_PRODUCTIONS` constant and names itself a CHECKED MIRROR
  // of `orbit-architecture-engine`'s format requirement; fresh S1 — §5's unprompted route states its
  // UNDATED and live-citer tests in the status JSON's own field names. One re-record for the walk's two
  // body edits, a second act recorded as such (rc13b's lesson).
  // Moved a THIRD time at the project-wide audit-drift walk after rc15's archive (2026-10-01, category 3
  // SUGGESTION): the §5 heading's parenthetical now scopes its one-prompt claim to the completion flow
  // and names the Step 1 doc selector as the body's other prompt — a wording fix outside any change,
  // one re-record, recorded here and in orbit/.orbit-runs/address-reviews-<TS>.json.
  // rc05 (executable-references, design D6/D8) moved it a FOURTH time: the §2 scaffold's blockquote line
  // escaped each backtick around `orbit architecture status` twice inside the template literal, so the
  // generated doc scaffold carried a literal backslash before each one; it now carries plain backticks.
  // That one line, nothing else; held from here by test/core/cli-grammar/escaped-backticks.test.ts.
  getArchitectSkillTemplate: 'd0cd052e33c0684b14f3b248ee96119015c61a4cf6023b9947849df143c0fce1',
  getOrbitArchitectCommandTemplate: 'b65b8cca6431bb45aa8587d3bfc1e9458981e2e1bc925ae45cd57414143cb3db',
};

// Post-rc06b project-wide audit-drift walk (2026-10-05, category 3 WARNING) — archive, explore and
// propose moved DELIBERATELY, one sentence each: the additions preamble's "The upstream content above
// is unchanged" became a pointer to `orbit-conventions`' `Generated-file disposition`. It was FALSE of
// archive-change (a named pre-rule upstream edit) and true of the other two; the owner states the fact
// once (R-crc-14). A wording fix outside any change, recorded here and in the walk's address-reviews
// emit under orbit/.orbit-runs/. Their three function hashes and three generated-skill hashes moved;
// no other pin did.
const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'orbit-explore': 'd34772425aeff5415c9760e2ac7414facfc70d142bbb7e12f8ffbab50fde7004', // rc16-retirement-sweep: moved once with the body at apply, a second time at the system blind-pair walk (see the function-hash note above)
  'orbit-new-change': '94c9d6377c6de0484f3a51923eba08214ca45cab5d87a55e46e032de2640b925',
  'orbit-continue-change': 'f61634ab5e96436b33fd30c210f84a57f55baf1716d6ef4679c1ed2a518cc3d3',
  'orbit-apply-change': '491bbad729e422441417760e937dfd15facaa5b1af64da61336732c7b66336b7', // rc17a apply: the v4 clause (see the function-hash note above)
  'orbit-ff-change': '77ea91cebd3be1e220824780ece9d90d82aa2f70783eedbf314a3298ec1f31e0',
  'orbit-sync-specs': '23adf56ababc77dac8dcc06048b4d74d27ded9bc4f49a57858e17c4ea7866a75',
  'orbit-archive-change': '4868cb3b0e95631238dd25753dc4a4e3fdf6794151dfa7131d2c8ddb4ffc40d1',
  'orbit-bulk-archive-change': '601dd7c74804c06a9818428f86030c8cef5311a9fc7c59f2dc14e490007a291d',
  'orbit-verify-change': '06080070b8f2dfd4e3053c9143845095d0b80c6efcce286cc46e9de37dfe8ea8', // rc06b-map-readers (2026-10-05): moved with the body's step 6 edit, then again at system walk 2's additions edit (see the function-hash note above)
  'orbit-onboard': 'a2d4f3bc2b5fc3562fe264fcb291e0e280f988fe0a10be081a4770c32fe00e2f', // rc17b task 5.1 (see the function-hash note above)
  'orbit-propose': '41036fc096f8c022d56fcd5190d907455473b905811c8af0dbb85056dc4c6801', // rc13c, then rc03b, then rc05's system walk, then rc09a's size brief (task 5.3): moved with the body (see the function-hash notes above)
  'orbit-architect': 'f8b7a68ca470c5a2d2e2f36d42f11b0973c8be58748d86222cca944adb80aed1', // rc15: moved twice with the body — apply, then the system walk; a third time at the post-archive audit walk; a fourth at rc05's apply, the scaffold's escaped backticks (see the function-hash note above)
};

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`);

    return `{${entries.join(',')}}`;
  }

  return JSON.stringify(value);
}

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

describe('skill templates split parity', () => {
  it('preserves all template function payloads exactly', () => {
    const functionFactories: Record<string, () => unknown> = {
      getExploreSkillTemplate,
      getNewChangeSkillTemplate,
      getContinueChangeSkillTemplate,
      getApplyChangeSkillTemplate,
      getFfChangeSkillTemplate,
      getSyncSpecsSkillTemplate,
      getOnboardSkillTemplate,
      getOrbitExploreCommandTemplate,
      getOrbitNewCommandTemplate,
      getOrbitContinueCommandTemplate,
      getOrbitApplyCommandTemplate,
      getOrbitFfCommandTemplate,
      getArchiveChangeSkillTemplate,
      getBulkArchiveChangeSkillTemplate,
      getOrbitSyncCommandTemplate,
      getVerifyChangeSkillTemplate,
      getOrbitArchiveCommandTemplate,
      getOrbitOnboardCommandTemplate,
      getOrbitBulkArchiveCommandTemplate,
      getOrbitVerifyCommandTemplate,
      getOrbitProposeSkillTemplate,
      getOrbitProposeCommandTemplate,
      getFeedbackSkillTemplate,
      getArchitectSkillTemplate,
      getOrbitArchitectCommandTemplate,
    };

    const actualHashes = Object.fromEntries(
      Object.entries(functionFactories).map(([name, fn]) => [name, hash(stableStringify(fn()))])
    );

    expect(actualHashes).toEqual(EXPECTED_FUNCTION_HASHES);
  });

  it('preserves generated skill file content exactly', () => {
    // Intentionally excludes getFeedbackSkillTemplate: skillFactories only models templates
    // deployed via generateSkillContent, while feedback is covered in function payload parity.
    const skillFactories: Array<[string, () => SkillTemplate]> = [
      ['orbit-explore', getExploreSkillTemplate],
      ['orbit-new-change', getNewChangeSkillTemplate],
      ['orbit-continue-change', getContinueChangeSkillTemplate],
      ['orbit-apply-change', getApplyChangeSkillTemplate],
      ['orbit-ff-change', getFfChangeSkillTemplate],
      ['orbit-sync-specs', getSyncSpecsSkillTemplate],
      ['orbit-archive-change', getArchiveChangeSkillTemplate],
      ['orbit-bulk-archive-change', getBulkArchiveChangeSkillTemplate],
      ['orbit-verify-change', getVerifyChangeSkillTemplate],
      ['orbit-onboard', getOnboardSkillTemplate],
      ['orbit-propose', getOrbitProposeSkillTemplate],
      ['orbit-architect', getArchitectSkillTemplate],
    ];

    const actualHashes = Object.fromEntries(
      skillFactories.map(([dirName, createTemplate]) => [
        dirName,
        hash(generateSkillContent(createTemplate(), 'PARITY-BASELINE')),
      ])
    );

    expect(actualHashes).toEqual(EXPECTED_GENERATED_SKILL_CONTENT_HASHES);
  });
});
