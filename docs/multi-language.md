# Multi-language

orbit can have the AI write a change's artifacts in a language other than English. The mechanism is the `context`
field of `orbit/config.yaml`, inherited unchanged from orbit's 1.3.1 baseline (see [Built on](../README.md)).

## Setting a language

Add a language instruction to the `context` of `orbit/config.yaml`:

```yaml
schema: spec-driven

context: |
  Language: Portuguese (pt-BR)
  All artifacts must be written in Brazilian Portuguese.

  Tech stack: TypeScript, React, Node.js
```

`context` is injected into the instructions for every artifact the AI writes: the proposal, the design, the delta
specs and the tasks. From the next artifact on, they are written in that language.

Carried by: the 1.3.1 baseline

## Examples

### Portuguese (Brazil)

```yaml
context: |
  Language: Portuguese (pt-BR)
  All artifacts must be written in Brazilian Portuguese.
```

### Spanish

```yaml
context: |
  Idioma: Español
  Todos los artefactos deben escribirse en español.
```

### Chinese (Simplified)

```yaml
context: |
  语言：中文（简体）
  所有产出物必须用简体中文撰写。
```

### Japanese

```yaml
context: |
  言語：日本語
  すべての成果物は日本語で作成してください。
```

### French

```yaml
context: |
  Langue : Français
  Tous les artefacts doivent être rédigés en français.
```

### German

```yaml
context: |
  Sprache: Deutsch
  Alle Artefakte müssen auf Deutsch verfasst werden.
```

Carried by: the 1.3.1 baseline

## Tips

### Technical terms

Say how to treat terms that read better untranslated:

```yaml
context: |
  Language: Japanese
  Write in Japanese, but:
  - Keep technical terms like "API", "REST", "GraphQL" in English
  - Code examples and file paths remain in English
```

### The words the format needs

A delta spec's structure is read by the engine, so its keywords stay as they are in any language: the `## ADDED
Requirements`, `## MODIFIED Requirements`, `## REMOVED Requirements` and `## RENAMED Requirements` headings, the
`### Requirement:` and `#### Scenario:` prefixes, and the `SHALL` or `MUST` in each requirement's first line.
Everything after those keywords can be in your language. If you want this spelled out to the AI, add it to the
`context`.

Carried by: the 1.3.1 baseline

## Checking it

Print the instructions the AI receives for an artifact; your language instruction appears in the context:

```bash
orbit instructions proposal --change my-change
```

Carried by: the 1.3.1 baseline

## What stays in English

`context` reaches the artifacts the AI writes. orbit's own output does not change language: the readouts of
`orbit status`, the fixed labels and engine-computed lines of a rendered review report, and the engine's messages are
English.

Carried by: `orbit-orientation`, `orbit-report-rendering`

## Related

- [Customization](customization.md)
- [Workflows](workflows.md)
