/**
 * public-readiness (task 2.3): what the public repository carries beside its code — `orbit-public-repository`'s
 * license and CI claims, `orbit-release`'s only-release-path claim, and the three upstream links `orbit init` and
 * `orbit update` print (design D10, R-ugd-12). Each check is a pure function over file text, run once on the
 * repository and once on a mutated copy it must reject, so no assertion passes vacuously.
 */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const REPO = fileURLToPath(new URL('../../', import.meta.url));
const read = (rel: string) => readFileSync(path.join(REPO, rel), 'utf-8');

type Workflow = { name: string; text: string };

/** The workflow files, as the specs name them: `.github/workflows/*.yml` and `*.yaml`. */
const workflows = (): Workflow[] => {
  const dir = path.join(REPO, '.github', 'workflows');
  return readdirSync(dir)
    .filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'))
    .sort()
    .map((f) => ({ name: f, text: readFileSync(path.join(dir, f), 'utf-8') }));
};

const UPSTREAM_NOTICE = 'Copyright (c) 2024 OpenSpec Contributors';
const ORBIT_NOTICE = 'Copyright (c) 2026 Michael Sallas';
const MIT_PERMISSION = 'Permission is hereby granted, free of charge';

function licenseErrors(text: string): string[] {
  const errors: string[] = [];
  const lines = text.split(/\r?\n/);
  const up = lines.indexOf(UPSTREAM_NOTICE);
  if (up === -1) errors.push('upstream notice missing');
  else if (lines[up + 1] !== ORBIT_NOTICE) errors.push("orbit's notice is not on the line beneath upstream's");
  if (lines.filter((l) => l === ORBIT_NOTICE).length !== 1) errors.push("orbit's notice is not present exactly once");
  const permissions = text.split(MIT_PERMISSION).length - 1;
  if (permissions !== 1) errors.push(`the MIT permission paragraph appears ${permissions} times`);
  return errors;
}

const OSES = ['ubuntu', 'macos', 'windows'];
const EVENTS = ['pull_request', 'merge_group', 'push'];
const COMMANDS = ['npm ci', 'npm run build', 'npm test'];

function ciErrors(files: Workflow[]): string[] {
  const errors: string[] = [];
  for (const f of files) {
    if (/\bpnpm\b/.test(f.text)) errors.push(`${f.name} names pnpm`);
    if (/\bnix\b/i.test(f.text)) errors.push(`${f.name} names nix`);
  }
  const testing = files.flatMap((f) => {
    const doc = parse(f.text) as { on?: Record<string, unknown>; jobs?: Record<string, any> };
    const jobs = doc?.jobs ?? {};
    for (const [id, job] of Object.entries(jobs)) {
      const needs = job?.needs === undefined ? [] : [job.needs].flat();
      for (const n of needs) if (!(n in jobs)) errors.push(`${f.name}: job ${id} needs undefined job ${n}`);
    }
    return Object.entries(jobs)
      .filter(([, job]) => {
        const runs: string[] = (job?.steps ?? []).map((s: { run?: string }) => s?.run ?? '');
        return COMMANDS.every((c) => runs.some((r) => r.split(/\r?\n/).some((line) => line.trim() === c)));
      })
      .map(([id, job]) => ({ file: f.name, id, job, events: Object.keys(doc?.on ?? {}) }));
  });
  if (testing.length === 0) errors.push(`no job runs ${COMMANDS.join(', ')}`);
  for (const t of testing) {
    const oses: string[] = (t.job?.strategy?.matrix?.include ?? []).map((m: { os?: string }) => m?.os ?? '');
    for (const os of OSES) {
      if (!oses.some((o) => o.startsWith(os))) errors.push(`${t.file}: job ${t.id}'s matrix does not name ${os}`);
    }
    for (const e of EVENTS) if (!t.events.includes(e)) errors.push(`${t.file}: does not run on ${e}`);
    if (t.job?.if !== undefined) errors.push(`${t.file}: job ${t.id} is conditional (${t.job.if})`);
  }
  return errors;
}

const PUBLISHING_SCRIPT_NAMES = ['release', 'release:ci', 'changeset'];

function scriptErrors(pkgText: string): string[] {
  const errors: string[] = [];
  const scripts: Record<string, string> = JSON.parse(pkgText).scripts ?? {};
  for (const [name, cmd] of Object.entries(scripts)) {
    if (cmd.includes('npm publish')) errors.push(`script ${name} runs npm publish`);
    if (cmd.includes('changeset')) errors.push(`script ${name} runs changeset`);
  }
  for (const name of PUBLISHING_SCRIPT_NAMES) if (name in scripts) errors.push(`script ${name} is present`);
  if (!('release:tree' in scripts)) errors.push('release:tree is missing');
  return errors;
}

function workflowPublishErrors(files: Workflow[]): string[] {
  const errors: string[] = [];
  for (const f of files) {
    for (const needle of ['npm publish', 'changeset', 'changesets/action']) {
      if (f.text.includes(needle)) errors.push(`${f.name} names ${needle}`);
    }
    if (/id-token:\s*write/.test(f.text)) errors.push(`${f.name} requests id-token: write`);
  }
  return errors;
}

