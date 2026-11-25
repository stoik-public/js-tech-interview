import { Injectable } from '@nestjs/common';

import { ConflictError, ResourceNotFoundError } from 'src/core/domain/errors';
import { Clock } from 'src/core/domain/ports/clock.port';
import { Assessment } from 'src/protect/domain/assessment/assessment';
import { AssessmentError } from 'src/protect/domain/assessment/error';
import { ScoredSignals } from 'src/protect/domain/assessment/scored-signals';
import { NO_SIGNALS } from 'src/protect/domain/assessment/security-signals';
import { CompanyError } from 'src/protect/domain/company/error';
import { AssessmentRepository } from 'src/protect/domain/ports/assessment-repository.port';
import { CompanyRepository } from 'src/protect/domain/ports/company-repository.port';
import { ScoreCalculator } from 'src/protect/domain/ports/score-calculator.port';

export type StartAssessmentCommand = { companyId: string };

/** Starts the next month's draft from the signals of the company's latest report. */
@Injectable()
export class StartAssessmentUseCase {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly assessmentRepository: AssessmentRepository,
    private readonly scoreCalculator: ScoreCalculator,
    private readonly clock: Clock,
  ) {}

  async execute({ companyId }: StartAssessmentCommand): Promise<Assessment> {
    const company = await this.companyRepository.findById(companyId);
    if (!company) throw new ResourceNotFoundError(CompanyError.NotFound, 'Company not found');

    const latest = await this.assessmentRepository.findLatestOfCompany(companyId);
    if (latest?.getProps().status === 'draft') {
      throw new ConflictError(
        AssessmentError.DraftInProgress,
        'This company already has an assessment in progress',
      );
    }
    const scored = await ScoredSignals.score(this.scoreCalculator, latest?.signals ?? NO_SIGNALS);
    const assessment = Assessment.start({ companyId, scored }, this.clock.now());

    await this.assessmentRepository.save(assessment);
    return assessment;
  }
}
