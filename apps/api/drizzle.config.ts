import { bcConfig } from './src/core/infra/db/bc-config';

// `pnpm db:generate <context>` sets BOUNDED_CONTEXT (scripts/db.ts).
const context = process.env.BOUNDED_CONTEXT;
if (!context)
  throw new Error('Run `pnpm db:generate <context>`, such as `pnpm db:generate distribution`.');

export default bcConfig(context);
