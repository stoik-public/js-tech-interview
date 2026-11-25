import { Assessment } from 'src/protect/domain/assessment/assessment';
import type { AssessmentView } from 'src/protect/domain/ports/protect-queries.port';
import type { AssessmentRow } from 'src/protect/infra/db/schema';

export class AssessmentMapper {
  static fromRowToDomain(row: AssessmentRow): Assessment {
    return Assessment.hydrate(
      {
        companyId: row.companyId,
        status: row.status,
        signals: {
          phishingClickRatePct: row.phishingClickRatePct,
          leakedPasswords: row.leakedPasswords,
          unhandledAlerts: row.unhandledAlerts,
        },
        result: { score: row.score, band: row.band, breakdown: row.scoreBreakdown },
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        publishedAt: row.publishedAt,
      },
      row.id,
    );
  }

  static fromDomainToRow(assessment: Assessment) {
    const { signals, result, ...props } = assessment.getProps();
    return {
      id: assessment.id,
      ...props,
      ...signals,
      score: result.score,
      band: result.band,
      scoreBreakdown: result.breakdown,
    };
  }

  /** Lists every field of the response: a new field of the assessment is not published by accident. */
  static fromDomainToDto(assessment: Assessment): AssessmentView {
    const { companyId, status, signals, result, createdAt, updatedAt, publishedAt } =
      assessment.getProps();
    return {
      id: assessment.id,
      companyId,
      status,
      signals,
      score: result.score,
      band: result.band,
      scoreBreakdown: result.breakdown,
      createdAt,
      updatedAt,
      publishedAt,
    };
  }
}
