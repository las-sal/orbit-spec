/**
 * Common flags used across multiple commands
 */
const COMMON_FLAGS = {
    json: {
        name: 'json',
        description: 'Output as JSON',
    },
    jsonValidation: {
        name: 'json',
        description: 'Output validation results as JSON',
    },
    strict: {
        name: 'strict',
        description: 'Enable strict validation mode',
    },
    noInteractive: {
        name: 'no-interactive',
        description: 'Disable interactive prompts',
    },
    type: {
        name: 'type',
        description: 'Specify item type when ambiguous',
        takesValue: true,
        values: ['change', 'spec'],
    },
};
/**
 * Registry of all OpenSpec CLI commands with their flags and metadata.
 * This registry is used to generate shell completion scripts.
 */
export const COMMAND_REGISTRY = [
    {
        name: 'init',
        description: 'Initialize orbit in your project',
        acceptsPositional: true,
        positionalType: 'path',
        flags: [
            {
                name: 'tools',
                description: 'Configure AI tools non-interactively (e.g., "all", "none", or comma-separated tool IDs)',
                takesValue: true,
            },
            {
                name: 'force',
                description: 'Auto-cleanup legacy files without prompting',
            },
            {
                name: 'profile',
                description: 'Override global config profile (core or custom)',
                takesValue: true,
                values: ['core', 'custom'],
            },
        ],
    },
    {
        name: 'update',
        description: 'Update orbit instruction files',
        acceptsPositional: true,
        positionalType: 'path',
        flags: [
            {
                name: 'force',
                description: 'Force update even when tools are up to date',
            },
        ],
    },
    {
        name: 'list',
        description: 'List items (changes by default, or specs with --specs)',
        flags: [
            {
                name: 'specs',
                description: 'List specs instead of changes',
            },
            {
                name: 'changes',
                description: 'List changes explicitly (default)',
            },
            {
                name: 'sort',
                description: 'Sort order: "recent" (default) or "name"',
                takesValue: true,
                values: ['recent', 'name'],
            },
            COMMON_FLAGS.json,
        ],
    },
    {
        name: 'view',
        description: 'Display an interactive dashboard of specs and changes',
        flags: [],
    },
    {
        name: 'validate',
        description: 'Validate changes and specs',
        acceptsPositional: true,
        positionalType: 'change-or-spec-id',
        flags: [
            {
                name: 'all',
                description: 'Validate all changes and specs',
            },
            {
                name: 'changes',
                description: 'Validate all changes',
            },
            {
                name: 'specs',
                description: 'Validate all specs',
            },
            {
                name: 'sources',
                description: 'Lint marked source spans against orbit/sources.yaml',
            },
            COMMON_FLAGS.type,
            COMMON_FLAGS.strict,
            COMMON_FLAGS.jsonValidation,
            {
                name: 'concurrency',
                description: 'Max concurrent validations (defaults to env OPENSPEC_CONCURRENCY or 6)',
                takesValue: true,
            },
            COMMON_FLAGS.noInteractive,
        ],
    },
    {
        name: 'show',
        description: 'Show a change or spec',
        acceptsPositional: true,
        positionalType: 'change-or-spec-id',
        flags: [
            COMMON_FLAGS.json,
            COMMON_FLAGS.type,
            COMMON_FLAGS.noInteractive,
            {
                name: 'deltas-only',
                description: 'Show only deltas (JSON only, change-specific)',
            },
            {
                name: 'requirements-only',
                description: 'Alias for --deltas-only (deprecated, change-specific)',
            },
            {
                name: 'requirements',
                description: 'Show only requirements, exclude scenarios (JSON only, spec-specific)',
            },
            {
                name: 'no-scenarios',
                description: 'Exclude scenario content (JSON only, spec-specific)',
            },
            {
                name: 'requirement',
                short: 'r',
                description: 'Show specific requirement by ID (JSON only, spec-specific)',
                takesValue: true,
            },
        ],
    },
    {
        name: 'archive',
        description: 'Archive a completed change and update main specs',
        acceptsPositional: true,
        positionalType: 'change-id',
        flags: [
            {
                name: 'yes',
                short: 'y',
                description: 'Skip confirmation prompts',
            },
            {
                name: 'skip-specs',
                description: 'Skip spec update operations',
            },
            {
                name: 'no-validate',
                description: 'Skip validation (not recommended)',
            },
            {
                name: 'override-fingerprints',
                description: 'Proceed past base-fingerprint divergence (deliberate)',
            },
        ],
    },
    {
        name: 'feedback',
        description: 'Submit feedback about orbit',
        acceptsPositional: true,
        flags: [
            {
                name: 'body',
                description: 'Detailed description for the feedback',
                takesValue: true,
            },
        ],
    },
    {
        name: 'change',
        description: 'Manage orbit change proposals (deprecated)',
        flags: [],
        subcommands: [
            {
                name: 'show',
                description: 'Show a change proposal',
                acceptsPositional: true,
                positionalType: 'change-id',
                flags: [
                    COMMON_FLAGS.json,
                    {
                        name: 'deltas-only',
                        description: 'Show only deltas (JSON only)',
                    },
                    {
                        name: 'requirements-only',
                        description: 'Alias for --deltas-only (deprecated)',
                    },
                    COMMON_FLAGS.noInteractive,
                ],
            },
            {
                name: 'list',
                description: 'List all active changes (deprecated)',
                flags: [
                    COMMON_FLAGS.json,
                    {
                        name: 'long',
                        description: 'Show id and title with counts',
                    },
                ],
            },
            {
                name: 'validate',
                description: 'Validate a change proposal',
                acceptsPositional: true,
                positionalType: 'change-id',
                flags: [
                    COMMON_FLAGS.strict,
                    COMMON_FLAGS.jsonValidation,
                    COMMON_FLAGS.noInteractive,
                ],
            },
        ],
    },
    {
        name: 'spec',
        description: 'Manage orbit specifications',
        flags: [],
        subcommands: [
            {
                name: 'show',
                description: 'Show a specification',
                acceptsPositional: true,
                positionalType: 'spec-id',
                flags: [
                    COMMON_FLAGS.json,
                    {
                        name: 'requirements',
                        description: 'Show only requirements, exclude scenarios (JSON only)',
                    },
                    {
                        name: 'no-scenarios',
                        description: 'Exclude scenario content (JSON only)',
                    },
                    {
                        name: 'requirement',
                        short: 'r',
                        description: 'Show specific requirement by ID (JSON only)',
                        takesValue: true,
                    },
                    COMMON_FLAGS.noInteractive,
                ],
            },
            {
                name: 'list',
                description: 'List all specifications',
                flags: [
                    COMMON_FLAGS.json,
                    {
                        name: 'long',
                        description: 'Show id and title with counts',
                    },
                ],
            },
            {
                name: 'validate',
                description: 'Validate a specification',
                acceptsPositional: true,
                positionalType: 'spec-id',
                flags: [
                    COMMON_FLAGS.strict,
                    COMMON_FLAGS.jsonValidation,
                    COMMON_FLAGS.noInteractive,
                ],
            },
        ],
    },
    {
        name: 'completion',
        description: 'Manage shell completions for the orbit CLI',
        flags: [],
        subcommands: [
            {
                name: 'generate',
                description: 'Generate completion script for a shell (outputs to stdout)',
                acceptsPositional: true,
                positionalType: 'shell',
                flags: [],
            },
            {
                name: 'install',
                description: 'Install completion script for a shell',
                acceptsPositional: true,
                positionalType: 'shell',
                flags: [
                    {
                        name: 'verbose',
                        description: 'Show detailed installation output',
                    },
                ],
            },
            {
                name: 'uninstall',
                description: 'Uninstall completion script for a shell',
                acceptsPositional: true,
                positionalType: 'shell',
                flags: [
                    {
                        name: 'yes',
                        short: 'y',
                        description: 'Skip confirmation prompts',
                    },
                ],
            },
        ],
    },
    {
        name: 'config',
        description: 'View and modify global orbit configuration',
        flags: [
            {
                name: 'scope',
                description: 'Config scope (only "global" supported currently)',
                takesValue: true,
                values: ['global'],
            },
        ],
        subcommands: [
            {
                name: 'path',
                description: 'Show config file location',
                flags: [],
            },
            {
                name: 'list',
                description: 'Show all current settings',
                flags: [
                    COMMON_FLAGS.json,
                ],
            },
            {
                name: 'get',
                description: 'Get a specific value (raw, scriptable)',
                acceptsPositional: true,
                flags: [],
            },
            {
                name: 'set',
                description: 'Set a value (auto-coerce types)',
                acceptsPositional: true,
                flags: [
                    {
                        name: 'string',
                        description: 'Force value to be stored as string',
                    },
                    {
                        name: 'allow-unknown',
                        description: 'Allow setting unknown keys',
                    },
                ],
            },
            {
                name: 'unset',
                description: 'Remove a key (revert to default)',
                acceptsPositional: true,
                flags: [],
            },
            {
                name: 'reset',
                description: 'Reset configuration to defaults',
                flags: [
                    {
                        name: 'all',
                        description: 'Reset all configuration (required)',
                    },
                    {
                        name: 'yes',
                        short: 'y',
                        description: 'Skip confirmation prompts',
                    },
                ],
            },
            {
                name: 'edit',
                description: 'Open config in $EDITOR',
                flags: [],
            },
            {
                name: 'profile',
                description: 'Configure workflow profile (interactive picker or preset shortcut)',
                acceptsPositional: true,
                flags: [],
            },
        ],
    },
    {
        name: 'schema',
        description: 'Manage workflow schemas',
        flags: [],
        subcommands: [
            {
                name: 'which',
                description: 'Show where a schema resolves from',
                acceptsPositional: true,
                positionalType: 'schema-name',
                flags: [
                    COMMON_FLAGS.json,
                    {
                        name: 'all',
                        description: 'List all schemas with their resolution sources',
                    },
                ],
            },
            {
                name: 'validate',
                description: 'Validate a schema structure and templates',
                acceptsPositional: true,
                positionalType: 'schema-name',
                flags: [
                    COMMON_FLAGS.json,
                    {
                        name: 'verbose',
                        description: 'Show detailed validation steps',
                    },
                ],
            },
            {
                name: 'fork',
                description: 'Copy an existing schema to project for customization',
                acceptsPositional: true,
                positionalType: 'schema-name',
                flags: [
                    COMMON_FLAGS.json,
                    {
                        name: 'force',
                        description: 'Overwrite existing destination',
                    },
                ],
            },
            {
                name: 'init',
                description: 'Create a new project-local schema',
                acceptsPositional: true,
                flags: [
                    COMMON_FLAGS.json,
                    {
                        name: 'description',
                        description: 'Schema description',
                        takesValue: true,
                    },
                    {
                        name: 'artifacts',
                        description: 'Comma-separated artifact IDs',
                        takesValue: true,
                    },
                    {
                        name: 'default',
                        description: 'Set as project default schema',
                    },
                    {
                        name: 'no-default',
                        description: 'Do not prompt to set as default',
                    },
                    {
                        name: 'force',
                        description: 'Overwrite existing schema',
                    },
                ],
            },
        ],
    },
    {
        name: 'emit',
        description: 'Compose and write a run-summary emit from a narrative payload',
        acceptsPositional: true,
        flags: [
            {
                name: 'change',
                description: 'Target workstream (a change, or the staging exploration)',
                takesValue: true,
            },
            {
                name: 'doc',
                description: 'Target architecture doc (architecture-scoped commands)',
                takesValue: true,
            },
            {
                name: 'payload',
                description: 'Payload JSON file',
                takesValue: true,
            },
            {
                name: 'json',
                description: 'Stdout becomes exactly one {path, emit, render?} object',
            },
            {
                name: 'render',
                description: 'Print the engine report render after the write',
            },
        ],
    },
    {
        name: 'fingerprint',
        description: 'Stamp or check base fingerprints for the delta specs of a change',
        acceptsPositional: true,
        positionalType: 'change-id',
        flags: [
            {
                name: 'check',
                description: 'Check mode: recompute live hashes (never writes)',
            },
            {
                name: 'refresh',
                description: 'Stamp mode: overwrite existing fingerprints',
            },
            COMMON_FLAGS.json,
        ],
    },
    {
        name: 'external',
        description: 'External review: the recorded runner of the user, and saving a raw return',
        flags: [],
        subcommands: [
            {
                name: 'runner',
                description: 'Print the resolved external runner record (never executes it)',
                flags: [COMMON_FLAGS.json],
            },
            {
                name: 'save',
                description: 'Save the raw return of an external AI into the trail of a change',
                acceptsPositional: true,
                positionalType: 'change-id',
                flags: [
                    {
                        name: 'as',
                        description: 'Review mode: proposal or system',
                        takesValue: true,
                        values: ['proposal', 'system'],
                    },
                    {
                        name: 'from',
                        description: 'The raw return file',
                        takesValue: true,
                    },
                    {
                        name: 'launch',
                        description: 'The T0 token of the launch',
                        takesValue: true,
                    },
                    COMMON_FLAGS.json,
                ],
            },
        ],
    },
    {
        name: 'pr',
        description: 'PR lifecycle: observe and print the writes for a seam (never performs a write)',
        flags: [],
        subcommands: [
            {
                name: 'select',
                description: 'Propose and ff Phase 1: resolve the branch and print the switch',
                acceptsPositional: true,
                flags: [COMMON_FLAGS.json],
            },
            {
                name: 'publish',
                description: 'Propose and ff Phase 3: the commit scope and the land-and-open segments',
                acceptsPositional: true,
                positionalType: 'change-id',
                flags: [COMMON_FLAGS.json],
            },
            {
                name: 'preflight',
                description: 'Archive preflight: validate the attachment and decide one outcome',
                acceptsPositional: true,
                positionalType: 'change-id',
                flags: [COMMON_FLAGS.json],
            },
            {
                name: 'tail',
                description: 'Archive tail: the commit scope and PR steps, from the outcome and the archive emit',
                acceptsPositional: true,
                flags: [
                    {
                        name: 'outcome',
                        description: 'The preflight outcome, passed verbatim',
                        takesValue: true,
                        values: [
                            'valid',
                            'closed',
                            'merged',
                            'retargeted',
                            'head-mismatch',
                            'repository-mismatch',
                            'not-found',
                            'discovered',
                            'none',
                            'several',
                            'unobserved',
                            'gh-absent',
                        ],
                    },
                    {
                        name: 'include',
                        description: 'An at-archive-note edit to add to the commit scope (repeatable)',
                        takesValue: true,
                    },
                    COMMON_FLAGS.json,
                ],
            },
            {
                name: 'program',
                description: 'Architect arc-done readout: the program PR, its live state, and the human acts',
                acceptsPositional: true,
                flags: [COMMON_FLAGS.json],
            },
        ],
    },
    {
        name: 'architecture',
        description: 'Architecture-tier declarations: computed program position, stage sections, doc validation',
        flags: [],
        subcommands: [
            {
                name: 'status',
                description: 'Computed stage states across all architecture docs',
                flags: [COMMON_FLAGS.json],
            },
            {
                name: 'show',
                description: 'Print one stage section (or the stage index of a doc)',
                acceptsPositional: true,
                flags: [COMMON_FLAGS.json],
            },
            {
                name: 'validate',
                description: 'Validate the parseable structure of a doc',
                acceptsPositional: true,
                flags: [COMMON_FLAGS.json],
            },
        ],
    },
    {
        name: 'status',
        description: 'Orientation: bare = current sprint; --full = arc view; --change <id> = per-change status',
        flags: [
            {
                name: 'change',
                description: 'Change name to show status for',
                takesValue: true,
            },
            {
                name: 'schema',
                description: 'Schema override (auto-detected from config.yaml)',
                takesValue: true,
            },
            {
                name: 'full',
                description: 'Render the arc view',
            },
            {
                name: 'report',
                description: 'Render a review pass as the engine-computed report (rides --change)',
                takesValue: true,
            },
            {
                name: 'boot',
                description: 'Render the cold-start boot sequence (rides --change)',
            },
            {
                name: 'scenarios',
                description: 'Render the scenario map (rides --change)',
            },
            COMMON_FLAGS.json,
        ],
    },
    {
        name: 'instructions',
        description: 'Output enriched instructions for creating an artifact or applying tasks',
        acceptsPositional: true,
        flags: [
            {
                name: 'change',
                description: 'Change name',
                takesValue: true,
            },
            {
                name: 'schema',
                description: 'Schema override (auto-detected from config.yaml)',
                takesValue: true,
            },
            COMMON_FLAGS.json,
        ],
    },
    {
        name: 'templates',
        description: 'Show resolved template paths for all artifacts in a schema',
        flags: [
            {
                name: 'schema',
                description: 'Schema to use',
                takesValue: true,
            },
            COMMON_FLAGS.json,
        ],
    },
    {
        name: 'schemas',
        description: 'List available workflow schemas with descriptions',
        flags: [COMMON_FLAGS.json],
    },
    {
        name: 'new',
        description: 'Create new items',
        flags: [],
        subcommands: [
            {
                name: 'change',
                description: 'Create a new change directory',
                acceptsPositional: true,
                flags: [
                    {
                        name: 'description',
                        description: 'Description to add to README.md',
                        takesValue: true,
                    },
                    {
                        name: 'schema',
                        description: 'Workflow schema to use',
                        takesValue: true,
                    },
                ],
            },
        ],
    },
];
//# sourceMappingURL=command-registry.js.map