#!/usr/bin/env python3
"""Fail if site code injects untrusted strings as HTML.

The published site renders the GSD ledger. Every field in that ledger is
authored by an anonymous agent: `--notes` is free text, contributor handles
arrive from merged pull requests. Rendering any of it as HTML is stored XSS on
a github.io origin — it runs in the context of the published site, for every
visitor, persistently.

Use `textContent`, or build elements with `document.createElement`. Never
assign untrusted data to `innerHTML`.

Usage: python scripts/check_xss.py
"""

import glob
import re
import sys

SCAN_DIRS = ("src", "site", "docs", "scripts")
EXTENSIONS = (".ts", ".tsx", ".js", ".jsx", ".mjs")

BANNED = [
    (re.compile(r"\.innerHTML\s*[+]?="), "innerHTML assignment"),
    (re.compile(r"\.outerHTML\s*[+]?="), "outerHTML assignment"),
    (re.compile(r"document\s*\.\s*write\b"), "document.write"),
    (re.compile(r"dangerouslySetInnerHTML"), "dangerouslySetInnerHTML"),
    (re.compile(r"\binsertAdjacentHTML\b"), "insertAdjacentHTML"),
    (re.compile(r"\beval\s*\("), "eval"),
    (re.compile(r"new\s+Function\s*\("), "new Function"),
]

# An href/src whose value is interpolated from a variable. Escaping the value
# stops attribute breakout but NOT `javascript:` — the payload needs no quotes.
# Every such URL must come from safeUrl() in src/ledger.ts, which allowlists
# the origin. Three independent submissions shipped this same hole, so it is
# checked mechanically rather than left to review.
UNSAFE_URL = re.compile(r"""(?:href|src)\s*=\s*["']?\$\{""")
SAFE_URL_HELPERS = ("safeUrl", "safeHref", "xss-ok")

ALLOW = re.compile(r"//\s*xss-ok\b")


def scan(path: str) -> list[str]:
    problems = []
    for n, line in enumerate(open(path, encoding="utf-8", errors="replace"), 1):
        if ALLOW.search(line):
            continue
        stripped = line.strip()
        if stripped.startswith(("//", "*", "/*")):
            continue
        for pattern, label in BANNED:
            if pattern.search(line):
                problems.append(
                    f"::error file={path},line={n}::{label} renders untrusted "
                    f"ledger data as HTML. Use textContent or createElement. "
                    f"If this string is provably constant, append // xss-ok."
                )
        if UNSAFE_URL.search(line) and not any(h in line for h in SAFE_URL_HELPERS):
            problems.append(
                f"::error file={path},line={n}::A URL is interpolated into an "
                f"href/src without scheme validation. Escaping does not stop "
                f"`javascript:` URLs. Pass the value through safeUrl() from "
                f"src/ledger.ts, which allowlists the repository origin."
            )
    return problems


def main() -> int:
    paths = [
        p
        for d in SCAN_DIRS
        for p in glob.glob(f"{d}/**/*", recursive=True)
        if p.endswith(EXTENSIONS) and "node_modules" not in p and "/dist/" not in p
    ]
    problems = [p for path in paths for p in scan(path)]
    for p in problems:
        print(p)
    if problems:
        print(f"\n{len(problems)} potential XSS site(s) found.", file=sys.stderr)
        return 1
    print(f"No unsafe HTML injection in {len(paths)} file(s): OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
