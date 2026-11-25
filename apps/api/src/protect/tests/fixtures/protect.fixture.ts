import { StubClock } from 'src/core/infra/adapters/clock.stub';
import { Assessment } from 'src/protect/domain/assessment/assessment';
import { ScoredSignals } from 'src/protect/domain/assessment/scored-signals';
import type { SecuritySignals } from 'src/protect/domain/assessment/security-signals';
import { Company } from 'src/protect/domain/company/company';
import { InMemoryAssessmentRepository } from 'src/protect/infra/adapters/assessment-repository.in-memory';
import { InMemoryCompanyRepository } from 'src/protect/infra/adapters/company-repository.in-memory';
import { StubScoreCalculator } from 'src/protect/infra/adapters/score-calculator.stub';
import { PublishAssessmentUseCase } from 'src/protect/use-cases/publish-assessment/use-case';
import { StartAssessmentUseCase } from 'src/protect/use-cases/start-assessment/use-case';
import { UpdateSignalsUseCase } from 'src/protect/use-cases/update-signals/use-case';

import { ACME_SIGNALS } from '../builders';

/** The protect use cases wired to in-memory adapters. */
export class ProtectFixture {
  readonly clock = new StubClock(new Date('2026-03-15T10:00:00Z'));
  readonly companies = new InMemoryCompanyRepository();
  readonly assessments = new InMemoryAssessmentRepository();
  private readonly scoreCalculator = new StubScoreCalculator();

  readonly startAssessment = new StartAssessmentUseCase(
    this.companies,
    this.assessments,
    this.scoreCalculator,
    this.clock,
  );
  readonly updateSignals = new UpdateSignalsUseCase(
    this.assessments,
    this.scoreCalculator,
    this.clock,
  );
  readonly publishAssessment = new PublishAssessmentUseCase(this.assessments, this.clock);

  async givenACompany(): Promise<string> {
    const company = Company.create({ name: 'Acme Logistics' }, this.clock.now());
    await this.companies.save(company);
    return company.id;
  }

  /** A company with a draft assessment of `signals`. */
  async givenADraftAssessment(signals: SecuritySignals = ACME_SIGNALS) {
    const companyId = await this.givenACompany();
    const scored = await ScoredSignals.score(this.scoreCalculator, signals);
    const draft = Assessment.start({ companyId, scored }, this.clock.now());
    await this.assessments.save(draft);
    return { companyId, assessmentId: draft.id };
  }

  assessment(assessmentId: string) {
    const props = this.assessments.snapshots.get(assessmentId);
    if (!props) throw new Error(`No assessment ${assessmentId}`);
    return props;
  }
}
