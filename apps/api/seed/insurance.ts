// Demo data of the insurance test: prospects with a draft quote, and clients with a contract.
import { count } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import type { CoverageOption } from 'src/core/domain/coverage-option';
import { startOfDayUtc } from 'src/core/domain/dates';
import { Contract } from 'src/distribution/domain/contract/contract';
import { company, contract, quote } from 'src/distribution/infra/db/schema';
import { priceQuote } from 'src/pricing/public-api';

type Db = NodePgDatabase;

const today = startOfDayUtc(new Date());
const daysFromToday = (days: number) => new Date(today.getTime() + days * 86_400_000);

// ─── Companies ──────────────────────────────────────────────────────────────

type Terms = { limitEur: number; deductibleEur: number; options: CoverageOption[] };

type ContractSpec = {
  /** Days between the signature, which starts the contract, and today. */
  signedDaysAgo: number;
  terms?: Terms;
};

type CompanySpec = {
  name: string;
  revenueEur: number;
  /** Signed quote. */
  contract?: ContractSpec;
  /** Open draft quote. */
  draft?: Terms;
};

const standard: Terms = { limitEur: 500_000, deductibleEur: 5_000, options: [] };

const companies: CompanySpec[] = [
  // Prospects with a draft quote
  {
    name: 'Boulangerie Martin',
    revenueEur: 1_200_000,
    draft: standard,
  },
  {
    name: 'Nimbus Analytics',
    revenueEur: 8_500_000,
    draft: { limitEur: 1_000_000, deductibleEur: 10_000, options: ['ransomware_extortion'] },
  },
  {
    name: 'Optique Durand',
    revenueEur: 2_100_000,
    draft: { limitEur: 250_000, deductibleEur: 1_000, options: [] },
  },
  {
    name: 'Mercury Logistics',
    revenueEur: 49_200_000,
    draft: { limitEur: 2_000_000, deductibleEur: 25_000, options: ['social_engineering_fraud'] },
  },

  // Contracts, from the most recent to the oldest
  {
    name: 'Horizon Voyages',
    revenueEur: 4_200_000,
    contract: { signedDaysAgo: 12 },
  },
  {
    name: 'Quincaillerie Roux',
    revenueEur: 950_000,
    contract: { signedDaysAgo: 120 },
  },
  {
    name: 'Groupe Vauban',
    revenueEur: 14_000_000,
    contract: {
      signedDaysAgo: 200,
      terms: { limitEur: 1_000_000, deductibleEur: 10_000, options: ['business_interruption'] },
    },
  },
  {
    name: 'Clinique des Lilas',
    revenueEur: 18_000_000,
    contract: {
      signedDaysAgo: 275,
      terms: { limitEur: 2_000_000, deductibleEur: 10_000, options: ['regulatory_fines'] },
    },
  },
  {
    name: 'Nordic Software',
    revenueEur: 12_000_000,
    contract: {
      signedDaysAgo: 306,
      terms: {
        limitEur: 1_000_000,
        deductibleEur: 5_000,
        options: ['ransomware_extortion', 'social_engineering_fraud'],
      },
    },
  },
  {
    name: 'École Montessori Soleil',
    revenueEur: 1_100_000,
    contract: { signedDaysAgo: 364 },
  },
];

// ─── Seeding ────────────────────────────────────────────────────────────────

async function createQuote(
  db: Db,
  data: { companyId: string; revenueEur: number; terms: Terms; createdAt: Date },
  status: 'draft' | 'signed',
) {
  const input = {
    annualRevenueCents: data.revenueEur * 100,
    coverageLimitCents: data.terms.limitEur * 100,
    deductibleCents: data.terms.deductibleEur * 100,
    options: data.terms.options,
  };
  const { premiumCents, breakdown } = priceQuote(input);
  const [row] = await db
    .insert(quote)
    .values({
      companyId: data.companyId,
      status,
      coverageLimitCents: input.coverageLimitCents,
      deductibleCents: input.deductibleCents,
      options: input.options,
      premiumCents,
      pricingBreakdown: breakdown,
      createdAt: data.createdAt,
      updatedAt: data.createdAt,
    })
    .returning();
  return row;
}

async function seedCompany(db: Db, spec: CompanySpec) {
  const startDate = spec.contract ? daysFromToday(-spec.contract.signedDaysAgo) : null;
  const [created] = await db
    .insert(company)
    .values({
      name: spec.name,
      annualRevenueCents: spec.revenueEur * 100,
      createdAt: startDate ? new Date(startDate.getTime() - 15 * 86_400_000) : daysFromToday(-5),
    })
    .returning();

  if (spec.contract && startDate) {
    const signed = await createQuote(
      db,
      {
        companyId: created.id,
        revenueEur: spec.revenueEur,
        terms: spec.contract.terms ?? standard,
        createdAt: new Date(startDate.getTime() - 10 * 86_400_000),
      },
      'signed',
    );
    // The contract starts and ends as it would if the quote were validated that day.
    const { endDate } = Contract.start(
      {
        quoteId: signed.id,
        companyId: created.id,
        premiumCents: signed.premiumCents,
        terms: {
          coverageLimitCents: signed.coverageLimitCents,
          deductibleCents: signed.deductibleCents,
          options: signed.options,
        },
      },
      startDate,
    ).getProps();
    await db.insert(contract).values({
      quoteId: signed.id,
      companyId: created.id,
      startDate,
      endDate,
      premiumCents: signed.premiumCents,
      coverageLimitCents: signed.coverageLimitCents,
      deductibleCents: signed.deductibleCents,
      options: signed.options,
      createdAt: startDate,
    });
  }

  if (spec.draft) {
    await createQuote(
      db,
      {
        companyId: created.id,
        revenueEur: spec.revenueEur,
        terms: spec.draft,
        createdAt: daysFromToday(-3),
      },
      'draft',
    );
  }
}

export async function isSeeded(db: Db): Promise<boolean> {
  const [{ companies }] = await db.select({ companies: count() }).from(company);
  return companies > 0;
}

/** Returns what it seeded. */
export async function seedData(db: Db): Promise<string> {
  for (const spec of companies) {
    await seedCompany(db, spec);
  }
  return `seeded ${companies.length} companies.`;
}
