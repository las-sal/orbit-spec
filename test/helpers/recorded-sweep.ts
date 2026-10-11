/**
 * The recorded-tool snippet sweep (rc05b design D2): `git` and `gh` through the shared
 * extractor, each snippet validated against its tool's RECORDED contract by that tool's one
 * CommonJS validator. A recorded tool's bare-name tree is its contract's command keys
 * (`orbit-cli-grammar`'s bare-name table). Failures are formatted as `orbit-sweep.ts`
 * formats them: the surface (workflow and file), the line, the snippet, the message.
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { analyseSurfaces, describeSurface, type CommandNode, type Surface, type SurfaceAnalysis } from './surface-snippets.js';

export interface RecordedContract {
  commands: Record<string, unknown>;
}

export type RecordedValidate = (argv: string[], contract: RecordedContract) => { ok: boolean; message?: string };

/** The contract's command keys, each split on spaces into a path. */
export function commandTreeFromKeys(keys: string[]): CommandNode {
  const root: CommandNode = { names: [], children: [] };
  for (const key of keys) {
    let node = root;
    for (const word of key.split(' ')) {
      let next = node.children.find((child) => child.names.includes(word));
      if (!next) {
        next = { names: [word], children: [] };
        node.children.push(next);
      }
      node = next;
    }
  }
  return root;
}

export function analyseRecorded(surfaces: Surface[], tool: string, contract: RecordedContract): SurfaceAnalysis {
  return analyseSurfaces(surfaces, tool, commandTreeFromKeys(Object.keys(contract.commands)));
}

export function sweepRecorded(analysis: SurfaceAnalysis, validate: RecordedValidate, contract: RecordedContract): string[] {
  const failures: string[] = [];
  for (const f of analysis.failures) {
    failures.push(`${describeSurface(f.surface)}:${f.line}: ${f.snippet}\n    ${f.message}`);
  }
  for (const snippet of analysis.snippets) {
    const result = validate(snippet.tokens.slice(1), contract);
    if (!result.ok) {
      failures.push(`${describeSurface(snippet.surface)}:${snippet.line}: ${snippet.text}\n    ${result.message ?? ''}`);
    }
  }
  return failures;
}

const integration = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'integration');
const load = createRequire(import.meta.url);

export interface RecordedTool {
  tool: 'git' | 'gh';
  contract: RecordedContract;
  validate: RecordedValidate;
}

/** The two recorded tools, each with its checked-in contract and its one validator. */
export function recordedTools(): RecordedTool[] {
  const read = (dir: string, name: string) => ({
    contract: JSON.parse(fs.readFileSync(path.join(integration, dir, `${name}-contract.json`), 'utf-8')) as RecordedContract,
    validate: (load(path.join(integration, dir, `${name}-contract-validate.cjs`)) as { validate: RecordedValidate }).validate,
  });
  return [
    { tool: 'git', ...read('cli-contracts', 'git') },
    { tool: 'gh', ...read('pr-lifecycle', 'gh') },
  ];
}

export function recordedTool(tool: 'git' | 'gh'): RecordedTool {
  return recordedTools().find((t) => t.tool === tool)!;
}
