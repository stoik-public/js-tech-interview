import { StubClock } from 'src/core/infra/adapters/clock.stub';
import { Company } from 'src/protect/domain/company/company';
import { Report } from 'src/protect/domain/report/report';
import { ScoredSignals } from 'src/protect/domain/report/scored-signals';
import type { SecuritySignals } from 'src/protect/domain/report/security-signals';
import { InMemoryCompanyRepository } from 'src/protect/infra/adapters/company-repository.in-memory';
import { InMemoryReportRepository } from 'src/protect/infra/adapters/report-repository.in-memory';
import { StubScoreCalculator } from 'src/protect/infra/adapters/score-calculator.stub';
import { PublishReportUseCase } from 'src/protect/use-cases/publish-report/use-case';
import { StartReportUseCase } from 'src/protect/use-cases/start-report/use-case';
import { UpdateSignalsUseCase } from 'src/protect/use-cases/update-signals/use-case';

import { ACME_SIGNALS } from '../builders';

/** The protect use cases wired to in-memory adapters. */
export class ProtectFixture {
  readonly clock = new StubClock(new Date('2026-03-15T10:00:00Z'));
  readonly companies = new InMemoryCompanyRepository();
  readonly reports = new InMemoryReportRepository();
  private readonly scoreCalculator = new StubScoreCalculator();

  readonly startReport = new StartReportUseCase(
    this.companies,
    this.reports,
    this.scoreCalculator,
    this.clock,
  );
  readonly updateSignals = new UpdateSignalsUseCase(this.reports, this.scoreCalculator, this.clock);
  readonly publishReport = new PublishReportUseCase(this.reports, this.clock);

  async givenACompany(): Promise<string> {
    const company = Company.create({ name: 'Acme Logistics' }, this.clock.now());
    await this.companies.save(company);
    return company.id;
  }

  /** A company with a draft report of `signals`. */
  async givenADraftReport(signals: SecuritySignals = ACME_SIGNALS) {
    const companyId = await this.givenACompany();
    const scored = await ScoredSignals.score(this.scoreCalculator, signals);
    const draft = Report.start({ companyId, scored }, this.clock.now());
    await this.reports.save(draft);
    return { companyId, reportId: draft.id };
  }

  report(reportId: string) {
    const props = this.reports.snapshots.get(reportId);
    if (!props) throw new Error(`No report ${reportId}`);
    return props;
  }
}
