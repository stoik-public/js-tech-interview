# API

NestJS app organised in bounded contexts.

```
src/
├── core/            shared kernel
│   ├── domain/      Entity, DomainError, Clock and UnitOfWork ports
│   └── infra/       config, error filter, database (db/) and developer routes (dev/)
├── pricing/         pricing rules and the premium formula
├── distribution/    companies, quotes and contracts
├── scoring/         scoring rules and the security score formula
└── protect/         companies and their security reports
seed/                demo data of every test
scripts/db.ts        database commands: generate, migrate, seed, reset
```

`core/infra/dev/tests.ts` lists the hiring tests and the contexts each one is about (Insurance: `distribution` and `pricing`, Protect: `protect` and `scoring`). The client's test switcher and the toolbox read it, so a candidate only sees the tables and routes of their test.

Each context:

```
<context>/
├── <context>.module.ts      binds ports to adapters, declares controllers and use cases
├── public-api.ts            what other contexts may use (`priceQuote`, `scoreSignals`)
├── domain/                  entities, rules, error codes, ports/*.port.ts. No Nest, no database.
├── use-cases/<verb-noun>/   use-case.ts, controller.http.ts, dto.http.ts, use-case.test.ts
├── infra/                   adapters/<port>.<drizzle|in-memory|in-process|stub>.ts, mappers/,
│                            db/schema.ts and db/migrations/ (contexts that own tables)
└── tests/                   fixtures, builders and contracts/ (suites every adapter of a port must pass)
```

## Conventions

- **Ports** are abstract classes in `domain/ports/`, used as injection tokens. Adapters `implements` them.
- **Use cases** are `@Injectable()` classes with `execute(command)`. They get time from `Clock` and transactions from `UnitOfWork`.
- **Routes**: a context owns its prefix: every controller path starts with the context's name (`distribution/prospects`, `pricing/catalog`).
- **Controllers** build the command with `satisfies XCommand`, call `useCase.execute`, and map the result with a mapper. A read with no business logic calls a query port directly: a `get*` of the query port fails with a `ResourceNotFoundError` when nothing matches, so there is no use case only to turn `null` into 404. The query port is also the only place that knows what a prospect is (a company whose latest quote is a draft).
- **Invariants live in the domain**, not in the use cases that call it. A quote only accepts `PricedTerms` (terms deduplicated and priced, together with the turnover that premium assumes), so no caller can store terms that were not priced; `Quote.reconfigure` keeps the company's turnover in step; a signed quote never changes, and every `QuoteRepository` and `ContractRepository` adapter refuses to overwrite it or to sign it twice.
- **Validation**: a DTO is a zod schema and its type, with one name: `@Body({ schema: HttpXBodyDto }) body: HttpXBodyDto`.
- **Errors**: throw a `DomainError` subclass from `core/domain/errors.ts` with a code from the aggregate's `error.ts`. `DomainErrorFilter` maps it to HTTP: not found 404, conflict 409, business rule 422.
- **Database**: one Postgres database, one schema per context that owns tables, named after it. A context's `infra/db/schema.ts` declares its tables in that schema, and its migrations record themselves there too. No foreign key crosses contexts. To change a table, edit `schema.ts`, then `pnpm db:generate <context> --name <name>`; `pnpm db:migrate` runs every context's migrations in the order of `core/infra/db/contexts.ts`, and stops at the first failure. A new context with tables is added to that list.
- **Transactions**: wrap saves in `unitOfWork.runInTransaction`. Drizzle adapters always use `database.db`, which joins the current transaction.
- **Other contexts**: a context never imports another one. It defines a port in its own `domain/ports/` and implements it with an `.in-process` adapter that calls the other context's `public-api.ts`. `public-api.ts` exports what the other contexts need, which can be a plain function (`priceQuote`); a use case that only forwards to a function is not needed.
- **Concurrency**: when the database aborts a transaction because two requests wrote the same rows (deadlock, write conflict), `DrizzleUnitOfWork` answers a `ConflictError` (`core.concurrentUpdate`, HTTP 409) that the client can retry.

oxlint fails the build when `domain/` imports Nest or the database, when a use case imports an adapter, or when a context imports another one.

## Tests

- `*.test.ts` next to the code: use cases through the context's fixture on in-memory adapters, and the pure pricing function. No database.
- **Adapter contracts**: a port with two adapters has one suite in `<context>/tests/contracts/<port>.contract.ts`, run on each adapter: the in-memory one and the stub in `*.test.ts`, the Drizzle one in `test/repositories.e2e.test.ts`. A promise of the port (a signed quote is never overwritten, a turnover above 50M EUR is not eligible) goes in the suite, not in one adapter's test.
- `test/*.e2e.test.ts`: the whole app over HTTP on the `stoik_lite_test` database, migrated from empty schemas on every run. Every table of every context is emptied after each test. The reads of the query port (prospect or client, ordering, 404) and the races between requests are tested here, against the real adapter: an in-memory copy of the joins would be a second place to keep in step.
