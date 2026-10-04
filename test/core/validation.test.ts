import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import os from 'os';
import path from 'path';
import { Validator } from '../../src/core/validation/validator.js';
import { runCLI } from '../helpers/run-cli.js';
import { 
  ScenarioSchema, 
  RequirementSchema, 
  SpecSchema, 
  ChangeSchema,
  DeltaSchema 
} from '../../src/core/schemas/index.js';

describe('Validation Schemas', () => {
  describe('ScenarioSchema', () => {
    it('should validate a valid scenario', () => {
      const scenario = {
        rawText: 'Given a user is logged in\nWhen they click logout\nThen they are redirected to login page',
      };
      
      const result = ScenarioSchema.safeParse(scenario);
      expect(result.success).toBe(true);
    });

    it('should reject scenario with empty text', () => {
      const scenario = {
        rawText: '',
      };
      
      const result = ScenarioSchema.safeParse(scenario);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Scenario text cannot be empty');
      }
    });
  });

  describe('RequirementSchema', () => {
    it('should validate a valid requirement', () => {
      const requirement = {
        text: 'The system SHALL provide user authentication',
        scenarios: [
          {
            rawText: 'Given a user with valid credentials\nWhen they submit the login form\nThen they are authenticated',
          },
        ],
      };
      
      const result = RequirementSchema.safeParse(requirement);
      expect(result.success).toBe(true);
    });

    it('should reject requirement without SHALL or MUST', () => {
      const requirement = {
        text: 'The system provides user authentication',
        scenarios: [
          {
            rawText: 'Given a user\nWhen they login\nThen authenticated',
          },
        ],
      };
      
      const result = RequirementSchema.safeParse(requirement);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Requirement must contain SHALL or MUST keyword');
      }
    });

    it('should reject requirement without scenarios', () => {
      const requirement = {
        text: 'The system SHALL provide user authentication',
        scenarios: [],
      };
      
      const result = RequirementSchema.safeParse(requirement);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Requirement must have at least one scenario');
      }
    });
  });

  describe('SpecSchema', () => {
    it('should validate a valid spec', () => {
      const spec = {
        name: 'user-auth',
        overview: 'This spec defines user authentication requirements',
        requirements: [
          {
            text: 'The system SHALL provide user authentication',
            scenarios: [
              {
                rawText: 'Given a user with valid credentials\nWhen they submit the login form\nThen they are authenticated',
              },
            ],
          },
        ],
      };
      
      const result = SpecSchema.safeParse(spec);
      expect(result.success).toBe(true);
    });

    it('should reject spec without requirements', () => {
      const spec = {
        name: 'user-auth',
        overview: 'This spec defines user authentication requirements',
        requirements: [],
      };
      
      const result = SpecSchema.safeParse(spec);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Spec must have at least one requirement');
      }
    });
  });

  describe('ChangeSchema', () => {
    it('should validate a valid change', () => {
      const change = {
        name: 'add-user-auth',
        why: 'We need user authentication to secure the application and protect user data',
        whatChanges: 'Add authentication module with login and logout capabilities',
        deltas: [
          {
            spec: 'user-auth',
            operation: 'ADDED',
            description: 'Add new user authentication spec',
          },
        ],
      };
      
      const result = ChangeSchema.safeParse(change);
      expect(result.success).toBe(true);
    });

    it('should reject change with short why section', () => {
      const change = {
        name: 'add-user-auth',
        why: 'Need auth',
        whatChanges: 'Add authentication',
        deltas: [
          {
            spec: 'user-auth',
            operation: 'ADDED',
            description: 'Add auth',
          },
        ],
      };
      
      const result = ChangeSchema.safeParse(change);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Why section must be at least 50 characters');
      }
    });

    it('should warn about too many deltas', () => {
      const deltas = Array.from({ length: 11 }, (_, i) => ({
        spec: `spec-${i}`,
        operation: 'ADDED' as const,
        description: `Add spec ${i}`,
      }));
      
      const change = {
        name: 'massive-change',
        why: 'This is a massive change that affects many parts of the system',
        whatChanges: 'Update everything',
        deltas,
      };
      
      const result = ChangeSchema.safeParse(change);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Consider splitting changes with more than 10 deltas');
      }
    });
  });
});

