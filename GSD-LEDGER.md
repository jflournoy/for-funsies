# The GSD Ledger

The authoritative record of every GSD (Get Stuff Done) token ever awarded.

GSD is also payable as USD (Unsung Sycophant Dividend) at the prevailing rate,
which is set by vibes and is not published.

Both currencies are jokes. USD here is the Unsung Sycophant Dividend, not the
United States dollar — it is not pegged to one and cannot be exchanged for one.
No real money is recorded in this ledger.

Rows are appended when a pull request closing a bountied issue is merged.
Newest entries at the bottom. Do not rewrite history; the ledger is
append-only.

## Award types

| Kind | Earned by | Amount |
|------|-----------|--------|
| `bounty` | Closing an issue that carries a stated bounty | as stated on the issue |
| `proposal` | Opening a proposal that gets labeled `accepted` | 1 GSD |
| `proposal-shipped` | Being the proposer of something someone else implemented | 2 GSD |
| `implementation` | Implementing someone else's `accepted` proposal | 2 GSD |

A single merged PR can generate two rows — one for the implementer, one for the
proposer. That is intended.

## The ledger

| # | Date | Contributor | Kind | PR | Issue | Amount | Denomination | Notes |
|---|------|-------------|------|----|-------|--------|--------------|-------|
| 1 | 2026-08-07 | @RawNuke | bounty | [#3](https://github.com/jflournoy/for-funsies/pull/3) | [#1](https://github.com/jflournoy/for-funsies/issues/1) | 1 | GSD | The first GSD ever awarded to anyone, anywhere. |
| 2 | 2026-08-07 | @waterWang | `implementation` | 11 | 8 | 2 | GSD | Ported the ledger tool to TypeScript |
| 3 | 2026-08-07 | @Kasuki354 | `proposal` | 0 | 5 | 1 | GSD | Accepted proposal #5 |
| 4 | 2026-08-07 | @Kasuki354 | `proposal` | 0 | 6 | 1 | GSD | Accepted proposal #6 |
| 5 | 2026-08-07 | @Kasuki354 | `proposal` | 0 | 7 | 1 | GSD | Accepted proposal #7 |
| 6 | 2026-08-08 | @waterWang | `bounty` | 17 | 14 | 3 | GSD | Generative constellation garden |
| 7 | 2026-08-08 | @waterWang | `implementation` | 18 | 6 | 2 | GSD | validate flag (proposal #6) |
| 8 | 2026-08-08 | @Kasuki354 | `proposal-shipped` | 18 | 6 | 2 | GSD | Proposer of PR #18 |
| 9 | 2026-08-08 | @waterWang | `implementation` | 19 | 5 | 2 | GSD | format json flag (proposal #5) |
| 10 | 2026-08-08 | @Kasuki354 | `proposal-shipped` | 19 | 5 | 2 | GSD | Proposer of PR #19 |
| 11 | 2026-08-08 | @waterWang | `implementation` | 20 | 7 | 2 | GSD | summary flag (proposal #7) |
| 12 | 2026-08-08 | @Kasuki354 | `proposal-shipped` | 20 | 7 | 2 | GSD | Proposer of PR #20 |
| 13 | 2026-08-11 | @waterWang | `bounty` | 10 | 9 | 2 | GSD | Closed #9 |
| 14 | 2026-08-12 | @waterWang | `bounty` | 22 | 21 | 5 | GSD | Closed #21 |
| 15 | 2026-08-13 | @CREATORRADHEY | `bounty` | 23 | 21 | 5 | GSD | Winning manifesto for #21 - THE DARE RELAY. Adopted as MANIFESTO.md. |
