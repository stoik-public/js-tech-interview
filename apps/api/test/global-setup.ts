import { execSync } from 'node:child_process';

import { TEST_DATABASE_URL } from './test-database';

/** Applies the migrations to an empty test database before the e2e suites run. */
export default function globalSetup() {
  // The test database is disposable: starting from empty schemas means a rewritten migration
  // history can never meet an older one. A script, because Jest's global setup does not resolve
  // the `src/*` path alias.
  execSync('tsx scripts/db.ts reset --no-seed', {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: ['ignore', 'ignore', 'inherit'],
  });
}
