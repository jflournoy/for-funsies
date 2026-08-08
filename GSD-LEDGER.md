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
