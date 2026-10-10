/**
 * The `git` contract capture's PURE parts (rc05b design D4): the candidate set's key and
 * flag reading, and the probe-result classifiers over `{status, firstLine}`. The probe
 * table they implement is `orbit-cli-grammar`'s `Every \`git\` and \`gh\` snippet on the
 * generated surface validates against its tool's recorded contract`; this module states
 * none of it.
 *
 * Kept apart from `scripts/capture-git-contract.capture.ts` so the unit tests exercise every
 * branch with recorded lines and never spawn git (importing the capture file would register
 * its capture test in the importer).
 */

/** One probe's outcome: the exit status and the first non-empty output line (stderr first). */
export interface Probe {
  status: number | null;
  firstLine: string;
}

export type ProbeClass = 'parse-options' | 'run' | 'rule';

/** The bogus subcommand word that tells a command group from a command. */
export const BOGUS_VERB = 'orbitcapturebogusverb';
/** The bogus flag every command is classed by. */
export const BOGUS_FLAG = '--orbit-capture-bogus';

/** A word that can be a group's verb (the prototype's test). */
export const VERB = /^[a-z][a-z0-9-]*$/;

/** Commands neither bogus probe rejects, and the orbit-side rule each carries. */
export const ORBIT_SIDE_RULES: Record<string, string> = {
  'rev-parse': 'rev_parse_recorded_flags_only',
};

export class CaptureError extends Error {}

/** The first non-empty line of stderr, else of stdout, trailing whitespace removed. */
export function firstLineOf(stderr: string, stdout: string): string {
  for (const stream of [stderr, stdout]) {
    const line = stream.split('\n').find((l) => l.trim() !== '');
    if (line !== undefined) return line.replace(/\s+$/, '');
  }
  return '';
}

/** A first line git uses to refuse a flag. */
export function isRejection(firstLine: string): boolean {
  return (
    firstLine.startsWith('error: unknown option') ||
    firstLine.startsWith('error: invalid option') ||
    firstLine.startsWith('error: unknown switch') ||
    firstLine.startsWith('fatal: unrecognized argument:') ||
    (firstLine.startsWith('error: option ') && firstLine.endsWith('takes no value'))
  );
}

export function isUsage(firstLine: string): boolean {
  return firstLine.startsWith('usage:');
}

/** `git <a> orbitcapturebogusverb` reporting `unknown subcommand` makes `<a>` a group. */
export function isGroup(probe: Probe): boolean {
  return probe.firstLine.includes('unknown subcommand');
}

/**
 * The command key a segment's tokens (the leading `git` excluded) name, or null when a group
 * segment carries no verb: a group's key is two words when the second token is a verb word;
 * every other key is the first word.
 */
export function keyOf(argv: string[], groups: ReadonlySet<string>): string | null {
  const [first, second] = argv;
  if (first === undefined) return null;
  if (!groups.has(first)) return first;
  return second !== undefined && VERB.test(second) ? `${first} ${second}` : null;
}

export interface WrittenFlag {
  /** The flag's name: before `=`, or the two characters of a short flag with its value attached. */
  name: string;
  /** The token as the surface writes it. */
  written: string;
}

/** Every flag token a segment writes after its key, up to `--`. */
export function flagsWritten(argv: string[], key: string): WrittenFlag[] {
  const flags: WrittenFlag[] = [];
  for (const token of argv.slice(key.split(' ').length)) {
    if (token === '--') break;
    if (!token.startsWith('-') || token.length < 2) continue;
    const eq = token.indexOf('=');
    let name = eq > 0 ? token.slice(0, eq) : token;
    if (!name.startsWith('--') && name.length > 2) name = name.slice(0, 2);
    flags.push({ name, written: token });
  }
  return flags;
}

/** The form a flag is probed in: as written, a placeholder value standing as `x`. */
export function probeForm(flag: WrittenFlag): string {
  const eq = flag.written.indexOf('=');
  if (eq > 0 && flag.written.slice(eq + 1).includes('<')) return `${flag.written.slice(0, eq)}=x`;
  return flag.written;
}

/**
 * Every distinct form a key's segments write each flag in, grouped by name, both in
 * first-written order. Forms are distinct by the form they are probed in, so every
 * written form reaches a probe, not only the first one written (system walk, fresh W1).
 */
