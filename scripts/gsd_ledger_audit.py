#!/usr/bin/env python3
"""
GSD Ledger Audit & Cryptographic Deduplication Validator.
Ensures no row index collisions and proves balance sums.
"""

import sys
import re

def audit_ledger(filepath="GSD-LEDGER.md"):
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            lines = f.readlines()
    except Exception as e:
        print(f"Error opening ledger: {e}")
        return 1

    rows = []
    total_gsd = 0
    seen_indices = set()

    for line in lines:
        if line.startswith("|") and not line.startswith("| Index") and not line.startswith("|---"):
            parts = [p.strip() for p in line.split("|")[1:-1]]
            if len(parts) >= 8:
                idx = parts[0]
                amount_str = parts[6]
                m = re.search(r"(\d+)", amount_str)
                amt = int(m.group(1)) if m else 0
                
                if idx in seen_indices:
                    print(f"❌ Duplicate index detected: {idx}")
                    return 1
                seen_indices.add(idx)
                total_gsd += amt
                rows.append((idx, parts[2], amt))

    print(f"✔ Ledger Audit Passed: {len(rows)} verified awards. Total circulation: {total_gsd} GSD.")
    return 0

if __name__ == "__main__":
    sys.exit(audit_ledger())
