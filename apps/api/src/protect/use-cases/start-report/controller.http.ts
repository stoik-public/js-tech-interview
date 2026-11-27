import { Controller, Param, Post } from '@nestjs/common';

import { ReportMapper } from 'src/protect/infra/mappers/report.mapper';
import {
  type StartReportCommand,
  StartReportUseCase,
} from 'src/protect/use-cases/start-report/use-case';

@Controller('protect/companies')
export class HttpStartReportController {
  constructor(private readonly useCase: StartReportUseCase) {}

  @Post(':companyId/reports')
  async start(@Param('companyId') companyId: string) {
    const command = { companyId } satisfies StartReportCommand;
    return ReportMapper.fromDomainToDto(await this.useCase.execute(command));
  }
}
