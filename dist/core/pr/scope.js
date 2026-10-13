export function enumerateScope(entries, rules) {
    const scope = [];
    const alreadyStaged = new Set();
    const unrelated = [];
    const visit = (p, xy, renameSource) => {
        const deleted = renameSource || xy.includes('D');
        const gone = renameSource || xy[0] === 'D';
        const owned = rules.some((r) => p.startsWith(r.prefix) && (!r.deletionsOnly || deleted));
        if (owned) {
            if (!scope.includes(p))
                scope.push(p);
            if (gone)
                alreadyStaged.add(p);
        }
        else {
            unrelated.push({ path: p, status: xy });
        }
    };
    for (const e of entries) {
        visit(e.path, e.xy, false);
        if (e.from !== undefined)
            visit(e.from, e.xy, true);
    }
    return { scope, alreadyStaged, unrelated };
}
//# sourceMappingURL=scope.js.map