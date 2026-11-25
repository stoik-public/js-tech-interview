import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

import {
  DATABASE_CONTEXTS,
  type DatabaseContext,
  migrationsFolderOf,
} from 'src/core/infra/db/contexts';
import { MIGRATIONS_TABLE } from 'src/core/infra/db/migrations-table';

/** Runs the migrations of every context, one context after the other, and stops at the first failure. */
export async function migrateDatabase(url: string): Promise<void> {
  const pool = new Pool({ connectionString: url });
  try {
    const db = drizzle(pool);
    for (const context of Object.keys(DATABASE_CONTEXTS) as DatabaseContext[]) {
      await migrate(db, {
        migrationsFolder: migrationsFolderOf(context),
        migrationsSchema: context,
        migrationsTable: MIGRATIONS_TABLE,
      });
    }
  } finally {
    await pool.end();
  }
}

/** Drops what every context owns: its tables, its types and its migration history. */
export async function dropDatabaseContexts(url: string): Promise<void> {
  const pool = new Pool({ connectionString: url });
  try {
    for (const context of Object.keys(DATABASE_CONTEXTS)) {
      await pool.query(`DROP SCHEMA IF EXISTS "${context}" CASCADE`);
    }
  } finally {
    await pool.end();
  }
}
