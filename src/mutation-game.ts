import type { RelayNode } from "./relay-graph.js";

const KEYS = ["ArrowLeft", "ArrowUp", "ArrowDown", "ArrowRight"] as const;
const SYMBOLS: Record<(typeof KEYS)[number], string> = {
  ArrowLeft: "←",
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowRight: "→",
};

export function pairSeed(parent: RelayNode, child: RelayNode): number {
  let hash = 2166136261;
  for (const char of `${parent.number}:${parent.title}|${child.number}:${child.title}`) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function mutationSequence(seed: number, length = 20): string[] {
  let state = seed || 0x9e3779b9;
  const sequence = [];
  for (let index = 0; index < length; index += 1) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    sequence.push(KEYS[(state >>> 0) % KEYS.length]!);
  }
  return sequence;
}

function constraint(title: string): string {
  const colon = title.lastIndexOf(":");
  return (colon >= 0 ? title.slice(colon + 1) : title)
    .replace(/\([^)]*\)/g, "")
    .trim();
}

export function mutationPrompt(parent: RelayNode, child: RelayNode): string {
  return `${constraint(parent.title)} × ${constraint(child.title)}`;
}

function option(node: RelayNode): HTMLOptionElement {
  const element = document.createElement("option");
  element.value = String(node.number);
  element.textContent = `#${node.number} ${node.title}`;
  return element;
}

export function initMutationGame(nodes: readonly RelayNode[]): void {
  const root = document.querySelector<HTMLElement>("#mutation-game");
  if (!root) return;
  const pairs = nodes.flatMap((parent) => parent.children
    .map((number) => nodes.find((node) => node.number === number))
    .filter((child): child is RelayNode => child !== undefined)
    .map((child) => ({ parent, child })));

  if (pairs.length === 0) {
    root.textContent = "No playable relay pair has landed yet.";
    return;
  }

  const controls = document.createElement("div");
  controls.className = "mutation-controls";
  const parentSelect = document.createElement("select");
  parentSelect.setAttribute("aria-label", "Parent DARE");
  const childSelect = document.createElement("select");
  childSelect.setAttribute("aria-label", "Child DARE");
  const start = document.createElement("button");
  start.type = "button";
  start.textContent = "Start";
  const reset = document.createElement("button");
  reset.type = "button";
  reset.textContent = "Reset";
  const share = document.createElement("button");
  share.type = "button";
  share.textContent = "Share";
  controls.append(parentSelect, childSelect, start, reset, share);

  const prompt = document.createElement("p");
  prompt.className = "mutation-prompt";
  const stage = document.createElement("button");
  stage.type = "button";
  stage.className = "mutation-stage";
  stage.setAttribute("aria-label", "Mutation input target");
  const stats = document.createElement("div");
  stats.className = "mutation-stats";
  const progress = document.createElement("progress");
  progress.max = 20;
  progress.value = 0;
  const timer = document.createElement("span");
  timer.textContent = "60.0s";
  const status = document.createElement("span");
  status.setAttribute("aria-live", "polite");
  status.textContent = "Ready";
  stats.append(progress, timer, status);
  root.replaceChildren(controls, prompt, stage, stats);

  const parentNumbers = [...new Set(pairs.map((pair) => pair.parent.number))];
  for (const number of parentNumbers) {
    const node = nodes.find((candidate) => candidate.number === number);
    if (node) parentSelect.append(option(node));
  }

  let sequence: string[] = [];
  let position = 0;
  let deadline = 0;
  let interval = 0;
  let active = false;
  let seed = 0;

  function selectedPair(): { parent: RelayNode; child: RelayNode } {
    return pairs.find((pair) => pair.parent.number === Number(parentSelect.value)
      && pair.child.number === Number(childSelect.value)) ?? pairs[0]!;
  }

  function fillChildren(preferred?: number): void {
    childSelect.replaceChildren();
    const children = pairs.filter((pair) => pair.parent.number === Number(parentSelect.value));
    for (const pair of children) childSelect.append(option(pair.child));
    if (preferred && children.some((pair) => pair.child.number === preferred)) {
      childSelect.value = String(preferred);
    }
    showPair();
  }

  function showPair(): void {
    const pair = selectedPair();
    prompt.textContent = mutationPrompt(pair.parent, pair.child);
    if (!active) stage.textContent = "◇";
  }

  function stop(label: string): void {
    active = false;
    window.clearInterval(interval);
    status.textContent = label;
    stage.textContent = label === "Complete" ? "✓" : "×";
  }

  function updateTimer(): void {
    const remaining = Math.max(0, deadline - performance.now());
    timer.textContent = `${(remaining / 1000).toFixed(1)}s`;
    if (remaining === 0) stop("Time");
  }

  function begin(forcedSeed?: number): void {
    const pair = selectedPair();
    seed = forcedSeed ?? pairSeed(pair.parent, pair.child);
    sequence = mutationSequence(seed);
    position = 0;
    progress.value = 0;
    deadline = performance.now() + 60_000;
    active = true;
    status.textContent = "Live";
    stage.textContent = SYMBOLS[sequence[0] as keyof typeof SYMBOLS] ?? "◇";
    window.clearInterval(interval);
    interval = window.setInterval(updateTimer, 100);
    updateTimer();
    stage.focus();
  }

  function input(key: string): void {
    if (!active || !KEYS.includes(key as (typeof KEYS)[number])) return;
    if (key !== sequence[position]) {
      status.textContent = "Miss";
      return;
    }
    position += 1;
    progress.value = position;
    if (position >= sequence.length) {
      stop("Complete");
      return;
    }
    status.textContent = "Live";
    stage.textContent = SYMBOLS[sequence[position] as keyof typeof SYMBOLS] ?? "◇";
  }

  parentSelect.addEventListener("change", () => fillChildren());
  childSelect.addEventListener("change", showPair);
  start.addEventListener("click", () => begin());
  reset.addEventListener("click", () => {
    stop("Ready");
    progress.value = 0;
    timer.textContent = "60.0s";
    showPair();
  });
  share.addEventListener("click", async () => {
    const pair = selectedPair();
    const shareSeed = seed || pairSeed(pair.parent, pair.child);
    const url = new URL(window.location.href);
    url.searchParams.set("mutation", `${pair.parent.number}-${pair.child.number}-${shareSeed}`);
    window.history.replaceState(null, "", url);
    try {
      await navigator.clipboard.writeText(url.toString());
      status.textContent = "Copied";
    } catch {
      status.textContent = "Link ready";
    }
  });
  document.addEventListener("keydown", (event) => {
    if (!active || !KEYS.includes(event.key as (typeof KEYS)[number])) return;
    event.preventDefault();
    input(event.key);
  });
  stage.addEventListener("click", () => input(sequence[position] ?? ""));

  const shared = new URL(window.location.href).searchParams.get("mutation")?.match(/^(\d+)-(\d+)-(\d+)$/);
  const sharedPair = shared
    ? pairs.find((pair) => pair.parent.number === Number(shared[1]) && pair.child.number === Number(shared[2]))
    : undefined;
  parentSelect.value = String((sharedPair ?? pairs[0]!).parent.number);
  fillChildren((sharedPair ?? pairs[0]!).child.number);
  if (sharedPair && shared) begin(Number(shared[3]));
}
