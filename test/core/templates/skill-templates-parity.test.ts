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
  getExploreSkillTemplate: '278d0d4fff3fd91554c862c9f7a4bbbc5823f09c61d3b26f2129379ab76fc07d',
  getNewChangeSkillTemplate: 'be5b3b17beb5ea6000a1c58a72fb492392d1ab6aede25e10b55ebb6774dbf269',
  getContinueChangeSkillTemplate: '3d34c29edf8401fd73910d124cdb94e61c13c8481d62066fa7984a247b94a7c6',
  getApplyChangeSkillTemplate: '1427cb1935d06ea838b14cfb564b4e2912d40a8ab02f390a42c9da8197306b31',
  getFfChangeSkillTemplate: 'e1cb43226a233253b5e941cbfa3e91370bbde60019da29849b91909ebbddcc62',
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
  getVerifyChangeSkillTemplate: '6362a75dd5a1a75bf54a2794d014c5654dab872893f5e8d8dca817f32d818d47',
  getOrbitArchiveCommandTemplate: '729cc242b591501dfa6c7661af4eae58a0a6d69fdae7acf97bd2b35d982c8913',
  getOrbitOnboardCommandTemplate: 'c0c35e5e565f2228d2fe47b8f8cf7ceb83f369578a62ea5a715667340c26b99e',
  getOrbitBulkArchiveCommandTemplate: 'a84f4da07a4f116bd187e6775889ee8698f57a71249fd4cee6c90c49143cb0fd',
  getOrbitVerifyCommandTemplate: '8aa5765188bb0d8b73b00dd5a6133a8fb1594c732140c99191beb3bc8862a6cc',
  getOrbitProposeSkillTemplate: '229e750135a02c4fa1548a2e2ddc65f5cd176b6093c52d816fa2c2ed3c36c151',
  getOrbitProposeCommandTemplate: 'f299d60b3e99da372cb172e9605ef10ef6d72c917d26200b5890e83f1170a624',
  getFeedbackSkillTemplate: 'ded61ad85c5050f7bf241870b14bfcdd929f0be68a028c1130fd30a66efbda3b',
};

const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'orbit-explore': 'f6c729269cf9c81fc34559918c06fe8062ccc8492fadb136fc474e5d0c9bc7b0',
  'orbit-new-change': '00367a29e95b7768021b961e7282d16b2b57ea712ca5255138bf083a578f1b4d',
  'orbit-continue-change': 'f2ef822d902824bc1a81033b3951fd10db0376cfa917137029ee4426c78b4da5',
  'orbit-apply-change': 'd626bc2b22eb74b4b1ad86857ae110e2fbe9d564e2f9092867cf548aaa155505',
  'orbit-ff-change': '28d6b092803d4691fb5fb423fe6c970a10a568365d0eaefc77ca730c4836b116',
  'orbit-sync-specs': '69fce0ecb0f9cf76b6abf5c463ee2a11a8898859c449ba984a16f7f2c9015fe5',
  'orbit-archive-change': '4662c1a35205ada0415d5606d82fee4f9628a818cb034f602f8b46ed677d7bf3',
  'orbit-bulk-archive-change': '1bd94762c8d0b2f8ec86e06d2552be7e2ad14574147839018988071b33abccf8',
  'orbit-verify-change': 'caba1afc11f1d67a19bafea077003f86d320cda7a6600d44572281c95b66ffaf',
  'orbit-onboard': 'b5fb4f9083c7404916c84019eed9c415caac5bf6da02f411fa802c56da0ffefc',
  'orbit-propose': '812d4ec8d6518bf8b59f66eab048dafb225bd4323606e34c0ab058ff6c9bba5b',
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
