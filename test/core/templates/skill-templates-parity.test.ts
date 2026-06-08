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
  getExploreSkillTemplate: '270b381bba51a0c7a166a8b1e4220c57741ec895631aa8000e8ab5ca11faf2b8',
  getNewChangeSkillTemplate: '5dba3b98c35dd88d623832f5ec8f31ff9afd004391c230aa3f2a0432469f652f',
  getContinueChangeSkillTemplate: '3645899756f2bf41e8d4de7f0dd2b0e72504909868586ad50896ae99a41fa26c',
  getApplyChangeSkillTemplate: 'dae3d1728d4eab02b0f3bd661253c35eee727b8d94458b2c08e3f0a3c6fbde29',
  getFfChangeSkillTemplate: '33624dc6af011ab12112c845247b4260c9592d56238302d8fd169bf159b2bc71',
  getSyncSpecsSkillTemplate: 'd23ab1a4b44b97727e12dc91740c119dd6598519b2b4e440f0550e0d4267d5b4',
  getOnboardSkillTemplate: '333c4a4fff215769dd93d1c7ea865b97eff7eb14a383e21cea2c8dbc30043f93',
  getOpsxExploreCommandTemplate: 'c3675c6f69da064c5b0fbd48847dcdf37286e883f38c0b9418456e5ee978fdeb',
  getOpsxNewCommandTemplate: '8209bc77af04e79b8f9d345b336fe79943ca4924cf2af2601483e59248c69577',
  getOpsxContinueCommandTemplate: '239ba7cd56bde825736f95cf87f7789e4fd32da901064dc05d5171b3a91fa534',
  getOpsxApplyCommandTemplate: '5cba722f11cb009f39cba420c713f57c5d7fb37c940739d7dc0e3000241f1fd5',
  getOpsxFfCommandTemplate: 'b921e5ead20fbb01c499b30bbb0ccf462e7832bf015872a5f754f653e2440cb8',
  getArchiveChangeSkillTemplate: '8aba354a98ad3efa0d4338cace5634ba66d6e25f573598cc8cbe1755936ada4f',
  getBulkArchiveChangeSkillTemplate: '6202f3d017eeb5332c87697e5d4c7cb68dcebefac0059a550ea60eb2302fe8ae',
  getOpsxSyncCommandTemplate: 'a4b53160057c3f247144758b5ef0d35fc077421c550e997f60ed49fa9492b25a',
  getVerifyChangeSkillTemplate: '723e80f9cc54a845f3940591f401e2f15c28a3da36e8e600e81250fd1f1f4c2d',
  getOpsxArchiveCommandTemplate: 'dbb2ac2c3e28c6acabac322882b4a3d41209d30dbf201c48680bcf4ed18dbde5',
  getOpsxOnboardCommandTemplate: '6c818719d154c7808269445e46755509a6be66a3e24bc027bbbc07f638b6d448',
  getOpsxBulkArchiveCommandTemplate: 'df3887ed905c63da156a0650a2d013fed57fd24da5f21db3c13fdf5d45db2cda',
  getOpsxVerifyCommandTemplate: 'dd8e11fd0f8775f3fe11767d4ae20b66a605fae97bbab2b2bb906d946ddd80c5',
  getOpsxProposeSkillTemplate: '4ba4a7534fc8c9f8031c70d7e8c3dc1b909db58cf9886b46fe52e76180ceefa3',
  getOpsxProposeCommandTemplate: 'e66ff294de10662e12002e8a81b6520f2e0ba249b5d67c3a61c7709cc2dc3e1b',
  getFeedbackSkillTemplate: 'ded61ad85c5050f7bf241870b14bfcdd929f0be68a028c1130fd30a66efbda3b',
};

const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'openspec-explore': '10549b4495819782dd8c7ab3480966a46c13cac60bb4b92429b049fe9d04b7dd',
  'openspec-new-change': '04138b8d359891beaadb4cc65de9288d785c4003a08df3d7cab01d2e42e90ab6',
  'openspec-continue-change': '14681b423d84d6955fcf6affdb2fee3d0e8236e863a66b62724b472e529e8606',
  'openspec-apply-change': 'f23e919f5d2f00a6ae09da2153d2f63fb061a85a2a7436461cd8ab4f0ac26254',
  'openspec-ff-change': '4baf4c0fa63a3f4098442d46fc1dd55302e8c514b14130a471849c27ddcfa637',
  'openspec-sync-specs': '0d97f3108157402adf872ef7010356e73745297246b1219d4542ec7de31da167',
  'openspec-archive-change': '09455905e504499d5597cdcbf7085b9336fc0be56ace123f2b53e268667218bb',
  'openspec-bulk-archive-change': '67b631edc2df841ae1bcaa8077e96e34c87da3db48ec53fa5a4ede46ecb77ab9',
  'openspec-verify-change': '89fbdd00de08a1b3e1418b91506b5f4d15f66931413d2c7dcb71b4e7d40dfd49',
  'openspec-onboard': '5379f8e68b501126ff6c86e6cd85b53a14fe7d70890f6dc4cb5a01e21cfb92e2',
  'openspec-propose': 'a60dc0b2f4634eccc9d9fc8e3d9772edbe68a48d5a09e778817e5545d828600b',
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
      ['openspec-explore', getExploreSkillTemplate],
      ['openspec-new-change', getNewChangeSkillTemplate],
      ['openspec-continue-change', getContinueChangeSkillTemplate],
      ['openspec-apply-change', getApplyChangeSkillTemplate],
      ['openspec-ff-change', getFfChangeSkillTemplate],
      ['openspec-sync-specs', getSyncSpecsSkillTemplate],
      ['openspec-archive-change', getArchiveChangeSkillTemplate],
      ['openspec-bulk-archive-change', getBulkArchiveChangeSkillTemplate],
      ['openspec-verify-change', getVerifyChangeSkillTemplate],
      ['openspec-onboard', getOnboardSkillTemplate],
      ['openspec-propose', getOpsxProposeSkillTemplate],
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
