import { Controller, Get, Param } from '@nestjs/common';

import { ProtectQueries } from 'src/protect/domain/ports/protect-queries.port';

/** A report: a published report and its company. A read without business logic: no use case. */
@Controller('protect/reports')
export class HttpGetReportController {
  constructor(private readonly protectQueries: ProtectQueries) {}

  @Get(':reportId')
  get(@Param('reportId') reportId: string) {
    return this.protectQueries.getReport(reportId);
  }
}