export function formsByName(argvs: string[][], key: string): Map<string, WrittenFlag[]> {
  const forms = new Map<string, WrittenFlag[]>();
  for (const argv of argvs) {
    for (const flag of flagsWritten(argv, key)) {
      const seen = forms.get(flag.name) ?? [];
      if (!seen.some((f) => probeForm(f) === probeForm(flag))) forms.set(flag.name, [...seen, flag]);
    }
  }
  return forms;
}

/**
 * A name's one contract entry: rejected when ANY of its written forms is rejected, with
 * the first rejected form's line, so a rejected form cannot hide behind an accepted one.
 */
export function flagEntry(
  name: string,
  takesValue: boolean,
  acceptances: Array<{ accepted: true } | { accepted: false; message: string }>
): { name: string; takes_value: boolean; accepted: boolean; message?: string } {
  const rejected = acceptances.find((a) => !a.accepted);
  return { name, takes_value: takesValue, ...(rejected ?? { accepted: true }) };
}

/**
 * The acceptance probe's argument vector: the key's words, the flag as written, the stand-in
 * value `x` when the flag takes a value the surface did not attach, then `-h` for PARSE-OPTIONS
 * or `HEAD` for RUN. Never `<flag> -h` on a value-taking flag, which takes `-h` as the value.
 */
export function acceptanceArgs(key: string, flag: WrittenFlag, takesValue: boolean, probeClass: Exclude<ProbeClass, 'rule'>): string[] {
  const standIn = takesValue && flag.written === flag.name ? ['x'] : [];
  return [...key.split(' '), probeForm(flag), ...standIn, probeClass === 'parse-options' ? '-h' : 'HEAD'];
}

/** `git <key> -h`: known on a usage page; unknown, with git's line, on either unknown shape. */
export function knownFrom(key: string, probe: Probe): { known: true } | { known: false; message: string } {
  if (isUsage(probe.firstLine)) return { known: true };
  if (probe.firstLine.includes('is not a git command') || probe.firstLine.includes('unknown subcommand')) {
    return { known: false, message: probe.firstLine };
  }
  throw new CaptureError(`git ${key} -h: cannot tell whether git knows the command: ${JSON.stringify(probe.firstLine)}`);
}

/**
 * The command's probe class: PARSE-OPTIONS when the bogus flag is rejected under `-h`; else
 * RUN when it is rejected, or prints usage, with `HEAD`; else the named orbit-side rule, or
 * the capture fails naming the key.
 */
export function classFrom(key: string, underHelp: Probe, underHead: Probe): ProbeClass {
  if (isRejection(underHelp.firstLine)) return 'parse-options';
  if (isRejection(underHead.firstLine) || isUsage(underHead.firstLine)) return 'run';
  if (ORBIT_SIDE_RULES[key]) return 'rule';
  throw new CaptureError(
    `git ${key}: neither bogus-flag probe is rejected and no orbit-side rule names it ` +
      `(${JSON.stringify(underHelp.firstLine)}; ${JSON.stringify(underHead.firstLine)})`
  );
}

/** `git <key> <name>` alone: `requires a value` records the flag value-taking. */
export function takesValueFrom(probe: Probe): boolean {
  return probe.firstLine.includes('requires a value');
}

/**
 * A flag's acceptance in its command's class. PARSE-OPTIONS (probed under `-h`): usage is
 * accepted, a rejection shape rejected, any other line fails the capture. RUN (probed with
 * `HEAD`): a rejection shape or usage is rejected, anything else accepted.
 */
export function acceptanceFrom(
  probeClass: Exclude<ProbeClass, 'rule'>,
  probeText: string,
  probe: Probe
): { accepted: true } | { accepted: false; message: string } {
  if (probeClass === 'parse-options') {
    if (isUsage(probe.firstLine)) return { accepted: true };
    if (isRejection(probe.firstLine)) return { accepted: false, message: probe.firstLine };
    throw new CaptureError(`${probeText}: neither a usage page nor a rejection: ${JSON.stringify(probe.firstLine)}`);
  }
  if (isRejection(probe.firstLine) || isUsage(probe.firstLine)) return { accepted: false, message: probe.firstLine };
  return { accepted: true };
}

/** `git <key>` alone: a usage page records a required positional. */
export function positionalRequiredFrom(probe: Probe): boolean {
  return isUsage(probe.firstLine);
}
