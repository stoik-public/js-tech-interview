import { Controller, Param, Post } from '@nestjs/common';

import { AssessmentMapper } from 'src/protect/infra/mappers/assessment.mapper';
import {
  type StartAssessmentCommand,
  StartAssessmentUseCase,
} from 'src/protect/use-cases/start-assessment/use-case';

@Controller('protect/companies')
export class HttpStartAssessmentController {
  constructor(private readonly useCase: StartAssessmentUseCase) {}

  @Post(':companyId/assessments')
  async start(@Param('companyId') companyId: string) {
    const command = { companyId } satisfies StartAssessmentCommand;
    return AssessmentMapper.fromDomainToDto(await this.useCase.execute(command));
  }
}
