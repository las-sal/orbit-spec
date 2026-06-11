import { describe, it, expect } from 'vitest';

import {
  CORE_WORKFLOWS,
  ALL_WORKFLOWS,
  getProfileWorkflows,
} from '../../src/core/profiles.js';

describe('profiles', () => {
  describe('CORE_WORKFLOWS', () => {
    it('should contain the four core workflows', () => {
      expect(CORE_WORKFLOWS).toEqual(['propose', 'explore', 'apply', 'archive']);
    });

    it('should be a subset of ALL_WORKFLOWS', () => {
      for (const workflow of CORE_WORKFLOWS) {
        expect(ALL_WORKFLOWS).toContain(workflow);
      }
    });
  });

  describe('ALL_WORKFLOWS', () => {
    it('should contain all 11 workflows', () => {
      expect(ALL_WORKFLOWS).toHaveLength(11);
    });

    it('should contain expected workflow IDs', () => {
      const expected = [
        'propose', 'explore', 'new', 'continue', 'apply',
        'ff', 'sync', 'archive', 'bulk-archive', 'verify', 'onboard',
      ];
      expect([...ALL_WORKFLOWS]).toEqual(expected);
    });
  });

  describe('getProfileWorkflows', () => {
    // orbit (D15): profile resolution is deliberately inert — every install
    // gets the full workflow surface regardless of profile configuration.
    it('returns all workflows for core profile', () => {
      const result = getProfileWorkflows('core');
      expect(result).toEqual(ALL_WORKFLOWS);
    });

    it('returns all workflows for core profile even if customWorkflows provided', () => {
      const result = getProfileWorkflows('core', ['new', 'apply']);
      expect(result).toEqual(ALL_WORKFLOWS);
    });

    it('returns all workflows for custom profile regardless of customWorkflows', () => {
      const result = getProfileWorkflows('custom', ['explore', 'new', 'apply', 'ff']);
      expect(result).toEqual(ALL_WORKFLOWS);
    });

    it('returns all workflows for custom profile with no customWorkflows', () => {
      const result = getProfileWorkflows('custom');
      expect(result).toEqual(ALL_WORKFLOWS);
    });

    it('returns all workflows for custom profile with empty customWorkflows', () => {
      const result = getProfileWorkflows('custom', []);
      expect(result).toEqual(ALL_WORKFLOWS);
    });
  });
});
