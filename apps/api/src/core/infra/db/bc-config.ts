import { defineConfig } from 'drizzle-kit';

// Relative: drizzle-kit loads this file without the `src/*` path alias.
import { MIGRATIONS_TABLE } from './migrations-table';

/**
 * The drizzle-kit configuration of one bounded context: its schema.ts, its migrations folder and
 * its own Postgres schema. Paths are relative to apps/api, where drizzle-kit runs.
 */
export const bcConfig = (context: string) =>
  defineConfig({
    dialect: 'postgresql',
    schema: `./src/${context}/infra/db/schema.ts`,
    out: `./src/${context}/infra/db/migrations`,
    schemaFilter: [context],
    migrations: { schema: context, table: MIGRATIONS_TABLE },
  });
