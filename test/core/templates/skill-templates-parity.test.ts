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
  getOpsxApplyCommandTemplate,
  getOpsxArchiveCommandTemplate,
  getOpsxBulkArchiveCommandTemplate,
  getOpsxContinueCommandTemplate,
  getOpsxExploreCommandTemplate,
  getOpsxFfCommandTemplate,
  getOpsxNewCommandTemplate,
  getOpsxOnboardCommandTemplate,
  getOpsxSyncCommandTemplate,
  getOpsxProposeCommandTemplate,
  getOpsxProposeSkillTemplate,
  getOpsxVerifyCommandTemplate,
  getSyncSpecsSkillTemplate,
  getVerifyChangeSkillTemplate,
} from '../../../src/core/templates/skill-templates.js';
import { generateSkillContent } from '../../../src/core/shared/skill-generation.js';

const EXPECTED_FUNCTION_HASHES: Record<string, string> = {
  getExploreSkillTemplate: '99c93dd670bc548ed93da66adbe4f7281a8e1c6f4913162613b9867a823990f5',
  getNewChangeSkillTemplate: 'e08e2b0b51ca6e820a886df1893ff649fe1d5988935a19a88fa3b32740ced156',
  getContinueChangeSkillTemplate: '2e6fb52e5cab42c85accc2dfd947e2077543777a54b6c2b29dfa0e7efc19c54a',
  getApplyChangeSkillTemplate: '06badb808c247f8d26f79b662ffff7b855a90ac6a823882cc31a398ddbd73188',
  getFfChangeSkillTemplate: '4ba6ecdc4d2aa021ae5e34a92247405ba03612257a32e14889bf7033e8ac9a6b',
  getSyncSpecsSkillTemplate: '051c7fbb52cf2e87d8da2ffc45e6dbd2b4663f9b37add611abe430695e9694b1',
  getOnboardSkillTemplate: 'a96f0e76b7647a7c56ce3f7cb337ed351cbb94de1b77be2811333db4c61d345a',
  getOpsxExploreCommandTemplate: 'c3675c6f69da064c5b0fbd48847dcdf37286e883f38c0b9418456e5ee978fdeb',
  getOpsxNewCommandTemplate: '8209bc77af04e79b8f9d345b336fe79943ca4924cf2af2601483e59248c69577',
  getOpsxContinueCommandTemplate: '239ba7cd56bde825736f95cf87f7789e4fd32da901064dc05d5171b3a91fa534',
  getOpsxApplyCommandTemplate: '5cba722f11cb009f39cba420c713f57c5d7fb37c940739d7dc0e3000241f1fd5',
  getOpsxFfCommandTemplate: 'b921e5ead20fbb01c499b30bbb0ccf462e7832bf015872a5f754f653e2440cb8',
  getArchiveChangeSkillTemplate: '0cc1ce888ed11b44350234e63a14488ac91854d7a1ed130a5f1d4ec6b80c1de2',
  getBulkArchiveChangeSkillTemplate: '769c095d57aca9fa783f99b9e03578d77a0123f5027b84c0749711e9a50e454c',
  getOpsxSyncCommandTemplate: 'a4b53160057c3f247144758b5ef0d35fc077421c550e997f60ed49fa9492b25a',
  getVerifyChangeSkillTemplate: '24ba12008a12d6a15900693fb0eafefa4bdc2736516d5a2af691c759d57aa0be',
  getOpsxArchiveCommandTemplate: '4d29e73b4febe04f569699ca5dd7b26136a15511c87f39b3986c48f5ad08101e',
  getOpsxOnboardCommandTemplate: '6c818719d154c7808269445e46755509a6be66a3e24bc027bbbc07f638b6d448',
  getOpsxBulkArchiveCommandTemplate: '688ecd00f21be6ee13dea430b4be9450094a28ca1a7321fe7ef1b0fdcc992ae6',
  getOpsxVerifyCommandTemplate: 'dd8e11fd0f8775f3fe11767d4ae20b66a605fae97bbab2b2bb906d946ddd80c5',
  getOpsxProposeSkillTemplate: 'e89b4bed43b454b3c475abffe4f2e1071c36b4e1a929f776f77be17849abddb8',
  getOpsxProposeCommandTemplate: 'e66ff294de10662e12002e8a81b6520f2e0ba249b5d67c3a61c7709cc2dc3e1b',
  getFeedbackSkillTemplate: 'ded61ad85c5050f7bf241870b14bfcdd929f0be68a028c1130fd30a66efbda3b',
};

const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'orbit-explore': 'cbcebd6c743f119de397427f15c1cb37d54ec704708aa0edf50864e5e0afb2cd',
  'orbit-new-change': '0a0e2b19dfb444f72d5e813e7a719be3200c327807ad027f23d2059fe1ecea40',
  'orbit-continue-change': 'a7ebec8f27a2bdbc4d4c0762ef5913833cab493452d8238985f1d6623964feac',
  'orbit-apply-change': 'e68f52487361d6faa892840002b434bcff4a13910a2beb3b6d4b0a6f1d590a2d',
  'orbit-ff-change': 'f6e676534d88d529fde2ff429396f89277b6a0f964c9bf5e0204fa6e296ff0f9',
  'orbit-sync-specs': '69fce0ecb0f9cf76b6abf5c463ee2a11a8898859c449ba984a16f7f2c9015fe5',
  'orbit-archive-change': 'caf7d2b193f32732c666d928417c9cf03e879908574072e6e352018a6d3f0080',
  'orbit-bulk-archive-change': '34f494c489355b7728af8c28f77333fd3c45ff31d00a03452a1e65ef5a457ef2',
  'orbit-verify-change': 'ff2924efd44d677968e23634fc21cbaab4328ada7c6072aaa3a3ee8b255de86e',
  'orbit-onboard': '3507c1b4d2906199355bd450db48c228507e0b27708dd229df9e1dd928389f68',
  'orbit-propose': '97f160da4da191d9b24fa7029e269855a3cb340ddbc77c8bbb6fa219a221349d',
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
      getOpsxExploreCommandTemplate,
      getOpsxNewCommandTemplate,
      getOpsxContinueCommandTemplate,
      getOpsxApplyCommandTemplate,
      getOpsxFfCommandTemplate,
      getArchiveChangeSkillTemplate,
      getBulkArchiveChangeSkillTemplate,
      getOpsxSyncCommandTemplate,
      getVerifyChangeSkillTemplate,
      getOpsxArchiveCommandTemplate,
      getOpsxOnboardCommandTemplate,
      getOpsxBulkArchiveCommandTemplate,
      getOpsxVerifyCommandTemplate,
      getOpsxProposeSkillTemplate,
      getOpsxProposeCommandTemplate,
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
      ['orbit-propose', getOpsxProposeSkillTemplate],
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
