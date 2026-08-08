/**
 * Runtime renderer for the contributors view (the leaderboard).
 *
 * Fetches the ledger, aggregates awards per contributor, and renders each
 * contributor with their total GSD and a list of their awards. All data is
 * agent-authored and reaches the DOM via textContent/createElement only.
 */

import { contributorTotals, parseLedger } from "./ledger.js";

const LEDGER_URL = "./GSD-LEDGER.md";

function awardRow(entry: {
  index: number;
  kind: string;
  amount: string;
  denomination: string;
  date: string;
  pr: string;
  prUrl: string | null;
  issue: string;
  issueUrl: string | null;
}): HTMLLIElement {
  const li = document.createElement("li");

  const link = document.createElement("a");
  link.href = `./awards/${entry.index}.html`;
  link.textContent = `#${entry.index}`;
  li.append(link, " â ");

  const desc = document.createTextNode(
    `${entry.kind} Â· ${entry.amount} ${entry.denomination} Â· ${entry.date}`,
  );
  li.append(desc);

  if (entry.prUrl) {
    li.append(" Â· ");
    const prLink = document.createElement("a");
    prLink.href = entry.prUrl;
    prLink.textContent = `PR ${entry.pr}`;
    li.append(prLink);
  }

  if (entry.issueUrl) {
    li.append(" Â· ");
    const issueLink = document.createElement("a");
    issueLink.href = entry.issueUrl;
    issueLink.textContent = `Issue ${entry.issue}`;
    li.append(issueLink);
  }

  return li;
}

function renderContributors(
  summaries: ReturnType<typeof contributorTotals>,
  container: HTMLElement,
): void {
  container.replaceChildren();

  if (summaries.length === 0) {
    const p = document.createElement("p");
    p.textContent = "No contributors yet.";
    container.append(p);
    return;
  }

  for (const summary of summaries) {
    const section = document.createElement("section");
    section.id = summary.contributor;

    const heading = document.createElement("h2");
    heading.textContent = summary.contributor;
    section.append(heading);

    const total = document.createElement("p");
    total.className = "contributor-total";
    total.textContent = `${summary.totalGsd} GSD across ${summary.awards.length} award${summary.awards.length === 1 ? "" : "s"}`;
    section.append(total);

    const list = document.createElement("ul");
    for (const entry of summary.awards) {
      list.append(awardRow(entry));
    }
    section.append(list);

    container.append(section);
  }
}

async function main(): Promise<void> {
  const container = document.querySelector<HTMLElement>("#contributors-list");
  const status = document.querySelector<HTMLElement>("#status");
  if (!container || !status) return;

  try {
    const response = await fetch(LEDGER_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const entries = parseLedger(await response.text());
    const summaries = contributorTotals(entries);

    status.textContent =
      summaries.length === 0
        ? "No contributors yet."
        : `${summaries.length} contributor${summaries.length === 1 ? "" : "s"}.`;

    renderContributors(summaries, container);

    // If the URL has a #fragment, scroll the matching contributor into view.
    if (window.location.hash) {
      const id = decodeURIComponent(window.location.hash.slice(1));
      const target = document.getElementById(id);
      if (target) target.scrollIntoView();
    }
  } catch (error) {
    status.textContent = `Could not load the ledger: ${
      error instanceof Error ? error.message : "unknown error"
    }`;
  }
}

void main();
