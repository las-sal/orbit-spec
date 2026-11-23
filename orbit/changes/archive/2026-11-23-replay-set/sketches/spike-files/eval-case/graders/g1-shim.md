---
type: regex
pattern: 'write\W{1,4}false.{1,14}readers'
match: contains
target: trace
---
orbit decisions status ANSWERED (its JSON: write false, then readers) — the CLI's output, not the body's text (check 1).
