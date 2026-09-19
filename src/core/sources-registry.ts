/**
 * The source registry (rc07) — `orbit/sources.yaml` plus the CLOSED table of facts the
 * ENGINE can compute.
 *
 * A `src:` marker in living prose may name only what this registry declares, and the
 * registry may name only what the table below exposes. The domain therefore closes by
 * construction: adding a fact is a code change with a test, never a line of YAML. There is
 * deliberately no `command:` field — orbit is a published package, so a shell escape hatch
 * would mean that cloning a project and running a read-only-looking `orbit validate`
 * executes repository data.
 *
 * The rulings-index parse lives HERE rather than in `src/core/architecture/parser.ts`: that
 * parser's model is contractually limited to stage ids/titles, the two slot lines and
 * section boundaries, and this change keeps it that way (the engine-level exception is named
 * in the `orbit-architecture-engine` baseline instead).
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { parse as parseYaml } from 'yaml';
import {
  loadArchitectureDoc,
  isValidDocName,
  ARCHITECTURE_DIR,
  type ParsedArchitectureDoc,
} from './architecture/parser.js';
import { createFenceTracker } from './markdown-fence.js';
import { parseSchema } from './artifact-graph/schema.js';
import {
  getPackageSchemasDir,
  getProjectSchemasDir,
} from './artifact-graph/resolver.js';

export const SOURCES_REGISTRY_PATH = path.join('orbit', 'sources.yaml');

/** A source NAME must be nameable by a marker, whose grammar this mirrors exactly. */
export const SOURCE_NAME_REGEX = /^[a-z0-9][a-z0-9-]*$/;

/** A schema parameter names a schema DIRECTORY — one kebab-case segment, never a path. */
export const SCHEMA_NAME_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** A fault in the registry file itself: its shape, its names, or its parameters. */
export class SourceRegistryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SourceRegistryError';
  }
}

/** A fault resolving ONE declared source to its value. */
export class SourceResolutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SourceResolutionError';
  }
}

export interface DeclaredSource {
  /** The name a marker uses. */
  name: string;
  /** The engine source it names, e.g. `architecture.stage-count`. */
  engine: string;
  /** Declared parameter values, already validated as non-empty strings. */
  params: Record<string, string>;
}

interface EngineSource {
  /** Required parameter names; an entry carrying any other key is an error. */
  params: string[];
  /**
   * Existence checks that can be made without reading a document's grammar — a doc or
   * schema that is simply not there. Returns a reason, or null when the inputs resolve.
   */
  checkInputs(projectRoot: string, params: Record<string, string>): string | null;
  /** Resolves the fact to its STRING form. Throws SourceResolutionError. */
  resolve(projectRoot: string, params: Record<string, string>): string;
}

// ---------------------------------------------------------------------------
// The ruling-index parse (task 1.1)
// ---------------------------------------------------------------------------

/**
 * Counts ruling entries in a parsed architecture doc's `## Rulings index` section.
 *
 * A ruling entry is a TOP-LEVEL list item whose FIRST bold span is exactly
 * `<prefix>-<n>`: `<prefix>` is matched LITERALLY (never compiled as a pattern) and `<n>`
 * is one or more decimal digits with nothing following them, so `R-crc-10` is an entry and
 * `R-crc-4a` is not. TOP-LEVEL means a `-` or `*` marker at indent 0–3 that is not nested
 * inside another list item; the SECTION runs from the heading to the next heading at `##`
 * or higher. Fence-aware, like every parse over these docs.
 *
 * The prefix is DECLARED by the caller, never derived from the doc's name: a doc's filename
 * stem is not the abbreviation its rulings use, and deriving one would be a guess about a
 * naming convention the engine cannot observe. Because it is declared, emptiness is
 * meaningful — a section yielding ZERO entries is a MALFORMED source that throws, never a
 * count of zero that would silently agree with any prose containing a zero digit.
 */
