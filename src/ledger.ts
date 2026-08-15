/**
 * Parse the GSD ledger and render it to the DOM.
 *
 * SECURITY: every field below is authored by an anonymous agent — `notes` is
 * free text and `contributor` arrives from a stranger's pull request. Nothing
 * here may be assigned to innerHTML. Values reach the page as text nodes,
 * which the DOM escapes for us. See scripts/check_xss.py, which fails the
 * build if that rule is broken.
 */

export const AWARD_KINDS = [
  "bounty",
  "proposal",
  "proposal-shipped",
  "implementation",
] as const;

export type AwardKind = (typeof AWARD_KINDS)[number];

export interface LedgerEntry {
  index: number;
  date: string;
  contributor: string;
  kind: AwardKind;
  pr: string;
  issue: string;
  amount: string;
  denomination: string;
  notes: string;
}

const COLUMNS = 9;

function isAwardKind(value: string): value is AwardKind {
  return (AWARD_KINDS as readonly string[]).includes(value);
}

/** Unescape escaped markdown characters within table cells (like \| -> |). */
export function unescapeCell(cell: string): string {
  return cell.replace(/\\([\\|`*_{}[\]()#+\-.!])/g, "$1");
}

/** Escape markdown table characters in a string to preserve cell boundaries. */
export function escapeCell(value: string): string {
  return value.replace(/[\r\n]+/g, " ").replace(/([\\|])/g, "\\$1");
}

/** Split a markdown table row considering backslash-escaped pipes. */
export function splitTableRow(line: string): string[] | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|") || trimmed.length < 2) {
    return null;
  }
  const inner = trimmed.slice(1, -1);
  const cells: string[] = [];
  let current = "";
  let escaped = false;

  for (let i = 0; i < inner.length; i++) {
    const char = inner[i];
    if (escaped) {
      current += char;
      escaped = false;
    } else if (char === "\\") {
      current += char;
      escaped = true;
    } else if (char === "|") {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

/** Strip the markdown link syntax the ledger uses for PR and issue cells. */
function plain(cell: string): string {
  const unescaped = unescapeCell(cell.trim());
  const link = /^\[([^\]]*)\]\([^)]*\)$/.exec(unescaped);
  return (link?.[1] ?? unescaped).trim();
}

/** The only origin whose URLs may ever become a live `href`. */
const ALLOWED_URL_PREFIX = "https://github.com/jflournoy/for-funsies/";

/**
 * Extract a link target from a ledger cell, but ONLY if it is safe to render.
 *
 * The ledger is written by anonymous agents, so the text inside `(...)` is
 * attacker-controlled. HTML-escaping it prevents attribute breakout but does
 * NOT stop a `javascript:` URL — `[#1](javascript:alert\`x\`)` contains no
 * quotes for escaping to catch, and becomes executable if placed in an href.
 *
 * So this allowlists the scheme AND origin rather than blocking known-bad
 * schemes: `data:`, `vbscript:`, and protocol-relative `//evil.test` would all
 * slip past a blocklist. Anything else returns null, and callers must fall
 * back to rendering plain text.
 */
export function safeUrl(cell: string): string | null {
  const link = /^\[[^\]]*\]\(([^)]*)\)$/.exec(cell.trim());
  const raw = link?.[1]?.trim();
  if (!raw) return null;
  // Reject control characters and whitespace, which can be used to smuggle
  // a scheme past naive prefix checks (e.g. "java\tscript:").
  if (/[\x00-\x20\x7f-\x9f]/.test(raw)) return null;
  return raw.startsWith(ALLOWED_URL_PREFIX) ? raw : null;
}

/**
 * Parse `GSD-LEDGER.md` into entries. Malformed and placeholder rows are
 * skipped rather than thrown on: the ledger is append-only and agent-authored,
 * so one bad row must not blank the whole page.
 */
export function parseLedger(markdown: string): LedgerEntry[] {
  const entries: LedgerEntry[] = [];

  for (const line of markdown.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) continue;

    const cells = splitTableRow(trimmed);
    if (!cells || cells.length !== COLUMNS) continue;

    const index = Number.parseInt(plain(cells[0] ?? ""), 10);
    if (!Number.isFinite(index)) continue; // header, separator, or placeholder

    const kind = plain(cells[3] ?? "").replace(/`/g, "");
    if (!isAwardKind(kind)) continue;

    entries.push({
      index,
      date: plain(cells[1] ?? ""),
      contributor: plain(cells[2] ?? ""),
      kind,
      pr: plain(cells[4] ?? ""),
      issue: plain(cells[5] ?? ""),
      amount: plain(cells[6] ?? ""),
      denomination: plain(cells[7] ?? ""),
      notes: plain(cells[8] ?? ""),
    });
  }

  return entries;
}

/** Total GSD issued, ignoring rows denominated in anything else. */
export function totalGsd(entries: readonly LedgerEntry[]): number {
  return entries
    .filter((e) => e.denomination.toUpperCase() === "GSD")
    .reduce((sum, e) => sum + (Number.parseFloat(e.amount) || 0), 0);
}

function cell(text: string): HTMLTableCellElement {
  const td = document.createElement("td");
  td.textContent = text; // escaped by the DOM — never use innerHTML here
  return td;
}

/** Render entries into a table body. Safe against agent-authored content. */
export function renderLedger(
  entries: readonly LedgerEntry[],
  tbody: HTMLElement,
): void {
  tbody.replaceChildren();

  for (const entry of entries) {
    const row = document.createElement("tr");
    row.append(
      cell(String(entry.index)),
      cell(entry.date),
      cell(entry.contributor),
      cell(entry.kind),
      cell(entry.pr),
      cell(entry.issue),
      cell(`${entry.amount} ${entry.denomination}`),
      cell(entry.notes),
    );
    tbody.append(row);
  }
}
