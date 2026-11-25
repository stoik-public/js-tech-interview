import type { Assessment, ProtectCompanyDetail, ReportSummary, ScoreScale } from '../lib/types';

export const scale = (): ScoreScale => ({
  bands: [
    { band: 'Weak', minScore: 0, maxScore: 69 },
    { band: 'Good', minScore: 70, maxScore: 100 },
  ],
});

/** The draft of Acme Logistics, scored by the API: 55, Weak. */
export const draftAssessment = (overrides: Partial<Assessment> = {}): Assessment => ({
  id: 'assessment-1',
  companyId: 'company-1',
  status: 'draft',
  signals: { phishingClickRatePct: 18, leakedPasswords: 3, unhandledAlerts: 2 },
  score: 55,
  band: 'Weak',
  scoreBreakdown: {
    lines: [
      { signal: 'phishingClickRatePct', value: 18, tierUpTo: 30, penalty: 20 },
      { signal: 'leakedPasswords', value: 3, tierUpTo: 5, penalty: 20 },
      { signal: 'unhandledAlerts', value: 2, tierUpTo: 3, penalty: 5 },
    ],
    totalPenalty: 45,
  },
  createdAt: '2026-11-20T10:00:00.000Z',
  updatedAt: '2026-11-20T10:00:00.000Z',
  publishedAt: null,
  ...overrides,
});

export const report = (overrides: Partial<ReportSummary> = {}): ReportSummary => ({
  id: 'report-1',
  score: 45,
  band: 'Weak',
  publishedAt: '2026-11-01T00:00:00.000Z',
  ...overrides,
});

export const companyDetail = (
  overrides: Partial<ProtectCompanyDetail> = {},
): ProtectCompanyDetail => ({
  company: { id: 'company-1', name: 'Acme Logistics', createdAt: '2025-10-01T00:00:00.000Z' },
  draft: draftAssessment(),
  reports: [report()],
  ...overrides,
});