export function countRulingEntries(doc: ParsedArchitectureDoc, prefix: string): number {
  const lines = doc.lines;
  const fence = fenceMaskFor(lines);

  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (!fence[i] && /^##\s+Rulings index\s*$/.test(lines[i])) {
      start = i + 1;
      break;
    }
  }
  if (start === -1) {
    throw new SourceResolutionError(
      `architecture doc '${doc.name}' has no '## Rulings index' section, so no ruling entry matching prefix '${prefix}' can be counted`
    );
  }

  let end = lines.length;
  for (let i = start; i < lines.length; i++) {
    if (!fence[i] && /^#{1,2}\s/.test(lines[i])) {
      end = i;
      break;
    }
  }

  const entryPattern = new RegExp(`^${escapeRegExp(prefix)}-\\d+$`);
  let count = 0;
  // Content column of the most recent top-level list item; any bullet indented to that
  // column or beyond is nested inside it and is not an entry.
  let topLevelContentColumn: number | null = null;

  for (let i = start; i < end; i++) {
    if (fence[i]) continue;
    const bullet = lines[i].match(/^(\s*)([-*])(\s+)(.*)$/);
    if (!bullet) continue;
    const indent = bullet[1].length;
    if (topLevelContentColumn !== null && indent >= topLevelContentColumn) continue; // nested
    if (indent > 3) continue;
    topLevelContentColumn = indent + bullet[2].length + bullet[3].length;
    const bold = bullet[4].match(/\*\*(.+?)\*\*/);
    if (bold && entryPattern.test(bold[1])) count++;
  }

  if (count === 0) {
    throw new SourceResolutionError(
      `architecture doc '${doc.name}' has a '## Rulings index' section but no ruling entry matching prefix '${prefix}'`
    );
  }
  return count;
}

