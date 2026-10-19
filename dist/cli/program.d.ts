import { Command } from 'commander';
export interface ProgramOptions {
    /**
     * `false` skips registering every `preAction` hook (the root's, `change`'s, and
     * the three the `spec`, `config` and `schema` register modules add), because
     * commander has no public API to remove a hook once added. Production passes
     * nothing; a grammar check passes `false` and neutralises the rest.
     */
    hooks?: boolean;
}
/**
 * Build the `orbit` commander program: the CLI's grammar, stated once
 * (`orbit-cli-grammar`). `src/cli/index.ts` builds it and parses; a test builds
 * the same program in-process without running any command.
 */
export declare function buildProgram(options?: ProgramOptions): Command;
//# sourceMappingURL=program.d.ts.map