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
  getExploreSkillTemplate: 'a46cc8e8950a12d6ad59244f18a98abd8c44845999d82127495f2d99696e5548',
  getNewChangeSkillTemplate: '05c1ecc705197039db89d61dd9ec7ce80c3c379787879336bd4f96b24d3586ad',
  getContinueChangeSkillTemplate: 'f2e413f0333dfd6641cc2bd1a189273fdea5c399eecdde98ef528b5216f097b3',
  getApplyChangeSkillTemplate: '6238712ba8cd2fd099c4f3bac13436f758fc6ac776fb8be19547f2b195240bfd',
  getFfChangeSkillTemplate: '5f56b52af6b5a018a97c5938882baa6fa02a3fa435fabd31d4f49b489077abb1',
  getSyncSpecsSkillTemplate: '3708428ee4c2b3479b859f1b255d2db8df6d929c605a9e7721106a5938e08e4e',
  getOnboardSkillTemplate: '4566a2f9d3890b8a365172839056523547e747fc38bf735c72ab87eafe3ae4bf',
  getOpsxExploreCommandTemplate: '25d2213222938868833c72ca496e26bcb33182e957746d2eba878ec17f989699',
  getOpsxNewCommandTemplate: '964e70ff5c06c74612ade42b96176a3c970e329abdf94fbd78bcc1eb9d8654d7',
  getOpsxContinueCommandTemplate: '8bbaedcc95287f9e822572608137df4f49ad54cedfb08d3342d0d1c4e9716caa',
  getOpsxApplyCommandTemplate: 'f59cfe9482a1b29f64b9cd7396397991a2f00a5cb1abde4ab8b4757acf1678b9',
  getOpsxFfCommandTemplate: '11a932fdec8028de6bfb589b654b52774e40e755247e10c72a0b536fb2bcd0ab',
  getArchiveChangeSkillTemplate: '7dd82391565f4fd42be1a3bdf65550c4b82d16021e2d991a658f69d16bd07f76',
  getBulkArchiveChangeSkillTemplate: '7fda50b38da1f4862c04e19bab5a5b7da5b905f15cfa0c6f5533ba9abf79e62d',
  getOpsxSyncCommandTemplate: '1f43fa3f86c3419810c489a937d987a99c75519b3f7d8de04185eb3d882c5cf5',
  getVerifyChangeSkillTemplate: '75411ca5de377e99910979c26387eb28249dcbe8cb05a48c9d578bf29f8075a9',
  getOpsxArchiveCommandTemplate: '45e934d69c858ad8182863cb1a6a2a190bf8fa6a186738e7a86155ef96dfdbdc',
  getOpsxOnboardCommandTemplate: 'e22045820652b51734a152ee00dcf900e87b1a01251be2c27c9703531af38a70',
  getOpsxBulkArchiveCommandTemplate: 'd330c0fd335156a8bd9012e7e6eb999bbbc04cff3d2bd41f33e0a0d3edd6fd26',
  getOpsxVerifyCommandTemplate: '8e815dc2ea7e455ed72a6658dd70c69778a0f05fd9f8abf5165dcfacb1fc144e',
  getOpsxProposeSkillTemplate: '9462cf5cdbfce7a8c4928ab8f412438b940de54ef476d3541d3bb95796105f0c',
  getOpsxProposeCommandTemplate: 'da966e5702d3cfca3503b26e9385b150ef589023a3086251f36c9dae09eca71f',
  getFeedbackSkillTemplate: 'd7d83c5f7fc2b92fe8f4588a5bf2d9cb315e4c73ec19bcd5ef28270906319a0d',
};

const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'openspec-explore': 'bb3b638e2d59eaa6fc7121cc35b3767a1d68cd4e6b7bd73e81e7562090b6efc5',
  'openspec-new-change': '1a04e109c08da7f07d9a49773576a7309af031742c469d45cb055af7d6a659d8',
  'openspec-continue-change': '463cf0b980ec9c3c24774414ef2a3e48e9faa8577bc8748990f45ab3d5efe960',
  'openspec-apply-change': '38ad2cb645827eda555f20e1ac9d483e1d75bae4c817c0669474aaa8c12c0421',
  'openspec-ff-change': 'd3e6666a85494872f3e329c7b8e4befbf65f4cb203346048bda430ea63ef0791',
  'openspec-sync-specs': '4fe710f1788de6c7e21d20319954092bc5f5dd86a3ba79725e1cce84bbd9c3ad',
  'openspec-archive-change': 'f01e3fd3fd9a90f2746fc84be1057c9be274a903c9d16aa71e84e77b199e60fd',
  'openspec-bulk-archive-change': '98f38a82226ec1190ad14b0267fbd3115664704f452089275fff6f3d97597cdf',
  'openspec-verify-change': '070b59a7cdf1c51a16d4640e6c6bb51d772b2dc1885f2151b3dae3dc10d54021',
  'openspec-onboard': '9206ebea0dc2e49f484deb4f3b416c701ca7a1eb0353ab543483dee1f0117715',
  'openspec-propose': '09cd54c1c7a404c61486ab5ec7c05147b3386dc086750c4fa7e64c8fbe15342c',
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
