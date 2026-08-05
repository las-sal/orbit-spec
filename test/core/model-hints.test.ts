import { describe, it, expect } from 'vitest';
import { isRenderableHint, resolveModelHint, withModelHint } from '../../src/core/model-hints.js';

describe('model-hint garnish (D5)', () => {
  it('slot entry wins over phase (the more specific hook)', () => {
    const models = { 'review-proposal': 'Opus', external: 'GPT-5 Codex' };
    expect(resolveModelHint(models, { phase: 'review-proposal', slot: 'external' })).toBe('GPT-5 Codex');
    expect(resolveModelHint(models, { phase: 'review-proposal' })).toBe('Opus');
  });

  it('keys outside both vocabularies and absent maps are inert', () => {
    expect(resolveModelHint(undefined, { phase: 'apply' })).toBeNull();
    expect(resolveModelHint({ nonsense: 'x' }, { phase: 'apply', slot: 'fresh' })).toBeNull();
    expect(resolveModelHint({ apply: 'Coder' }, undefined)).toBeNull();
  });

  it('rendering-boundary check: newline/control/overlong/empty values are inert, never errors', () => {
    expect(isRenderableHint('GPT-5 Codex')).toBe(true);
    expect(isRenderableHint('two\nlines')).toBe(false);
    expect(isRenderableHint('tab\tchar')).toBe(false);
    expect(isRenderableHint('carriage\rreturn')).toBe(false);
    expect(isRenderableHint('')).toBe(false);
    expect(isRenderableHint('   ')).toBe(false);
    expect(isRenderableHint('x'.repeat(81))).toBe(false);
    expect(isRenderableHint('x'.repeat(80))).toBe(true);
    // A malformed slot value falls through to a valid phase value.
    const models = { external: 'bad\nvalue', 'review-system': 'Codex' };
    expect(resolveModelHint(models, { phase: 'review-system', slot: 'external' })).toBe('Codex');
  });

  it('withModelHint appends after the line (incl. after a user-invoked marker) and is identity on null', () => {
    expect(withModelHint('/orbit:apply foo — user-invoked', 'Coder')).toBe(
      '/orbit:apply foo — user-invoked — hint: Coder'
    );
    // Byte-identical when unconfigured.
    expect(withModelHint('/orbit:apply foo', null)).toBe('/orbit:apply foo');
  });
});
