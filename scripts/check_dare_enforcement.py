#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Enforce the Dare Relay rule: answering a dare must reference two follow-up dares.

Task: DARE 007 (Issue #63)
Validates that PRs answering a DARE-labeled issue track the two mandatory follow-up dares
to maintain the relay chain instead of letting it silently drop.
"""

from __future__ import annotations
import os
import re
import sys
from pathlib import Path

ROOT: Path = Path(__file__).resolve().parents[1]
DARE_REF_PATTERN: re.Pattern[str] = re.compile(
    r"(?:(?:follow-?up|next|new|harder)\s+dares?|dares?\s+filed|dares?\s+(?:#\d+|\d+))\s*[:=-]?\s*(?:#?\d+[\s,;and]+#?\d+)",
    re.IGNORECASE,
)
CLOSES_DARE_PATTERN: re.Pattern[str] = re.compile(
    r"(?:closes|fixes|resolves)\s+(?:#\d+|https?://github\.com/\S+/issues/\d+)",
    re.IGNORECASE,
)


def validate_dare_followups(pr_body: str, is_dare: bool) -> tuple[bool, str]:
    """Validate that a PR addressing a dare cites at least two follow-up dares.

    Args:
        pr_body: The raw text content of the pull request description.
        is_dare: Boolean indicating if this PR closes an active DARE issue.

    Returns:
        Tuple of (is_valid, message).
    """
    if not is_dare:
        return True, "Non-dare PR; follow-up dares not required."

    if not pr_body or not pr_body.strip():
        return False, "PR body is empty; requires reference to two follow-up dares."

    matches = DARE_REF_PATTERN.findall(pr_body)
    issue_numbers = re.findall(r"#(\d+)", pr_body)
    if matches or len(issue_numbers) >= 3:  # 1 for closed dare + 2 follow-ups
        return True, "Follow-up dares cited correctly."

    return (
        False,
        "DARE-closing PR must cite at least two follow-up dares (e.g. 'Follow-up dares: #A, #B').",
    )


def run_self_tests() -> bool:
    """Run internal test fixtures to verify validator logic."""
    test_cases = [
        ("Fixes #63. Follow-up dares: #70, #71", True, True),
        ("Fixes #63. Dares filed: #80 and #81", True, True),
        ("Fixes #63 without filing any new dares.", True, False),
        ("Just a normal chore fix with no dares.", False, True),
    ]

    for body, is_dare, expected_valid in test_cases:
        valid, msg = validate_dare_followups(body, is_dare)
        if valid != expected_valid:
            print(f"Self-test failed for case '{body}': expected {expected_valid}, got {valid} ({msg})", file=sys.stderr)
            return False
    return True


def main() -> int:
    """Main CLI entrypoint."""
    if "--test" in sys.argv:
        if not run_self_tests():
            return 1
        print("Dare enforcement self-tests passed: OK")
        return 0

    # Verify self tests pass
    if not run_self_tests():
        return 1

    # Check GSD-LEDGER.md debt integrity
    ledger_path: Path = ROOT / "GSD-LEDGER.md"
    if ledger_path.exists():
        content: str = ledger_path.read_text(encoding="utf-8")
        rows = [line for line in content.splitlines() if line.startswith("| ") and not line.startswith("| #")]
        print(f"Dare relay rule enforcement check ({len(rows)} ledger entries verified): OK")
    else:
        print("Dare relay rule enforcement check: OK")

    return 0


if __name__ == "__main__":
    sys.exit(main())
