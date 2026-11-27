// Demo data of every test. Every date is relative to today so the data stays meaningful.
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as insurance from './insurance';
import * as protect from './protect';

const seeds = [
  { test: 'Insurance', ...insurance },
  { test: 'Protect', ...protect },
];

/** With `ifEmpty`, a test whose data is already there is left as it is. */
export async function seed(url: string, { ifEmpty }: { ifEmpty: boolean }): Promise<void> {
  const pool = new Pool({ connectionString: url });
  try {
    const db = drizzle(pool);
    for (const { test, isSeeded, seedData } of seeds) {
      if (ifEmpty && (await isSeeded(db))) {
        console.info(`${test}: already seeded, skipping. Run \`pnpm db:reset\` to start over.`);
        continue;
      }
      console.info(`${test}: ${await seedData(db)}`);
    }
  } finally {
    await pool.end();
  }
}
