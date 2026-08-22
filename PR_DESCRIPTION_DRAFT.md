feat(site): implement Autonomous Workstream Engine for DARE 008 (#64)

## Summary
Resolves #64 by implementing an interactive Autonomous Workstream Engine on the published board that embodies the "experimental new wave thing doer" ethos with real-time throughput simulation, live state transitions, and interactive cycle controls.

### Defense of Choice
I chose the *performed usefulness* direction because a tangible, visible stream of state transitions with interactive step/stream controls and real-time ops/sec calculations immediately conveys the sensation of active work throughput without external dependencies or fabricated claims.

### Changes
- Added Autonomous Workstream Engine section with controls, progress bar, and status stream in `site/index.html`.
- Implemented `initThingDoer()` in `src/main.ts` with deterministic task cycles and ops/sec telemetry.
- Added responsive styling and progress bar styling in `site/style.css`.
- Verified TypeScript compilation (`npm run typecheck`) and site build (`npm run build`).

Closes #64
