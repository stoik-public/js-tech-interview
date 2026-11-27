import { Body, Controller, Param, Put } from '@nestjs/common';

import { ReportMapper } from 'src/protect/infra/mappers/report.mapper';
import { HttpUpdateSignalsBodyDto } from 'src/protect/use-cases/update-signals/dto.http';
import {
  type UpdateSignalsCommand,
  UpdateSignalsUseCase,
} from 'src/protect/use-cases/update-signals/use-case';

@Controller('protect/reports')
export class HttpUpdateSignalsController {
  constructor(private readonly useCase: UpdateSignalsUseCase) {}

  @Put(':reportId')
  async update(
    @Param('reportId') reportId: string,
    @Body({ schema: HttpUpdateSignalsBodyDto }) body: HttpUpdateSignalsBodyDto,
  ) {
    const command = { reportId, ...body } satisfies UpdateSignalsCommand;
    return ReportMapper.fromDomainToDto(await this.useCase.execute(command));
  }
}
