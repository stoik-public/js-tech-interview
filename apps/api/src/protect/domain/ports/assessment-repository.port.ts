import type { Assessment } from 'src/protect/domain/assessment/assessment';

export abstract class AssessmentRepository {
  abstract findById(id: string): Promise<Assessment | null>;
  /** The company's most recent assessment, draft or published. */
  abstract findLatestOfCompany(companyId: string): Promise<Assessment | null>;
  /**
   * Fails with a ConflictError when the stored assessment is already published (a report never
   * changes, even if the caller read it while it was a draft), or when it would give its company
   * a second draft.
   */
  abstract save(assessment: Assessment): Promise<void>;
}
