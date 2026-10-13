/**
 * public-readiness (CI's first run): a gh-absent fixture kept `/usr/bin` on PATH whole, and GitHub's Ubuntu runners
 * install gh there beside git, so five "gh absent" cases saw a gh. The fixture now mirrors the system dirs as links
 * with `gh` left out; this case builds a host where gh sits beside git and shows it gone.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { systemBinWithoutGh } from '../../integration/pr-lifecycle/harness.js';

let base: string;
afterEach(() => fs.rmSync(base, { recursive: true, force: true }));

describe('the gh-absent PATH', () => {
  it('drops a gh installed beside git, keeps every other system entry, and the first dir wins a shared name', () => {
    base = fs.mkdtempSync(path.join(os.tmpdir(), 'orbit-gh-absent-'));
    const usrBin = path.join(base, 'usr-bin');
    const bin = path.join(base, 'bin');
    fs.mkdirSync(usrBin);
    fs.mkdirSync(bin);
    const tool = (dir: string, name: string, says: string) => {
      fs.writeFileSync(path.join(dir, name), `#!/bin/sh\necho ${says}\n`, { mode: 0o755 });
    };
    tool(usrBin, 'gh', 'host-gh');
    tool(usrBin, 'git', 'usr-git');
    tool(bin, 'git', 'bin-git');
    tool(bin, 'sh-helper', 'helper');

    const sysbin = systemBinWithoutGh(path.join(base, 'sysbin'), [usrBin, bin]);
    expect(fs.readdirSync(sysbin).sort()).toEqual(['git', 'sh-helper']);
    expect(execFileSync(path.join(sysbin, 'git'), { encoding: 'utf-8' }).trim()).toBe('usr-git');

    // The same host's dirs on PATH whole — the old fixture — would have found the gh.
    expect(fs.existsSync(path.join(usrBin, 'gh'))).toBe(true);
  });
});
