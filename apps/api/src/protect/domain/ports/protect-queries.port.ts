import type { AssessmentStatus } from 'src/protect/domain/assessment/assessment';
import type { Band, SecuritySignals } from 'src/protect/domain/assessment/security-signals';

// Read models returned by the HTTP API.

export type CompanyView = {
  id: string;
  name: string;
  createdAt: Date;
};

export type AssessmentView = {
  id: string;
  companyId: string;
  status: AssessmentStatus;
  signals: SecuritySignals;
  score: number;
  band: Band;
  scoreBreakdown: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
};

/** A published assessment, as listed and charted. */
export type ReportSummary = Pick<AssessmentView, 'id' | 'score' | 'band'> & { publishedAt: Date };

export type CompanySummary = CompanyView & {
  latestReport: ReportSummary | null;
  draft: Pick<AssessmentView, 'id' | 'score' | 'band'> | null;
};

export type CompanyDetail = {
  company: CompanyView;
  /** The assessment in progress, if any. */
  draft: AssessmentView | null;
  /** Newest first. */
  reports: ReportSummary[];
};

export type ReportDetail = AssessmentView & { company: CompanyView };

/** Every read of the HTTP API. A report is a published assessment. */
export abstract class ProtectQueries {
  /** By name. */
  abstract listCompanies(): Promise<CompanySummary[]>;
  /** Fails with a ResourceNotFoundError when the company does not exist. */
  abstract getCompany(companyId: string): Promise<CompanyDetail>;
  /** Fails with a ResourceNotFoundError when there is no published assessment with this id. */
  abstract getReport(assessmentId: string): Promise<ReportDetail>;
}
