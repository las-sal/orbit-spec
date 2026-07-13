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
  getExploreSkillTemplate: 'c238112e70913c194476028bb593f19804fa9453beeb8f138aecd96950502b8d',
  getNewChangeSkillTemplate: '9a42adfda579ac7e7f66547322b28f0f5d33229786607ba29893e4e534da2cc5',
  getContinueChangeSkillTemplate: 'a396420460b0ed7fcf4a06fcfeb354013b5d41175079b8dd3c624d8858bc9181',
  getApplyChangeSkillTemplate: 'c44f59bf6418119c46f4fda4164502ee30a2ed66d62c39398e5dcd0197d86294',
  getFfChangeSkillTemplate: 'aad2b3ae1367a92e379f19f00860e180f52bd62cf31ca5b0beb5bd68af6a0b80',
  getSyncSpecsSkillTemplate: 'e11f682d57b131a469d9e7468443f82ba6b7111c484dca50cb2fb9954c0264e6',
  getOnboardSkillTemplate: '5d5e6e91987e56f7be7096e5cdd6c72d132b10bfe54ef7f681798036551bc456',
  getOrbitExploreCommandTemplate: '52892dbd4b5eb72264dc6eb54f8126a09fc903adc1c1654c58e0650df609bfb6',
  getOrbitNewCommandTemplate: '47d97305a2d3abca6eafa8f7ed5fe13fb83ea8ca0b71f007975b217135f5f5aa',
  getOrbitContinueCommandTemplate: 'e1ecd4fffee224e284453be717226824c7567041d7c1676b6b6bca4727e3a9dd',
  getOrbitApplyCommandTemplate: 'e5a4f72b65777d13fdd9d968e3ba50ec3c9d49c890a604a64e8dbb472bf130f8',
  getOrbitFfCommandTemplate: '57607811009ca5ece844affae130fa47efc8e64f2c14c181113f581c81978405',
  getArchiveChangeSkillTemplate: '9aa7c1093c2be553456e9aaf8610f8d8bea9d1d0b4725c2881dbb233e8914087',
  getBulkArchiveChangeSkillTemplate: '86752c2a1f9302c18f0436518447e4e570cd9be110d19cc4d2986686805bb078',
  getOrbitSyncCommandTemplate: '1067039e869d8dedf7922da46230b53a88253cf3fe27c7a5d60c96bc9a43453f',
  getVerifyChangeSkillTemplate: '0107097efc1e796cf6cfcd08a7c5644f3cec74c468bcd868012db58f3ddbaf30',
  getOrbitArchiveCommandTemplate: '92e3ebad046cbc2a68dfb204cbb3c847498d2cafcdd2065357d744580c05a8fe',
  getOrbitOnboardCommandTemplate: '3a3e98c6a01517896dfdccaba4fa4477edea62fd69dc4189df1dd105bbedcc5b',
  getOrbitBulkArchiveCommandTemplate: '6bc94ce2a406ceb934f461665bdd1e96f5a7149c798172c04f50d83c3630819a',
  getOrbitVerifyCommandTemplate: 'b98377960f7416452e77f6042ffbb037df4c6461619aebe9b595a6883a752a9a',
  getOrbitProposeSkillTemplate: '860168ea59ccd84ff93db44e468e009da8d85d8a60011b23128b4b97b8e37c78',
  getOrbitProposeCommandTemplate: 'b91222654d5050d7ae7f2f49b5d6c4b34e65638bd8c5ae3e622550eb1329c168',
  getFeedbackSkillTemplate: 'ded61ad85c5050f7bf241870b14bfcdd929f0be68a028c1130fd30a66efbda3b',
};

const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'orbit-explore': '40ba5177ce85cde5b3e6a3ab2287e7ddc247f9e5f884dc793fe875353ad3d329',
  'orbit-new-change': '8f552229463c98b062a62c59e8a155bb8cb51f80912a355f3df7007a0700ceb4',
  'orbit-continue-change': '6121a242d5bc00e1a1ad034f90483931398ac48b214ae446cd438c813cd2b228',
  'orbit-apply-change': 'df534b81dfb89f75b62310bfb6f7fdee04667fb7ce35435862b4f0e2a1e00b17',
  'orbit-ff-change': '7dde651c599b56a4bd7e53400f6ddf43c8021994ba1f2062467bbbda08fde98e',
  'orbit-sync-specs': '6103fa358c0d15c7d22a3800555f5cbfb54f3213a5ac40b520b0e916c7af92e4',
  'orbit-archive-change': 'a174131094f9350beed44a7faa9ed9dc4bb415e9ef6b0881704f6fa0f23ca94b',
  'orbit-bulk-archive-change': '43f4a834a5274aaab4e48ee7c58b3da0b36d5b2140c5fb8adef78c771ac16703',
  'orbit-verify-change': '5bbe1cdd4ea0417eb51f4000239a4048f8d8db4f78621b5237609d3e4d07330a',
  'orbit-onboard': '87d7fb94ca25aaa7366e8cecbd91661b17dd33db06a53d955312da3c7c0f5c0f',
  'orbit-propose': '4376b6cd118d8fc12e11b3621f7905d5b441d472389e82d17d480417d5cebac1',
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
