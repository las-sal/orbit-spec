/**
 * `orbit external runner` / `orbit external save` (rc17d-external-runner, `orbit-external-runner`).
 *
 * `runner` prints the RESOLVED per-user record — the engine never executes it. `save` writes an
 * external AI's raw return into a change's trail, cutting any preamble above its heading. Neither
 * reads git state or runs a process; the launch itself is the review body's.
 */
import * as path from 'node:path';
import { resolveExternalRunner, saveExternalReturn, ExternalSaveError, } from '../core/external-runner.js';
export class ExternalCommand {
    runner(options = {}) {
        const { runner, warnings } = resolveExternalRunner();
        for (const w of warnings)
            console.error(w);
        if (options.json) {
            console.log(JSON.stringify({ runner }));
            return 0;
        }
        if (runner === null) {
            console.log('No external runner recorded — the external review prints its prompt for paste.');
            return 0;
        }
        console.log(`External runner: ${runner.name} (${runner.form})`);
        console.log(`  argv: ${JSON.stringify(runner.argv)}`);
        console.log(`  reachable: ${runner.reachable ? 'yes' : `no — ${runner.argv[0]} not found on PATH`}`);
        return 0;
    }
    save(change, options = {}) {
        try {
            if (options.as === undefined)
                throw new ExternalSaveError('--as <proposal|system> is required; nothing written.');
            if (options.from === undefined)
                throw new ExternalSaveError('--from <path> is required; nothing written.');
            const result = saveExternalReturn({
                projectRoot: '.',
                change,
                mode: options.as,
                from: path.resolve(options.from),
                launch: options.launch,
            });
            if (options.json) {
                console.log(JSON.stringify(result));
                return 0;
            }
            console.log(`Saved ${result.path}`);
            if (result.removed.length === 0) {
                console.log('No lines removed — the return opened with its heading.');
            }
            else {
                console.log(`Removed ${result.removed.length} line(s) above the heading:`);
                for (const l of result.removed)
                    console.log(`  > ${l}`);
            }
            return 0;
        }
        catch (e) {
            if (e instanceof ExternalSaveError) {
                console.error(`Error: ${e.message}`);
                return 1;
            }
            throw e;
        }
    }
}
//# sourceMappingURL=external.js.map