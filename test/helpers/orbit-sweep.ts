/**
 * The `orbit` snippet sweep (rc05 exit (1)): every extracted snippet handed to commander's own
 * parser over the neutralised program, and the guard's failures — each failure naming the
 * surface (workflow and file), the line, the snippet and commander's message.
 */
import { commandTree, parseArgv } from './neutral-program.js';
import { analyseSurfaces, describeSurface, type Surface, type SurfaceAnalysis } from './surface-snippets.js';

export function analyseOrbit(surfaces: Surface[]): SurfaceAnalysis {
  return analyseSurfaces(surfaces, 'orbit', commandTree());
}

export async function sweepFailures(analysis: SurfaceAnalysis): Promise<string[]> {
  const failures: string[] = [];
  for (const f of analysis.failures) {
    failures.push(`${describeSurface(f.surface)}:${f.line}: ${f.snippet}\n    ${f.message}`);
  }
  for (const snippet of analysis.snippets) {
    const result = await parseArgv(snippet.tokens.slice(1));
    if (!result.ok) {
      failures.push(`${describeSurface(snippet.surface)}:${snippet.line}: ${snippet.text}\n    ${result.message || result.code}`);
    }
  }
  return failures;
}

export function guardFailureLines(analysis: SurfaceAnalysis): string[] {
  return analysis.guard.map((g) => `${describeSurface(g.surface)}:${g.line}: ${g.text}`);
}