describe('Validator', () => {
  const testDir = path.join(process.cwd(), 'test-validation-tmp');
  
  beforeEach(async () => {
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('validateSpec', () => {
    it('should validate a valid spec file', async () => {
      const specContent = `# User Authentication Spec

## Purpose
This specification defines the requirements for user authentication in the system.

## Requirements

### The system SHALL provide secure user authentication
The system SHALL provide secure user authentication mechanisms.

#### Scenario: Successful login
Given a user with valid credentials
When they submit the login form
Then they are authenticated and redirected to the dashboard

### The system SHALL handle invalid login attempts
The system SHALL gracefully handle incorrect credentials.

#### Scenario: Invalid credentials
Given a user with invalid credentials
When they submit the login form
Then they see an error message`;

      const specPath = path.join(testDir, 'spec.md');
      await fs.writeFile(specPath, specContent);
      
      const validator = new Validator();
      const report = await validator.validateSpec(specPath);
      
      expect(report.valid).toBe(true);
      expect(report.summary.errors).toBe(0);
    });

    it('should detect missing overview section', async () => {
      const specContent = `# User Authentication Spec

## Requirements

### The system SHALL provide secure user authentication

#### Scenario: Login
Given a user
When they login
Then authenticated`;

      const specPath = path.join(testDir, 'spec.md');
      await fs.writeFile(specPath, specContent);
      
      const validator = new Validator();
      const report = await validator.validateSpec(specPath);
      
      expect(report.valid).toBe(false);
      expect(report.summary.errors).toBeGreaterThan(0);
      expect(report.issues.some(i => i.message.includes('Purpose'))).toBe(true);
    });

    it('should error on delta headers inside a main spec', async () => {
      const specContent = `# Test Specification

## Purpose
This specification validates that stray delta headers are rejected in main specs.

## Requirements

### Requirement: A
The system SHALL do A.

#### Scenario: A works
- **WHEN** foo
- **THEN** bar

## MODIFIED Requirements

### Requirement: B
The system SHALL do B.

#### Scenario: B works
- **WHEN** baz
- **THEN** qux`;

      const specPath = path.join(testDir, 'spec.md');
      await fs.writeFile(specPath, specContent);

      const report = await new Validator().validateSpec(specPath);

      expect(report.valid).toBe(false);
      expect(
        report.issues.some(i => i.level === 'ERROR' && i.message.includes('Main spec contains delta header'))
      ).toBe(true);
      expect(
        report.issues.some(i => i.level === 'ERROR' && i.message.includes('Requirement header "### Requirement: B" appears outside'))
      ).toBe(true);
    });

    it('should error on requirement headers that appear after the Requirements section ends', async () => {
      const specContent = `# Test Specification

## Purpose
This specification validates that hidden requirements are rejected even without delta headers.

## Requirements

### Requirement: A
The system SHALL do A.

#### Scenario: A works
- **WHEN** foo
- **THEN** bar

## Edge Cases

### Requirement: B
The system SHALL do B.

#### Scenario: B works
- **WHEN** baz
- **THEN** qux`;

      const specPath = path.join(testDir, 'spec.md');
      await fs.writeFile(specPath, specContent);

      const report = await new Validator().validateSpec(specPath);

      expect(report.valid).toBe(false);
      expect(
        report.issues.some(i => i.level === 'ERROR' && i.message.includes('Requirement header "### Requirement: B" appears outside'))
      ).toBe(true);
    });

    it('should ignore delta header examples inside fenced code blocks', async () => {
      const specContent = `# Test Specification

## Purpose
This specification documents delta syntax without being flagged for quoted examples.

## Requirements

### Requirement: Explain delta syntax
The system SHALL allow documentation specs to quote delta headers inside fenced code blocks.

\`\`\`markdown
## ADDED Requirements

### Requirement: Example
The system SHALL ...
\`\`\`

#### Scenario: reader follows the example
- **WHEN** a reader reviews the documentation
- **THEN** the quoted delta header remains an example only`;

      const specPath = path.join(testDir, 'spec.md');
      await fs.writeFile(specPath, specContent);

      const report = await new Validator().validateSpec(specPath);

      expect(report.valid).toBe(true);
      expect(report.issues.some(i => i.message.includes('Main spec contains delta header'))).toBe(false);
      expect(report.issues.some(i => i.message.includes('appears outside the main ## Requirements section'))).toBe(false);
    });
  });

  describe('validateChange', () => {
    it('should validate a valid change file', async () => {
      const changeContent = `# Add User Authentication

## Why
We need to implement user authentication to secure the application and protect user data from unauthorized access.

## What Changes
- **user-auth:** Add new user authentication specification
- **api-endpoints:** Modify to include auth endpoints`;

      const changePath = path.join(testDir, 'change.md');
      await fs.writeFile(changePath, changeContent);
      
      const validator = new Validator();
      const report = await validator.validateChange(changePath);
      
      expect(report.valid).toBe(true);
      expect(report.summary.errors).toBe(0);
    });

    it('should detect missing why section', async () => {
      const changeContent = `# Add User Authentication

## What Changes
- **user-auth:** Add new user authentication specification`;

      const changePath = path.join(testDir, 'change.md');
      await fs.writeFile(changePath, changeContent);
      
      const validator = new Validator();
      const report = await validator.validateChange(changePath);
      
      expect(report.valid).toBe(false);
      expect(report.summary.errors).toBeGreaterThan(0);
      expect(report.issues.some(i => i.message.includes('Why'))).toBe(true);
    });
  });

  describe('strict mode', () => {
    it('should fail on warnings in strict mode', async () => {
      const specContent = `# Test Spec

## Purpose
Brief overview

## Requirements

### The system SHALL do something

#### Scenario: Test
Given test
When action
Then result`;

      const specPath = path.join(testDir, 'spec.md');
      await fs.writeFile(specPath, specContent);

      const validator = new Validator(true); // strict mode
      const report = await validator.validateSpec(specPath);

      expect(report.valid).toBe(false); // Should fail due to brief overview warning
    });

    it('should pass warnings in non-strict mode', async () => {
      const specContent = `# Test Spec

## Purpose
Brief overview

## Requirements

### The system SHALL do something

#### Scenario: Test
Given test
When action
Then result`;

      const specPath = path.join(testDir, 'spec.md');
      await fs.writeFile(specPath, specContent);

      const validator = new Validator(false); // non-strict mode
      const report = await validator.validateSpec(specPath);

      expect(report.valid).toBe(true); // Should pass despite warnings
      expect(report.summary.warnings).toBeGreaterThan(0);
    });
  });

  describe('validateChangeDeltaSpecs with metadata', () => {
    it('should validate requirement with metadata before SHALL/MUST text', async () => {
      const changeDir = path.join(testDir, 'test-change');
      const specsDir = path.join(changeDir, 'specs', 'test-spec');
      await fs.mkdir(specsDir, { recursive: true });

      const deltaSpec = `# Test Spec

## ADDED Requirements

### Requirement: Circuit Breaker State Management SHALL be implemented
**ID**: REQ-CB-001
**Priority**: P1 (High)

The system MUST implement a circuit breaker with three states.

#### Scenario: Normal operation
**Given** the circuit breaker is in CLOSED state
**When** a request is made
**Then** the request is executed normally`;

      const specPath = path.join(specsDir, 'spec.md');
      await fs.writeFile(specPath, deltaSpec);

      const validator = new Validator(true);
      const report = await validator.validateChangeDeltaSpecs(changeDir);

      expect(report.valid).toBe(true);
      expect(report.summary.errors).toBe(0);
    });

    it('should validate requirement with SHALL in text but not in header', async () => {
      const changeDir = path.join(testDir, 'test-change-2');
      const specsDir = path.join(changeDir, 'specs', 'test-spec');
      await fs.mkdir(specsDir, { recursive: true });

      const deltaSpec = `# Test Spec

## ADDED Requirements

### Requirement: Error Handling
**ID**: REQ-ERR-001
**Priority**: P2

The system SHALL handle all errors gracefully.

#### Scenario: Error occurs
**Given** an error condition
**When** an error occurs
**Then** the error is logged and user is notified`;

      const specPath = path.join(specsDir, 'spec.md');
      await fs.writeFile(specPath, deltaSpec);

      const validator = new Validator(true);
      const report = await validator.validateChangeDeltaSpecs(changeDir);

      expect(report.valid).toBe(true);
      expect(report.summary.errors).toBe(0);
    });

    it('should fail when requirement text lacks SHALL/MUST', async () => {
      const changeDir = path.join(testDir, 'test-change-3');
      const specsDir = path.join(changeDir, 'specs', 'test-spec');
      await fs.mkdir(specsDir, { recursive: true });

      const deltaSpec = `# Test Spec

## ADDED Requirements

### Requirement: Logging Feature
**ID**: REQ-LOG-001

The system will log all events.

#### Scenario: Event occurs
**Given** an event
**When** it occurs
**Then** it is logged`;

      const specPath = path.join(specsDir, 'spec.md');
      await fs.writeFile(specPath, deltaSpec);

      const validator = new Validator(true);
      const report = await validator.validateChangeDeltaSpecs(changeDir);

      expect(report.valid).toBe(false);
      expect(report.summary.errors).toBeGreaterThan(0);
      expect(report.issues.some(i => i.message.includes('must contain SHALL or MUST'))).toBe(true);
    });

    it('should handle requirements without metadata fields', async () => {
      const changeDir = path.join(testDir, 'test-change-4');
      const specsDir = path.join(changeDir, 'specs', 'test-spec');
      await fs.mkdir(specsDir, { recursive: true });

      const deltaSpec = `# Test Spec

## ADDED Requirements

### Requirement: Simple Feature
The system SHALL implement this feature.

#### Scenario: Basic usage
**Given** a condition
**When** an action occurs
**Then** a result happens`;

      const specPath = path.join(specsDir, 'spec.md');
      await fs.writeFile(specPath, deltaSpec);

      const validator = new Validator(true);
      const report = await validator.validateChangeDeltaSpecs(changeDir);

      expect(report.valid).toBe(true);
      expect(report.summary.errors).toBe(0);
    });

    it('should treat delta headers case-insensitively', async () => {
      const changeDir = path.join(testDir, 'test-change-mixed-case');
      const specsDir = path.join(changeDir, 'specs', 'test-spec');
      await fs.mkdir(specsDir, { recursive: true });

      const deltaSpec = `# Test Spec

## Added Requirements

### Requirement: Mixed Case Handling
The system MUST support mixed case delta headers.

#### Scenario: Case insensitive parsing
**Given** a delta file with mixed case headers
**When** validation runs
**Then** the delta is detected`;

      const specPath = path.join(specsDir, 'spec.md');
      await fs.writeFile(specPath, deltaSpec);

      const validator = new Validator(true);
      const report = await validator.validateChangeDeltaSpecs(changeDir);

      expect(report.valid).toBe(true);
      expect(report.summary.errors).toBe(0);
      expect(report.summary.warnings).toBe(0);
      expect(report.summary.info).toBe(0);
    });
  });
});

/**
 * rc06a-scenario-map — the declaration check in `validateChangeDeltaSpecs` (`orbit-scenario-map`'s
 * `A declaration is owed by every scenario in the change's delta blocks` and `An undeclared delta
 * scenario is INFO until the apply gate passes`). Fixture tags are assembled at runtime (design D3).
 */
describe('scenario-map declaration check (rc06a)', () => {
  const AT = '// @' + 'scenario';
  let root: string;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  const ON = "schema: spec-driven\nscenario_map:\n  tests: ['test/**/*.test.ts']\n";

  function write(rel: string, content: string): void {
    const p = path.join(root, rel);
    mkdirSync(path.dirname(p), { recursive: true });
    writeFileSync(p, content);
  }
  function req(name: string, scenarios: string[]): string {
    return [`### Requirement: ${name}`, '', `${name} SHALL hold.`, '', ...scenarios.flatMap((s) => [`#### Scenario: ${s}`, '', '- **WHEN** a', '- **THEN** b', ''])].join('\n');
  }
  function change(opts: { delta: string; tasks?: string | null; schema?: string; config?: string | null }): string {
    const dir = `orbit/changes/c1`;
    write(`${dir}/.openspec.yaml`, `schema: ${opts.schema ?? 'spec-driven'}\n`);
    write(`${dir}/proposal.md`, '# P\n');
    if (opts.tasks !== null) write(`${dir}/tasks.md`, opts.tasks ?? '## 1. W\n\n- [ ] 1.1 t\n');
    write(`${dir}/specs/orbit-x/spec.md`, opts.delta);
    if (opts.config !== null) write('orbit/config.yaml', opts.config ?? ON);
    return path.join(root, dir);
  }
  const mapIssues = (r: { issues: Array<{ path: string; level: string; message: string }> }) =>
    r.issues.filter((i) => i.path === 'scenario-map');

  beforeEach(() => {
    root = mkdtempSync(path.join(os.tmpdir(), 'orbit-validate-scenarios-'));
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
    warnSpy.mockRestore();
  });

  // @scenario behaviour orbit-scenario-map :: A declaration is owed by every scenario in the change's delta blocks :: An undeclared ADDED scenario is reported
  it('reports an undeclared ADDED scenario naming its key', async () => {
    const dir = change({ delta: '## ADDED Requirements\n\n' + req('Req A', ['S1', 'S2']) });
    write('test/a.test.ts', `${AT} behaviour orbit-x :: Req A :: S1\nit('x', () => {});\n`);
    const issues = mapIssues(await new Validator().validateChangeDeltaSpecs(dir));
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toContain('orbit-x :: Req A :: S2');
  });

  // @scenario behaviour orbit-scenario-map :: A declaration is owed by every scenario in the change's delta blocks :: A MODIFIED block's unchanged scenario owes a declaration
  it("reports a MODIFIED block's unchanged scenario", async () => {
    write('orbit/specs/orbit-x/spec.md', '# x\n\n## Purpose\n\nP.\n\n## Requirements\n\n' + req('Req M', ['Kept']));
    const dir = change({ delta: '## MODIFIED Requirements\n\n' + req('Req M', ['Kept', 'New']) });
    const messages = mapIssues(await new Validator().validateChangeDeltaSpecs(dir)).map((i) => i.message);
    expect(messages.some((m) => m.includes('orbit-x :: Req M :: Kept'))).toBe(true);
    expect(messages.some((m) => m.includes('orbit-x :: Req M :: New'))).toBe(true);
  });

  // @scenario behaviour orbit-scenario-map :: A declaration is owed by every scenario in the change's delta blocks :: A RENAMED requirement re-keys its scenarios
  it("reports a RENAMED requirement's scenarios under the new key", async () => {
    write('orbit/specs/orbit-x/spec.md', '# x\n\n## Purpose\n\nP.\n\n## Requirements\n\n' + req('Req A', ['S1']));
    const dir = change({
      delta: '## RENAMED Requirements\n\n- FROM: `### Requirement: Req A`\n- TO: `### Requirement: Req B`\n',
    });
    write('test/a.test.ts', `${AT} behaviour orbit-x :: Req A :: S1\nit('x', () => {});\n`);
    const messages = mapIssues(await new Validator().validateChangeDeltaSpecs(dir)).map((i) => i.message);
    expect(messages).toHaveLength(1);
    expect(messages[0]).toContain('orbit-x :: Req B :: S1');
  });

  // @scenario behaviour orbit-scenario-map :: A declaration is owed by every scenario in the change's delta blocks :: A renamed-then-modified requirement owes its MODIFIED block
  it('a renamed-then-modified requirement owes exactly its MODIFIED block under the new key', async () => {
    write('orbit/specs/orbit-x/spec.md', '# x\n\n## Purpose\n\nP.\n\n## Requirements\n\n' + req('Req A', ['Old']));
    const dir = change({
      delta:
        '## RENAMED Requirements\n\n- FROM: `### Requirement: Req A`\n- TO: `### Requirement: Req B`\n\n## MODIFIED Requirements\n\n' +
        req('Req B', ['N1', 'N2', 'N3']),
    });
    const messages = mapIssues(await new Validator().validateChangeDeltaSpecs(dir)).map((i) => i.message);
    expect(messages).toHaveLength(3);
    for (const n of ['N1', 'N2', 'N3']) expect(messages.some((m) => m.includes(`orbit-x :: Req B :: ${n}`))).toBe(true);
  });

  // @scenario behaviour orbit-scenario-map :: A declaration is owed by every scenario in the change's delta blocks :: A baseline scenario outside the delta never fails validate
  it('an untouched baseline scenario is never reported', async () => {
    write('orbit/specs/orbit-y/spec.md', '# y\n\n## Purpose\n\nP.\n\n## Requirements\n\n' + req('Req Y', ['Y1']));
    const dir = change({ delta: '## ADDED Requirements\n\n' + req('Req A', ['S1']) });
    const messages = mapIssues(await new Validator().validateChangeDeltaSpecs(dir)).map((i) => i.message);
    expect(messages.some((m) => m.includes('orbit-y'))).toBe(false);
  });

  // @scenario behaviour orbit-scenario-map :: An undeclared delta scenario is INFO until the apply gate passes :: Before apply, an undeclared scenario is INFO
  it('tasks unchecked: INFO, and --strict passes', async () => {
    const dir = change({ delta: '## ADDED Requirements\n\n' + req('Req A', ['S1']) });
    const report = await new Validator(true).validateChangeDeltaSpecs(dir);
    expect(mapIssues(report).map((i) => i.level)).toEqual(['INFO']);
    expect(report.valid).toBe(true);
  });

  it('tasks.md absent (apply blocked): INFO', async () => {
    const dir = change({ delta: '## ADDED Requirements\n\n' + req('Req A', ['S1']), tasks: null });
    expect(mapIssues(await new Validator(true).validateChangeDeltaSpecs(dir)).map((i) => i.level)).toEqual(['INFO']);
  });

  // @scenario behaviour orbit-scenario-map :: An undeclared delta scenario is INFO until the apply gate passes :: After apply, an undeclared scenario is an ERROR
  it('every task checked: ERROR, and validate fails', async () => {
    const dir = change({ delta: '## ADDED Requirements\n\n' + req('Req A', ['S1']), tasks: '## 1. W\n\n- [x] 1.1 t\n' });
    const report = await new Validator().validateChangeDeltaSpecs(dir);
    expect(mapIssues(report).map((i) => i.level)).toEqual(['ERROR']);
    expect(report.valid).toBe(false);
  });

  // @scenario behaviour orbit-scenario-map :: An undeclared delta scenario is INFO until the apply gate passes :: Pending user-validation handoffs count as applied
  it('only declared user-validation handoffs unchecked: ERROR', async () => {
    const dir = change({
      delta: '## ADDED Requirements\n\n' + req('Req A', ['S1']),
      tasks: '## 1. W\n\n- [x] 1.1 t\n- [ ] 1.2 (User-validation handoff) the user tries it\n',
    });
    write('orbit/changes/c1/.orbit-runs/apply-2026-10-04T10-00-00Z.json', JSON.stringify({ user_validation_tasks: ['1.2'] }));
    expect(mapIssues(await new Validator().validateChangeDeltaSpecs(dir)).map((i) => i.level)).toEqual(['ERROR']);
  });

  it('a schema with no apply gate: INFO', async () => {
    write(
      'orbit/schemas/no-gates/schema.yaml',
      'name: no-gates\nversion: 1\ndescription: x\nartifacts:\n  - id: proposal\n    generates: proposal.md\n    description: p\n    template: proposal.md\n'
    );
    write('orbit/schemas/no-gates/templates/proposal.md', '# P\n');
    const dir = change({
      delta: '## ADDED Requirements\n\n' + req('Req A', ['S1']),
      tasks: '## 1. W\n\n- [x] 1.1 t\n',
      schema: 'no-gates',
    });
    expect(mapIssues(await new Validator().validateChangeDeltaSpecs(dir)).map((i) => i.level)).toEqual(['INFO']);
  });

  // @scenario behaviour orbit-scenario-map :: An undeclared delta scenario is INFO until the apply gate passes :: A change whose context cannot load reports INFO
  it('a change whose schema does not resolve: INFO and no throw', async () => {
    const dir = change({
      delta: '## ADDED Requirements\n\n' + req('Req A', ['S1']),
      tasks: '## 1. W\n\n- [x] 1.1 t\n',
      schema: 'no-such-schema',
    });
    const report = await new Validator().validateChangeDeltaSpecs(dir);
    expect(mapIssues(report).map((i) => i.level)).toEqual(['INFO']);
  });

  // @scenario behaviour orbit-scenario-map :: A declaration is owed by every scenario in the change's delta blocks :: An unkeyable title is refused before apply
  it.each([
    ['tasks unchecked', 'spec-driven'],
    ['an unresolvable schema', 'no-such-schema'],
  ])('an unkeyable delta title is UNKEYABLE at ERROR with %s, and not also undeclared', async (_label, schema) => {
    const dir = change({ delta: '## ADDED Requirements\n\n' + req('Req A', ['S1', 'A :: B']), schema });
    const report = await new Validator(true).validateChangeDeltaSpecs(dir);
    const issues = mapIssues(report);
    const unkeyable = issues.filter((i) => /unkeyable/i.test(i.message));
    expect(unkeyable).toHaveLength(1);
    expect(unkeyable[0].level).toBe('ERROR');
    expect(unkeyable[0].message).toContain('orbit-x');
    expect(unkeyable[0].message).toContain('Req A');
    expect(unkeyable[0].message).toContain('A :: B');
    expect(issues).toHaveLength(2); // S1 undeclared + the one UNKEYABLE — A :: B is not also undeclared
    expect(report.valid).toBe(false);
  });

  // @scenario behaviour orbit-scenario-map :: A declaration is owed by every scenario in the change's delta blocks :: A repeated scenario title is unkeyable
  it('a scenario title repeated within its requirement is UNKEYABLE at ERROR at each occurrence, even with every task checked and a tag naming it', async () => {
    const dir = change({
      delta: '## ADDED Requirements\n\n' + req('Req A', ['Same', 'Same']),
      tasks: '## 1. W\n\n- [x] 1.1 t\n',
    });
    write('test/a.test.ts', `${AT} behaviour orbit-x :: Req A :: Same\nit('only first', () => {});\n`);
    const report = await new Validator(true).validateChangeDeltaSpecs(dir);
    const issues = mapIssues(report);
    expect(issues).toHaveLength(2);
    expect(issues.every((i) => i.level === 'ERROR' && /unkeyable/i.test(i.message) && i.message.includes('Same'))).toBe(true);
    expect(report.valid).toBe(false);
  });

  it('check OFF with a malformed scenario_map: exactly the one warning, no issue', async () => {
    const dir = change({ delta: '## ADDED Requirements\n\n' + req('Req A', ['S1']), config: 'schema: spec-driven\nscenario_map: true\n' });
    const report = await new Validator().validateChangeDeltaSpecs(dir);
    expect(mapIssues(report)).toEqual([]);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(String(warnSpy.mock.calls[0][0])).toContain('scenario_map');
  });

  // @scenario behaviour orbit-scenario-map :: The scenario map is opt-in by the scenario_map config key :: An absent key leaves validate unchanged
  // @scenario behaviour orbit-scenario-map :: The scenario map is opt-in by the scenario_map config key :: Another field's malformed value does not reach validate
  it('check OFF: the report is identical to the report without the key, and a malformed pr: prints nothing', async () => {
    const dir = change({
      delta: '## ADDED Requirements\n\n' + req('Req A', ['S1']),
      tasks: '## 1. W\n\n- [x] 1.1 t\n',
      config: null,
    });
    const without = await new Validator(true).validateChangeDeltaSpecs(dir);
    write('orbit/config.yaml', 'schema: spec-driven\npr: sometimes\n');
    const offWithOtherField = await new Validator(true).validateChangeDeltaSpecs(dir);
    expect(offWithOtherField).toEqual(without);
    expect(mapIssues(without)).toEqual([]);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  describe('human-mode orbit validate prints scenario-map INFO beneath a valid report (design D4)', () => {
    const PROPOSAL = '# P\n\n## Why\nBecause reasons that are sufficiently long for validation.\n\n## What Changes\n- **orbit-x:** add it\n';

    // @scenario behaviour orbit-scenario-map :: An undeclared delta scenario is INFO until the apply gate passes :: Before apply, an undeclared scenario is INFO
    it('prints each INFO line beneath the is-valid line, and --strict passes', async () => {
      change({ delta: '## ADDED Requirements\n\n' + req('Req A', ['S1', 'S2']) });
      write('orbit/changes/c1/proposal.md', PROPOSAL);
      const r = await runCLI(['validate', 'c1', '--strict'], { cwd: root });
      expect(r.exitCode).toBe(0);
      const lines = r.stdout.trimEnd().split('\n');
      expect(lines[0]).toBe("Change 'c1' is valid");
      expect(lines.slice(1)).toEqual([
        expect.stringMatching(/^ℹ \[INFO\] scenario-map: undeclared delta scenario: orbit-x :: Req A :: S1/),
        expect.stringMatching(/^ℹ \[INFO\] scenario-map: undeclared delta scenario: orbit-x :: Req A :: S2/),
      ]);
    });

    it('the legacy orbit change validate labels an INFO issue [INFO], never [WARNING]', async () => {
      // An unkeyable title (ERROR) makes the report invalid, so the undeclared S1 (INFO) is printed.
      change({ delta: '## ADDED Requirements\n\n' + req('Req A', ['S1', 'A :: B']) });
      write('orbit/changes/c1/proposal.md', PROPOSAL);
      const r = await runCLI(['change', 'validate', 'c1'], { cwd: root });
      expect(r.exitCode).not.toBe(0);
      expect(r.stderr).toMatch(/ℹ \[INFO\] scenario-map: undeclared delta scenario: orbit-x :: Req A :: S1/);
      expect(r.stderr).not.toMatch(/\[WARNING\] scenario-map/);
    });

    it('a report with no scenario-map issue prints exactly the is-valid line', async () => {
      change({ delta: '## ADDED Requirements\n\n' + req('Req A', ['S1']), config: null });
      write('orbit/changes/c1/proposal.md', PROPOSAL);
      const r = await runCLI(['validate', 'c1'], { cwd: root });
      expect(r.exitCode).toBe(0);
      expect(r.stdout).toBe("Change 'c1' is valid\n");
    });
  });

  it('a directory outside an orbit/changes layout is never checked', async () => {
    write('loose/c9/specs/orbit-x/spec.md', '## ADDED Requirements\n\n' + req('Req A', ['S1']));
    write('orbit/config.yaml', ON);
    const report = await new Validator().validateChangeDeltaSpecs(path.join(root, 'loose', 'c9'));
    expect(mapIssues(report)).toEqual([]);
  });
});
