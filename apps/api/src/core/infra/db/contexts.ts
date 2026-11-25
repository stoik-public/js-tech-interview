import { is } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';
import { join } from 'node:path';

import * as distribution from 'src/distribution/infra/db/schema';
import * as protect from 'src/protect/infra/db/schema';

/**
 * The bounded contexts that own tables, in the order their migrations run. Each one owns a
 * Postgres schema of its name, and nothing references a table of another one.
 */
export const DATABASE_CONTEXTS = { distribution, protect } as const;

export type DatabaseContext = keyof typeof DATABASE_CONTEXTS;

export const isDatabaseContext = (name: string): name is DatabaseContext =>
  Object.hasOwn(DATABASE_CONTEXTS, name);

/** Every table a context's schema.ts exports. */
export const tablesOf = (context: DatabaseContext): PgTable[] =>
  (Object.values(DATABASE_CONTEXTS[context]) as unknown[]).filter((value): value is PgTable =>
    is(value, PgTable),
  );

export const migrationsFolderOf = (context: DatabaseContext) =>
  join(__dirname, '..', '..', '..', context, 'infra', 'db', 'migrations');
