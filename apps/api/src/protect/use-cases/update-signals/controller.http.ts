import { Body, Controller, Param, Put } from '@nestjs/common';

import { AssessmentMapper } from 'src/protect/infra/mappers/assessment.mapper';
import { HttpUpdateSignalsBodyDto } from 'src/protect/use-cases/update-signals/dto.http';
import {
  type UpdateSignalsCommand,
  UpdateSignalsUseCase,
} from 'src/protect/use-cases/update-signals/use-case';

@Controller('protect/assessments')
export class HttpUpdateSignalsController {
  constructor(private readonly useCase: UpdateSignalsUseCase) {}

  @Put(':assessmentId')
  async update(
    @Param('assessmentId') assessmentId: string,
    @Body({ schema: HttpUpdateSignalsBodyDto }) body: HttpUpdateSignalsBodyDto,
  ) {
    const command = { assessmentId, ...body } satisfies UpdateSignalsCommand;
    return AssessmentMapper.fromDomainToDto(await this.useCase.execute(command));
  }
}
