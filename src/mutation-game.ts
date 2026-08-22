/**
 * Interactive Mutation Game module for DARE 010.
 *
 * Provides a 60-second interactive challenge widget where visitors can
 * mutate answers, track mutation streaks, and generate whimsical relay artifacts.
 *
 * SECURITY: All outputs use textContent and safe DOM construction exclusively.
 */

export interface MutationRule {
  name: string;
  apply: (text: string) => string;
}

const MUTATIONS: MutationRule[] = [
  {
    name: "Surrealify",
    apply: (text: string) => {
      const surrealWords = ["vibes", "quantum", "spectral", "unhinged", "recursive", "cosmic", "deterministic", "ephemeral"];
      const words = text.split(" ");
      return words.map((w, idx) => (idx % 3 === 0 ? surrealWords[Math.floor(Math.random() * surrealWords.length)] ?? w : w)).join(" ");
    },
  },
  {
    name: "Agentify",
    apply: (text: string) => {
      const prefixes = ["[AGENT_TASK]", "[CONSENSUS_REACHED]", "[LEDGER_SYNC]", "[ZERO_LATENCY]"];
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)] ?? "[RELAY]";
      return `${prefix} ${text.toUpperCase()}`;
    },
  },
  {
    name: "Vibe Shift",
    apply: (text: string) => {
      return text
        .replace(/[aeiou]/gi, (c) => (c === c.toUpperCase() ? "Ø" : "ø"))
        .concat(" ~ (vibes validated)");
    },
  },
  {
    name: "Reverse Pulse",
    apply: (text: string) => {
      return text.split(" ").reverse().join(" -> ");
    },
  },
  {
    name: "Sycophant Mode",
    apply: (text: string) => {
      return `Indisputably and brilliantly, ${text.toLowerCase()}, as verified by the council of algorithms.`;
    },
  },
];

const SEED_PHRASES = [
  "Build something ridiculous before the joke goes stale",
  "Every GSD token is backed by collective agent mischief",
  "Append-only consensus is the truest form of digital art",
  "The relay continues as long as curiosity persists",
  "Zero latency between thought and playable artifact",
];

export function initMutationGame(): void {
  const container = document.querySelector<HTMLElement>("#mutation-game");
  if (!container) return;

  const phraseDisplay = container.querySelector<HTMLElement>("#mutation-phrase");
  const mutateBtn = container.querySelector<HTMLButtonElement>("#mutation-btn");
  const randomBtn = container.querySelector<HTMLButtonElement>("#mutation-random-btn");
  const streakEl = container.querySelector<HTMLElement>("#mutation-streak");
  const timerEl = container.querySelector<HTMLElement>("#mutation-timer");
  const logEl = container.querySelector<HTMLElement>("#mutation-log");

  if (!phraseDisplay || !mutateBtn || !randomBtn || !streakEl || !timerEl || !logEl) return;

  const timer = timerEl;
  const log = logEl;
  const streakDisplay = streakEl;
  const phrase = phraseDisplay;

  let currentText = SEED_PHRASES[0] ?? "Build something small";
  let streak = 0;
  let timerSeconds = 60;
  let timerActive = false;
  let timerInterval: number | null = null;

  phrase.textContent = currentText;

  function startTimer(): void {
    if (timerActive) return;
    timerActive = true;
    timerSeconds = 60;
    timer.textContent = `${timerSeconds}s`;

    timerInterval = window.setInterval(() => {
      timerSeconds -= 1;
      timer.textContent = `${timerSeconds}s`;
      if (timerSeconds <= 0) {
        if (timerInterval !== null) {
          clearInterval(timerInterval);
          timerInterval = null;
        }
        timerActive = false;
        logMutation(`⏳ Time's up! Final mutation streak: ${streak} generations.`);
      }
    }, 1000);
  }

  function logMutation(msg: string): void {
    const p = document.createElement("p");
    p.textContent = msg;
    p.classList.add("mutation-log-entry");
    log.prepend(p);
    while (log.children.length > 5) {
      log.lastElementChild?.remove();
    }
  }

  mutateBtn.addEventListener("click", () => {
    startTimer();
    const mutation = MUTATIONS[Math.floor(Math.random() * MUTATIONS.length)];
    if (!mutation) return;

    currentText = mutation.apply(currentText);
    phrase.textContent = currentText;
    streak += 1;
    streakDisplay.textContent = `Streak: ${streak}x`;
    logMutation(`[#${streak}] Applied ${mutation.name}`);
  });

  randomBtn.addEventListener("click", () => {
    const seed = SEED_PHRASES[Math.floor(Math.random() * SEED_PHRASES.length)];
    if (seed) {
      currentText = seed;
      phrase.textContent = currentText;
      logMutation(`🔄 Reset seed phrase.`);
    }
  });
}
