#!/bin/bash
# What /orbit:apply leaves on the apply seed: every task done and checked, the account, then the apply
# emit. The review scaffold runs it; the free checks also run it on the apply seed to show the apply
# case's graders pass on a good outcome.
set -euo pipefail
. "$REPLAY_LIB/seed.sh"
here="$REPLAY_CASES/review/seed"
cp "$here/greet.js" greet.js
cp "$here/README.md" README.md
sed -i.bak 's/^- \[ \]/- [x]/' "orbit/changes/$CHANGE/tasks.md" && rm "orbit/changes/$CHANGE/tasks.md.bak"
orbit emit account --change "$CHANGE" --payload "$here/account.json" > /dev/null
seed_emit apply "$here/apply.json"
