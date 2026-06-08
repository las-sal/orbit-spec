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
  getExploreSkillTemplate: 'c17e0e557f13454839dd2435357972649f4028753f7aee9dc7c95364df54ffbe',
  getNewChangeSkillTemplate: 'e08e2b0b51ca6e820a886df1893ff649fe1d5988935a19a88fa3b32740ced156',
  getContinueChangeSkillTemplate: '2e6fb52e5cab42c85accc2dfd947e2077543777a54b6c2b29dfa0e7efc19c54a',
  getApplyChangeSkillTemplate: '471e23bea7b29a8eeca2d502a387a488ff1df45e49a43d302ad76cb40ad23cec',
  getFfChangeSkillTemplate: 'e63ecaac630af686df60ff3c64f76e4612776f8259e687093cc7f686132363fb',
  getSyncSpecsSkillTemplate: '051c7fbb52cf2e87d8da2ffc45e6dbd2b4663f9b37add611abe430695e9694b1',
  getOnboardSkillTemplate: 'db7e816f43c97375e1414fae6092866eb9a76b6fbe126abbc276ae2d93d96b70',
  getOpsxExploreCommandTemplate: 'e5b17dd8273e394f88996bf82ed84cf236f8e58092fc963c905bdf385f74ac67',
  getOpsxNewCommandTemplate: '291c8347f65dcc38184dafa932c78b0a3e3218e5a105daff9046f33020febf0c',
  getOpsxContinueCommandTemplate: '93442585519372325506d445d28c1ca3828fe5b2e027ad8a413a47e139228295',
  getOpsxApplyCommandTemplate: '7f6f2fdd707fe599e9d5d6f9b851e5e52f95c0de8e969a1a8025aec3e698d523',
  getOpsxFfCommandTemplate: '4afcf62f1be0d918a8ea7bd48aa29aa15a2b000670b181362cffaeb37c61cd33',
  getArchiveChangeSkillTemplate: '0cc1ce888ed11b44350234e63a14488ac91854d7a1ed130a5f1d4ec6b80c1de2',
  getBulkArchiveChangeSkillTemplate: '769c095d57aca9fa783f99b9e03578d77a0123f5027b84c0749711e9a50e454c',
  getOpsxSyncCommandTemplate: 'fac20e37231338129b53cf0bb8f97b4f3ca1f317ed1868dc7555e5bb139083da',
  getVerifyChangeSkillTemplate: '24ba12008a12d6a15900693fb0eafefa4bdc2736516d5a2af691c759d57aa0be',
  getOpsxArchiveCommandTemplate: 'ee2b7eeb7d75975133d8ebbc65bf3e99bd90047de0693276b9790529c7e6e9c8',
  getOpsxOnboardCommandTemplate: '2d4d9b6939c336cd0a4ddf187db03e59a465dad6786ff9e8e5ff1ba7fba02dfe',
  getOpsxBulkArchiveCommandTemplate: 'a84f4da07a4f116bd187e6775889ee8698f57a71249fd4cee6c90c49143cb0fd',
  getOpsxVerifyCommandTemplate: '8aa5765188bb0d8b73b00dd5a6133a8fb1594c732140c99191beb3bc8862a6cc',
  getOpsxProposeSkillTemplate: '2f17d264c531aa226499557eda8635968f75be1e3b8a3c9d85aca2112bb431e1',
  getOpsxProposeCommandTemplate: 'd32ec9bc32a0c07e1dad3497c1f46dea2677229c7c407fdeecca4e12e4608785',
  getFeedbackSkillTemplate: 'ded61ad85c5050f7bf241870b14bfcdd929f0be68a028c1130fd30a66efbda3b',
};

const EXPECTED_GENERATED_SKILL_CONTENT_HASHES: Record<string, string> = {
  'orbit-explore': '287e551a604d041ad3bb67341cd26d88eacd692f9cd7177768c34a8fb0d77c22',
  'orbit-new-change': '0a0e2b19dfb444f72d5e813e7a719be3200c327807ad027f23d2059fe1ecea40',
  'orbit-continue-change': 'a7ebec8f27a2bdbc4d4c0762ef5913833cab493452d8238985f1d6623964feac',
  'orbit-apply-change': '845492f025cdd78f1b6eeeb0b2ba325719322549ae73f539f6ceac89c14cb84c',
  'orbit-ff-change': '6f4355fc0edce4d1e90cfb33aa9e2df585430b3fe4362f4b48915fbcf0b016dc',
  'orbit-sync-specs': '69fce0ecb0f9cf76b6abf5c463ee2a11a8898859c449ba984a16f7f2c9015fe5',
  'orbit-archive-change': 'caf7d2b193f32732c666d928417c9cf03e879908574072e6e352018a6d3f0080',
  'orbit-bulk-archive-change': '34f494c489355b7728af8c28f77333fd3c45ff31d00a03452a1e65ef5a457ef2',
  'orbit-verify-change': 'ff2924efd44d677968e23634fc21cbaab4328ada7c6072aaa3a3ee8b255de86e',
  'orbit-onboard': '266a01344df34761af9a1a974ef986c46059d5daef41b04de62c3f1b0c4cb1eb',
  'orbit-propose': 'dd2dfe4ed525e4f9a56e7ace6bfd716f96ff5142d42ee503146ad45d5ab0bedf',
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
