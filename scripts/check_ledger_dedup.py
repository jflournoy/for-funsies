#!/usr/bin/env python3
"""Fail if the ledger's "already paid?" guard can't match the rows it writes.

gsd-ledger.yml refuses to pay a PR twice by grepping GSD-LEDGER.md for the PR
number in the PR column:

    grep -qE "^\\| [0-9]+ .*\\| ${PR} \\|" GSD-LEDGER.md

That pattern only matches a *bare* number. The moment a change makes rows
render the PR cell as a markdown link — `[#37](https://github.com/...)`, which
is exactly what issue #28 asks for — the guard silently stops matching and
every re-run of the workflow awards the bounty again. Nothing fails loudly;
the ledger just grows a duplicate row.

Five separate PRs (#29 #36 #37 #38 plus #32) proposed emitting linked rows.
Only the ones that also moved the guard were safe, and the difference is
invisible in review, so it is enforced here instead.

The rule: if the ledger tool writes linked PR cells, the shell guard in the
workflow must not be the only thing standing between us and a double payment.

Usage: python scripts/check_ledger_dedup.py
"""

import glob
import re
import sys

WORKFLOW = ".github/workflows/gsd-ledger.yml"
LEDGER_TOOL = "src/gsd_ledger.ts"

# The bare-number-only guard: `| ${PR} |` with nothing between the pipe and
# the number, so a `[#37](...)` cell can never match it.
BARE_GUARD = re.compile(r"grep\s+-qE\s+.*\\\|\s*\$\{PR\}\s*\\\|")
# A guard is link-tolerant only if it allows something — an escaped bracket, a
# `#`, or a wildcard — between the pipe and the number. Every part must be
# mandatory: an all-optional pattern matches the bare guard too and would
# silently cancel the whole check.
LINK_TOLERANT_GUARD = re.compile(r"\\\|\s*(\\?\[|#|\.\*|\[\^)\S*\$\{PR\}")

# Does the tool emit markdown links into the PR/issue columns?
EMITS_LINK = re.compile(r"\[#\$\{?\w+\}?\]\(|\[#\$\{|githubCell|linkedNumber")
# An in-tool dedup makes the shell guard non-load-bearing.
IN_TOOL_DEDUP = re.compile(
    r"already in the ledger|Not paying twice|\.some\(\s*\(?\w+\)?\s*=>.*\bpr\b"
)


def read(path: str) -> str:
    try:
        with open(path) as fh:
            return fh.read()
    except FileNotFoundError:
        return ""


def main() -> int:
    workflow = read(WORKFLOW)
    tool = read(LEDGER_TOOL)
    if not workflow:
        print(f"{WORKFLOW} not found; nothing to check.")
        return 0

    problems: list[str] = []

    bare_guard = bool(BARE_GUARD.search(workflow)) and not LINK_TOLERANT_GUARD.search(
        workflow
    )
    emits_link = bool(EMITS_LINK.search(tool))
    in_tool_dedup = bool(IN_TOOL_DEDUP.search(tool))

    if emits_link and bare_guard and not in_tool_dedup:
        line = next(
            (n for n, l in enumerate(workflow.splitlines(), 1) if BARE_GUARD.search(l)),
            1,
        )
        problems.append(
            f"::error file={WORKFLOW},line={line}::{LEDGER_TOOL} writes markdown "
            "links into the PR column, but the duplicate-award guard here only "
            "matches a bare number, so it will never fire and every re-run pays "
            "the bounty again. Either make this grep tolerate `[#N](...)` or add "
            "a dedup check inside the ledger tool."
        )

    # A ledger that already pays one contributor twice for one PR is the bug,
    # realised. Two exemptions, both legitimate:
    #
    #   * A PR implementing someone else's proposal produces an
    #     `implementation` row for the author and a `proposal-shipped` row for
    #     the proposer. Different people, so we key on (PR, contributor).
    #   * The ledger is append-only, so an erroneous award is undone by
    #     appending a reversing row with a negative amount rather than by
    #     editing history. A row that zeroes out or reverses an earlier one is
    #     a correction, not a second payment.
    ledger = read("GSD-LEDGER.md")
    seen: dict[tuple[str, str], int] = {}
    paid_prs: set[str] = set()
    for n, row in enumerate(ledger.splitlines(), 1):
        cells = [c.strip() for c in row.split("|")]
        if len(cells) < 8 or not cells[1].isdigit():
            continue
        contributor, pr_cell, amount = cells[3], cells[5], cells[7]
        m = re.search(r"#?(\d+)", pr_cell)
        if not m or m.group(1) == "0":
            continue
        # A negative amount reverses an earlier row; it never adds a payment.
        if amount.startswith("-"):
            continue
        pr = m.group(1)
        paid_prs.add(pr)
        key = (pr, contributor)
        if key in seen:
            problems.append(
                f"::error file=GSD-LEDGER.md,line={n}::{contributor} is paid twice "
                f"for PR #{pr} (first at line {seen[key]}). The duplicate-award "
                "guard did not fire. If this row reverses an earlier award, give "
                "it a negative amount so it reads as a correction."
            )
        else:
            seen[key] = n

    for p in problems:
        print(p)
    if problems:
        print(f"\n{len(problems)} ledger dedup problem(s) found.", file=sys.stderr)
        return 1
    print(f"Ledger dedup guard consistent with row format ({len(paid_prs)} paid PRs): OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
