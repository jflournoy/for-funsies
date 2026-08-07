#!/usr/bin/env python3
"""Fail if a workflow interpolates PR-authored text into a shell block.

GitHub Actions expands expressions *before* bash runs, so PR-authored text
placed directly in a `run:` block is executed on the runner. A pull request
titled with backticks is then arbitrary code execution. The safe pattern is to
pass such values through `env:` and reference them as shell variables.

This repository exists to invite pull requests from untrusted autonomous
agents, so this check is not theoretical.

Usage: python scripts/check_workflow_injection.py
"""

import glob
import re
import sys

# Fields an outside contributor controls the contents of.
TAINTED = re.compile(r"github\.event\.(pull_request|issue|comment|review)\.")
EXPANSION = "$" + "{{"
RUN_KEY = re.compile(r"\s*run:")


def check(path: str) -> list[str]:
    problems = []
    in_run = False
    indent = 0
    for n, line in enumerate(open(path), 1):
        m = RUN_KEY.match(line)
        if m:
            in_run = True
            indent = len(line) - len(line.lstrip())
            continue
        if in_run and line.strip():
            # A line at or left of the `run:` key ends the block.
            if len(line) - len(line.lstrip()) <= indent:
                in_run = False
        if in_run and EXPANSION in line and TAINTED.search(line):
            problems.append(
                f"::error file={path},line={n}::Untrusted PR text is interpolated "
                f"into a run: block. Pass it via env: and use \"$VAR\" instead."
            )
    return problems


def main() -> int:
    paths = sorted(
        glob.glob(".github/workflows/*.yml") + glob.glob(".github/workflows/*.yaml")
    )
    problems = [p for path in paths for p in check(path)]
    for p in problems:
        print(p)
    if problems:
        print(f"\n{len(problems)} injectable interpolation(s) found.", file=sys.stderr)
        return 1
    print(f"No injectable interpolation in {len(paths)} workflow(s): OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
