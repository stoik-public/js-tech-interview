// Database commands, run from apps/api:
//
//   tsx scripts/db.ts generate <context>   a migration from the changes of <context>'s schema.ts
//   tsx scripts/db.ts migrate              every context's pending migrations, in order
//   tsx scripts/db.ts seed [--if-empty]    demo data, for every test (only the empty ones)
//   tsx scripts/db.ts reset [--no-seed]    drop every context's schema, migrate and seed
import { execFileSync } from 'node:child_process';

import { config } from 'src/core/infra/config';
import { DATABASE_CONTEXTS, isDatabaseContext } from 'src/core/infra/db/contexts';
import { dropDatabaseContexts, migrateDatabase } from 'src/core/infra/db/migrate';

import { seed } from '../seed';

const contexts = Object.keys(DATABASE_CONTEXTS).join(', ');

async function main([command, ...args]: string[]) {
  switch (command) {
    case 'generate': {
      const [context, ...options] = args;
      if (!context || !isDatabaseContext(context)) {
        throw new Error(
          `Usage: pnpm db:generate <context>, where <context> is one of: ${contexts}.`,
        );
      }
      execFileSync('drizzle-kit', ['generate', ...options], {
        stdio: 'inherit',
        env: { ...process.env, BOUNDED_CONTEXT: context },
      });
      return;
    }
    case 'migrate':
      await migrateDatabase(config.DATABASE_URL);
      console.info(`Migrated: ${contexts}.`);
      return;
    case 'seed':
      await seed(config.DATABASE_URL, { ifEmpty: args.includes('--if-empty') });
      return;
    case 'reset':
      await dropDatabaseContexts(config.DATABASE_URL);
      await migrateDatabase(config.DATABASE_URL);
      if (!args.includes('--no-seed')) await seed(config.DATABASE_URL, { ifEmpty: false });
      return;
    default:
      throw new Error('Usage: tsx scripts/db.ts generate <context> | migrate | seed | reset');
  }
}

main(process.argv.slice(2)).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
