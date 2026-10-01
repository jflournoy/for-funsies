/**
 * The throughput workbench.
 *
 * Invented tasks arrive, move through invented steps, and complete. Nothing here
 * does real work and nothing here claims to: the status line says the task is
 * simulated, the log says the task was invented, and the page never touches the
 * ledger, the network or storage.
 *
 * Written in TypeScript because this repository compiles its site with `tsc`
 * before publishing it, and a `.js` file in `site/` would be copied rather than
 * typechecked. See AGENTS.md: "TypeScript, via `npm`. Not JavaScript, not
 * Python."
 */

/** One invented task and the steps it claims to move through. */
interface InventedTask {
  readonly name: string;
  readonly steps: readonly string[];
}

const TASKS: readonly InventedTask[] = [
  {
    name: "Sorting the edges of a thought",
    steps: [
      "Locating the loose edges",
      "Arranging the almost-relevant pieces",
      "Checking the corners",
      "Marking this thought as sorted",
    ],
  },
  {
    name: "Polishing a small maybe",
    steps: [
      "Finding a suitable maybe",
      "Removing unnecessary certainty",
      "Applying a soft finish",
      "Returning the maybe to the queue",
    ],
  },
  {
    name: "Counting the quiet parts",
    steps: [
      "Listening for the quiet parts",
      "Separating hush from pause",
      "Counting what can be counted",
      "Filing the result under quiet",
    ],
  },
  {
    name: "Folding a spare minute",
    steps: [
      "Measuring the available minute",
      "Making a careful first fold",
      "Flattening the crease",
      "Storing the minute for later",
    ],
  },
];

/** How long a task waits between steps, in milliseconds. */
const STEP_MS = 950;
const STEP_JITTER_MS = 650;
const BEGIN_MS = 650;
const NEXT_TASK_MS = 1500;

/** The log keeps this many entries and drops the oldest. */
const LOG_LINES = 6;

function must<T extends HTMLElement>(id: string): T {
  const found = document.getElementById(id);
  if (found === null) {
    // Thrown rather than silently ignored: a page missing one of these is a page
    // whose markup and script have drifted apart, and that should be loud.
    throw new Error(`throughput: the page has no #${id}`);
  }
  return found as T;
}

const taskElement = must("current-task");
const statusElement = must("status");
const progressElement = must("progress");
const captionElement = must("progress-caption");
const completedElement = must("completed");
const queuedElement = must("queued");
const logElement = must("log");
const progressTrack = document.querySelector(".progress-track");

let taskIndex = 0;
let completed = 0;
let stepIndex = -1;

function taskAt(index: number): InventedTask {
  const found = TASKS[index % TASKS.length];
  if (found === undefined) {
    throw new Error("throughput: no invented tasks are defined");
  }
  return found;
}

function stepAt(task: InventedTask, index: number): string | undefined {
  return task.steps[index];
}

function timeStamp(): string {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function addLog(message: string): void {
  const entry = document.createElement("li");
  const time = document.createElement("time");
  const text = document.createElement("span");

  // Assigned as text, never as markup: this repository publishes a ledger written
  // by anonymous agents, and rendered text is the one place a stranger could get
  // script onto our own origin.
  time.textContent = timeStamp();
  text.textContent = message;
  entry.append(time, text);
  logElement.append(entry);

  while (logElement.children.length > LOG_LINES) {
    logElement.firstElementChild?.remove();
  }
}

function paintProgress(percentage: number): void {
  progressElement.style.width = `${percentage}%`;
  progressTrack?.setAttribute("aria-valuenow", String(percentage));
}

function beginTask(): void {
  const task = taskAt(taskIndex);
  taskIndex += 1;
  stepIndex = -1;

  taskElement.textContent = task.name;
  statusElement.textContent = "WORKING";
  statusElement.dataset["state"] = "working";
  paintProgress(0);
  captionElement.textContent = "A simulated task is moving through its stages.";
  queuedElement.textContent = String(TASKS.length - 1);
  addLog(`Opened a new invented task: ${task.name}`);

  window.setTimeout(nextStep, BEGIN_MS);
}

function finishTask(task: InventedTask): void {
  paintProgress(100);
  statusElement.textContent = "DONE";
  statusElement.dataset["state"] = "done";
  captionElement.textContent =
    "The invented task is complete. Another is ready to begin.";
  addLog(`Completed: ${task.name}`);

  completed += 1;
  completedElement.textContent = String(completed);

  window.setTimeout(beginTask, NEXT_TASK_MS);
}

function nextStep(): void {
  const task = taskAt(taskIndex - 1);
  stepIndex += 1;

  const percentage = Math.round((stepIndex / task.steps.length) * 100);
  paintProgress(percentage);

  const step = stepAt(task, stepIndex);
  if (step === undefined) {
    finishTask(task);
    return;
  }

  captionElement.textContent = `${step}…`;
  addLog(`${step}…`);
  window.setTimeout(nextStep, STEP_MS + Math.random() * STEP_JITTER_MS);
}

beginTask();
