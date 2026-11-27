import { ConflictError } from 'src/core/domain/errors';
import type { Company } from 'src/protect/domain/company/company';
import type { ReportRepository } from 'src/protect/domain/ports/report-repository.port';

import { aCompany, aDraftReport, NOW, scored } from '../builders';

type Harness = {
  repository: ReportRepository;
  /** Makes the company exist where the adapter needs it (a foreign key, for the database). */
  givenCompany: (company: Company) => Promise<void>;
};

const later = (minutes: number) => new Date(NOW.getTime() + minutes * 60_000);

/** What every ReportRepository adapter promises. */
export function describeReportRepository(name: string, harness: () => Promise<Harness>) {
  describe(`ReportRepository: ${name}`, () => {
    let repository: ReportRepository;
    let company: Company;

    beforeEach(async () => {
      const given = await harness();
      repository = given.repository;
      company = aCompany();
      await given.givenCompany(company);
    });

    it('saves a draft report and finds it again', async () => {
      const draft = await aDraftReport(company);

      await repository.save(draft);

      expect((await repository.findById(draft.id))?.getProps()).toEqual(draft.getProps());
    });

    it('overwrites a draft report', async () => {
      const draft = await aDraftReport(company);
      await repository.save(draft);
      draft.rescore(
        await scored({ phishingClickRatePct: 2, leakedPasswords: 0, unhandledAlerts: 0 }),
        NOW,
      );

      await repository.save(draft);

      expect((await repository.findById(draft.id))?.signals.phishingClickRatePct).toBe(2);
    });

    it('answers null for an unknown report', async () => {
      expect(await repository.findById('00000000-0000-4000-8000-000000000000')).toBeNull();
    });

    it("finds the company's most recent report", async () => {
      const report = await aDraftReport(company, NOW);
      report.publish(later(1));
      await repository.save(report);
      const draft = await aDraftReport(company, later(2));
      await repository.save(draft);

      expect((await repository.findLatestOfCompany(company.id))?.id).toBe(draft.id);
      expect(
        await repository.findLatestOfCompany('00000000-0000-4000-8000-000000000000'),
      ).toBeNull();
    });

    it('never overwrites a report, even with a copy read while it was a draft', async () => {
      const draft = await aDraftReport(company);
      await repository.save(draft);
      const stale = await repository.findById(draft.id);
      const published = await repository.findById(draft.id);
      if (!stale || !published) throw new Error('The report was saved');
      published.publish(NOW);
      await repository.save(published);

      stale.rescore(
        await scored({ phishingClickRatePct: 0, leakedPasswords: 0, unhandledAlerts: 0 }),
        NOW,
      );

      await expect(repository.save(stale)).rejects.toMatchObject({
        code: 'protect.report.published',
      });
      expect((await repository.findById(draft.id))?.getProps()).toEqual(published.getProps());
    });

    it('refuses a second draft for the same company', async () => {
      await repository.save(await aDraftReport(company));

      const second = repository.save(await aDraftReport(company, later(1)));

      await expect(second).rejects.toThrow(ConflictError);
      await expect(second).rejects.toMatchObject({ code: 'protect.report.draftInProgress' });
    });
  });
}
