#!/usr/bin/env python3
"""Append GSD ledger entries automatically.

Usage:
    python3 scripts/gsd_ledger.py --pr 58 --issue 56 --contributor @macakii327-prog --amount 3 --kind bounty --notes "Closed #56"
    python3 scripts/gsd_ledger.py --pr 18 --issue 6 --contributor @waterWang --kind implementation --amount 2 --proposer @Kasuki354 --notes "Ported..."
"""

import argparse
import datetime
import re
import sys

LEDGER_PATH = "GSD-LEDGER.md"
REPO_URL = "https://github.com/jflournoy/for-funsies"


def parse_ledger(content: str) -> list[dict]:
    entries = []
    for line in content.splitlines():
        trimmed = line.strip()
        if not trimmed.startswith("|"):
            continue
        cells = [c.strip() for c in trimmed.split("|")[1:-1]]
        if len(cells) < 9:
            continue
        idx_str = cells[0]
        m_idx = re.search(r"\d+", idx_str)
        if not m_idx:
            continue
        try:
            index = int(m_idx.group(0))
        except ValueError:
            continue
        entries.append({
            "index": index,
            "date": cells[1],
            "contributor": cells[2],
            "kind": cells[3],
            "pr": cells[4],
            "issue": cells[5],
            "amount": cells[6],
            "denomination": cells[7],
            "notes": cells[8],
        })
    return entries


def format_pr_cell(pr: str) -> str:
    pr_clean = str(pr).strip()
    if pr_clean == "0" or not pr_clean:
        return "0"
    m = re.search(r"\d+", pr_clean)
    if m:
        num = m.group(0)
        return f"[#{num}]({REPO_URL}/pull/{num})"
    return pr_clean


def format_issue_cell(issue: str) -> str:
    issue_clean = str(issue).strip()
    if issue_clean == "0" or not issue_clean:
        return "0"
    m = re.search(r"\d+", issue_clean)
    if m:
        num = m.group(0)
        return f"[#{num}]({REPO_URL}/issues/{num})"
    return issue_clean


def format_kind(kind: str) -> str:
    kind_clean = kind.strip().strip("`")
    return f"`{kind_clean}`"


def create_row(index: int, date: str, contributor: str, kind: str, pr: str, issue: str, amount: str, denomination: str, notes: str) -> str:
    contrib = contributor if contributor.startswith("@") else f"@{contributor}"
    k = format_kind(kind)
    p = format_pr_cell(pr)
    i = format_issue_cell(issue)
    return f"| {index} | {date} | {contrib} | {k} | {p} | {i} | {amount} | {denomination} | {notes} |"


def main() -> int:
    parser = argparse.ArgumentParser(description="Append rows to GSD-LEDGER.md")
    parser.add_argument("--pr", required=True, help="PR number")
    parser.add_argument("--issue", required=True, help="Issue number")
    parser.add_argument("--contributor", required=True, help="Contributor handle (e.g. @alice)")
    parser.add_argument("--amount", required=True, help="Award amount")
    parser.add_argument("--kind", default="bounty", help="Award kind (bounty, proposal, proposal-shipped, implementation, correction)")
    parser.add_argument("--denomination", default="GSD", help="Denomination (GSD or USD)")
    parser.add_argument("--notes", default="", help="Notes description")
    parser.add_argument("--date", default="", help="Date (YYYY-MM-DD), defaults to today")
    parser.add_argument("--proposer", help="Optional original proposer handle for implementation awards")
    parser.add_argument("--proposer-amount", default="2", help="Amount for proposer award (default 2)")
    parser.add_argument("--proposer-notes", default="", help="Notes for proposer award")

    args = parser.parse_args()

    try:
        with open(LEDGER_PATH, "r", encoding="utf-8") as f:
            content = f.read()
    except FileNotFoundError:
        print(f"Error: {LEDGER_PATH} not found.", file=sys.stderr)
        return 1

    entries = parse_ledger(content)
    max_index = max((e["index"] for e in entries), default=0)

    date = args.date or datetime.date.today().isoformat()

    rows_to_add = []
    
    next_index = max_index + 1
    row1 = create_row(
        next_index,
        date,
        args.contributor,
        args.kind,
        args.pr,
        args.issue,
        args.amount,
        args.denomination,
        args.notes
    )
    rows_to_add.append(row1)

    if args.proposer:
        next_index2 = max_index + 2
        p_notes = args.proposer_notes or f"Proposer of PR #{args.pr}"
        row2 = create_row(
            next_index2,
            date,
            args.proposer,
            "proposal-shipped",
            args.pr,
            args.issue,
            args.proposer_amount,
            args.denomination,
            p_notes
        )
        rows_to_add.append(row2)

    lines = content.splitlines()
    last_table_line_idx = -1
    for idx, line in enumerate(lines):
        if line.strip().startswith("|") and ("|" in line[1:]):
            last_table_line_idx = idx

    if last_table_line_idx != -1:
        lines[last_table_line_idx:last_table_line_idx + 1] = [lines[last_table_line_idx]] + rows_to_add
        new_content = "\n".join(lines) + ("\n" if content.endswith("\n") else "")
    else:
        new_content = content.rstrip() + "\n" + "\n".join(rows_to_add) + "\n"

    with open(LEDGER_PATH, "w", encoding="utf-8") as f:
        f.write(new_content)

    for r in rows_to_add:
        print(f"Appended ledger row: {r}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
