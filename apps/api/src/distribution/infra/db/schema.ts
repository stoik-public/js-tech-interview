import {
  bigint,
  date,
  index,
  integer,
  jsonb,
  pgSchema,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { randomUUID } from 'node:crypto';

// Relative: drizzle-kit loads this file without the `src/*` path alias.
import { COVERAGE_OPTIONS } from '../../../core/domain/coverage-option';

export const distribution = pgSchema('distribution');

export const quoteStatus = distribution.enum('QuoteStatus', ['draft', 'signed']);
export const coverageOption = distribution.enum('CoverageOption', COVERAGE_OPTIONS);

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

/** The client company, insured or prospect. */
export const company = distribution.table('company', {
  id: id(),
  name: text().notNull(),
  // Up to 50M EUR, far below Number.MAX_SAFE_INTEGER cents.
  annualRevenueCents: bigint({ mode: 'number' }).notNull(),
  ...timestamps,
});

export const quote = distribution.table(
  'quote',
  {
    id: id(),
    companyId: text()
      .notNull()
      .references(() => company.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    status: quoteStatus().notNull().default('draft'),
    coverageLimitCents: integer().notNull(),
    deductibleCents: integer().notNull(),
    options: coverageOption().array().notNull(),
    premiumCents: integer().notNull(),
    /** Output of the pricing context: inputs, every factor and the premium. */
    pricingBreakdown: jsonb().$type<Record<string, unknown>>().notNull(),
    ...timestamps,
  },
  (table) => [index('quote_companyId_idx').on(table.companyId)],
);

/** Terms are copied from the quote when it is signed. */
export const contract = distribution.table(
  'contract',
  {
    id: id(),
    // Unique: a quote is signed once.
    quoteId: text()
      .notNull()
      .unique('contract_quoteId_key')
      .references(() => quote.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    companyId: text()
      .notNull()
      .references(() => company.id, { onDelete: 'restrict', onUpdate: 'cascade' }),
    startDate: date({ mode: 'date' }).notNull(),
    endDate: date({ mode: 'date' }).notNull(),
    premiumCents: integer().notNull(),
    coverageLimitCents: integer().notNull(),
    deductibleCents: integer().notNull(),
    options: coverageOption().array().notNull(),
    ...timestamps,
  },
  (table) => [index('contract_companyId_idx').on(table.companyId)],
);

export type CompanyRow = typeof company.$inferSelect;
export type QuoteRow = typeof quote.$inferSelect;
export type ContractRow = typeof contract.$inferSelect;
