import { Injectable } from '@nestjs/common';

import { ResourceNotFoundError } from 'src/core/domain/errors';
import { Clock } from 'src/core/domain/ports/clock.port';
import type { Assessment } from 'src/protect/domain/assessment/assessment';
import { AssessmentError } from 'src/protect/domain/assessment/error';
import { ScoredSignals } from 'src/protect/domain/assessment/scored-signals';
import type { SecuritySignals } from 'src/protect/domain/assessment/security-signals';
import { AssessmentRepository } from 'src/protect/domain/ports/assessment-repository.port';
import { ScoreCalculator } from 'src/protect/domain/ports/score-calculator.port';

export type UpdateSignalsCommand = SecuritySignals & { assessmentId: string };

/** Saves the signals of a draft assessment and re-scores it. */
@Injectable()
export class UpdateSignalsUseCase {
  constructor(
    private readonly assessmentRepository: AssessmentRepository,
    private readonly scoreCalculator: ScoreCalculator,
    private readonly clock: Clock,
  ) {}

  async execute({ assessmentId, ...signals }: UpdateSignalsCommand): Promise<Assessment> {
    const assessment = await this.assessmentRepository.findById(assessmentId);
    if (!assessment) {
      throw new ResourceNotFoundError(AssessmentError.NotFound, 'Assessment not found');
    }
    // A report answers "read-only" whatever the signals, before anything is scored.
    assessment.assertDraft();

    const scored = await ScoredSignals.score(this.scoreCalculator, signals);
    assessment.rescore(scored, this.clock.now());

    await this.assessmentRepository.save(assessment);
    return assessment;
  }
}
