SUB = ('CRITICAL','WARNING')
def stands(trail):
    """D-rc02c-3 (refined by cell F): an independent pass STANDS iff
         (1) it carried zero substantive findings,
         (2) no substantive walk followed it, and
         (3) no EARLIER independent pass carries substantive findings that were not
             walked before it.
       (3) is what makes the fact self-sufficient rather than leaning on clause (b).
       Never indexes a 'latest' pass, so ties and pairs need no special case."""
    walks = [e for e in trail if e['k']=='walk' and e['sub']>0]
    indep = [e for e in trail if e['k']=='pass' and e['cls'] in ('fresh','external')]
    for p in indep:
        if p['sub'] > 0: continue
        if any(w['t'] > p['t'] for w in walks): continue
        unwalked_earlier = any(
            q['sub'] > 0 and not any(p['t'] > w['t'] > q['t'] or w['t'] == q['t'] for w in walks)
            for q in indep if q['t'] < p['t'])
        if unwalked_earlier: continue
        return True, p['t']
    return False, None

P=lambda t,cls,sub: {'k':'pass','t':t,'cls':cls,'sub':sub}
W=lambda t,sub: {'k':'walk','t':t,'sub':sub}

CELLS = [
 ("A  no independent pass at all",              [P('05','in-context',0)],                       False),
 ("B  clean pass, nothing after",               [P('05','fresh',0)],                            True ),
 ("C  clean pass, substantive walk after",      [P('05','fresh',0), W('06',3)],                 False),
 ("D  pass with findings, no walk after",       [P('05','fresh',2)],                            False),
 ("E  pair: early CRIT + late clean, walk after both",
                                                [P('05','external',4), P('06','fresh',0), W('07',4)], False),
 ("F  pair: early CRIT + late clean, NO walk",  [P('05','external',4), P('06','fresh',0)],      False),
 ("L  pair: early CRIT WALKED, then late clean",[P('05','external',4), W('06',4), P('07','fresh',0)], True ),
 ("G  pair, IDENTICAL timestamps, both clean",  [P('05','external',0), P('05','fresh',0)],      True ),
 ("H  suggestion-only walk after clean pass",   [P('05','fresh',0), W('06',0)],                 True ),
 ("I  in-context pass after the last walk",     [P('05','fresh',2), W('06',2), P('07','in-context',0)], False),
 ("J  pass -> walk -> clean pass (the good shape)",
                                                [P('05','external',5), W('06',5), P('07','fresh',0)],  True ),
 ("K  clean pass, then walk, then clean pass",  [P('05','fresh',0), W('06',2), P('07','external',0)],  True ),
]
print(f"  {'cell':52} {'stands':7} expected  result")
bad=0
for name, trail, exp in CELLS:
    got,_ = stands(sorted(trail, key=lambda e:e['t']))
    ok = got==exp
    bad += (not ok)
    print(f"  {name:52} {str(got):7} {str(exp):9} {'ok' if ok else 'MISMATCH'}")
print(f"\n  {len(CELLS)} cells, {bad} mismatches")