const LINKS: Array<{ file: string; line: string }> = [
  { file: 'src/core/init.ts', line: "Learn more: ${chalk.cyan('https://github.com/las-sal/orbit-spec')}" },
  { file: 'src/core/init.ts', line: "Feedback:   ${chalk.cyan('https://github.com/las-sal/orbit-spec/issues')}" },
  { file: 'src/core/update.ts', line: "Learn more: ${chalk.cyan('https://github.com/las-sal/orbit-spec')}" },
];

function linkErrors(sources: Record<string, string>): string[] {
  const errors: string[] = [];
  for (const { file, line } of LINKS) if (!sources[file].includes(line)) errors.push(`${file} lacks ${line}`);
  for (const [file, text] of Object.entries(sources)) {
    if (text.includes('github.com/Fission-AI/OpenSpec')) errors.push(`${file} still links upstream`);
  }
  return errors;
}

describe('orbit-public-repository: the license', () => {
  // @scenario behaviour orbit-public-repository :: The license carries upstream's notice and orbit's :: Both notices, upstream's first
  it('carries both notices, upstream first, and the permission paragraph once', () => {
    const text = read('LICENSE');
    expect(licenseErrors(text)).toEqual([]);
    expect(licenseErrors(text.replace(`${ORBIT_NOTICE}\n`, ''))).not.toEqual([]);
    expect(licenseErrors(text.replace(`${UPSTREAM_NOTICE}\n${ORBIT_NOTICE}`, `${ORBIT_NOTICE}\n${UPSTREAM_NOTICE}`))).not.toEqual([]);
    expect(licenseErrors(`${text}\n${MIT_PERMISSION}`)).not.toEqual([]);
  });
});

describe('orbit-public-repository: CI', () => {
  // @scenario behaviour orbit-public-repository :: CI checks every commit with orbit's toolchain :: The CI workflow installs, builds and tests with npm
  it('installs, builds and tests with npm on three operating systems for every checked event', () => {
    const files = workflows();
    expect(files.length).toBeGreaterThan(0);
    expect(ciErrors(files)).toEqual([]);

    const ci = files.find((f) => f.text.includes('npm ci'))!;
    const others = files.filter((f) => f !== ci);
    const mutate = (from: string, to: string) => ciErrors([...others, { ...ci, text: ci.text.replace(from, to) }]);
    expect(mutate('npm ci', 'pnpm install --frozen-lockfile')).not.toEqual([]);
    expect(mutate('run: npm test', 'run: echo skipped')).not.toEqual([]);
    expect(mutate('os: windows-latest', 'os: ubuntu-22.04')).not.toEqual([]);
    expect(mutate('  merge_group:\n    branches: [main]\n', '')).not.toEqual([]);
    expect(mutate('needs: [test_matrix, lint]', 'needs: [test_pr, lint]')).not.toEqual([]);
    expect(ciErrors([...files, { name: 'extra.yaml', text: 'jobs:\n  x:\n    steps:\n      - run: nix build\n' }])).not.toEqual([]);
  });
});

describe('orbit-release: the release tree is the only release path', () => {
  // @scenario behaviour orbit-release :: The release tree is orbit's only release path :: No package script publishes
  it('no package script publishes, and release:tree is present', () => {
    const pkg = read('package.json');
    expect(scriptErrors(pkg)).toEqual([]);
    const withScript = (name: string, cmd: string) => {
      const p = JSON.parse(pkg);
      p.scripts[name] = cmd;
      return JSON.stringify(p);
    };
    expect(scriptErrors(withScript('ship', 'npm publish --access public'))).not.toEqual([]);
    expect(scriptErrors(withScript('version-pr', 'changeset version'))).not.toEqual([]);
    expect(scriptErrors(withScript('release', 'node scripts/release-tree.mjs'))).not.toEqual([]);
    const p = JSON.parse(pkg);
    delete p.scripts['release:tree'];
    expect(scriptErrors(JSON.stringify(p))).not.toEqual([]);
  });

  // @scenario behaviour orbit-release :: The release tree is orbit's only release path :: No workflow publishes
  it('no workflow publishes or requests the trusted-publishing token', () => {
    const files = workflows();
    expect(workflowPublishErrors(files)).toEqual([]);
    const plus = (text: string) => workflowPublishErrors([...files, { name: 'release.yaml', text }]);
    expect(plus('jobs:\n  r:\n    steps:\n      - run: npm publish\n')).not.toEqual([]);
    expect(plus('jobs:\n  r:\n    steps:\n      - uses: changesets/action@v1\n')).not.toEqual([]);
    expect(plus('permissions:\n  id-token: write\n')).not.toEqual([]);
  });
});

describe('the upstream links orbit init and orbit update print (R-ugd-12)', () => {
  it("point at orbit's repository and its issues, never upstream's", () => {
    const sources = Object.fromEntries(['src/core/init.ts', 'src/core/update.ts'].map((f) => [f, read(f)]));
    expect(linkErrors(sources)).toEqual([]);
    const init = sources['src/core/init.ts'];
    expect(linkErrors({ ...sources, 'src/core/init.ts': init.replace('las-sal/orbit-spec/issues', 'Fission-AI/OpenSpec/issues') })).not.toEqual([]);
    expect(linkErrors({ ...sources, 'src/core/update.ts': sources['src/core/update.ts'].replace(LINKS[2].line, '') })).not.toEqual([]);
  });
});
