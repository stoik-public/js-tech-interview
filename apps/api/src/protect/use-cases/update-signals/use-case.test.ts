import { BusinessRuleError, ConflictError } from 'src/core/domain/errors';
import { ProtectFixture } from 'src/protect/tests/fixtures/protect.fixture';

describe('UpdateSignalsUseCase', () => {
  let fixture: ProtectFixture;
  const signals = { phishingClickRatePct: 10, leakedPasswords: 1, unhandledAlerts: 0 };

  beforeEach(() => {
    fixture = new ProtectFixture();
  });

  it('saves the signals and re-scores the draft', async () => {
    const { reportId } = await fixture.givenADraftReport();
    fixture.clock.current = new Date('2026-03-16T09:00:00Z');

    await fixture.updateSignals.execute({ reportId, ...signals });

    expect(fixture.report(reportId)).toMatchObject({
      status: 'draft',
      signals,
      // Stub: 100 - 10 / 2 - 5 x 1
      result: { score: 90, level: 'Good' },
      updatedAt: new Date('2026-03-16T09:00:00Z'),
    });
  });

  it('changes nothing when the signals cannot be scored', async () => {
    const { reportId } = await fixture.givenADraftReport();
    const before = fixture.report(reportId);

    await expect(
      fixture.updateSignals.execute({ reportId, ...signals, phishingClickRatePct: 101 }),
    ).rejects.toThrow(BusinessRuleError);

    expect(fixture.report(reportId)).toEqual(before);
  });

  it('fails on an unknown report', async () => {
    await expect(
      fixture.updateSignals.execute({ reportId: 'unknown', ...signals }),
    ).rejects.toMatchObject({ code: 'protect.report.notFound' });
  });

  it('refuses to re-score a published report, whatever the signals', async () => {
    const { reportId } = await fixture.givenADraftReport();
    await fixture.publishReport.execute({ reportId });
    const report = fixture.report(reportId);

    await expect(fixture.updateSignals.execute({ reportId, ...signals })).rejects.toThrow(
      ConflictError,
    );
    // Refused before anything is scored: signals that cannot be scored are not the answer.
    await expect(
      fixture.updateSignals.execute({ reportId, ...signals, phishingClickRatePct: 101 }),
    ).rejects.toMatchObject({ code: 'protect.report.published' });
    expect(fixture.report(reportId)).toEqual(report);
  });
});
