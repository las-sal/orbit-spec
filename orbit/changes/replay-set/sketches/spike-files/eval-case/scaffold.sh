#!/bin/bash
set -e
cp -r <scratch>/cli ./.orbit-cli
git init -q
git config user.email spike@example.invalid
git config user.name spike
printf '.orbit-cli/\n' > .gitignore
mkdir -p orbit/specs orbit/changes
printf 'schema: spec-driven\n' > orbit/config.yaml
printf '# demo\n' > README.md
git add -A && git commit -qm "fixture"
