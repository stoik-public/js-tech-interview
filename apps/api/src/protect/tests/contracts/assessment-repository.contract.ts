import { ConflictError } from 'src/core/domain/errors';
import type { Company } from 'src/protect/domain/company/company';
import type { AssessmentRepository } from 'src/protect/domain/ports/assessment-repository.port';

import { aCompany, aDraftAssessment, NOW, scored } from '../builders';

type Harness = {
  repository: AssessmentRepository;
  /** Makes the company exist where the adapter needs it (a foreign key, for the database). */
  givenCompany: (company: Company) => Promise<void>;
};

const later = (minutes: number) => new Date(NOW.getTime() + minutes * 60_000);

/** What every AssessmentRepository adapter promises. */
export function describeAssessmentRepository(name: string, harness: () => Promise<Harness>) {
  describe(`AssessmentRepository: ${name}`, () => {
    let repository: AssessmentRepository;
    let company: Company;

    beforeEach(async () => {
      const given = await harness();
      repository = given.repository;
      company = aCompany();
      await given.givenCompany(company);
    });

    it('saves a draft assessment and finds it again', async () => {
      const draft = await aDraftAssessment(company);

      await repository.save(draft);

      expect((await repository.findById(draft.id))?.getProps()).toEqual(draft.getProps());
    });

    it('overwrites a draft assessment', async () => {
      const draft = await aDraftAssessment(company);
      await repository.save(draft);
      draft.rescore(
        await scored({ phishingClickRatePct: 2, leakedPasswords: 0, unhandledAlerts: 0 }),
        NOW,
      );

      await repository.save(draft);

      expect((await repository.findById(draft.id))?.signals.phishingClickRatePct).toBe(2);
    });

    it('answers null for an unknown assessment', async () => {
      expect(await repository.findById('00000000-0000-4000-8000-000000000000')).toBeNull();
    });

    it("finds the company's most recent assessment", async () => {
      const report = await aDraftAssessment(company, NOW);
      report.publish(later(1));
      await repository.save(report);
      const draft = await aDraftAssessment(company, later(2));
      await repository.save(draft);

      expect((await repository.findLatestOfCompany(company.id))?.id).toBe(draft.id);
      expect(
        await repository.findLatestOfCompany('00000000-0000-4000-8000-000000000000'),
      ).toBeNull();
    });

    it('never overwrites a report, even with a copy read while it was a draft', async () => {
      const draft = await aDraftAssessment(company);
      await repository.save(draft);
      const stale = await repository.findById(draft.id);
      const published = await repository.findById(draft.id);
      if (!stale || !published) throw new Error('The assessment was saved');
      published.publish(NOW);
      await repository.save(published);

      stale.rescore(
        await scored({ phishingClickRatePct: 0, leakedPasswords: 0, unhandledAlerts: 0 }),
        NOW,
      );

      await expect(repository.save(stale)).rejects.toMatchObject({
        code: 'protect.assessment.published',
      });
      expect((await repository.findById(draft.id))?.getProps()).toEqual(published.getProps());
    });

    it('refuses a second draft for the same company', async () => {
      await repository.save(await aDraftAssessment(company));

      const second = repository.save(await aDraftAssessment(company, later(1)));

      await expect(second).rejects.toThrow(ConflictError);
      await expect(second).rejects.toMatchObject({ code: 'protect.assessment.draftInProgress' });
    });
  });
}
