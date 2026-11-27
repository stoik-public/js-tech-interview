import { Injectable } from '@nestjs/common';

import { ConflictError, ResourceNotFoundError } from 'src/core/domain/errors';
import { Clock } from 'src/core/domain/ports/clock.port';
import { CompanyError } from 'src/protect/domain/company/error';
import { CompanyRepository } from 'src/protect/domain/ports/company-repository.port';
import { ReportRepository } from 'src/protect/domain/ports/report-repository.port';
import { ScoreCalculator } from 'src/protect/domain/ports/score-calculator.port';
import { ReportError } from 'src/protect/domain/report/error';
import { Report } from 'src/protect/domain/report/report';
import { ScoredSignals } from 'src/protect/domain/report/scored-signals';
import { NO_SIGNALS } from 'src/protect/domain/report/security-signals';

export type StartReportCommand = { companyId: string };

/** Starts the next month's draft from the signals of the company's latest report. */
@Injectable()
export class StartReportUseCase {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly reportRepository: ReportRepository,
    private readonly scoreCalculator: ScoreCalculator,
    private readonly clock: Clock,
  ) {}

  async execute({ companyId }: StartReportCommand): Promise<Report> {
    const company = await this.companyRepository.findById(companyId);
    if (!company) throw new ResourceNotFoundError(CompanyError.NotFound, 'Company not found');

    const latest = await this.reportRepository.findLatestOfCompany(companyId);
    if (latest?.getProps().status === 'draft') {
      throw new ConflictError(
        ReportError.DraftInProgress,
        'This company already has a report in progress',
      );
    }
    const scored = await ScoredSignals.score(this.scoreCalculator, latest?.signals ?? NO_SIGNALS);
    const report = Report.start({ companyId, scored }, this.clock.now());

    await this.reportRepository.save(report);
    return report;
  }
}
