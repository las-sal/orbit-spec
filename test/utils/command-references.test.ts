import { describe, it, expect } from 'vitest';
import { transformToHyphenCommands } from '../../src/utils/command-references.js';

describe('transformToHyphenCommands', () => {
  describe('basic transformations', () => {
    it('should transform single command reference', () => {
      expect(transformToHyphenCommands('/orbit:new')).toBe('/orbit-new');
    });

    it('should transform multiple command references', () => {
      const input = '/orbit:new and /orbit:apply';
      const expected = '/orbit-new and /orbit-apply';
      expect(transformToHyphenCommands(input)).toBe(expected);
    });

    it('should transform command reference in context', () => {
      const input = 'Use /orbit:apply to implement tasks';
      const expected = 'Use /orbit-apply to implement tasks';
      expect(transformToHyphenCommands(input)).toBe(expected);
    });

    it('should handle backtick-quoted commands', () => {
      const input = 'Run `/orbit:continue` to proceed';
      const expected = 'Run `/orbit-continue` to proceed';
      expect(transformToHyphenCommands(input)).toBe(expected);
    });
  });

  describe('edge cases', () => {
    it('should return unchanged text with no command references', () => {
      const input = 'This is plain text without commands';
      expect(transformToHyphenCommands(input)).toBe(input);
    });

    it('should return empty string unchanged', () => {
      expect(transformToHyphenCommands('')).toBe('');
    });

    it('should not transform similar but non-matching patterns', () => {
      const input = '/ops:new orbit: /other:command';
      expect(transformToHyphenCommands(input)).toBe(input);
    });

    it('should handle multiple occurrences on same line', () => {
      const input = '/orbit:new /orbit:continue /orbit:apply';
      const expected = '/orbit-new /orbit-continue /orbit-apply';
      expect(transformToHyphenCommands(input)).toBe(expected);
    });
  });

  describe('multiline content', () => {
    it('should transform references across multiple lines', () => {
      const input = `Use /orbit:new to start
Then /orbit:continue to proceed
Finally /orbit:apply to implement`;
      const expected = `Use /orbit-new to start
Then /orbit-continue to proceed
Finally /orbit-apply to implement`;
      expect(transformToHyphenCommands(input)).toBe(expected);
    });
  });

  describe('all known commands', () => {
    const commands = [
      'new',
      'continue',
      'apply',
      'ff',
      'sync',
      'archive',
      'bulk-archive',
      'verify',
      'explore',
      'onboard',
    ];

    for (const cmd of commands) {
      it(`should transform /orbit:${cmd}`, () => {
        expect(transformToHyphenCommands(`/orbit:${cmd}`)).toBe(`/orbit-${cmd}`);
      });
    }
  });
});
