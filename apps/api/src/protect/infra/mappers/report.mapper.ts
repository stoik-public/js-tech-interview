import type { ReportView } from 'src/protect/domain/ports/protect-queries.port';
import { Report } from 'src/protect/domain/report/report';
import type { ReportRow } from 'src/protect/infra/db/schema';

export class ReportMapper {
  static fromRowToDomain(row: ReportRow): Report {
    return Report.hydrate(
      {
        companyId: row.companyId,
        status: row.status,
        signals: {
          phishingClickRatePct: row.phishingClickRatePct,
          leakedPasswords: row.leakedPasswords,
          unhandledAlerts: row.unhandledAlerts,
        },
        result: { score: row.score, level: row.level, breakdown: row.scoreBreakdown },
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        publishedAt: row.publishedAt,
      },
      row.id,
    );
  }

  static fromDomainToRow(report: Report) {
    const { signals, result, ...props } = report.getProps();
    return {
      id: report.id,
      ...props,
      ...signals,
      score: result.score,
      level: result.level,
      scoreBreakdown: result.breakdown,
    };
  }

  /** Lists every field of the response: a new field of the report is not published by accident. */
  static fromDomainToDto(report: Report): ReportView {
    const { companyId, status, signals, result, createdAt, updatedAt, publishedAt } =
      report.getProps();
    return {
      id: report.id,
      companyId,
      status,
      signals,
      score: result.score,
      level: result.level,
      scoreBreakdown: result.breakdown,
      createdAt,
      updatedAt,
      publishedAt,
    };
  }
}