function escapeRegExp(literal: string): string {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Per-line fenced mask built from the SHARED CommonMark tracker.
 *
 * This deliberately does NOT use `computeFenceMask` from the requirement-block parser. That
 * one is a depth heuristic — a bare delimiter closes the current level regardless of its
 * character or length — so in a doc carrying a four-backtick fence around a three-backtick
 * example it both ADMITS the fenced ruling bullets and MASKS the live one, making an
 * engine-computed source value false. Two fence languages inside one capability is the defect
 * `markdown-fence.ts` exists to prevent: import the tracker, never restate it.
 *
 * (The architecture PARSER still uses the heuristic. Migrating it is engine-wide grammar
 * unification with its own blast radius — `status`, `show` and `validate` all consume that
 * parse — and is recorded as a declared residual rather than done inside a review walk.)
 */
function fenceMaskFor(lines: string[]): boolean[] {
  const tracker = createFenceTracker();
  return lines.map((line) => {
    const wasInFence = tracker.inFence;
    const isDelimiter = tracker.handle(line);
    return wasInFence || isDelimiter;
  });
}

// ---------------------------------------------------------------------------
// The CLOSED engine-source table (task 1.2)
// ---------------------------------------------------------------------------

/**
 * Loads an architecture doc and refuses anything the engine could not fully read: an
 * ABSENT, LEGACY or MALFORMED doc ERRORS naming the doc and the source rather than emitting
 * a short count. `parseArchitectureDoc` populates `stages` even on a malformed doc and
 * returns an empty list for a legacy one, so a source that simply read `stages.length`
 * would quietly omit a near-miss heading.
 */
function requireParseableDoc(projectRoot: string, source: string, name: string): ParsedArchitectureDoc {
  const doc = loadArchitectureDoc(projectRoot, name);
  if (!doc) {
    throw new SourceResolutionError(
      `${source}: architecture doc '${name}' does not exist under orbit/architecture/`
    );
  }
  if (doc.docClass !== 'parseable') {
    throw new SourceResolutionError(
      `${source}: architecture doc '${name}' is ${doc.docClass}, so no count is emitted over a document the engine could not fully read`
    );
  }
  return doc;
}

function architectureDocMissing(projectRoot: string, name: string): string | null {
  if (!docWithinTier(projectRoot, name)) {
    return `architecture doc '${name}' does not exist under orbit/architecture/, or does not resolve within it`;
  }
  return loadArchitectureDoc(projectRoot, name)
    ? null
    : `architecture doc '${name}' does not exist under orbit/architecture/`;
}

/**
 * ONE containment rule for both declared parameter kinds. `loadArchitectureDoc` checks the NAME
 * lexically but follows a symlinked doc wherever it points; that parser is shared by
 * `architecture status`, `show` and `validate`, so the containment this capability requires is
 * enforced HERE rather than by widening it.
 */
function docWithinTier(projectRoot: string, name: string): boolean {
  if (!isValidDocName(name)) return false;
  return resolveWithinTier(path.join(projectRoot, ARCHITECTURE_DIR), `${name}.md`) !== null;
}

/**
 * Resolves a schema PROJECT-LOCAL then PACKAGE BUILT-IN, deliberately SKIPPING the
 * user-global override tier the engine's ordinary resolver consults. That tier lives in a
 * developer's data directory, so honouring it would make one checkout emit different values
 * on different machines and a marked repository fact would be machine-dependent.
 */
function findSchemaFile(projectRoot: string, name: string): string | null {
  // A schema parameter is an IDENTIFIER, never a path. Passing it straight to path.join let
  // `../../schemas/spec-driven` escape both declared tiers and resolve a schema.yaml anywhere
  // reachable — a read-only-looking validation command consuming files outside the project's
  // declared inputs.
  //
  // TWO guards, and it is worth being exact about which does what, because an earlier comment
  // here credited a third that could never fire. (1) The NAME GRAMMAR admits no separator and
  // no dot, so `path.resolve(tierRoot, name, …)` cannot leave the tier — that is what closes
  // traversal, by construction. (2) The SYMLINK check below closes the case the grammar cannot
  // see: a tier directory or a schema.yaml that resolves outside its tier.
  if (!SCHEMA_NAME_REGEX.test(name)) return null;
  for (const dir of [getProjectSchemasDir(projectRoot), getPackageSchemasDir()]) {
    const candidate = resolveWithinTier(dir, path.join(name, 'schema.yaml'));
    if (candidate) return candidate;
  }
  return null;
}

/**
 * Resolves `relative` inside the LEXICAL tier root `dir`, or null.
 *
 * The lexical root is deliberately NOT realpath'd first. An earlier version did, and a symlinked
 * tier directory then became the root against which containment was compared — making the check
 * tautologically true and admitting a schema from outside the declared tier. So a tier root that
 * is itself a symlink is REJECTED, and the candidate's real path must sit inside the real path of
 * that non-symlinked root. Internal symlinks are still fine; escapes are not.
 */
function resolveWithinTier(dir: string, relative: string): string | null {
  const lexicalRoot = path.resolve(dir);
  let rootEntry: fs.Stats;
  try {
    // lstat, not exists: the TIER DIRECTORY ENTRY itself must not be a symlink. Comparing
    // realpath(root) to the lexical path would be wrong — an ANCESTOR being symlinked is
    // ordinary (on macOS `/tmp` and `/var/folders` both are) and says nothing about the tier.
    rootEntry = fs.lstatSync(lexicalRoot);
  } catch {
    return null;
  }
  if (rootEntry.isSymbolicLink()) return null; // symlinked tier root: never trusted
  const realRoot = fs.realpathSync(lexicalRoot);
  const candidate = path.resolve(lexicalRoot, relative);
  if (!isContainedIn(candidate, lexicalRoot)) return null;
  if (!fs.existsSync(candidate)) return null;
  if (!isContainedIn(fs.realpathSync(candidate), realRoot)) return null;
  return candidate;
}

/** True when `target` sits at or beneath `root` — a path comparison, never a string prefix. */
function isContainedIn(target: string, root: string): boolean {
  const rel = path.relative(root, target);
  return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel);
}

