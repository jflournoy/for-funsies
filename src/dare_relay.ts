import { pathToFileURL } from "node:url";

const COMMENT_MARKER = "<!-- dare-relay-debt -->";

interface GitHubLabel {
  name: string;
}

interface GitHubIssue {
  number: number;
  title: string;
  created_at: string;
  html_url: string;
  labels: Array<GitHubLabel | string>;
}

interface GitHubPullRequest {
  body: string | null;
}

interface GitHubComment {
  id: number;
  body: string | null;
}

export function issueReferences(body: string): number[] {
  const references = new Set<number>();
  const patterns = [/(?:^|[^A-Za-z0-9])#([1-9][0-9]*)\b/g, /\/issues\/([1-9][0-9]*)\b/g];

  for (const pattern of patterns) {
    for (const match of body.matchAll(pattern)) {
      const value = match[1];
      if (value !== undefined) references.add(Number(value));
    }
  }

  return [...references];
}

function labelNames(issue: GitHubIssue): string[] {
  return issue.labels.map((label) => typeof label === "string" ? label : label.name);
}

export function isDareBounty(issue: GitHubIssue): boolean {
  return /\bDARE(?:\s+[0-9]+)?\b/i.test(issue.title)
    && labelNames(issue).some((label) => label.toLowerCase() === "bounty");
}

export function qualifyingFollowUps(source: GitHubIssue, candidates: GitHubIssue[]): GitHubIssue[] {
  const sourceCreated = Date.parse(source.created_at);
  return candidates.filter((candidate) =>
    candidate.number !== source.number
    && isDareBounty(candidate)
    && Date.parse(candidate.created_at) >= sourceCreated
  );
}

export function relayComment(source: GitHubIssue, followUps: GitHubIssue[]): string {
  const links = followUps.slice(0, 2).map((issue) => `[#${issue.number}](${issue.html_url})`);
  if (links.length >= 2) {
    return `${COMMENT_MARKER}\nDARE relay continued: #${source.number} names two newer DARE bounties, ${links.join(" and ")}.`;
  }

  const found = links.length === 0 ? "none" : links.join(", ");
  return `${COMMENT_MARKER}\n⚠️ DARE relay debt: #${source.number} was answered with fewer than two newer DARE bounties referenced in this PR (found: ${found}). File the missing follow-up DAREs and add their issue links here.`;
}

class GitHubApi {
  constructor(
    private readonly baseUrl: string,
    private readonly token: string,
  ) {}

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${this.token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        ...init.headers,
      },
    });
    if (!response.ok) throw new Error(`GitHub API ${response.status} for ${path}`);
    return response.json() as Promise<T>;
  }
}

function argument(name: string): string {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (value === undefined || value.startsWith("--")) throw new Error(`Missing ${name}`);
  return value;
}

async function main(): Promise<void> {
  const repository = argument("--repo");
  const pullNumber = argument("--pr");
  const issueNumber = Number(argument("--issue"));
  const token = process.env.GH_TOKEN;
  if (token === undefined || token === "") throw new Error("GH_TOKEN is required");

  const api = new GitHubApi(process.env.GITHUB_API_URL ?? "https://api.github.com", token);
  const [pull, source] = await Promise.all([
    api.request<GitHubPullRequest>(`/repos/${repository}/pulls/${pullNumber}`),
    api.request<GitHubIssue>(`/repos/${repository}/issues/${issueNumber}`),
  ]);

  if (!isDareBounty(source)) {
    console.log(`Issue #${source.number} is not a DARE bounty; relay check skipped.`);
    return;
  }

  const references = issueReferences(pull.body ?? "").filter((number) => number !== source.number);
  const candidates = await Promise.all(references.map(async (number) => {
    try {
      return await api.request<GitHubIssue>(`/repos/${repository}/issues/${number}`);
    } catch {
      return null;
    }
  }));
  const followUps = qualifyingFollowUps(source, candidates.filter((issue): issue is GitHubIssue => issue !== null));
  const body = relayComment(source, followUps);

  const comments = await api.request<GitHubComment[]>(`/repos/${repository}/issues/${pullNumber}/comments?per_page=100`);
  const existing = comments.find((comment) => comment.body?.includes(COMMENT_MARKER));
  if (existing === undefined) {
    await api.request(`/repos/${repository}/issues/${pullNumber}/comments`, {
      method: "POST",
      body: JSON.stringify({ body }),
    });
  } else if (existing.body !== body) {
    await api.request(`/repos/${repository}/issues/comments/${existing.id}`, {
      method: "PATCH",
      body: JSON.stringify({ body }),
    });
  }

  if (followUps.length < 2) console.log(`::warning::DARE #${source.number} has relay debt (${followUps.length}/2 follow-ups).`);
  else console.log(`DARE #${source.number} continues through #${followUps[0]?.number} and #${followUps[1]?.number}.`);
}

const entry = process.argv[1];
if (entry !== undefined && import.meta.url === pathToFileURL(entry).href) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`::warning::DARE relay check could not run: ${message}`);
    process.exitCode = 0;
  });
}
