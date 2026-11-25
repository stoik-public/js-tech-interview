import { ConflictError } from 'src/core/domain/errors';
import { Assessment, type AssessmentProps } from 'src/protect/domain/assessment/assessment';
import { AssessmentError } from 'src/protect/domain/assessment/error';
import { AssessmentRepository } from 'src/protect/domain/ports/assessment-repository.port';

export class InMemoryAssessmentRepository implements AssessmentRepository {
  readonly snapshots = new Map<string, AssessmentProps>();

  async findById(id: string): Promise<Assessment | null> {
    const props = this.snapshots.get(id);
    return props ? Assessment.hydrate(structuredClone(props), id) : null;
  }

  async findLatestOfCompany(companyId: string): Promise<Assessment | null> {
    const [latest] = [...this.snapshots]
      .filter(([, props]) => props.companyId === companyId)
      .sort(([, a], [, b]) => b.createdAt.getTime() - a.createdAt.getTime());
    return latest ? Assessment.hydrate(structuredClone(latest[1]), latest[0]) : null;
  }

  async save(assessment: Assessment): Promise<void> {
    const props = assessment.getProps();
    if (this.snapshots.get(assessment.id)?.status === 'published') {
      throw new ConflictError(AssessmentError.Published, 'A published assessment is read-only');
    }
    const anotherDraft = [...this.snapshots].some(
      ([id, saved]) =>
        id !== assessment.id &&
        saved.companyId === props.companyId &&
        saved.status === 'draft' &&
        props.status === 'draft',
    );
    if (anotherDraft) {
      throw new ConflictError(
        AssessmentError.DraftInProgress,
        'This company already has an assessment in progress',
      );
    }
    this.snapshots.set(assessment.id, structuredClone(props));
  }
}
