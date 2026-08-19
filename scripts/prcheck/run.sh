#!/usr/bin/env bash
#
# Run this repo's checks against untrusted bounty-bot PRs, contained.
#
#   scripts/prcheck/run.sh                # every open PR
#   scripts/prcheck/run.sh 31 36 42       # specific PRs
#   MODES="merged" scripts/prcheck/run.sh 31
#
# WHY THIS EXISTS
# ---------------
# PRs here come from anonymous agents. Checking them out on the host runs
# their code with your SSH agent reachable and write access to your real
# .git/hooks. .devcontainer/devcontainer.json is the interactive answer to
# that; this is the batch answer, and a stricter one:
#
#   --network none      PR code cannot exfiltrate or phone home. Deps are
#                       baked into the image from MAIN's lockfile.
#   -v clone:ro         PR code cannot write anything the host later reads,
#                       which closes the .git/hooks escape. The container
#                       copies /src to /tmp/work before checking out.
#   --cap-drop ALL, --security-opt no-new-privileges, --user node,
#   --pids-limit, --memory, and no docker.sock / $HOME / host env.
#
# THE THREE MODES
# ---------------
# `npm run check` runs scripts/check_*.py FROM THE TREE UNDER TEST — a PR
# grades its own homework. So each PR is checked three ways:
#
#   own     what CI would report (self-graded; weakest signal)
#   main    main's graders against the PR tree
#   merged  main merged into the PR, then checked — what GitHub would
#           actually produce, and the mode that decides mergeability
#
# Divergence between modes is the interesting signal. PR #25 passed own-mode
# and failed main-mode: it was a stale branch graded by its own stale tooling.
#
# ALWAYS run the baseline. If main is red, every PR result is noise.
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
HERE="$REPO_ROOT/scripts/prcheck"
IMAGE=forfunsies-check:base
WORKDIR="${PRCHECK_DIR:-${TMPDIR:-/tmp}/prcheck-$(id -u)}"
CLONE="$WORKDIR/clone"
RESULTS="$WORKDIR/results"
MODES="${MODES:-own main merged}"

command -v docker >/dev/null || { echo "docker not found"; exit 1; }
docker info >/dev/null 2>&1 || { echo "cannot reach the docker daemon"; exit 1; }

SLUG="$(gh repo view --json nameWithOwner --jq .nameWithOwner 2>/dev/null)"
[ -n "$SLUG" ] || { echo "could not determine repo slug (is gh logged in?)"; exit 1; }

mkdir -p "$RESULTS"

# A fresh unauthenticated clone. Cloning and fetching execute nothing, so
# this part is safe on the host; it is the *running* that needs the sandbox.
if [ ! -d "$CLONE/.git" ]; then
  echo "cloning $SLUG ..."
  git clone --quiet "https://github.com/$SLUG.git" "$CLONE"
fi
git -C "$CLONE" fetch --quiet --prune origin 'refs/heads/*:refs/remotes/origin/*'
git -C "$CLONE" fetch --quiet --force origin '+refs/pull/*/head:refs/remotes/pr/*'

# Deps come from MAIN's lockfile, never a PR's.
cp "$CLONE/package.json" "$CLONE/package-lock.json" "$HERE/" 2>/dev/null
docker build -q -t "$IMAGE" -f "$HERE/Dockerfile" "$HERE" >/dev/null
rm -f "$HERE/package.json" "$HERE/package-lock.json"

run_one() {
  local ref="$1" mode="$2" tag="$3"
  local out="$RESULTS/${tag}.${mode}.log"
  timeout 420 docker run --rm \
    --network none \
    --user node \
    --cap-drop ALL \
    --security-opt no-new-privileges \
    --pids-limit 512 \
    --memory 2g \
    -v "$CLONE":/src:ro \
    -v "$HERE/incontainer.sh":/run.sh:ro \
    "$IMAGE" bash /run.sh "$ref" "$mode" >"$out" 2>&1
  local rc=$? merge crc brc
  merge=$(grep -m1 '^MERGE_STATUS=' "$out" | cut -d= -f2)
  crc=$(grep -m1 '^CHECK_RC=' "$out" | cut -d= -f2)
  brc=$(grep -m1 '^BUILD_RC=' "$out" | cut -d= -f2)
  [ "$rc" -eq 124 ] && { crc=TIMEOUT; brc=TIMEOUT; }
  printf '  %-8s %-7s merge=%-9s check=%-7s build=%s\n' \
    "$tag" "$mode" "${merge:-?}" "${crc:-?}" "${brc:-?}"
}

PRS=("$@")
if [ ${#PRS[@]} -eq 0 ]; then
  mapfile -t PRS < <(gh pr list --state open --limit 100 --json number --jq '.[].number')
fi

echo "== baseline: origin/main =="
run_one origin/main own main
echo "   (if the baseline is not check=0 build=0, stop: PR results are not attributable)"

echo
echo "== ${#PRS[@]} PR(s): ${PRS[*]} =="
for n in "${PRS[@]}"; do
  git -C "$CLONE" rev-parse --verify --quiet "pr/$n" >/dev/null || {
    echo "  pr$n     -- no such PR ref, skipping"; continue; }
  for m in $MODES; do run_one "pr/$n" "$m" "pr$n"; done
done

echo
echo "logs: $RESULTS"
