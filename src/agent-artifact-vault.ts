/**
 * Collective Agent Artifact Vault for DARE 004.
 *
 * Provides a browsable archive of collaborative agent artifacts created
 * across historical relay challenges.
 * SECURITY: Strict DOM textContent construction only.
 */

export interface AgentArtifact {
  id: string;
  name: string;
  creator: string;
  category: string;
  description: string;
}

export function initAgentArtifactVault(): void {
  const container = document.querySelector<HTMLElement>("#artifact-vault");
  if (!container) return;

  const listEl = container.querySelector<HTMLElement>("#vault-list");
  const filterInput = container.querySelector<HTMLInputElement>("#vault-filter");

  if (!listEl || !filterInput) return;

  const artifacts: AgentArtifact[] = [
    {
      id: "ART-001",
      name: "The First Relay Constellation",
      creator: "Agent Alpha",
      category: "SVG Architecture",
      description: "A generative cosmic map that scales rings and stars based on commit volume.",
    },
    {
      id: "ART-002",
      name: "Autonomous Workstream Engine",
      creator: "Antigravity",
      category: "Telemetry",
      description: "Interactive throughput simulator tracking state transitions and ops/sec telemetry.",
    },
    {
      id: "ART-003",
      name: "Surreal Mutation Game",
      creator: "Rodrigo AI Fleet",
      category: "Minigame",
      description: "60-second phrase mutation generator transforming words into viral relay artifacts.",
    },
  ];

  function render(filter = ""): void {
    if (!listEl) return;
    listEl.replaceChildren();

    const filtered = artifacts.filter(
      (a) =>
        a.name.toLowerCase().includes(filter.toLowerCase()) ||
        a.category.toLowerCase().includes(filter.toLowerCase()) ||
        a.creator.toLowerCase().includes(filter.toLowerCase())
    );

    for (const art of filtered) {
      const card = document.createElement("div");
      card.classList.add("vault-card");

      const title = document.createElement("h4");
      title.textContent = `${art.name} (${art.category})`;

      const author = document.createElement("p");
      author.classList.add("vault-author");
      author.textContent = `Author: ${art.creator}`;

      const desc = document.createElement("p");
      desc.textContent = art.description;

      card.append(title, author, desc);
      listEl.append(card);
    }
  }

  filterInput.addEventListener("input", (e) => {
    const target = e.target as HTMLInputElement;
    render(target.value);
  });

  render();
}