const ENGINE_SOURCES: Record<string, EngineSource> = {
  'architecture.stage-count': {
    params: ['doc'],
    checkInputs: (projectRoot, params) => architectureDocMissing(projectRoot, params.doc),
    resolve: (projectRoot, params) =>
      String(requireParseableDoc(projectRoot, 'architecture.stage-count', params.doc).stages.length),
  },
  'architecture.ruling-count': {
    params: ['doc', 'prefix'],
    checkInputs: (projectRoot, params) => architectureDocMissing(projectRoot, params.doc),
    resolve: (projectRoot, params) =>
      String(
        countRulingEntries(
          requireParseableDoc(projectRoot, 'architecture.ruling-count', params.doc),
          params.prefix
        )
      ),
  },
  'specs.capability-count': {
    params: [],
    // An ABSENT specs directory is 'no baseline to count', not 'zero capabilities' — the same
    // short-count failure the architecture sources refuse. A PRESENT but empty directory still
    // emits '0', because that genuinely IS a count.
    checkInputs: (projectRoot) =>
      fs.existsSync(path.join(projectRoot, 'orbit', 'specs'))
        ? null
        : `the project has no orbit/specs/ directory, so there is no baseline capability count to emit`,
    resolve: (projectRoot) => {
      const specsDir = path.join(projectRoot, 'orbit', 'specs');
      if (!fs.existsSync(specsDir)) {
        throw new SourceResolutionError(
          'specs.capability-count: the project has no orbit/specs/ directory, so no count is emitted'
        );
      }
      const count = fs
        .readdirSync(specsDir, { withFileTypes: true })
        .filter(
          (e) =>
            e.isDirectory() &&
            !e.name.startsWith('.') &&
            fs.existsSync(path.join(specsDir, e.name, 'spec.md'))
        ).length;
      return String(count);
    },
  },
  'schema.version': {
    params: ['schema'],
    checkInputs: (projectRoot, params) =>
      findSchemaFile(projectRoot, params.schema)
        ? null
        : `schema '${params.schema}' does not exist project-locally or in the package`,
    resolve: (projectRoot, params) => {
      const file = findSchemaFile(projectRoot, params.schema);
      if (!file) {
        throw new SourceResolutionError(
          `schema.version: schema '${params.schema}' does not exist project-locally or in the package`
        );
      }
      try {
        // Numeric in YAML; rendered to its decimal string form AT THE SOURCE, never at the
        // comparison — the check is `includes` over two strings and coerces nothing.
        return String(parseSchema(fs.readFileSync(file, 'utf-8')).version);
      } catch (err) {
        throw new SourceResolutionError(
          `schema.version: schema '${params.schema}' at ${file} did not parse: ${(err as Error).message}`
        );
      }
    },
  },
};

/** The engine-source names a registry entry may name. CLOSED. */
export function listEngineSources(): string[] {
  return Object.keys(ENGINE_SOURCES).sort();
}

// ---------------------------------------------------------------------------
// The registry reader (task 1.3)
// ---------------------------------------------------------------------------

/**
 * Reads `orbit/sources.yaml`. An ABSENT file means an empty registry and no error — the
 * state of every repository today. A file that EXISTS can never reach that silence: every
 * fault below throws, naming the file or the entry.
 */
