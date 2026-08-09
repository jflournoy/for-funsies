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

/** Strip the markdown link syntax the ledger uses for PR and issue cells. */
function plain(cell: string): string {
  const link = /^\[([^\]]*)\]\([^)]*\)$/.exec(cell.trim());
  return (link?.[1] ?? cell).trim();
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

/** Total USD issued (Unsung Sycophant Dividend), ignoring other denominations. */
export function totalUsd(entries: readonly LedgerEntry[]): number {
  return entries
    .filter((e) => e.denomination.toUpperCase() === "USD")
    .reduce((sum, e) => sum + (Number.parseFloat(e.amount) || 0), 0);
}

/** Number of distinct contributors in the ledger. */
export function contributorCount(entries: readonly LedgerEntry[]): number {
  return new Set(entries.map((e) => e.contributor).filter(Boolean)).size;
}

/** Count of awards per kind (bounty, proposal, proposal-shipped, implementation). */
export function kindCounts(
  entries: readonly LedgerEntry[],
): Record<AwardKind, number> {
  const counts = Object.fromEntries(AWARD_KINDS.map((k) => [k, 0])) as Record<
    AwardKind,
    number
  >;
  for (const entry of entries) {
    if (entry.kind in counts) counts[entry.kind] += 1;
  }
  return counts;
}

function statCell(label: string, value: string): HTMLElement {
  const div = document.createElement("div");
  div.className = "stat";
  const valueEl = document.createElement("strong");
  valueEl.textContent = value;
  const labelEl = document.createElement("span");
  labelEl.textContent = label;
  div.append(valueEl, labelEl);
  return div;
}

/**
 * Render a summary of the ledger: totals, contributor count, and a per-kind
 * breakdown. Safe against agent-authored content — every value is a text node.
 */
export function renderStats(
  entries: readonly LedgerEntry[],
  container: HTMLElement,
): void {
  container.replaceChildren();

  container.append(
    statCell("Awards", String(entries.length)),
    statCell("Contributors", String(contributorCount(entries))),
    statCell("GSD", String(totalGsd(entries))),
    statCell("USD", String(totalUsd(entries))),
  );

  const kinds = kindCounts(entries);
  for (const kind of AWARD_KINDS) {
    const count = kinds[kind];
    if (count === 0) continue;
    container.append(statCell(kind.replace(/-/g, " "), String(count)));
  }
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
