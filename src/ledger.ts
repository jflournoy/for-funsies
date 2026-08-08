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
  prUrl: string | null;
  issue: string;
  issueUrl: string | null;
  amount: string;
  denomination: string;
  notes: string;
}

const COLUMNS = 9;

function isAwardKind(value: string): value is AwardKind {
  return (AWARD_KINDS as readonly string[]).includes(value);
}

/** Strip the markdown link syntax the ledger uses for PR and issue cells. */
function plain(cell: string): string {
  const link = /^\[([^\]]*)\]\([^)]*\)$/.exec(cell.trim());
  return (link?.[1] ?? cell).trim();
}

/** Extract both text and URL from a markdown link cell. */
function extractLink(cell: string): { text: string; url: string | null } {
  const trimmed = cell.trim();
  const match = /^\[([^\]]*)\]\(([^)]*)\)$/.exec(trimmed);
  if (match) {
    return { text: match[1], url: match[2] };
  }
  return { text: trimmed, url: null };
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

    const cells = trimmed.slice(1, -1).split("|").map((c) => c.trim());
    if (cells.length !== COLUMNS) continue;

    const index = Number.parseInt(plain(cells[0] ?? ""), 10);
    if (!Number.isFinite(index)) continue; // header, separator, or placeholder

    const kind = plain(cells[3] ?? "").replace(/`/g, "");
    if (!isAwardKind(kind)) continue;

    const prLink = extractLink(cells[4] ?? "");
    const issueLink = extractLink(cells[5] ?? "");

    entries.push({
      index,
      date: plain(cells[1] ?? ""),
      contributor: plain(cells[2] ?? ""),
      kind,
      pr: prLink.text,
      prUrl: prLink.url,
      issue: issueLink.text,
      issueUrl: issueLink.url,
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

/** Create a table cell with an optional link. */
function linkCell(text: string, url: string | null): HTMLTableCellElement {
  const td = document.createElement("td");
  if (url) {
    const a = document.createElement("a");
    a.href = url;
    a.textContent = text;
    td.appendChild(a);
  } else {
    td.textContent = text;
  }
  return td;
}

/** Create a table cell with a link to the award detail page. */
function indexCell(index: number): HTMLTableCellElement {
  const td = document.createElement("td");
  const a = document.createElement("a");
  a.href = `./award/${index}.html`;
  a.textContent = String(index);
  td.appendChild(a);
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

    row.appendChild(indexCell(entry.index));
    row.appendChild(cell(entry.date));
    row.appendChild(cell(entry.contributor));
    row.appendChild(cell(entry.kind));
    row.appendChild(linkCell(entry.pr, entry.prUrl));
    row.appendChild(linkCell(entry.issue, entry.issueUrl));
    row.appendChild(cell(entry.amount));
    row.appendChild(cell(entry.denomination));
    row.appendChild(cell(entry.notes));

    tbody.appendChild(row);
  }
}
