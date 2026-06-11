import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import {
  type SkillTemplate,
  getApplyChangeSkillTemplate,
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
  getExploreSkillTemplate: 'e7460329e6ed9ea02e334cb6fb62194cf40cda09f1c2123d5b510ec548aeadbb',
  getNewChangeSkillTemplate: 'bacb23a4a723e80e4b9d440ee84560425083561a88c24c334021d0b87fe689cd',
  getContinueChangeSkillTemplate: '7bfff97836bb3c9b4fe19d1b98450ff13b2b92a4917b763149faa9a78b1aaa45',
  getApplyChangeSkillTemplate: 'e011a39aec5f68d00e75f3a9ef607bd9e896e4ef6991cf6ffd2ac458bd226beb',
  getFfChangeSkillTemplate: 'd6fce56424e938e48e201e0b5f8c07d1e45b7f6a29ccff0a34e906f02fa7e51a',
  getSyncSpecsSkillTemplate: '051c7fbb52cf2e87d8da2ffc45e6dbd2b4663f9b37add611abe430695e9694b1',
  getOnboardSkillTemplate: '324a6459af060bb6de4e0d5dbbb7d8f6e18671a0b1445cd3ec15d9f960833ba0',
  getOrbitExploreCommandTemplate: '67d3c493798424aa9f2dc524c0ddb18c5f2b44ef6a29cdbbc0fdf644a3b50f8a',
  getOrbitNewCommandTemplate: '291c8347f65dcc38184dafa932c78b0a3e3218e5a105daff9046f33020febf0c',
  getOrbitContinueCommandTemplate: '93442585519372325506d445d28c1ca3828fe5b2e027ad8a413a47e139228295',
  getOrbitApplyCommandTemplate: '7f6f2fdd707fe599e9d5d6f9b851e5e52f95c0de8e969a1a8025aec3e698d523',
  getOrbitFfCommandTemplate: '4afcf62f1be0d918a8ea7bd48aa29aa15a2b000670b181362cffaeb37c61cd33',
  getArchiveChangeSkillTemplate: '0f30f87ac5990cd14e200f6163bf81681800314c732353a977a6edcc744a4622',
  getBulkArchiveChangeSkillTemplate: 'bc683abfd941a6ee78c9e464b01a63bfd941f21e814537317f58dbfec7cbf632',
  getOrbitSyncCommandTemplate: 'fac20e37231338129b53cf0bb8f97b4f3ca1f317ed1868dc7555e5bb139083da',
  getVerifyChangeSkillTemplate: '078a723db0ff1704fb9c4b9a0e84a2e47b1664017fc45bca67140f6f9c8f09cc',
  getOrbitArchiveCommandTemplate: '729cc242b591501dfa6c7661af4eae58a0a6d69fdae7acf97bd2b35d982c8913',
  getOrbitOnboardCommandTemplate: 'c0c35e5e565f2228d2fe47b8f8cf7ceb83f369578a62ea5a715667340c26b99e',
  getOrbitBulkArchiveCommandTemplate: 'a84f4da07a4f116bd187e6775889ee8698f57a71249fd4cee6c90c49143cb0fd',
  getOrbitVerifyCommandTemplate: '8aa5765188bb0d8b73b00dd5a6133a8fb1594c732140c99191beb3bc8862a6cc',
  getOrbitProposeSkillTemplate: '4b30fa019734591a22dcc40da0daaf7752b753ff398ab9c074dafe9c9f274588',
  getOrbitProposeCommandTemplate: 'f299d60b3e99da372cb172e9605ef10ef6d72c917d26200b5890e83f1170a624',
  getFeedbackSkillTemplate: 'ded61ad85c5050f7bf241870b14bfcdd929f0be68a028c1130fd30a66efbda3b',
};

const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'orbit-explore': '5ddcc19bc1688c154a1eda1f2e44ff35249b4f4c4b858e4d61f7f530e4040981',
  'orbit-new-change': '2742ce854143b3a463981aca416a8455bef4f73614994e47f723f581a0e39607',
  'orbit-continue-change': '8d41722989edde501cb56c0c27d9696519fdb917751cfb09c1ad768b5bbc6fab',
  'orbit-apply-change': '9618f839b6553892bff72f986d9b80585a332071b04371f5d9cb876cd9d81a81',
  'orbit-ff-change': 'ce1fd2bf07212880577139ef0def52d80f5c9cba2fe6cfcfcf1d0adb964a7737',
  'orbit-sync-specs': '69fce0ecb0f9cf76b6abf5c463ee2a11a8898859c449ba984a16f7f2c9015fe5',
  'orbit-archive-change': '4662c1a35205ada0415d5606d82fee4f9628a818cb034f602f8b46ed677d7bf3',
  'orbit-bulk-archive-change': '1bd94762c8d0b2f8ec86e06d2552be7e2ad14574147839018988071b33abccf8',
  'orbit-verify-change': 'dc4592d67bbd405a3d6751c0e5cdf2e288da30bb08832bf0c8a3abe3d14dcd4f',
  'orbit-onboard': 'b5fb4f9083c7404916c84019eed9c415caac5bf6da02f411fa802c56da0ffefc',
  'orbit-propose': '8d517954530023ae0decbfee6cdcb2577df5cdeb32977bf3305b7239a1c9f644',
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
