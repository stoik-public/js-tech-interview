import { Injectable } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';

import { ConflictError } from 'src/core/domain/errors';
import { Database } from 'src/core/infra/db/database';
import { isPostgresError, PostgresErrorCode } from 'src/core/infra/db/postgres-error';
import { ReportRepository } from 'src/protect/domain/ports/report-repository.port';
import { ReportError } from 'src/protect/domain/report/error';
import type { Report } from 'src/protect/domain/report/report';
import { report } from 'src/protect/infra/db/schema';
import { ReportMapper } from 'src/protect/infra/mappers/report.mapper';

@Injectable()
export class DrizzleReportRepository implements ReportRepository {
  constructor(private readonly database: Database) {}

  async findById(id: string): Promise<Report | null> {
    const [row] = await this.database.db.select().from(report).where(eq(report.id, id));
    return row ? ReportMapper.fromRowToDomain(row) : null;
  }

  async findLatestOfCompany(companyId: string): Promise<Report | null> {
    const [row] = await this.database.db
      .select()
      .from(report)
      .where(eq(report.companyId, companyId))
      .orderBy(desc(report.createdAt))
      .limit(1);
    return row ? ReportMapper.fromRowToDomain(row) : null;
  }

  async save(entity: Report): Promise<void> {
    const data = ReportMapper.fromDomainToRow(entity);
    // Only a stored draft is overwritten. Another request may have published the report since
    // it was read: the update then matches no row, and a rewrite of the report is never applied.
    const updated = await this.database.db
      .update(report)
      .set(data)
      .where(and(eq(report.id, entity.id), eq(report.status, 'draft')))
      .returning({ id: report.id });
    if (updated.length > 0) return;
    try {
      await this.database.db.insert(report).values(data);
    } catch (error) {
      if (!isPostgresError(error, PostgresErrorCode.UniqueViolation)) throw error;
      // The partial unique index: the company already has another draft.
      if (violatedConstraint(error) === DRAFT_PER_COMPANY) {
        throw new ConflictError(
          ReportError.DraftInProgress,
          'This company already has a report in progress',
        );
      }
      // The id exists: the stored report is published.
      throw new ConflictError(ReportError.Published, 'A published report is read-only');
    }
  }
}

const DRAFT_PER_COMPANY = 'report_one_draft_per_company_key';

/** Drizzle wraps the driver's error, which names the constraint, in its own. */
function violatedConstraint(error: unknown): string | undefined {
  for (let current = error; current instanceof Error; current = current.cause) {
    if ('constraint' in current && typeof current.constraint === 'string') {
      return current.constraint;
    }
  }
  return undefined;
}
