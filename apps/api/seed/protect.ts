// Demo data of the protect test: companies with 12 monthly reports and a draft report.
import { count } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import { addMonthsUtc } from 'src/core/domain/dates';
import type { SecuritySignals } from 'src/protect/domain/report/security-signals';
import { report, company } from 'src/protect/infra/db/schema';
import { scoreSignals } from 'src/scoring/public-api';

type Db = NodePgDatabase;

const DAY_MS = 86_400_000;
const REPORTS = 12;

const now = new Date();
const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

// ─── Companies ──────────────────────────────────────────────────────────────

/** [phishing click rate %, leaked passwords, unhandled alerts] */
type Signals = [number, number, number];

type CompanySpec = {
  name: string;
  /** The signals of the oldest report. The reports in between move from one to the other. */
  first: Signals;
  /** The signals of the latest report. */
  latest: Signals;
  /** The signals of the report in progress. */
  draft: Signals;
};

const companies: CompanySpec[] = [
  // 55, Weak, under the scoring rules v1.
  { name: 'Acme Logistics', first: [26, 6, 6], latest: [18, 3, 2], draft: [18, 3, 2] },
  { name: 'Atelier Moreau', first: [12, 1, 2], latest: [4, 0, 0], draft: [3, 0, 0] },
  { name: 'Brightpath Clinics', first: [35, 8, 12], latest: [22, 4, 6], draft: [20, 4, 5] },
  { name: 'Cabinet Lefèvre', first: [8, 0, 1], latest: [6, 0, 1], draft: [5, 0, 0] },
  { name: 'Delta Freight', first: [40, 9, 15], latest: [31, 7, 11], draft: [30, 6, 11] },
  { name: 'Helios Énergie', first: [15, 2, 3], latest: [9, 1, 1], draft: [9, 1, 0] },
  { name: 'Lumen Studio', first: [5, 0, 0], latest: [14, 2, 3], draft: [16, 2, 4] },
  { name: 'Northwind Retail', first: [28, 3, 8], latest: [12, 1, 3], draft: [11, 1, 2] },
  { name: 'Pixel & Co', first: [20, 5, 4], latest: [20, 5, 4], draft: [19, 5, 4] },
  { name: 'Verdant Foods', first: [45, 12, 20], latest: [16, 2, 4], draft: [14, 2, 3] },
];

// ─── Seeding ────────────────────────────────────────────────────────────────

const toSignals = ([phishingClickRatePct, leakedPasswords, unhandledAlerts]: Signals) => ({
  phishingClickRatePct,
  leakedPasswords,
  unhandledAlerts,
});

/** The signals of report `index`, from 0 (the oldest) to REPORTS - 1 (the latest). */
const signalsOfReport = (spec: CompanySpec, index: number): SecuritySignals =>
  toSignals(
    spec.first.map((value, signal) =>
      Math.round(value + ((spec.latest[signal] - value) * index) / (REPORTS - 1)),
    ) as Signals,
  );

function reportRow(companyId: string, signals: SecuritySignals, createdAt: Date) {
  const { score, level, breakdown } = scoreSignals(signals);
  return { companyId, ...signals, score, level, scoreBreakdown: breakdown, createdAt };
}

async function seedCompany(db: Db, spec: CompanySpec) {
  const firstReportAt = addMonthsUtc(startOfMonth, -(REPORTS - 1));
  const [created] = await db
    .insert(company)
    .values({ name: spec.name, createdAt: new Date(firstReportAt.getTime() - 30 * DAY_MS) })
    .returning();

  // One report on the 1st of each month, the latest this month.
  const reports = Array.from({ length: REPORTS }, (_, index) => {
    const publishedAt = addMonthsUtc(firstReportAt, index);
    const row = reportRow(
      created.id,
      signalsOfReport(spec, index),
      new Date(publishedAt.getTime() - 3 * DAY_MS),
    );
    return { ...row, status: 'published' as const, publishedAt, updatedAt: publishedAt };
  });
  await db.insert(report).values(reports);

  const draft = reportRow(created.id, toSignals(spec.draft), now);
  await db.insert(report).values({ ...draft, status: 'draft', updatedAt: now });
}

export async function isSeeded(db: Db): Promise<boolean> {
  const [{ companies: seeded }] = await db.select({ companies: count() }).from(company);
  return seeded > 0;
}

/** Returns what it seeded. */
export async function seedData(db: Db): Promise<string> {
  for (const spec of companies) {
    await seedCompany(db, spec);
  }
  return `seeded ${companies.length} companies with ${REPORTS} reports each.`;
}
