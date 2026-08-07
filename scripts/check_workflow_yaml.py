#!/usr/bin/env python3
"""Fail if any workflow file is not valid YAML.

A malformed workflow does not fail loudly — GitHub simply declines to run it,
which on this repository would mean bounty submissions silently stop being
checked. Better to break the build.

Usage: python scripts/check_workflow_yaml.py
"""

import glob
import sys

import yaml


def main() -> int:
    paths = sorted(
        glob.glob(".github/workflows/*.yml") + glob.glob(".github/workflows/*.yaml")
    )
    if not paths:
        print("No workflows found.")
        return 0
    failed = False
    for path in paths:
        try:
            yaml.safe_load(open(path, encoding="utf-8"))
        except yaml.YAMLError as e:
            print(f"::error file={path}::Invalid YAML: {e}")
            failed = True
    if failed:
        return 1
    print(f"Workflow YAML valid in {len(paths)} file(s): OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
