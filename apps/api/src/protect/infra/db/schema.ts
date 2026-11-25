import { sql } from 'drizzle-orm';
import { index, integer, jsonb, pgSchema, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { randomUUID } from 'node:crypto';

// Relative: drizzle-kit loads this file without the `src/*` path alias.
import { BANDS } from '../../domain/assessment/security-signals';

export const protect = pgSchema('protect');

export const assessmentStatus = protect.enum('AssessmentStatus', ['draft', 'published']);
export const band = protect.enum('Band', BANDS);

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

export const assessment = protect.table(
  'assessment',
  {
    id: id(),
    companyId: text()
      .notNull()
      .references(() => company.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    status: assessmentStatus().notNull().default('draft'),
    phishingClickRatePct: integer().notNull(),
    leakedPasswords: integer().notNull(),
    unhandledAlerts: integer().notNull(),
    score: integer().notNull(),
    band: band().notNull(),
    /** Output of the scoring context: one line per signal, with its value, tier and penalty. */
    scoreBreakdown: jsonb().$type<Record<string, unknown>>().notNull(),
    publishedAt: timestamp({ precision: 3 }),
    ...timestamps,
  },
  (table) => [
    index('assessment_companyId_idx').on(table.companyId),
    // A company has one assessment in progress at most.
    uniqueIndex('assessment_one_draft_per_company_key')
      .on(table.companyId)
      .where(sql`${table.status} = 'draft'`),
  ],
);

export type CompanyRow = typeof company.$inferSelect;
export type AssessmentRow = typeof assessment.$inferSelect;
