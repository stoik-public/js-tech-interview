import { Controller, Param, Post } from '@nestjs/common';

import { AssessmentMapper } from 'src/protect/infra/mappers/assessment.mapper';
import {
  type PublishAssessmentCommand,
  PublishAssessmentUseCase,
} from 'src/protect/use-cases/publish-assessment/use-case';

@Controller('protect/assessments')
export class HttpPublishAssessmentController {
  constructor(private readonly useCase: PublishAssessmentUseCase) {}

  @Post(':assessmentId/publish')
  async publish(@Param('assessmentId') assessmentId: string) {
    const command = { assessmentId } satisfies PublishAssessmentCommand;
    return AssessmentMapper.fromDomainToDto(await this.useCase.execute(command));
  }
}
