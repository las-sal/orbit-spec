# External Review: rc03b-pass-genres (iteration 1)

**Reviewer**: GPT-6 Codex
**Date**: 2026-10-04

## CRITICAL

None.

## WARNING

### The REGION grep cannot become green while the prompt retains required output paths
**File**: orbit/changes/rc03b-pass-genres/specs/orbit-review/spec.md:25
**Description**: The REGION rule treats every `.orbit-runs/` mention in `references/prompt-template.md` as a hit because the whole file is a BRIEF REGION. Even after removing the project-context read bullet, the template must retain its introductory prompt-file path, the findings output path, and the `git add` path (the review-external delta requires the latter two at lines 79 and 149). Task 1.1 therefore cannot reach its required zero hits, and task 3.5's literal “no `.orbit-runs/` pointer” check would reject a valid committed prompt. Define a region or predicate for reviewer *input reads*, exempt required output destinations by rule, and test both a legitimate output path and a planted prior-run read pointer.

### The walk listing omits the latest independent pass needed to determine genre
**File**: orbit/changes/rc03b-pass-genres/specs/orbit-conventions/spec.md:26
**Description**: The owner says the in-context body decides from one directory fact: ordered `address-reviews-*.json` names and their `source_path` values. The table at line 13 also requires the latest independent pass of the mode. Consider a proposal walk at token 03:13, followed by a fresh proposal pass at 03:20, then an in-context pass at 03:25: the walk is too old, so the pass is REVIEW. Without the fresh pass, the same walk listing makes the 03:25 pass VERIFICATION. The named input is identical in both cases, so an implementer cannot make the required decision. Include the token and class of the latest independent pass in the permitted metadata probe, or expose the computed qualifying-walk fact through an engine surface; neither requires reading findings.

### The no-prior-run scenario forbids the metadata read its genre decision requires
**File**: orbit/changes/rc03b-pass-genres/specs/orbit-review/spec.md:15
**Description**: This scenario says a REVIEW-genre pass does not read `address-reviews-*.json`, while the same requirement at lines 29–30 requires an in-context pass to read each record's `source_path` before it can know whether it is REVIEW genre. The owner's line 26 calls that a listing rather than findings, but reading `source_path` still reads the record. Narrow the prohibition to findings and resolution content, explicitly permit the bounded metadata probe for an in-context pass, and make the tests assert that distinction.

## SUGGESTION

### Replace “readable walk” with the defined qualifying-walk term
**File**: orbit/changes/rc03b-pass-genres/proposal.md:20
**Description**: The proposal calls the input a “readable walk record,” the review scenario at line 14 says “readable walk,” and the rc03b charter says “READABLE walk.” The owner instead qualifies a walk by source mode and token position, without requiring `TrailResolution.readable`, a separate field that can be false for an empty or malformed `resolutions` array. Use “qualifying walk” in these live descriptions so a reader does not add an unintended readability condition.

### Match the residual audit's stated scope to its instrument
**File**: orbit/changes/rc03b-pass-genres/specs/orbit-conventions/spec.md:28
**Description**: The BOUNDED residual method says to grep the WHOLE generated surface, but task 1.1 checks only the generated `orbit-review` skill and task 3.3 measures only that skill. Other workflow templates also contain `.orbit-runs/` text, so a literal whole-surface grep needs the same semantic input-read boundary. State the narrower scope if it is intentional, or specify an instrument that examines review-genre briefs across the whole generated surface.

## Blocks

None.

## Direction

**Disposition**: hold

The brief check must distinguish required output paths from prior-run reading, and the in-context genre probe needs enough trail metadata to apply the owner's bound. Those repairs make the proposed behavior decidable without passing findings to a reviewer.
