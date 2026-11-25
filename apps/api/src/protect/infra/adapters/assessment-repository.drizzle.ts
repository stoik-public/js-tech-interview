import { Injectable } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';

import { ConflictError } from 'src/core/domain/errors';
import { Database } from 'src/core/infra/db/database';
import { isPostgresError, PostgresErrorCode } from 'src/core/infra/db/postgres-error';
import type { Assessment } from 'src/protect/domain/assessment/assessment';
import { AssessmentError } from 'src/protect/domain/assessment/error';
import { AssessmentRepository } from 'src/protect/domain/ports/assessment-repository.port';
import { assessment } from 'src/protect/infra/db/schema';
import { AssessmentMapper } from 'src/protect/infra/mappers/assessment.mapper';

@Injectable()
export class DrizzleAssessmentRepository implements AssessmentRepository {
  constructor(private readonly database: Database) {}

  async findById(id: string): Promise<Assessment | null> {
    const [row] = await this.database.db.select().from(assessment).where(eq(assessment.id, id));
    return row ? AssessmentMapper.fromRowToDomain(row) : null;
  }

  async findLatestOfCompany(companyId: string): Promise<Assessment | null> {
    const [row] = await this.database.db
      .select()
      .from(assessment)
      .where(eq(assessment.companyId, companyId))
      .orderBy(desc(assessment.createdAt))
      .limit(1);
    return row ? AssessmentMapper.fromRowToDomain(row) : null;
  }

  async save(entity: Assessment): Promise<void> {
    const data = AssessmentMapper.fromDomainToRow(entity);
    // Only a stored draft is overwritten. Another request may have published the assessment since
    // it was read: the update then matches no row, and a rewrite of the report is never applied.
    const updated = await this.database.db
      .update(assessment)
      .set(data)
      .where(and(eq(assessment.id, entity.id), eq(assessment.status, 'draft')))
      .returning({ id: assessment.id });
    if (updated.length > 0) return;
    try {
      await this.database.db.insert(assessment).values(data);
    } catch (error) {
      if (!isPostgresError(error, PostgresErrorCode.UniqueViolation)) throw error;
      // The partial unique index: the company already has another draft.
      if (violatedConstraint(error) === DRAFT_PER_COMPANY) {
        throw new ConflictError(
          AssessmentError.DraftInProgress,
          'This company already has an assessment in progress',
        );
      }
      // The id exists: the stored assessment is published.
      throw new ConflictError(AssessmentError.Published, 'A published assessment is read-only');
    }
  }
}

const DRAFT_PER_COMPANY = 'assessment_one_draft_per_company_key';

/** Drizzle wraps the driver's error, which names the constraint, in its own. */
function violatedConstraint(error: unknown): string | undefined {
  for (let current = error; current instanceof Error; current = current.cause) {
    if ('constraint' in current && typeof current.constraint === 'string') {
      return current.constraint;
    }
  }
  return undefined;
}
