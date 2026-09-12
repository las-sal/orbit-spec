import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const contractPath = path.join(__dirname, 'gh-contract.json');
const contract = JSON.parse(fs.readFileSync(contractPath, 'utf-8'));
const { validate } = require('./gh-contract-validate.cjs') as {
  validate: (argv: string[], c: unknown) => { ok: boolean; message?: string; command?: string };
};

const SEVEN = ['repo view', 'pr list', 'pr create', 'pr view', 'pr edit', 'pr ready', 'pr merge'];

describe('gh contract — freshness (the checked-in file, never the host gh)', () => {
  it('parses, records a version and the availability probe', () => {
    expect(contract.gh_version).toMatch(/^gh version \d+\.\d+\.\d+/);
    expect(contract.availability_probe.argv).toEqual(['--version']);
    expect(contract.availability_probe.stdout.length).toBeGreaterThan(0);
  });

  it('carries exactly the seven commands the references invoke, each with a usage line and flag entries', () => {
    expect(Object.keys(contract.commands).sort()).toEqual([...SEVEN].sort());
    for (const c of SEVEN) {
      const spec = contract.commands[c];
      expect(spec.usage, c).toMatch(new RegExp(`^gh ${c}\\b`));
      expect(spec.flags.length, c).toBeGreaterThan(0);
      for (const f of spec.flags) {
        expect(f).toHaveProperty('long');
        expect(f).toHaveProperty('short');
        expect(typeof f.takes_value).toBe('boolean');
      }
    }
  });

  it('records the two rules a help page cannot express, as the real strings', () => {
    expect(contract.rules.repo_view_rejects_repo_flag).toBe('unknown flag: --repo');
    expect(contract.rules.pr_selector_required_with_repo).toBe('argument required when using the --repo flag');
    expect(contract.rules.pr_verbs_require_repo).toBe(true);
    expect(contract.rules.repo_view_requires_positional).toBe(true);
  });

  it('captured arity and aliases for the two snippets that need them', () => {
    const draft = contract.commands['pr create'].flags.find((f: any) => f.long === '--draft');
    expect(draft.takes_value).toBe(false);
    const jq = contract.commands['pr view'].flags.find((f: any) => f.short === '-q');
    expect(jq.long).toBe('--jq');
    expect(jq.takes_value).toBe(true);
  });
});

describe('gh contract — the shared validator (argv excludes the leading gh)', () => {
  const ok = (argv: string[]) => expect(validate(argv, contract).ok, argv.join(' ')).toBe(true);
  const bad = (argv: string[], msg: string) => {
    const r = validate(argv, contract);
    expect(r.ok, argv.join(' ')).toBe(false);
    expect(r.message).toContain(msg);
  };

  it('the D6 grammar cases: flag form of repo view rejected with the real message; positional accepted', () => {
    bad(['repo', 'view', '--repo', 'acme/widget', '--json', 'defaultBranchRef'], 'unknown flag: --repo');
    ok(['repo', 'view', 'acme/widget', '--json', 'defaultBranchRef']);
  });

  it('the selector rule: a selector-taking pr verb with --repo and no selector is rejected with the real message', () => {
    bad(['pr', 'view', '--repo', 'acme/widget', '--json', 'isDraft'], 'argument required when using the --repo flag');
    ok(['pr', 'view', '--repo', 'acme/widget', 'https://github.com/acme/widget/pull/1', '--json', 'isDraft']);
  });

  it('arity and aliases: a boolean flag consumes nothing; a short alias resolves to its long flag', () => {
    ok(['pr', 'create', '--repo', 'x/y', '--draft', '--base', 'main', '--head', 'b', '--title', 't', '--body-file', 'f']);
    ok(['pr', 'view', '--repo', 'x/y', '<url>', '--json', 'body', '-q', '.body']);
    ok(['pr', 'list', '--repo=x/y', '--state', 'open', '--json', 'url']);
  });

  it("orbit's own qualification contract, which the real CLI would not enforce", () => {
    bad(['pr', 'list', '--head', 'x', '--state', 'open', '--json', 'url'], 'must carry --repo');
    bad(['repo', 'view', '--json', 'defaultBranchRef'], 'requires a positional');
  });

  it('positional shape and unknown verbs', () => {
    bad(['pr', 'create', '--repo', 'x/y', 'stray'], 'accepts 0 arg(s)');
    bad(['pr', 'frobnicate', '--repo', 'x/y'], 'unknown command');
    bad(['pr', 'view', '--repo', 'x/y', '<url>', '--nope'], 'unknown flag: --nope');
  });

  it('answers the availability probe from the contract', () => {
    const r = validate(['--version'], contract) as any;
    expect(r.ok).toBe(true);
    expect(r.probe).toBe(true);
    expect(r.stdout).toBe(contract.availability_probe.stdout);
  });
});
