import { Assessment } from 'src/protect/domain/assessment/assessment';
import { ScoredSignals } from 'src/protect/domain/assessment/scored-signals';
import type { SecuritySignals } from 'src/protect/domain/assessment/security-signals';
import { Company } from 'src/protect/domain/company/company';
import { StubScoreCalculator } from 'src/protect/infra/adapters/score-calculator.stub';

export const NOW = new Date('2026-03-15T10:00:00Z');

/** The signals of Acme Logistics: 55, Weak, under the scoring rules v1. */
export const ACME_SIGNALS: SecuritySignals = {
  phishingClickRatePct: 18,
  leakedPasswords: 3,
  unhandledAlerts: 2,
};

export const aCompany = () => Company.create({ name: 'Acme Logistics' }, NOW);

/** Signals scored by the stub. */
export const scored = (signals: SecuritySignals = ACME_SIGNALS) =>
  ScoredSignals.score(new StubScoreCalculator(), signals);

/** A draft assessment of `company`, scored by the stub. */
export async function aDraftAssessment(company: Company = aCompany(), now = NOW) {
  return Assessment.start({ companyId: company.id, scored: await scored() }, now);
}
