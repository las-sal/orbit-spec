# Helpers a case's scaffold.sh sources: `. "$REPLAY_LIB/seed.sh"`.
#
# Every seeded record is written by orbit's own commands (`orbit emit`, `orbit new change`), so
# the trail and the gate states a session starts from are what the engine computes, never
# hand-written JSON the engine would read differently. Each step is committed, as a user's would be.
set -euo pipefail

CHANGE=greet-name

# A plain message, as a user's own commit would read: the session can read the history, and no
# message tells it the state was seeded.
seed_commit() {
  git add -A
  git commit -q --allow-empty -m "$1 $CHANGE"
}

# seed_emit <command> <payload-file>: `orbit emit <command> --change greet-name`, then a commit.
seed_emit() {
  orbit emit "$1" --change "$CHANGE" --payload "$2" > /dev/null
  seed_commit "$1"
}

# seed_walk <pass-prefix> <resolutions-file>: a walk of the newest `<pass-prefix>-*.json` pass in the
# change's trail, its payload built from the pass and the resolutions (replay/lib/seed-walk.mjs).
seed_walk() {
  local payload
  payload=$(mktemp)
  node "$REPLAY_LIB/seed-walk.mjs" "orbit/changes/$CHANGE" "$1" "$2" "$payload"
  orbit emit address-reviews --change "$CHANGE" --payload "$payload" > /dev/null
  rm -f "$payload"
  seed_commit "address-reviews"
}
