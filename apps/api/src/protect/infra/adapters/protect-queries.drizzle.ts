import { Injectable } from '@nestjs/common';
import { and, asc, desc, eq, getTableColumns, isNotNull } from 'drizzle-orm';

import { ResourceNotFoundError } from 'src/core/domain/errors';
import { Database } from 'src/core/infra/db/database';
import { AssessmentError } from 'src/protect/domain/assessment/error';
import { CompanyError } from 'src/protect/domain/company/error';
import {
  type CompanyDetail,
  type CompanySummary,
  ProtectQueries,
  type ReportDetail,
  type ReportSummary,
} from 'src/protect/domain/ports/protect-queries.port';
import { assessment, company } from 'src/protect/infra/db/schema';
import { AssessmentMapper } from 'src/protect/infra/mappers/assessment.mapper';
import { CompanyMapper } from 'src/protect/infra/mappers/company.mapper';

const reportColumns = {
  id: assessment.id,
  score: assessment.score,
  band: assessment.band,
  publishedAt: assessment.publishedAt,
};

/** Read models for the HTTP API. */
@Injectable()
export class DrizzleProtectQueries implements ProtectQueries {
  constructor(private readonly database: Database) {}

  /** The latest report of each company. */
  private latestReports() {
    return this.database.db
      .selectDistinctOn([assessment.companyId], {
        companyId: assessment.companyId,
        ...reportColumns,
      })
      .from(assessment)
      .where(eq(assessment.status, 'published'))
      .orderBy(assessment.companyId, desc(assessment.publishedAt))
      .as('latest_report');
  }

  private drafts() {
    return this.database.db
      .select({
        companyId: assessment.companyId,
        id: assessment.id,
        score: assessment.score,
        band: assessment.band,
      })
      .from(assessment)
      .where(eq(assessment.status, 'draft'))
      .as('draft');
  }

  async listCompanies(): Promise<CompanySummary[]> {
    const latest = this.latestReports();
    const draft = this.drafts();
    const rows = await this.database.db
      .select({
        company: getTableColumns(company),
        report: {
          id: latest.id,
          score: latest.score,
          band: latest.band,
          publishedAt: latest.publishedAt,
        },
        draft: { id: draft.id, score: draft.score, band: draft.band },
      })
      .from(company)
      .leftJoin(latest, eq(latest.companyId, company.id))
      .leftJoin(draft, eq(draft.companyId, company.id))
      .orderBy(asc(company.name));
    return rows.map((row) => ({
      ...CompanyMapper.fromRowToDto(row.company),
      latestReport: row.report ? toReportSummary(row.report) : null,
      draft: row.draft,
    }));
  }

  async getCompany(companyId: string): Promise<CompanyDetail> {
    const db = this.database.db;
    const [row] = await db.select().from(company).where(eq(company.id, companyId));
    if (!row) throw new ResourceNotFoundError(CompanyError.NotFound, 'Company not found');

    const [draft] = await db
      .select()
      .from(assessment)
      .where(and(eq(assessment.companyId, companyId), eq(assessment.status, 'draft')));
    const reports = await db
      .select(reportColumns)
      .from(assessment)
      .where(and(eq(assessment.companyId, companyId), eq(assessment.status, 'published')))
      .orderBy(desc(assessment.publishedAt));
    return {
      company: CompanyMapper.fromRowToDto(row),
      draft: draft
        ? AssessmentMapper.fromDomainToDto(AssessmentMapper.fromRowToDomain(draft))
        : null,
      reports: reports.map(toReportSummary),
    };
  }

  async getReport(assessmentId: string): Promise<ReportDetail> {
    const [row] = await this.database.db
      .select({ assessment, company })
      .from(assessment)
      .innerJoin(company, eq(company.id, assessment.companyId))
      .where(
        and(
          eq(assessment.id, assessmentId),
          eq(assessment.status, 'published'),
          isNotNull(assessment.publishedAt),
        ),
      );
    if (!row) throw new ResourceNotFoundError(AssessmentError.NotFound, 'Report not found');

    return {
      ...AssessmentMapper.fromDomainToDto(AssessmentMapper.fromRowToDomain(row.assessment)),
      company: CompanyMapper.fromRowToDto(row.company),
    };
  }
}

function toReportSummary(row: Omit<ReportSummary, 'publishedAt'> & { publishedAt: Date | null }) {
  if (!row.publishedAt) throw new Error(`Report ${row.id} has no publication date`);
  return { ...row, publishedAt: row.publishedAt };
}
