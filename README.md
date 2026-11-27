# Stoïk Lite

A small cyber insurance platform for brokers. A broker creates a prospect from a name and a turnover, configures its quote, and validates it: validating signs the quote and creates a contract. Everything here is fictional.

## Getting started

Requirements: Node.js 22.18+ (see `.nvmrc`), pnpm 10, Docker.

```bash
pnpm install
pnpm dev
```

`pnpm dev` starts Postgres in Docker, applies the migrations, seeds the database if it is empty, then starts the client and the API:

| Service | URL                   |
| ------- | --------------------- |
| Client  | http://localhost:3000 |
| API     | http://localhost:3001 |

Other commands:

| Command           | What it does                                    |
| ----------------- | ----------------------------------------------- |
| `pnpm db:reset`   | Drops the database, migrates and seeds again    |
| `pnpm db:migrate` | Applies the pending migrations                  |
| `pnpm test`       | API unit tests                                  |
| `pnpm test:e2e`   | API end-to-end tests, on a separate database    |
| `pnpm typecheck`  | TypeScript in every package                     |
| `pnpm lint`       | oxlint, including the architecture import rules |
| `pnpm format`     | oxfmt                                           |

## How it works

1. A **prospect** is a company with a draft **quote**. The broker picks a turnover bracket, a coverage limit, a deductible and options. Every change is saved, and the API recomputes the **premium**.
2. **Validating** a draft quote signs it and creates a 12-month **contract**.
3. The company leaves the prospects and appears in the contracts, each with a read-only page.

The terms are defined in [GLOSSARY.md](apps/api/src/distribution/GLOSSARY.md).

## How Protect works

The repository hosts a second test, Protect: pick it in the sidebar's **Test** dropdown, or open `/protect`.

1. Each **company** has a **draft report** with three **signals**: the phishing click rate, the leaked passwords and the unhandled alerts. Every change is saved, and the API recomputes the **security score** and its **level**.
2. **Publishing** a draft report makes it the month's **published report**, sent to the client.
3. The company page charts the last 12 reports, each with a read-only page, and starts the next month's draft.

The terms are defined in [GLOSSARY.md](apps/api/src/protect/GLOSSARY.md).

## Architecture

```
apps/api       NestJS API, PostgreSQL through Drizzle
apps/client    React UI (Vite, Tailwind, TanStack Query)
```

The API has four bounded contexts, two per test, on top of a small shared kernel (`core`):

- `pricing`: the pricing rules and the premium formula, a pure function (`computePremium`).
- `distribution`: companies, quotes and contracts.
- `scoring`: the scoring rules and the security score formula, a pure function (`computeSecurityScore`).
- `protect`: companies and their security reports.

Each context has a `domain/` (entities, rules, ports), `use-cases/` (one folder per action) and `infra/` (adapters, and the tables it owns). A context only reaches another through its `public-api.ts`, and `pnpm lint` checks it. Each context owns its routes (`/api/distribution/…`, `/api/pricing/…`, `/api/protect/…`, `/api/scoring/…`) and its Postgres schema. Conventions are in [apps/api/AGENTS.md](apps/api/AGENTS.md).

The client has its pages in `src/pages`, its generic components in `src/ui` and its app shell in `src/layout`.

## Toolbox

The round button in the lower right corner opens a toolbox that may be useful during the interview. It is optional: feel free to use your own tools instead.

| Tool         | Shortcut | What it does                                                     |
| ------------ | -------- | ---------------------------------------------------------------- |
| Notes        | `⌥N`     | Rich text notes, exported as Markdown                            |
| Diagram      | `⌥D`     | An Excalidraw whiteboard                                         |
| Data model   | `⌥M`     | The tables and relations of the API's database                   |
| API explorer | `⌥A`     | Every API route, with a form to call it                          |
| Reset        | `⌥R`     | Clears what the toolbox saved in your browser (development only) |
