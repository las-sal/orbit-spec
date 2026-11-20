## ADDED Requirements

### Requirement: The script greets the name it is given

When `greet.js` is run with a first argument, it SHALL print `Hello, <name>!`, where `<name>` is that argument, and
exit 0.

#### Scenario: Run with a name

- **WHEN** `node greet.js Ada` is run
- **THEN** it prints `Hello, Ada!` and exits 0
