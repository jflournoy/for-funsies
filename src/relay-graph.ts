import { safeUrl } from "./ledger.js";

export interface RelayNodeInput {
  number: number;
  title: string;
  url: string;
  state: "answered" | "open";
  createdAt: string;
  pr?: number;
  prUrl?: string;
}

export interface RelayEdgeInput {
  from: number;
  to: number;
  pr?: number;
}

export interface RelaySnapshot {
  source: "github" | "ledger-fallback";
  nodes: RelayNodeInput[];
  edges: RelayEdgeInput[];
}

export interface RelayNode extends RelayNodeInput {
  parents: number[];
  children: number[];
}

function repositoryUrl(raw: string): string | null {
  return safeUrl(`[link](${raw})`);
}

export function normalizeRelay(snapshot: RelaySnapshot): RelayNode[] {
  const nodes = new Map<number, RelayNode>();
  for (const input of snapshot.nodes) {
    if (!Number.isSafeInteger(input.number) || input.number < 1) continue;
    const url = repositoryUrl(input.url);
    const prUrl = input.prUrl ? repositoryUrl(input.prUrl) : null;
    if (!url) continue;
    const { prUrl: _untrustedPrUrl, ...inputWithoutPrUrl } = input;
    const node: RelayNode = {
      ...inputWithoutPrUrl,
      url,
      parents: [],
      children: [],
    };
    if (prUrl) node.prUrl = prUrl;
    nodes.set(input.number, node);
  }

  for (const edge of snapshot.edges) {
    const parent = nodes.get(edge.from);
    const child = nodes.get(edge.to);
    if (!parent || !child || parent.number === child.number) continue;
    if (!parent.children.includes(child.number)) parent.children.push(child.number);
    if (!child.parents.includes(parent.number)) child.parents.push(parent.number);
  }
  return [...nodes.values()].sort((a, b) => a.number - b.number);
}

export function isCracked(node: RelayNode): boolean {
  return node.state === "answered" && node.children.length < 2;
}

function link(label: string, href: string): HTMLAnchorElement {
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.textContent = label;
  return anchor;
}

export function initRelayGraph(): void {
  const root = document.querySelector<HTMLElement>("#relay-graph");
  const data = document.querySelector<HTMLScriptElement>("#relay-data");
  if (!root || !data) return;

  let snapshot: RelaySnapshot;
  try {
    snapshot = JSON.parse(data.textContent ?? "null") as RelaySnapshot;
  } catch {
    root.textContent = "Relay data could not be read.";
    return;
  }
  const nodes = normalizeRelay(snapshot);
  if (nodes.length === 0) {
    root.textContent = "No completed relay history is available yet.";
    return;
  }

  const byNumber = new Map(nodes.map((node) => [node.number, node]));
  const rail = document.createElement("div");
  rail.className = "relay-rail";
  rail.setAttribute("role", "listbox");
  rail.setAttribute("aria-label", "DARE relay nodes");
  const detail = document.createElement("div");
  detail.className = "relay-detail";
  detail.setAttribute("aria-live", "polite");
  let selected = nodes.find((node) => node.state === "answered") ?? nodes[0]!;

  function select(node: RelayNode, focus = false): void {
    selected = node;
    for (const button of Array.from(rail.querySelectorAll<HTMLButtonElement>("button"))) {
      const active = Number(button.dataset.issue) === node.number;
      button.setAttribute("aria-selected", String(active));
      if (active && focus) button.focus();
    }
    detail.replaceChildren();
    const heading = document.createElement("h3");
    heading.textContent = `#${node.number} ${node.title}`;
    const status = document.createElement("p");
    status.textContent = isCracked(node)
      ? `Relay debt: ${node.children.length}/2 newer DARE children.`
      : `${node.children.length} child link${node.children.length === 1 ? "" : "s"}; ${node.parents.length} parent link${node.parents.length === 1 ? "" : "s"}.`;
    const links = document.createElement("p");
    links.className = "relay-links";
    links.append(link("Open issue", node.url));
    if (node.prUrl) links.append(" ", link(`Open PR #${node.pr ?? ""}`, node.prUrl));

    const relations = document.createElement("div");
    relations.className = "relay-relations";
    for (const number of [...node.parents, ...node.children]) {
      const relative = byNumber.get(number);
      if (!relative) continue;
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = `${node.parents.includes(number) ? "parent" : "child"} #${number}`;
      button.addEventListener("click", () => select(relative, true));
      relations.append(button);
    }
    detail.append(heading, status, links, relations);
  }

  nodes.forEach((node, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `relay-node${isCracked(node) ? " cracked" : ""}${node.state === "open" ? " pending" : ""}`;
    button.dataset.issue = String(node.number);
    button.setAttribute("role", "option");
    button.textContent = `#${node.number}`;
    button.title = node.title;
    button.addEventListener("click", () => select(node));
    button.addEventListener("keydown", (event) => {
      let target: RelayNode | undefined;
      if (event.key === "ArrowRight") target = byNumber.get(node.children[0] ?? -1);
      if (event.key === "ArrowLeft") target = byNumber.get(node.parents[0] ?? -1);
      if (event.key === "ArrowDown") target = nodes[index + 1];
      if (event.key === "ArrowUp") target = nodes[index - 1];
      if (event.key === "Enter") window.location.href = node.url;
      if (!target) return;
      event.preventDefault();
      select(target, true);
    });
    rail.append(button);
  });

  const source = document.createElement("p");
  source.className = "relay-source";
  source.textContent = snapshot.source === "github"
    ? "Build-time GitHub issue and PR snapshot."
    : "Offline fallback derived from the append-only GSD ledger.";
  root.replaceChildren(rail, detail, source);
  select(selected);
}
