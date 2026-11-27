import { ConflictError } from 'src/core/domain/errors';
import { ACME_SIGNALS } from 'src/protect/tests/builders';
import { ProtectFixture } from 'src/protect/tests/fixtures/protect.fixture';

describe('StartReportUseCase', () => {
  let fixture: ProtectFixture;

  beforeEach(() => {
    fixture = new ProtectFixture();
  });

  it("starts a draft from the signals of the company's latest report", async () => {
    const { companyId, reportId } = await fixture.givenADraftReport();
    await fixture.publishReport.execute({ reportId });
    fixture.clock.current = new Date('2026-04-01T08:00:00Z');

    const draft = await fixture.startReport.execute({ companyId });

    expect(fixture.report(draft.id)).toMatchObject({
      companyId,
      status: 'draft',
      signals: ACME_SIGNALS,
      result: fixture.report(reportId).result,
      createdAt: new Date('2026-04-01T08:00:00Z'),
      publishedAt: null,
    });
  });

  it('starts a first report with no signals', async () => {
    const companyId = await fixture.givenACompany();

    const draft = await fixture.startReport.execute({ companyId });

    expect(fixture.report(draft.id)).toMatchObject({
      signals: { phishingClickRatePct: 0, leakedPasswords: 0, unhandledAlerts: 0 },
      result: { score: 100, level: 'Good' },
    });
  });

  it('refuses a second report in progress', async () => {
    const { companyId } = await fixture.givenADraftReport();

    await expect(fixture.startReport.execute({ companyId })).rejects.toThrow(ConflictError);
    expect(fixture.reports.snapshots.size).toBe(1);
  });

  it('fails on an unknown company', async () => {
    await expect(fixture.startReport.execute({ companyId: 'unknown' })).rejects.toMatchObject({
      code: 'protect.company.notFound',
    });
  });
});
