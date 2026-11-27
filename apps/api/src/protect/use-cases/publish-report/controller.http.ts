import { Controller, Param, Post } from '@nestjs/common';

import { ReportMapper } from 'src/protect/infra/mappers/report.mapper';
import {
  type PublishReportCommand,
  PublishReportUseCase,
} from 'src/protect/use-cases/publish-report/use-case';

@Controller('protect/reports')
export class HttpPublishReportController {
  constructor(private readonly useCase: PublishReportUseCase) {}

  @Post(':reportId/publish')
  async publish(@Param('reportId') reportId: string) {
    const command = { reportId } satisfies PublishReportCommand;
    return ReportMapper.fromDomainToDto(await this.useCase.execute(command));
  }
}
