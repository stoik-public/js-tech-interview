import { Injectable } from '@nestjs/common';

import { ResourceNotFoundError } from 'src/core/domain/errors';
import { Clock } from 'src/core/domain/ports/clock.port';
import type { Assessment } from 'src/protect/domain/assessment/assessment';
import { AssessmentError } from 'src/protect/domain/assessment/error';
import { AssessmentRepository } from 'src/protect/domain/ports/assessment-repository.port';

export type PublishAssessmentCommand = { assessmentId: string };

/** Freezes a draft assessment as the monthly report sent to the client. */
@Injectable()
export class PublishAssessmentUseCase {
  constructor(
    private readonly assessmentRepository: AssessmentRepository,
    private readonly clock: Clock,
  ) {}

  async execute({ assessmentId }: PublishAssessmentCommand): Promise<Assessment> {
    const assessment = await this.assessmentRepository.findById(assessmentId);
    if (!assessment) {
      throw new ResourceNotFoundError(AssessmentError.NotFound, 'Assessment not found');
    }
    assessment.publish(this.clock.now());

    await this.assessmentRepository.save(assessment);
    return assessment;
  }
}
