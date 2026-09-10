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

const EXPECTED_FUNCTION_HASHES: Record<string, string> = {
  getExploreSkillTemplate: '1dfd25f63ce539fc14a418bd6f9c22efa9b54720a7cd5f2548653c6731fb0d87',
  getNewChangeSkillTemplate: '8f68be94db91a147b93d492f6f32ab3c02725a20a001c87602ac8d9741587614',
  getContinueChangeSkillTemplate: '98c49b247140ba301964c1e5a825686485b74a525f65f31a365d19e0aa84923e',
  getApplyChangeSkillTemplate: '5e847a2383a76b80295b47b7177ff7adf2ca419a9344d1cdb32b594e50321a89',
  getFfChangeSkillTemplate: '9007ef06629a12ea511cbbb896e815556a51c86ffc157c6cc6e608260b3a8f42',
  getSyncSpecsSkillTemplate: 'a9672b720eff36fb30f2229d835fd9a9e4cc88e81f1773bc74aff79247aa9809',
  getOnboardSkillTemplate: 'cdedf05aa73703e83d2bb1eb0e74a3be72a0a2b1b2bfdc907c131c475ba8ec3f',
  getOrbitExploreCommandTemplate: '52892dbd4b5eb72264dc6eb54f8126a09fc903adc1c1654c58e0650df609bfb6',
  getOrbitNewCommandTemplate: '47d97305a2d3abca6eafa8f7ed5fe13fb83ea8ca0b71f007975b217135f5f5aa',
  getOrbitContinueCommandTemplate: 'e1ecd4fffee224e284453be717226824c7567041d7c1676b6b6bca4727e3a9dd',
  getOrbitApplyCommandTemplate: 'e5a4f72b65777d13fdd9d968e3ba50ec3c9d49c890a604a64e8dbb472bf130f8',
  getOrbitFfCommandTemplate: '57607811009ca5ece844affae130fa47efc8e64f2c14c181113f581c81978405',
  getArchiveChangeSkillTemplate: '5ea66ee9912fda61357d3f33dc225bdd216f2400e9d7f91838a0ff7f37f7d392',
  getBulkArchiveChangeSkillTemplate: 'd95ac9d5b2317736ac8395e44ff8eae1ce8d063b6eaa5fe16c225b41eeaa597d',
  getOrbitSyncCommandTemplate: '1067039e869d8dedf7922da46230b53a88253cf3fe27c7a5d60c96bc9a43453f',
  getVerifyChangeSkillTemplate: '13736310b7089e7ae108df25d6c3dc75ff923dbd9f52f02cfc322837f8e6ac4c',
  getOrbitArchiveCommandTemplate: '92e3ebad046cbc2a68dfb204cbb3c847498d2cafcdd2065357d744580c05a8fe',
  getOrbitOnboardCommandTemplate: '3a3e98c6a01517896dfdccaba4fa4477edea62fd69dc4189df1dd105bbedcc5b',
  getOrbitBulkArchiveCommandTemplate: '6bc94ce2a406ceb934f461665bdd1e96f5a7149c798172c04f50d83c3630819a',
  getOrbitVerifyCommandTemplate: 'b98377960f7416452e77f6042ffbb037df4c6461619aebe9b595a6883a752a9a',
  getOrbitProposeSkillTemplate: '1c9073523d4d09ab55eaea8cfdf13acc3b5f8b32f536c0348767a5391c06fe3c',
  getOrbitProposeCommandTemplate: 'b91222654d5050d7ae7f2f49b5d6c4b34e65638bd8c5ae3e622550eb1329c168',
  getFeedbackSkillTemplate: 'ded61ad85c5050f7bf241870b14bfcdd929f0be68a028c1130fd30a66efbda3b',
  getArchitectSkillTemplate: '6288a18309e38c9c8507d61993c3fef800526d572d99ba7154d8ff344bb82f1f',
  getOrbitArchitectCommandTemplate: 'b65b8cca6431bb45aa8587d3bfc1e9458981e2e1bc925ae45cd57414143cb3db',
};

const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'orbit-explore': 'ee4acd730d76d5f6ee9b0f08f439f6b0be39d87886bf1a5dafdb430f262ceb62',
  'orbit-new-change': '94c9d6377c6de0484f3a51923eba08214ca45cab5d87a55e46e032de2640b925',
  'orbit-continue-change': 'f61634ab5e96436b33fd30c210f84a57f55baf1716d6ef4679c1ed2a518cc3d3',
  'orbit-apply-change': 'ece702fe9e211eb1d2f2aff499222679b9ebbe12ffa88e7f6610d3531d1ab089',
  'orbit-ff-change': '597ccae4e64f155b19333a1f196f0d89173ab313cf657b2cf4bddbf2e48f9983',
  'orbit-sync-specs': '23adf56ababc77dac8dcc06048b4d74d27ded9bc4f49a57858e17c4ea7866a75',
  'orbit-archive-change': 'fd257a3913e8760050f9d52f6876af0524086a15c88e8681630a551e1df2b47e',
  'orbit-bulk-archive-change': '601dd7c74804c06a9818428f86030c8cef5311a9fc7c59f2dc14e490007a291d',
  'orbit-verify-change': '0d8f6b82d40bf95bd6b49f447fbd66d5414af79fa157872345668b9cb709ab6d',
  'orbit-onboard': '8f7e1e5ab79817914195b58d92e636b7ad7249be555deefe08e9e7256fdcda3f',
  'orbit-propose': '5e62bcae0dd9d181e42eb64b60d829fce54ccb0f9e8c08721f3b8d014cf62ccc',
  'orbit-architect': '2a5223710b0289dbcc902bbec064fbc5e688a237b5f4ad7b94223c2493c7ca5f',
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
