import { Injectable } from '@nestjs/common';

import { ResourceNotFoundError } from 'src/core/domain/errors';
import { Clock } from 'src/core/domain/ports/clock.port';
import { ReportRepository } from 'src/protect/domain/ports/report-repository.port';
import { ScoreCalculator } from 'src/protect/domain/ports/score-calculator.port';
import { ReportError } from 'src/protect/domain/report/error';
import type { Report } from 'src/protect/domain/report/report';
import { ScoredSignals } from 'src/protect/domain/report/scored-signals';
import type { SecuritySignals } from 'src/protect/domain/report/security-signals';

export type UpdateSignalsCommand = SecuritySignals & { reportId: string };

/** Saves the signals of a draft report and re-scores it. */
@Injectable()
export class UpdateSignalsUseCase {
  constructor(
    private readonly reportRepository: ReportRepository,
    private readonly scoreCalculator: ScoreCalculator,
    private readonly clock: Clock,
  ) {}

  async execute({ reportId, ...signals }: UpdateSignalsCommand): Promise<Report> {
    const report = await this.reportRepository.findById(reportId);
    if (!report) {
      throw new ResourceNotFoundError(ReportError.NotFound, 'Report not found');
    }
    // A report answers "read-only" whatever the signals, before anything is scored.
    report.assertDraft();

    const scored = await ScoredSignals.score(this.scoreCalculator, signals);
    report.rescore(scored, this.clock.now());

    await this.reportRepository.save(report);
    return report;
  }
}
