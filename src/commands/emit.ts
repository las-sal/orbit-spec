import * as fs from 'node:fs';
import { composeAndWriteEmit, EmitError, type EmitTarget } from '../core/emit-composition.js';

/**
 * `orbit emit <command>` — the generic emit surface's CLI channel (D-arc Stage D5).
 *
 * Targets per the target-resolution contract: `--change <name>` (workstream — change or
 * staging exploration; archived fallback for address-reviews), `--doc <doc-name>`
 * (architecture trail), or bare for project-scoped `audit-drift` and `address-reviews`
 * (anchor-less whole-repo walks). Payload arrives as JSON on stdin or via `--payload <file>`; when
 * `--payload` is present stdin is not consulted.
 *
 * Stdout contract: the written path; with `--json`, EXACTLY ONE structured object
 * `{path, emit, render?}` (no plain-text framing); `--render` (proposal/system review
 * emits) appends the engine report render — architecture mode: no-op + stderr note.
 * Error paths keep stdout empty (non-zero exit, message on stderr).
 */
export class EmitCommand {
  async execute(
    emitCommand: string,
    options: {
      change?: string;
      doc?: string;
      payload?: string;
      json?: boolean;
      render?: boolean;
    } = {}
  ): Promise<number> {
    let payloadRaw: string;
    if (options.payload !== undefined) {
      // When --payload is present stdin is not consulted (no both-channels ambiguity).
      try {
        payloadRaw = fs.readFileSync(options.payload, 'utf-8');
      } catch {
        throw new EmitError(`--payload file not readable: ${options.payload}`);
      }
    } else {
      payloadRaw = this.readStdin();
      if (payloadRaw.trim() === '') {
        throw new EmitError(
          'no payload supplied — provide JSON on stdin or via --payload <file>.'
        );
      }
    }

    let payload: unknown;
    try {
      payload = JSON.parse(payloadRaw);
    } catch (e) {
      throw new EmitError(`payload is not valid JSON: ${(e as Error).message}`);
    }

    const target: EmitTarget = {};
    if (options.change !== undefined) target.change = options.change;
    if (options.doc !== undefined) target.doc = options.doc;

    const result = composeAndWriteEmit(emitCommand, target, payload as Record<string, unknown>, {
      projectRoot: '.',
    });
    for (const w of result.warnings) console.error(w);

    let render: string | undefined;
    if (options.render && emitCommand === 'review') {
      const mode = (result.emit as any).mode;
      if (mode === 'proposal' || mode === 'system') {
        render = await this.renderReport(String(options.change));
      } else {
        console.error(
          'note: --render is a no-op for architecture-mode review emits (the report render is a change-scoped surface).'
        );
      }
    }

    if (options.json) {
      const out: Record<string, unknown> = { path: result.path, emit: result.emit };
      if (render !== undefined) out.render = render;
      console.log(JSON.stringify(out, null, 2));
      return 0;
    }

    console.log(result.path);
    if (render !== undefined) console.log(render);
    return 0;
  }

  private readStdin(): string {
    try {
      if (process.stdin.isTTY) return '';
      return fs.readFileSync(0, 'utf-8');
    } catch {
      return '';
    }
  }

  private async renderReport(changeName: string): Promise<string> {
    const { renderReport } = await import('../core/report-render.js');
    return renderReport('.', changeName);
  }
}
