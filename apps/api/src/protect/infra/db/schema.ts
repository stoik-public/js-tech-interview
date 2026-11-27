import { sql } from 'drizzle-orm';
import { index, integer, jsonb, pgSchema, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { randomUUID } from 'node:crypto';

// Relative: drizzle-kit loads this file without the `src/*` path alias.
import { SECURITY_LEVELS } from '../../domain/report/security-signals';

export const protect = pgSchema('protect');

export const reportStatus = protect.enum('ReportStatus', ['draft', 'published']);
export const level = protect.enum('SecurityLevel', SECURITY_LEVELS);

const id = () =>
  text()
    .primaryKey()
    .$defaultFn(() => randomUUID());

const timestamps = {
  createdAt: timestamp({ precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp({ precision: 3 })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/** A client of Stoïk Protect. Not the company of the insurance test: no table crosses contexts. */
export const company = protect.table('company', {
  id: id(),
  name: text().notNull(),
  ...timestamps,
});

export const report = protect.table(
  'report',
  {
    id: id(),
    companyId: text()
      .notNull()
      .references(() => company.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    status: reportStatus().notNull().default('draft'),
    phishingClickRatePct: integer().notNull(),
    leakedPasswords: integer().notNull(),
    unhandledAlerts: integer().notNull(),
    score: integer().notNull(),
    level: level().notNull(),
    /** Output of the scoring context: one line per signal, with its value, tier and penalty. */
    scoreBreakdown: jsonb().$type<Record<string, unknown>>().notNull(),
    publishedAt: timestamp({ precision: 3 }),
    ...timestamps,
  },
  (table) => [
    index('report_companyId_idx').on(table.companyId),
    // A company has one report in progress at most.
    uniqueIndex('report_one_draft_per_company_key')
      .on(table.companyId)
      .where(sql`${table.status} = 'draft'`),
  ],
);

export type CompanyRow = typeof company.$inferSelect;
export type ReportRow = typeof report.$inferSelect;
