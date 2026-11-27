import { getTableConfig } from 'drizzle-orm/pg-core';
import { Pool } from 'pg';

import { DATABASE_CONTEXTS, type DatabaseContext, tablesOf } from 'src/core/infra/db/contexts';

import { TEST_DATABASE_URL } from './test-database';

// Every test starts from empty tables: after each one, every table of every context is emptied.
const pool = new Pool({ connectionString: TEST_DATABASE_URL });
const tables = (Object.keys(DATABASE_CONTEXTS) as DatabaseContext[])
  .flatMap(tablesOf)
  .map((table) => {
    const { schema, name } = getTableConfig(table);
    return `"${schema}"."${name}"`;
  });

afterEach(() => pool.query(`TRUNCATE ${tables.join(', ')} CASCADE`));
afterAll(() => pool.end());
