import { BusinessRuleError, ConflictError } from 'src/core/domain/errors';
import { ProtectFixture } from 'src/protect/tests/fixtures/protect.fixture';

describe('UpdateSignalsUseCase', () => {
  let fixture: ProtectFixture;
  const signals = { phishingClickRatePct: 10, leakedPasswords: 1, unhandledAlerts: 0 };

  beforeEach(() => {
    fixture = new ProtectFixture();
  });

  it('saves the signals and re-scores the draft', async () => {
    const { assessmentId } = await fixture.givenADraftAssessment();
    fixture.clock.current = new Date('2026-03-16T09:00:00Z');

    await fixture.updateSignals.execute({ assessmentId, ...signals });

    expect(fixture.assessment(assessmentId)).toMatchObject({
      status: 'draft',
      signals,
      // Stub: 100 - 10 / 2 - 5 x 1
      result: { score: 90, band: 'Good' },
      updatedAt: new Date('2026-03-16T09:00:00Z'),
    });
  });

  it('changes nothing when the signals cannot be scored', async () => {
    const { assessmentId } = await fixture.givenADraftAssessment();
    const before = fixture.assessment(assessmentId);

    await expect(
      fixture.updateSignals.execute({ assessmentId, ...signals, phishingClickRatePct: 101 }),
    ).rejects.toThrow(BusinessRuleError);

    expect(fixture.assessment(assessmentId)).toEqual(before);
  });

  it('fails on an unknown assessment', async () => {
    await expect(
      fixture.updateSignals.execute({ assessmentId: 'unknown', ...signals }),
    ).rejects.toMatchObject({ code: 'protect.assessment.notFound' });
  });

  it('refuses to re-score a published assessment, whatever the signals', async () => {
    const { assessmentId } = await fixture.givenADraftAssessment();
    await fixture.publishAssessment.execute({ assessmentId });
    const report = fixture.assessment(assessmentId);

    await expect(fixture.updateSignals.execute({ assessmentId, ...signals })).rejects.toThrow(
      ConflictError,
    );
    // Refused before anything is scored: signals that cannot be scored are not the answer.
    await expect(
      fixture.updateSignals.execute({ assessmentId, ...signals, phishingClickRatePct: 101 }),
    ).rejects.toMatchObject({ code: 'protect.assessment.published' });
    expect(fixture.assessment(assessmentId)).toEqual(report);
  });
});
