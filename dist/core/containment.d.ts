/**
 * The ONE physical-containment test: true when `dir`'s real path is `root`'s real path or lies
 * under it. The root itself counts as contained. An unresolvable path returns true — existence
 * is the caller's check. Shared by the emit surface's `assertContained` and `orbit status
 * --report`'s archived fallback (report-archived-change design D1).
 */
export declare function resolvesWithin(dir: string, root: string): boolean;
//# sourceMappingURL=containment.d.ts.map