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
// rc12-engine-owned-choreography's system walk (2026-10-12, fresh S4, Sal: A) moved FOUR function hashes —
// ff, archive, propose and architect, the four skills whose `references/` carry the PR choreography — and
// no generated SKILL.md body: one sentence in `pr-choreography.ts`, "the orbit engine never shells to git
// or gh", narrowed to "performs no git or gh write", because `orbit pr` now reads. A pin the walk's plan
// did not name, re-recorded here as its own act; change 2 rewrites the references around the sentence.
// rc12-body-adoption apply (2026-10-12), a PLANNED move (its task 3.2): the three PR references were
// rewritten around `orbit pr` calls (D-rba-4) and the PR sections of propose, ff, archive and architect
// name the subcommand at each step, the archive's preflight moving before the move (Step 5.45 → 4.9).
// bulk-archive moved with ONE sentence: it pointed at "single-archive Step 5.45" for the attachment read,
// a step that no longer exists; it now reads the attachment from the change's own trail. Five function
// hashes and the same five generated-skill hashes moved; no other pin did.
// rc12-body-adoption system walk (2026-10-12), a recorded act the walk's plan did not name: the
// pair's findings re-worded the three references (the tail's two record-field notes, the unstaged
// paths, the retarget note's observed base, the arc-done readout with no PR, segment 1's inputs)
// and the checked consumption-table mirror, and archive's Step 5.6 recovery sentence. Four
// function hashes moved (propose, ff, archive, architect) and one generated-skill hash (archive,
// the only SKILL.md body edited); the references are not in the generated-skill hash.
// rc12-body-adoption verification walk (2026-10-12): the consumption table's step-failure row was
// scoped to publish and tail steps (a failed select step shows no recovery); the checked mirror in
// the propose/ff and archive references moved with it. Three function hashes moved (propose, ff,
// archive); no SKILL.md body changed.
// architect-first apply (2026-10-14), PLANNED moves (its task 4.3): the architect stance paragraph
// restated architect-first (R-rda-2), the onboard flow, explore label and try-it nudge put architect first
// (D-af-6), and the archive reference's example carries the uncited architect next (D-af-3). The onboard
// body also gained its external-handoff pointer and the propose-side merge boundary its carried scenarios name.
// cli-says-orbit apply (2026-10-14), a PLANNED move (its task 3.3): the named edits of `orbit-cli-name` say orbit
// for OpenSpec in the explore, apply (skill and command), new, ff and continue bodies (D-cso-1). Six function
// hashes and five generated-skill hashes moved; review is not pinned, and no other pin did.
// cli-says-orbit system walk (2026-10-14, fresh S1, Sal: C): every thin launcher's shared sentence says "upstream
// behavior plus orbit's additions" for "upstream openspec behavior …". Ten command-template function hashes moved
// (apply, archive, bulk-archive, continue, explore, ff, new, propose, sync, verify); no generated-skill hash did.
// read-obligation apply (2026-10-19), a PLANNED move (its task 2.2): upstream step 4a of the propose and ff bodies
// gained the two baseline-read lines `orbit-propose-modifications` fences (D-ro-1, a named in-place edit), and
// propose's standalone section dropped "(unchanged from upstream)" and its "ONE addition" sentence (design D3). Two
// function hashes and the same two generated-skill hashes moved; no other pin did.
// decision-writing apply (2026-11-08), a PLANNED move (its task 3.1, design D7): every epitome-carrying body's
// heading and intro lost their count and gained the decision-writing bullet after no-chaining, plus the shared
// decision-records.md reference; onboard's disciplines list lost its count and gained a fifth item. All twelve
// pinned skill function hashes and all twelve generated-skill hashes moved; no command-template pin did.
const EXPECTED_FUNCTION_HASHES: Record<string, string> = {
  getExploreSkillTemplate: '2d521e194a20ffcca7629aa51750cf9478b6d8be74625c2ede21df821cba6b3b',
  getNewChangeSkillTemplate: 'b9e96bbdd6c45cdbc0fd4494185a705917cbe130913ca99f9ab0423596101782',
  getContinueChangeSkillTemplate: 'bb4c975eceba1d40dc7bf52f5e330c19c792692eb9eb6c4cca006149d726983c',
  // rc17a-invoked-coverage apply (2026-10-05), a PLANNED move (its task 4.2): Step 3's all_done clause
  // stopped naming "spec-driven v4" and `blind-pair` as the post-apply slot — under v5 which review comes
  // next depends on the cadence and the review preference, so the body says it is read, not predicted.
  getApplyChangeSkillTemplate: 'af3dffe068a8d6667036b0b7fde744f0f6a009b8aec1a2790699850f884b2555',
  getFfChangeSkillTemplate: '49bbc619198c2ab718a2fad315d0381709c51284d20fdd4733b78442edd73d4c',
  getSyncSpecsSkillTemplate: 'eb429dc316ba80323e0980c6161b1e0e32be20fde7f7b02c8ecf243aacba619c',
  // rc08b-walk-routing (2026-10-05, task 3.3): the command-table row's retired "auto-discovers … when invoked
  // with a change name and no markers found" became the discovery sentence. One re-record, both onboard hashes.
  // rc17b-blind-pair-command (2026-10-06, task 5.1), a PLANNED move: the Identity, Phase 4 cross-AI and
  // command-table sentences stopped enumerating the reviewer values and point at the review skill instead
  // (design D8). One re-record, both onboard hashes.
  // landing-page (2026-10-12, task 2.2), a PLANNED move: the Orientation CLI bullet names `orbit --version` as
  // printing orbit's own version and states the upstream engine baseline 1.3.1 apart from it (design D6), because
  // `--version` prints 2.0.0 from this stage on. One re-record, both onboard hashes.
  getOnboardSkillTemplate: '24c7d5898101cd9ee3249a233c1b971e6ed25ca07683c172e395ff49501d9edf',
  getOrbitExploreCommandTemplate: 'ca4bdbd66993b629a5d234d2166efc1681b69da7e7e5665c1926b8e8ab154dda',
  getOrbitNewCommandTemplate: '18edaa0b230e31b5d55952d6b6328237c0ac7b6c85c23d44e5aa3e024a29aaba',
  getOrbitContinueCommandTemplate: '19b561b34b9e9946e6babd7faa74169efca692190dc5d036d2d5044aed0e5d16',
  getOrbitApplyCommandTemplate: 'f5fc0338e5705f0f614c48c7ca9bb84c27c49782820e457bdc29be4f5903b74c',
  getOrbitFfCommandTemplate: '9dd1e0c82c3c2b15f77aa70761e19abf988dabc884ed6bcad872332eb31bed2a',
  // rc10-apply-closure (2026-10-11, task 2.8) — archive and bulk archive moved DELIBERATELY, one act:
  // archive's upstream Step 3 count excludes `(User-validation` tasks (a named edit), the new Step 3.2
  // carries the DEFERRAL REFUSALS production as a checked mirror, Step 3.4 reads every reviewed gate,
  // the readout prints one line per deferral, and the schema reference documents `deferred_validations`;
  // bulk archive's Step 3b count excludes the same tasks and runs Step 3.2 per change. Their two function
  // hashes and two generated-skill hashes moved; no other pin did.
  // Moved a SECOND time at rc10's system walk (2026-10-11), a separate act: the DEFERRAL REFUSALS
  // production gains case 8 (a duplicated task id) and the read-failure rule (external W2, W3); archive's
  // Step 3.2 reports cases 2, 3 and 8 and widens its DEFERRED rule to post-move state (fresh S2); bulk
  // archive briefs before each move and gains its per-change archive emit step (fresh W2, S1). The same
  // four hashes moved; no other pin did.
  getArchiveChangeSkillTemplate: '4d2cb92d14b1c6afe0f5c26f823c9250b0f0a994e0fbb127f5c9d1efcfb7b32c',
  getBulkArchiveChangeSkillTemplate: 'cf1a6e7b61d90ed0423e565b8eba9af0996c07c0356a364e7a82867f8fc16dcc',
  getOrbitSyncCommandTemplate: 'b985d0a4d89b0e2cc3c6b6dec2521ef2a9d0df44a8ba9ec92a5495052c94a39c',
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
  getVerifyChangeSkillTemplate: '8fe374b6394ae3a4460353f866f9676bc2faa35646bf6902ed7f0025631f1d17',
  getOrbitArchiveCommandTemplate: '5889c3a6269b5c76c85578bf2ce6e6c4152b7536452e5ec1332dd93d3b493665',
  getOrbitOnboardCommandTemplate: '3a3e98c6a01517896dfdccaba4fa4477edea62fd69dc4189df1dd105bbedcc5b',
  getOrbitBulkArchiveCommandTemplate: 'bbb9fc75d87fb8339cf4a80ad75189f6d9a8b339c9b4539778e690b1c9043053',
  getOrbitVerifyCommandTemplate: '8624a54f93f8e562c1f43660b4f410ed012871ceb2461103ebb3bbafce39c931',
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
  // Moved a second time at rc09a's system walk (2026-10-11): the brief's validation named as non-strict, the
  // Split route's "the rest of the flow runs unchanged", "run" for "re-run" under Declare, and the heading
  // line's "exactly" dropped (the parser reads CommonMark indentation) — one re-record for the walk's edits.
  getOrbitProposeSkillTemplate: '6cf55f5d76dbba337361bb7c88c118aac501db7023b332f6b6bcdc7af8a8e2a3',
  getOrbitProposeCommandTemplate: '33077b4185c425952edcdf14f4f16f2a0fa9d5961158f3c63534b58cee2576fb',
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
  getArchitectSkillTemplate: 'efdcb6f584fd51dc05154527e66899bf3eb8cd483d6f9595754754e802e17b7c',
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
  'orbit-explore': '8be5b493ee44d17dc39b1e086ff39b9708f0c742b6515c019cd89981f866d8e7', // rc16-retirement-sweep: moved once with the body at apply, a second time at the system blind-pair walk (see the function-hash note above)
  'orbit-new-change': '3804d41468aa99fb93ea9cf8752eb3326d8be07c205ae786c1517a2898f87449',
  'orbit-continue-change': '0e28709378dc20c56d4174bd912e0a36151787e96853b18e5236b456aeb1785f',
  'orbit-apply-change': '8be89e7ff2d3ac8c819aa326b75ab8ae4c579e7d35836943f792ccc430a16ea6', // rc17a apply: the v4 clause (see the function-hash note above)
  'orbit-ff-change': '7a3c5e90f88fc18f0cfa0691708a52a4cfe2db15d8b00f142b64c0985162c643',
  'orbit-sync-specs': '0ea818783245d402e1b95c34f306a781eb7ff41ef29c6b6494e1ba63ee898713',
  'orbit-archive-change': 'a8a20f33bafe12916ceb24080550bbc465759da3cb36120902ff09acf75c49fc', // rc10-apply-closure task 2.8, then its system walk (see the function-hash note above)
  'orbit-bulk-archive-change': 'dc4f36c3b28361b245cbf05b7bf894795c8bc4b4e2819f86ec3b1aa068326078', // rc10-apply-closure task 2.8, then its system walk (see the function-hash note above)
  'orbit-verify-change': 'f0f0a7ccd0025153b7a9f9bae3016668e73353455ab3e4e76a7967757d252d44', // rc06b-map-readers (2026-10-05): moved with the body's step 6 edit, then again at system walk 2's additions edit (see the function-hash note above)
  'orbit-onboard': '687ccb052066c4a0cb96b02ed20a8c4a5508a78503d6367f9dd577b0894a429e', // landing-page task 2.2 (see the function-hash note above)
  'orbit-propose': '44f1c79015ef5125ee561a2a341f59912e5bd0eab5ce30770332809c5a8e3006', // rc13c, then rc03b, then rc05's system walk, then rc09a's size brief (task 5.3) and its system walk: moved with the body (see the function-hash notes above)
  'orbit-architect': '5c48690b0b719bc0ce1cef56118412921a17778c01135e5d441d9131dc7fbc5d', // rc15: moved twice with the body — apply, then the system walk; a third time at the post-archive audit walk; a fourth at rc05's apply, the scaffold's escaped backticks (see the function-hash note above)
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
