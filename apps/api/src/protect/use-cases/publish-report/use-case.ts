import { Injectable } from '@nestjs/common';

import { ResourceNotFoundError } from 'src/core/domain/errors';
import { Clock } from 'src/core/domain/ports/clock.port';
import { ReportRepository } from 'src/protect/domain/ports/report-repository.port';
import { ReportError } from 'src/protect/domain/report/error';
import type { Report } from 'src/protect/domain/report/report';

export type PublishReportCommand = { reportId: string };

/** Freezes a draft report as the monthly report sent to the client. */
@Injectable()
export class PublishReportUseCase {
  constructor(
    private readonly reportRepository: ReportRepository,
    private readonly clock: Clock,
  ) {}

  async execute({ reportId }: PublishReportCommand): Promise<Report> {
    const report = await this.reportRepository.findById(reportId);
    if (!report) {
      throw new ResourceNotFoundError(ReportError.NotFound, 'Report not found');
    }
    report.publish(this.clock.now());

    await this.reportRepository.save(report);
    return report;
  }
}
