import { program } from 'commander';
import type { ProgramOptions } from '../cli/program.js';
interface ShowOptions {
    json?: boolean;
    requirements?: boolean;
    scenarios?: boolean;
    requirement?: string;
    noInteractive?: boolean;
}
export declare class SpecCommand {
    private SPECS_DIR;
    show(specId?: string, options?: ShowOptions): Promise<void>;
}
export declare function registerSpecCommand(rootProgram: typeof program, options?: ProgramOptions): import("commander").Command;
export {};
//# sourceMappingURL=spec.d.ts.map