import { ConflictError } from 'src/core/domain/errors';
import { ACME_SIGNALS } from 'src/protect/tests/builders';
import { ProtectFixture } from 'src/protect/tests/fixtures/protect.fixture';

describe('StartAssessmentUseCase', () => {
  let fixture: ProtectFixture;

  beforeEach(() => {
    fixture = new ProtectFixture();
  });

  it("starts a draft from the signals of the company's latest report", async () => {
    const { companyId, assessmentId } = await fixture.givenADraftAssessment();
    await fixture.publishAssessment.execute({ assessmentId });
    fixture.clock.current = new Date('2026-04-01T08:00:00Z');

    const draft = await fixture.startAssessment.execute({ companyId });

    expect(fixture.assessment(draft.id)).toMatchObject({
      companyId,
      status: 'draft',
      signals: ACME_SIGNALS,
      result: fixture.assessment(assessmentId).result,
      createdAt: new Date('2026-04-01T08:00:00Z'),
      publishedAt: null,
    });
  });

  it('starts a first assessment with no signals', async () => {
    const companyId = await fixture.givenACompany();

    const draft = await fixture.startAssessment.execute({ companyId });

    expect(fixture.assessment(draft.id)).toMatchObject({
      signals: { phishingClickRatePct: 0, leakedPasswords: 0, unhandledAlerts: 0 },
      result: { score: 100, band: 'Good' },
    });
  });

  it('refuses a second assessment in progress', async () => {
    const { companyId } = await fixture.givenADraftAssessment();

    await expect(fixture.startAssessment.execute({ companyId })).rejects.toThrow(ConflictError);
    expect(fixture.assessments.snapshots.size).toBe(1);
  });

  it('fails on an unknown company', async () => {
    await expect(fixture.startAssessment.execute({ companyId: 'unknown' })).rejects.toMatchObject({
      code: 'protect.company.notFound',
    });
  });
});
