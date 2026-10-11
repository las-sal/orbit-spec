# External Review: rc03c-verification-record (iteration 1)

**Reviewer**: GPT-6
**Date**: 2026-10-04

## CRITICAL

### A same-second walk is invisible to its follow-up verification
**File**: src/core/artifact-graph/pass-genre.ts:61
**Description**: The genre calculation requires the walk token to be strictly earlier than the review token, while emit collision handling only checks the new command's own filename prefix. An `address-reviews` emit and a subsequent `review` emit can therefore receive the same one-second token. The follow-up computes `REVIEW`, stores no `verified_walks`, and refuses a verification record even though the walk completed first. Make trail tokens monotonic across command prefixes, or give cross-kind equal-token records an order that preserves the actual write sequence and use it in the genre computation.
**Reproduction**: From the repo root, run `npm run build`, then:

```bash
node --input-type=module -e 'import {computePassGenre} from "./dist/core/artifact-graph/pass-genre.js"; const t1="2026-10-04T12-00-00Z", t2="2026-10-04T12-01-00Z"; const trail={changeDir:"",runsDir:"",passes:[{token:t1,file:"/tmp/review-system-"+t1+".json",mode:"system",reviewerClass:"fresh"}],resolutions:[{token:t2,sourcePath:"review-system-"+t1+".json",readable:true,entries:[]}],applyTokens:[],rejectedExternals:[]}; console.log(JSON.stringify({sameSecond:computePassGenre(trail,"in-context","system",t2),nextSecond:computePassGenre(trail,"in-context","system","2026-10-04T12-01-01Z")}));'
```

The walk record is present before the follow-up call in both cases. Expected: both calls compute `VERIFICATION` and name `t2` in `verifiedWalks`. Observed: `sameSecond` is `{"passGenre":"REVIEW","verifiedWalks":[]}`; `nextSecond` is `{"passGenre":"VERIFICATION","verifiedWalks":["2026-10-04T12-01-00Z"]}`. The write path checks collisions only against `${filePrefix}-${token}.json` at `src/core/emit-composition.ts:1378`, so distinct command prefixes can actually produce this input.

## WARNING

### The residual check has no base when verification follows only in-context passes
**File**: orbit/changes/rc03c-verification-record/specs/orbit-review/spec.md:5
**Description**: The pass-genre table and its test admit an in-context pass, a walk of that pass, and then a VERIFICATION pass with no independent pass at all. The required residual check nevertheless defines `<C>` as the commit that added the latest accepted independent pass's file; its `HEAD` fallback applies only when that file is uncommitted. In this valid trail there is no such file, so the review body cannot execute the prescribed check and may omit it or choose a different range. Define a base for the no-independent case, such as the commit that first added the walked in-context pass's file (or `HEAD` when uncommitted), and carry that rule into the generated review body.

## SUGGESTION

### A verification row can lose its engine-derived walk token
**File**: src/core/report-render.ts:911
**Description**: The specified row grammar always includes `· walk <token>`, but the renderer silently omits that suffix when the current trail no longer resolves the recorded verdict key. For example, deleting or editing a walked resolution after an emit leaves a well-shaped stored verdict that renders without its provenance. Show an explicit unavailable-walk mark or fail the render when a carried verdict cannot be mapped to a walk, so the report does not present an apparently complete row.

## Blocks

None.

## Direction

**Disposition**: hold

The same-second token collision can turn the intended follow-up verification into a review with no verification record. Resolve that path and define the residual-check base for a valid no-independent trail before moving this change forward.

## Notes

I checked the change's delta against its baseline requirements, the review emit and report call paths, the generated review body, and the available trail cases. The repository has no `orbit/project.md`, root `*_convention.md`, or `orbit/lenses/` files. `orbit validate rc03c-verification-record --strict`, `orbit fingerprint rc03c-verification-record --check`, `orbit validate --sources`, the build, and all 2,552 tests passed.
