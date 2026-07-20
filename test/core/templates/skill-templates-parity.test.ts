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
  getExploreSkillTemplate: '9c7267ee9621af5a07850df38f6afe9fdb1c0aca4df501245ab938d80ccf525a',
  getNewChangeSkillTemplate: '9a42adfda579ac7e7f66547322b28f0f5d33229786607ba29893e4e534da2cc5',
  getContinueChangeSkillTemplate: 'a396420460b0ed7fcf4a06fcfeb354013b5d41175079b8dd3c624d8858bc9181',
  getApplyChangeSkillTemplate: 'd9197c075246a154fc86c273fb99d922428127292c7708ec6b304a077ca367d8',
  getFfChangeSkillTemplate: 'aad2b3ae1367a92e379f19f00860e180f52bd62cf31ca5b0beb5bd68af6a0b80',
  getSyncSpecsSkillTemplate: 'e11f682d57b131a469d9e7468443f82ba6b7111c484dca50cb2fb9954c0264e6',
  getOnboardSkillTemplate: 'eb85d0907bd8f43b3490fdc86e49bd73d2939035fb9259c6260e024c7e73d9da',
  getOrbitExploreCommandTemplate: '52892dbd4b5eb72264dc6eb54f8126a09fc903adc1c1654c58e0650df609bfb6',
  getOrbitNewCommandTemplate: '47d97305a2d3abca6eafa8f7ed5fe13fb83ea8ca0b71f007975b217135f5f5aa',
  getOrbitContinueCommandTemplate: 'e1ecd4fffee224e284453be717226824c7567041d7c1676b6b6bca4727e3a9dd',
  getOrbitApplyCommandTemplate: 'e5a4f72b65777d13fdd9d968e3ba50ec3c9d49c890a604a64e8dbb472bf130f8',
  getOrbitFfCommandTemplate: '57607811009ca5ece844affae130fa47efc8e64f2c14c181113f581c81978405',
  getArchiveChangeSkillTemplate: '8fe77191784a105d904de7e978caf276d8e0e0aa3aaa6356bd01ac554ce058eb',
  getBulkArchiveChangeSkillTemplate: '86752c2a1f9302c18f0436518447e4e570cd9be110d19cc4d2986686805bb078',
  getOrbitSyncCommandTemplate: '1067039e869d8dedf7922da46230b53a88253cf3fe27c7a5d60c96bc9a43453f',
  getVerifyChangeSkillTemplate: '0107097efc1e796cf6cfcd08a7c5644f3cec74c468bcd868012db58f3ddbaf30',
  getOrbitArchiveCommandTemplate: '92e3ebad046cbc2a68dfb204cbb3c847498d2cafcdd2065357d744580c05a8fe',
  getOrbitOnboardCommandTemplate: '3a3e98c6a01517896dfdccaba4fa4477edea62fd69dc4189df1dd105bbedcc5b',
  getOrbitBulkArchiveCommandTemplate: '6bc94ce2a406ceb934f461665bdd1e96f5a7149c798172c04f50d83c3630819a',
  getOrbitVerifyCommandTemplate: 'b98377960f7416452e77f6042ffbb037df4c6461619aebe9b595a6883a752a9a',
  getOrbitProposeSkillTemplate: 'aaee999aeb4bf54d1136aa2394250069812e6c3bbd1302cc97020553f75ad987',
  getOrbitProposeCommandTemplate: 'b91222654d5050d7ae7f2f49b5d6c4b34e65638bd8c5ae3e622550eb1329c168',
  getFeedbackSkillTemplate: 'ded61ad85c5050f7bf241870b14bfcdd929f0be68a028c1130fd30a66efbda3b',
  getArchitectSkillTemplate: '4b4f82764f20c8bd949a278d9992f83b303ef6666b3a6d90d90b21e1e2302a83',
  getOrbitArchitectCommandTemplate: 'b65b8cca6431bb45aa8587d3bfc1e9458981e2e1bc925ae45cd57414143cb3db',
};

const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'orbit-explore': '9e19a9614083652ba9e818c2dac767c5cf12d0ff5ef45ed9e9939176dd372139',
  'orbit-new-change': '8f552229463c98b062a62c59e8a155bb8cb51f80912a355f3df7007a0700ceb4',
  'orbit-continue-change': '6121a242d5bc00e1a1ad034f90483931398ac48b214ae446cd438c813cd2b228',
  'orbit-apply-change': 'e793b7623f4f2b72f3aa47cfe59dc9ff96c9b93868e6cef75e447b19dc16b335',
  'orbit-ff-change': '7dde651c599b56a4bd7e53400f6ddf43c8021994ba1f2062467bbbda08fde98e',
  'orbit-sync-specs': '6103fa358c0d15c7d22a3800555f5cbfb54f3213a5ac40b520b0e916c7af92e4',
  'orbit-archive-change': 'db9d4c6be2d8c38f62c6c3e93989ee8827aa3731ce80494ed4357d44e6250e55',
  'orbit-bulk-archive-change': '43f4a834a5274aaab4e48ee7c58b3da0b36d5b2140c5fb8adef78c771ac16703',
  'orbit-verify-change': '5bbe1cdd4ea0417eb51f4000239a4048f8d8db4f78621b5237609d3e4d07330a',
  'orbit-onboard': '6a78ad2a848a4f30bec3806a9c8ed2eb889143d353fe90f1d61fd4678029f395',
  'orbit-propose': 'dc2ad2a20cf54adabf6f1d5a308b9f4566396a80e3be1dca50cd166a9a6ee7b3',
  'orbit-architect': 'cfd4b7405929125dde479998647073b0282af9ba8460c1420d2e815d773bf8aa',
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
