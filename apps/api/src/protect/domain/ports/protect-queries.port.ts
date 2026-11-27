import type { ReportStatus } from 'src/protect/domain/report/report';
import type { SecurityLevel, SecuritySignals } from 'src/protect/domain/report/security-signals';

// Read models returned by the HTTP API.

export type CompanyView = {
  id: string;
  name: string;
  createdAt: Date;
};

export type ReportView = {
  id: string;
  companyId: string;
  status: ReportStatus;
  signals: SecuritySignals;
  score: number;
  level: SecurityLevel;
  scoreBreakdown: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
};

/** A published report, as listed and charted. */
export type ReportSummary = Pick<ReportView, 'id' | 'score' | 'level'> & { publishedAt: Date };

export type CompanySummary = CompanyView & {
  latestReport: ReportSummary | null;
  draft: Pick<ReportView, 'id' | 'score' | 'level'> | null;
};

export type CompanyDetail = {
  company: CompanyView;
  /** The report in progress, if any. */
  draft: ReportView | null;
  /** Newest first. */
  reports: ReportSummary[];
};

export type ReportDetail = ReportView & { company: CompanyView };

/** Every read of the HTTP API. */
export abstract class ProtectQueries {
  /** By name. */
  abstract listCompanies(): Promise<CompanySummary[]>;
  /** Fails with a ResourceNotFoundError when the company does not exist. */
  abstract getCompany(companyId: string): Promise<CompanyDetail>;
  /** Fails with a ResourceNotFoundError when there is no published report with this id. */
  abstract getReport(reportId: string): Promise<ReportDetail>;
}
