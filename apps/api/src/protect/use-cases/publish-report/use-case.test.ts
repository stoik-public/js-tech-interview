import { ConflictError } from 'src/core/domain/errors';
import { ProtectFixture } from 'src/protect/tests/fixtures/protect.fixture';

describe('PublishReportUseCase', () => {
  let fixture: ProtectFixture;

  beforeEach(() => {
    fixture = new ProtectFixture();
  });

  it('freezes the draft as a report, with its score, level and breakdown', async () => {
    const { reportId } = await fixture.givenADraftReport();
    const draft = fixture.report(reportId);
    fixture.clock.current = new Date('2026-04-01T08:00:00Z');

    await fixture.publishReport.execute({ reportId });

    expect(fixture.report(reportId)).toEqual({
      ...draft,
      status: 'published',
      publishedAt: new Date('2026-04-01T08:00:00Z'),
      updatedAt: new Date('2026-04-01T08:00:00Z'),
    });
  });

  it('fails on an unknown report', async () => {
    await expect(fixture.publishReport.execute({ reportId: 'unknown' })).rejects.toMatchObject({
      code: 'protect.report.notFound',
    });
  });

  it('publishes a report only once', async () => {
    const { reportId } = await fixture.givenADraftReport();
    await fixture.publishReport.execute({ reportId });
    const report = fixture.report(reportId);
    fixture.clock.current = new Date('2026-05-01T08:00:00Z');

    await expect(fixture.publishReport.execute({ reportId })).rejects.toThrow(ConflictError);
    expect(fixture.report(reportId)).toEqual(report);
  });
});
