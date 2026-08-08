/**
 * Parse the GSD ledger and render it to the DOM.
 *
 * SECURITY: every field below is authored by an anonymous agent â `notes` is
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

export interface ContributorSummary {
  contributor: string;
  totalGsd: number;
  awards: LedgerEntry[];
}

const COLUMNS = 9;

function isAwardKind(value: string): value is AwardKind {
  return (AWARD_KINDS as readonly string[]).includes(value);
}

interface CellData {
  text: string;
  url: string | null;
}

/**
 * Parse a ledger cell, preserving the markdown link URL when present.
 * PR and issue cells use `[text](url)`; other cells are plain text.
 */
function parseCell(cell: string): CellData {
  const trimmed = cell.trim();
  const link = /^\[([^\]]*)\]\(([^)]*)\)$/.exec(trimmed);
  if (link) {
    return { text: (link[1] ?? "").trim(), url: (link[2] ?? "").trim() };
  }
  return { text: trimmed, url: null };
}

/** Plain-text extraction for cells whose URL is not needed. */
function plain(cell: string): string {
  return parseCell(cell).text;
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

    const prCell = parseCell(cells[4] ?? "");
    const issueCell = parseCell(cells[5] ?? "");

    entries.push({
      index,
      date: plain(cells[1] ?? ""),
      contributor: plain(cells[2] ?? ""),
      kind,
      pr: prCell.text,
      prUrl: prCell.url,
      issue: issueCell.text,
      issueUrl: issueCell.url,
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

/**
 * Aggregate awards per contributor, sorted by total GSD descending.
 * Only GSD-denominated amounts count toward the total.
 */
export function contributorTotals(
  entries: readonly LedgerEntry[],
): ContributorSummary[] {
  const map = new Map<string, ContributorSummary>();

  for (const entry of entries) {
    let summary = map.get(entry.contributor);
    if (!summary) {
      summary = {
        contributor: entry.contributor,
        totalGsd: 0,
        awards: [],
      };
      map.set(entry.contributor, summary);
    }
    summary.awards.push(entry);
    if (entry.denomination.toUpperCase() === "GSD") {
      summary.totalGsd += Number.parseFloat(entry.amount) || 0;
    }
  }

  return [...map.values()].sort((a, b) => b.totalGsd - a.totalGsd);
}

function cell(text: string): HTMLTableCellElement {
  const td = document.createElement("td");
  td.textContent = text; // escaped by the DOM â never use innerHTML here
  return td;
}

/**
 * A table cell that optionally contains a link. The link text and href are
 * both set via DOM properties, so untrusted data is escaped automatically.
 */
function linkCell(
  text: string,
  href: string | null,
): HTMLTableCellElement {
  const td = document.createElement("td");
  if (href) {
    const a = document.createElement("a");
    a.href = href;
    a.textContent = text; // escaped by the DOM
    td.append(a);
  } else {
    td.textContent = text;
  }
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

    // The index column links to the pre-generated award detail page.
    const indexCell = linkCell(String(entry.index), `./awards/${entry.index}.html`);
    indexCell.style.cursor = "pointer";

    row.append(
      indexCell,
      cell(entry.date),
      linkCell(entry.contributor, `./contributors.html#${encodeURIComponent(entry.contributor)}`),
      cell(entry.kind),
      linkCell(entry.pr, entry.prUrl),
      linkCell(entry.issue, entry.issueUrl),
      cell(`${entry.amount} ${entry.denomination}`),
      cell(entry.notes),
    );
    tbody.append(row);
  }
}
