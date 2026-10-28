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
