#!/usr/bin/env bash
# Runs INSIDE the container. Never trust the mounted tree: /src is read-only
# and we copy out of it before touching anything.
#
#   $1  ref to check      e.g. pr/37, origin/main
#   $2  mode
#         own     PR head, PR's own scripts/   (reproduces what CI reports)
#         main    PR head, main's scripts/     (grader can't be tampered with)
#         merged  origin/main merged INTO the PR, then checked — the tree
#                 GitHub would actually produce. This is the mode that
#                 decides mergeability; a textually clean merge can still
#                 fail to typecheck (see PR #25, 2026-08-13).
set -uo pipefail
REF="${1:?ref required}"; MODE="${2:?mode required}"

# /tmp is writable by the unprivileged user; / is not.
WORK=/tmp/work
rm -rf "$WORK"; mkdir -p "$WORK"
cp -a /src/. "$WORK"/ 2>/dev/null
cd "$WORK" || { echo "FATAL: no $WORK"; exit 90; }

git config --global --add safe.directory "$WORK" >/dev/null 2>&1
git config user.email prcheck@local >/dev/null 2>&1
git config user.name prcheck >/dev/null 2>&1

echo "=== ref: $REF   mode: $MODE ==="
git checkout --quiet --detach "$REF" 2>&1 || { echo "FATAL: checkout failed"; exit 91; }
echo "head: $(git rev-parse --short HEAD)"

# Merge-vs-main is a signal distinct from check-failure, so report it separately.
MERGE=clean
if [ "$REF" != "origin/main" ]; then
  if git merge --quiet --no-commit --no-ff origin/main >/dev/null 2>&1; then
    MERGE=clean
    if [ "$MODE" = "merged" ]; then
      git commit --quiet --no-verify -m "merge for test" >/dev/null 2>&1
      echo "(merged origin/main into PR tree)"
    else
      git merge --abort >/dev/null 2>&1
      git reset --hard --quiet HEAD >/dev/null 2>&1
    fi
  else
    MERGE=CONFLICT
    echo "MERGE_CONFLICT_FILES:"
    git diff --name-only --diff-filter=U | sed 's/^/  /'
    git merge --abort >/dev/null 2>&1
    git reset --hard --quiet HEAD >/dev/null 2>&1
  fi
fi
echo "MERGE_STATUS=$MERGE"

# `npm run check` executes scripts/check_*.py FROM THE TREE UNDER TEST, so a
# PR grades its own homework. In main-mode we restore the graders first.
if [ "$MODE" = "main" ]; then
  git checkout --quiet origin/main -- scripts/ package.json 2>&1
  echo "(graders restored from origin/main)"
fi

ln -s /deps/node_modules "$WORK"/node_modules 2>/dev/null

echo "--- npm run check ---"
npm run --silent check 2>&1
RC=$?
echo "CHECK_RC=$RC"

echo "--- npm run build ---"
npm run --silent build 2>&1
echo "BUILD_RC=$?"

exit $RC
