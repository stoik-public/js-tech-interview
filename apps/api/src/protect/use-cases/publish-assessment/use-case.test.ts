import { ConflictError } from 'src/core/domain/errors';
import { ProtectFixture } from 'src/protect/tests/fixtures/protect.fixture';

describe('PublishAssessmentUseCase', () => {
  let fixture: ProtectFixture;

  beforeEach(() => {
    fixture = new ProtectFixture();
  });

  it('freezes the draft as a report, with its score, band and breakdown', async () => {
    const { assessmentId } = await fixture.givenADraftAssessment();
    const draft = fixture.assessment(assessmentId);
    fixture.clock.current = new Date('2026-04-01T08:00:00Z');

    await fixture.publishAssessment.execute({ assessmentId });

    expect(fixture.assessment(assessmentId)).toEqual({
      ...draft,
      status: 'published',
      publishedAt: new Date('2026-04-01T08:00:00Z'),
      updatedAt: new Date('2026-04-01T08:00:00Z'),
    });
  });

  it('fails on an unknown assessment', async () => {
    await expect(
      fixture.publishAssessment.execute({ assessmentId: 'unknown' }),
    ).rejects.toMatchObject({ code: 'protect.assessment.notFound' });
  });

  it('publishes an assessment only once', async () => {
    const { assessmentId } = await fixture.givenADraftAssessment();
    await fixture.publishAssessment.execute({ assessmentId });
    const report = fixture.assessment(assessmentId);
    fixture.clock.current = new Date('2026-05-01T08:00:00Z');

    await expect(fixture.publishAssessment.execute({ assessmentId })).rejects.toThrow(
      ConflictError,
    );
    expect(fixture.assessment(assessmentId)).toEqual(report);
  });
});
