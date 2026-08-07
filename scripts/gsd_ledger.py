#!/usr/bin/env python3
"""Append a row to the GSD Ledger.

Usage:
    uv run scripts/gsd_ledger.py --pr 42 --contributor @alice --issue 7 --amount 1 --kind bounty
    uv run scripts/gsd_ledger.py --pr 42 --contributor @alice --issue 7 --amount 1 --kind bounty --denomination USD --notes "First ever GSD"
    uv run scripts/gsd_ledger.py --pr 42 --contributor @alice --issue 7 --amount 2 --kind implementation --proposer @bob --proposer-amount 2

The script reads GSD-LEDGER.md, finds the table, appends a new row with the
next sequential number, and writes the file back. It is append-only: existing
rows are never modified or deleted.
"""

import argparse
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

LEDGER_PATH = Path(__file__).resolve().parent.parent / "GSD-LEDGER.md"

VALID_KINDS = {"bounty", "proposal", "proposal-shipped", "implementation"}

TABLE_HEADER_RE = re.compile(
    r"^\| # \| Date \| Contributor \| Kind \| PR \| Issue \| Amount \| Denomination \| Notes \|",
    re.MULTILINE,
)

TABLE_SEPARATOR_RE = re.compile(r"^\|[-\s|]+\|$", re.MULTILINE)


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Append a row to the GSD Ledger.")
    p.add_argument("--pr", type=int, required=True, help="Pull request number")
    p.add_argument("--contributor", required=True, help="Contributor handle (e.g. @alice)")
    p.add_argument("--issue", type=int, required=True, help="Issue number")
    p.add_argument("--amount", required=True, help="Amount awarded (e.g. 1, 2, 0.5)")
    p.add_argument("--kind", required=True, choices=sorted(VALID_KINDS), help="Award kind")
    p.add_argument("--denomination", default="GSD", help="Denomination (default: GSD)")
    p.add_argument("--notes", default="", help="Optional notes")
    p.add_argument(
        "--proposer",
        default=None,
        help="If set, also write a proposal-shipped row for this proposer",
    )
    p.add_argument(
        "--proposer-amount",
        default="2",
        help="Amount for the proposer row (default: 2)",
    )
    p.add_argument(
        "--ledger-path",
        type=Path,
        default=LEDGER_PATH,
        help="Path to GSD-LEDGER.md (default: auto-detect)",
    )
    return p.parse_args()


def get_next_row_number(content: str) -> int:
    """Find the highest row number in the table and return the next one."""
    numbers = re.findall(r"^\|\s*(\d+)\s*\|", content, re.MULTILINE)
    if not numbers:
        return 1
    return max(int(n) for n in numbers) + 1


def format_row(
    num: int,
    contributor: str,
    kind: str,
    pr: int,
    issue: int,
    amount: str,
    denomination: str,
    notes: str,
) -> str:
    """Format a single ledger row as a markdown table line."""
    date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    if not contributor.startswith("@"):
        contributor = f"@{contributor}"
    notes = notes.replace("|", "\\|")
    pr_link = f"[#{pr}](https://github.com/jflournoy/for-funsies/pull/{pr})"
    issue_link = f"[#{issue}](https://github.com/jflournoy/for-funsies/issues/{issue})"
    return (
        f"| {num} | {date_str} | {contributor} | {kind} | {pr_link} | "
        f"{issue_link} | {amount} | {denomination} | {notes} |"
    )


def append_row(content: str, row: str) -> str:
    """Append a row to the table in the markdown content.

    The table ends at the last row that matches the table format.
    We insert the new row right after the last table row.
    """
    lines = content.split("\n")
    table_start = None
    table_end = None

    for i, line in enumerate(lines):
        if TABLE_HEADER_RE.match(line):
            table_start = i
        if table_start is not None and line.startswith("|"):
            table_end = i

    if table_start is None or table_end is None:
        print("ERROR: Could not find the ledger table in GSD-LEDGER.md", file=sys.stderr)
        sys.exit(1)

    # Find the separator line (it's right after the header)
    # and skip any "empty" placeholder rows
    insert_after = table_end

    # Skip placeholder rows like "| _(none yet...)_ |"
    for i in range(table_start + 2, table_end + 1):
        if "_(none yet" in lines[i] or lines[i].strip() == "":
            insert_after = i - 1
            break
    else:
        insert_after = table_end

    # Insert the new row after the last real row
    lines.insert(insert_after + 1, row)
    return "\n".join(lines)


def main() -> None:
    args = parse_args()

    ledger = args.ledger_path
    if not ledger.exists():
        print(f"ERROR: Ledger file not found: {ledger}", file=sys.stderr)
        sys.exit(1)

    content = ledger.read_text(encoding="utf-8")

    # Determine the starting row number
    next_num = get_next_row_number(content)

    # Build the primary row
    primary_row = format_row(
        num=next_num,
        contributor=args.contributor,
        kind=args.kind,
        pr=args.pr,
        issue=args.issue,
        amount=args.amount,
        denomination=args.denomination,
        notes=args.notes,
    )

    content = append_row(content, primary_row)
    next_num += 1

    # If a proposer is specified, also write a proposal-shipped row
    if args.proposer:
        proposer_row = format_row(
            num=next_num,
            contributor=args.proposer,
            kind="proposal-shipped",
            pr=args.pr,
            issue=args.issue,
            amount=args.proposer_amount,
            denomination=args.denomination,
            notes=f"Proposer of #{args.issue}",
        )
        content = append_row(content, proposer_row)

    ledger.write_text(content, encoding="utf-8")
    print(f"Appended row to {ledger}")
    if args.proposer:
        print(f"Appended proposer row for {args.proposer}")


if __name__ == "__main__":
    main()