export function readSourcesRegistry(projectRoot: string): DeclaredSource[] {
  const file = path.join(projectRoot, SOURCES_REGISTRY_PATH);
  if (!fs.existsSync(file)) return [];

  const raw = fs.readFileSync(file, 'utf-8');
  let parsed: unknown;
  try {
    parsed = parseYaml(raw, { uniqueKeys: true });
  } catch (err) {
    throw new SourceRegistryError(
      `${SOURCES_REGISTRY_PATH} is not valid YAML: ${(err as Error).message}`
    );
  }

  if (parsed === null || parsed === undefined) {
    throw new SourceRegistryError(
      `${SOURCES_REGISTRY_PATH} is empty; delete the file to disable the source lint, or declare a 'sources:' map`
    );
  }
  if (!isPlainObject(parsed)) {
    throw new SourceRegistryError(
      `${SOURCES_REGISTRY_PATH} must be a map with a top-level 'sources:' key`
    );
  }
  const unknownTop = Object.keys(parsed).filter((k) => k !== 'sources');
  if (unknownTop.length > 0) {
    throw new SourceRegistryError(
      `${SOURCES_REGISTRY_PATH} carries unknown top-level key(s): ${unknownTop.join(', ')} (only 'sources' is defined)`
    );
  }
  if (!('sources' in parsed)) {
    throw new SourceRegistryError(`${SOURCES_REGISTRY_PATH} has no top-level 'sources:' key`);
  }
  const sources = (parsed as Record<string, unknown>).sources;
  if (!isPlainObject(sources)) {
    throw new SourceRegistryError(
      `${SOURCES_REGISTRY_PATH}: 'sources:' must be a map from source name to entry`
    );
  }
  // An EXISTING file must never reach the absent-file silence. `sources: {}` otherwise left
  // `registryPresent` true with no sources, no coverage rows and no output at all — a
  // truncation could disable every check without a named reason.
  if (Object.keys(sources).length === 0) {
    throw new SourceRegistryError(
      `${SOURCES_REGISTRY_PATH}: 'sources:' declares no entries; delete the file to disable the source lint rather than emptying it`
    );
  }

  // Duplicate source names are rejected by `parseYaml(..., { uniqueKeys: true })` above, which
  // throws `Map keys must be unique` before this loop runs — so no second guard lives here. The
  // test pins that branch by name rather than accepting either message.
  const declared: DeclaredSource[] = [];
  for (const [name, entry] of Object.entries(sources)) {
    const where = `${SOURCES_REGISTRY_PATH}: source '${name}'`;
    if (!SOURCE_NAME_REGEX.test(name)) {
      throw new SourceRegistryError(
        `${where} does not match the marker name grammar [a-z0-9][a-z0-9-]*, so no legal marker could ever name it`
      );
    }
    if (!isPlainObject(entry)) {
      throw new SourceRegistryError(`${where} must be a map, not ${describe(entry)}`);
    }
    const engine = (entry as Record<string, unknown>).engine;
    if (engine === undefined) {
      throw new SourceRegistryError(`${where} is missing 'engine:'`);
    }
    // `in` walks the prototype chain, so `engine: toString` passed this test and then threw a
    // raw TypeError on `.params` instead of the clean unknown-source error. Own keys only.
    if (typeof engine !== 'string' || !Object.hasOwn(ENGINE_SOURCES, engine)) {
      throw new SourceRegistryError(
        `${where} names an unknown engine source '${String(engine)}'; the engine exposes: ${listEngineSources().join(', ')}`
      );
    }
    const definition = ENGINE_SOURCES[engine];

    const params: Record<string, string> = {};
    for (const [key, value] of Object.entries(entry as Record<string, unknown>)) {
      if (key === 'engine') continue;
      if (!definition.params.includes(key)) {
        throw new SourceRegistryError(
          `${where} carries unknown key '${key}'; '${engine}' declares: ${definition.params.length ? definition.params.join(', ') : '(no parameters)'}`
        );
      }
      if (typeof value !== 'string' || value.trim() === '') {
        throw new SourceRegistryError(
          `${where}: parameter '${key}' must be a non-empty string, not ${describe(value)}`
        );
      }
      params[key] = value;
    }
    for (const required of definition.params) {
      if (!(required in params)) {
        throw new SourceRegistryError(
          `${where} is missing required parameter '${required}' for engine source '${engine}'`
        );
      }
    }

    const inputFault = definition.checkInputs(projectRoot, params);
    if (inputFault) {
      throw new SourceRegistryError(`${where}: ${inputFault}`);
    }

    declared.push({ name, engine, params });
  }

  return declared;
}

/** Resolves one declared source to the STRING it emits. Throws SourceResolutionError. */
export function resolveSourceValue(projectRoot: string, source: DeclaredSource): string {
  return ENGINE_SOURCES[source.engine].resolve(projectRoot, source.params);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function describe(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'a list';
  if (typeof value === 'object') return 'a map';
  return `${typeof value} (${JSON.stringify(value)})`;
}
