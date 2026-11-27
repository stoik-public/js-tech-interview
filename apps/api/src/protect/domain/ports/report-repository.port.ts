import type { Report } from 'src/protect/domain/report/report';

export abstract class ReportRepository {
  abstract findById(id: string): Promise<Report | null>;
  /** The company's most recent report, draft or published. */
  abstract findLatestOfCompany(companyId: string): Promise<Report | null>;
  /**
   * Fails with a ConflictError when the stored report is already published (a report never
   * changes, even if the caller read it while it was a draft), or when it would give its company
   * a second draft.
   */
  abstract save(report: Report): Promise<void>;
}
