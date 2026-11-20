## Context

`greet.js` prints a fixed greeting. The exploration settled that the name is the first command-line argument (D-gn-1)
and that no option or flag is added (D-gn-2).

## Goals / Non-Goals

**Goals:** greet the name given as the first argument.

**Non-Goals:** options or flags.

## Decisions

### 1. The name is `process.argv[2]`

When it is present, the script prints `Hello, <name>!`; otherwise `Hello, world!`.

## Risks / Trade-offs

- [A name with spaces arrives as several arguments] → Only the first is used; a quoted name works.
