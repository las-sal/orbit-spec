/**
 * The registry parity comparison (rc05 design D5), shared by the parity test and its injections.
 *
 * rc05 design D5: `COMMAND_REGISTRY` stays hand-written and is held to the
 * builder's program both ways, over the fields `orbit-cli-grammar`'s
 * `The completion registry is a checked copy of the program` table names:
 * command names (nested), flag long names, `short`, `takesValue`, and
 * `acceptsPositional`. Not compared: `positionalType`, `values`, `description`.
 */
import type { Command, Option } from 'commander';
import type { CommandDefinition } from '../../src/core/completions/types.js';

/** Excluded by name, so a later automatic option is a visible decision. */
const AUTOMATIC_OPTIONS: ReadonlySet<string> = new Set(['help', 'version']);
const ROOT_ONLY_EXCLUDED: ReadonlySet<string> = new Set(['no-color']);

/** The comparable shape of one command, from either side. */
export interface ComparableFlag {
  name: string;
  short: string | null;
  takesValue: boolean;
}
export interface ComparableCommand {
  name: string;
  acceptsPositional: boolean;
  flags: ComparableFlag[];
  subcommands: ComparableCommand[];
}

function optionName(opt: Option): string {
  return (opt.long ?? opt.short ?? '').replace(/^--?/, '');
}

export function fromProgram(cmd: Command): ComparableCommand[] {
  return cmd.commands
    .filter((sub) => !(sub as unknown as { _hidden: boolean })._hidden)
    .map((sub) => ({
      name: sub.name(),
      acceptsPositional: sub.registeredArguments.length > 0,
      flags: sub.options
        .filter((o) => !AUTOMATIC_OPTIONS.has(optionName(o)))
        .map((o) => ({ name: optionName(o), short: o.short ? o.short.replace(/^-/, '') : null, takesValue: o.required || o.optional })),
      subcommands: fromProgram(sub),
    }));
}

export function rootFlags(program: Command): string[] {
  return program.options
    .map(optionName)
    .filter((n) => !AUTOMATIC_OPTIONS.has(n) && !ROOT_ONLY_EXCLUDED.has(n));
}

export function fromRegistry(defs: CommandDefinition[]): ComparableCommand[] {
  return defs.map((d) => ({
    name: d.name,
    acceptsPositional: d.acceptsPositional === true,
    flags: d.flags.map((f) => ({ name: f.name, short: f.short ?? null, takesValue: f.takesValue === true })),
    subcommands: fromRegistry(d.subcommands ?? []),
  }));
}

/** Every disagreement between the two, each naming the command (and flag). */
export function registryDiff(program: ComparableCommand[], registry: ComparableCommand[], prefix = ''): string[] {
  const out: string[] = [];
  const reg = new Map(registry.map((c) => [c.name, c]));
  const prog = new Map(program.map((c) => [c.name, c]));
  for (const p of program) {
    const path = `${prefix}${p.name}`;
    const r = reg.get(p.name);
    if (!r) {
      out.push(`command '${path}': in the program, missing from the registry`);
      continue;
    }
    if (p.acceptsPositional !== r.acceptsPositional) {
      out.push(`command '${path}': acceptsPositional is ${r.acceptsPositional} in the registry, ${p.acceptsPositional} in the program`);
    }
    const rf = new Map(r.flags.map((f) => [f.name, f]));
    const pf = new Map(p.flags.map((f) => [f.name, f]));
    for (const f of p.flags) {
      const g = rf.get(f.name);
      if (!g) {
        out.push(`command '${path}': flag --${f.name} in the program, missing from the registry`);
        continue;
      }
      if (f.short !== g.short) out.push(`command '${path}': flag --${f.name} short is ${g.short} in the registry, ${f.short} in the program`);
      if (f.takesValue !== g.takesValue) out.push(`command '${path}': flag --${f.name} takesValue is ${g.takesValue} in the registry, ${f.takesValue} in the program`);
    }
    for (const g of r.flags) {
      if (!pf.has(g.name)) out.push(`command '${path}': flag --${g.name} in the registry, not declared by the program`);
    }
    out.push(...registryDiff(p.subcommands, r.subcommands, `${path} `));
  }
  for (const r of registry) {
    if (!prog.has(r.name)) out.push(`command '${prefix}${r.name}': in the registry, not declared by the program`);
  }
  return out;
}
