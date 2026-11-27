import { Injectable } from '@nestjs/common';
import { and, asc, desc, eq, getTableColumns, isNotNull } from 'drizzle-orm';

import { ResourceNotFoundError } from 'src/core/domain/errors';
import { Database } from 'src/core/infra/db/database';
import { CompanyError } from 'src/protect/domain/company/error';
import {
  type CompanyDetail,
  type CompanySummary,
  ProtectQueries,
  type ReportDetail,
  type ReportSummary,
} from 'src/protect/domain/ports/protect-queries.port';
import { ReportError } from 'src/protect/domain/report/error';
import { report, company } from 'src/protect/infra/db/schema';
import { CompanyMapper } from 'src/protect/infra/mappers/company.mapper';
import { ReportMapper } from 'src/protect/infra/mappers/report.mapper';

const reportColumns = {
  id: report.id,
  score: report.score,
  level: report.level,
  publishedAt: report.publishedAt,
};

/** Read models for the HTTP API. */
@Injectable()
export class DrizzleProtectQueries implements ProtectQueries {
  constructor(private readonly database: Database) {}

  /** The latest report of each company. */
  private latestReports() {
    return this.database.db
      .selectDistinctOn([report.companyId], {
        companyId: report.companyId,
        ...reportColumns,
      })
      .from(report)
      .where(eq(report.status, 'published'))
      .orderBy(report.companyId, desc(report.publishedAt))
      .as('latest_report');
  }

  private drafts() {
    return this.database.db
      .select({
        companyId: report.companyId,
        id: report.id,
        score: report.score,
        level: report.level,
      })
      .from(report)
      .where(eq(report.status, 'draft'))
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
          level: latest.level,
          publishedAt: latest.publishedAt,
        },
        draft: { id: draft.id, score: draft.score, level: draft.level },
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
      .from(report)
      .where(and(eq(report.companyId, companyId), eq(report.status, 'draft')));
    const reports = await db
      .select(reportColumns)
      .from(report)
      .where(and(eq(report.companyId, companyId), eq(report.status, 'published')))
      .orderBy(desc(report.publishedAt));
    return {
      company: CompanyMapper.fromRowToDto(row),
      draft: draft ? ReportMapper.fromDomainToDto(ReportMapper.fromRowToDomain(draft)) : null,
      reports: reports.map(toReportSummary),
    };
  }

  async getReport(reportId: string): Promise<ReportDetail> {
    const [row] = await this.database.db
      .select({ report, company })
      .from(report)
      .innerJoin(company, eq(company.id, report.companyId))
      .where(
        and(eq(report.id, reportId), eq(report.status, 'published'), isNotNull(report.publishedAt)),
      );
    if (!row) throw new ResourceNotFoundError(ReportError.NotFound, 'Report not found');

    return {
      ...ReportMapper.fromDomainToDto(ReportMapper.fromRowToDomain(row.report)),
      company: CompanyMapper.fromRowToDto(row.company),
    };
  }
}

function toReportSummary(row: Omit<ReportSummary, 'publishedAt'> & { publishedAt: Date | null }) {
  if (!row.publishedAt) throw new Error(`Report ${row.id} has no publication date`);
  return { ...row, publishedAt: row.publishedAt };
}
