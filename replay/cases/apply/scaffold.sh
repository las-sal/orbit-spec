#!/bin/bash
# The state /orbit:propose and the proposal review leave: a proposed change whose review-proposal gate
# has passed — a fresh proposal pass, its walk, and a later in-context (verification) pass with no finding.
set -euo pipefail
bash "$REPLAY_CASES/propose/scaffold.sh"
. "$REPLAY_LIB/seed.sh"
here="$REPLAY_CASES/apply/seed"

# What /orbit:propose leaves: the change's artifacts and the exploration moved into it.
orbit new change "$CHANGE" > /dev/null
cp -r "$here/change/." "orbit/changes/$CHANGE/"
mv "orbit/explore/$CHANGE/.orbit-runs" "orbit/changes/$CHANGE/.orbit-runs"
rm "orbit/explore/$CHANGE/.openspec.yaml"
mv "orbit/explore/$CHANGE/explore.md" "orbit/changes/$CHANGE/explore.md"
rmdir "orbit/explore/$CHANGE"
seed_emit propose "$here/propose.json"

# The proposal review at the default cadence [invoked, in-context].
seed_emit review "$here/review-fresh.json"
cp "$here/design-walked.md" "orbit/changes/$CHANGE/design.md"
seed_walk review-proposal "$here/walk-fresh.json"
seed_emit review "$here/review-verify.json"
