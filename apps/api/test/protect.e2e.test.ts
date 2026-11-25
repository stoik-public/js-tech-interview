import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

import type { Db } from 'src/core/infra/db/database';
import * as tables from 'src/protect/infra/db/schema';

import { createTestApp } from './helpers';

describe('Protect: assessments and reports (e2e)', () => {
  let app: INestApplication;
  let db: Db;
  let companyId: string;

  const api = () => request(app.getHttpServer());
  const acme = { phishingClickRatePct: 18, leakedPasswords: 3, unhandledAlerts: 2 };

  /** Starts a draft and gives it the signals of Acme Logistics. */
  async function givenADraft(): Promise<string> {
    const { body } = await api()
      .post(`/api/protect/companies/${companyId}/assessments`)
      .expect(201);
    await api().put(`/api/protect/assessments/${body.id}`).send(acme).expect(200);
    return body.id;
  }

  beforeAll(async () => {
    ({ app, db } = await createTestApp());
  });
  beforeEach(async () => {
    [{ id: companyId }] = await db
      .insert(tables.company)
      .values({ name: 'Acme Logistics' })
      .returning({ id: tables.company.id });
  });
  afterAll(() => app.close());

  it('starts a first assessment with no signals', async () => {
    const { body } = await api()
      .post(`/api/protect/companies/${companyId}/assessments`)
      .expect(201);

    expect(body).toMatchObject({
      companyId,
      status: 'draft',
      signals: { phishingClickRatePct: 0, leakedPasswords: 0, unhandledAlerts: 0 },
      score: 100,
      band: 'Good',
      publishedAt: null,
    });
    await api().post(`/api/protect/companies/${companyId}/assessments`).expect(409);
    await api().post('/api/protect/companies/unknown/assessments').expect(404);
  });

  it('re-scores a draft when its signals change, with a breakdown that adds up', async () => {
    const { body: draft } = await api()
      .post(`/api/protect/companies/${companyId}/assessments`)
      .expect(201);

    const { body } = await api().put(`/api/protect/assessments/${draft.id}`).send(acme).expect(200);

    expect(body).toMatchObject({ signals: acme, score: 55, band: 'Weak' });
    expect(body.scoreBreakdown).toEqual({
      lines: [
        { signal: 'phishingClickRatePct', value: 18, tierUpTo: 30, penalty: 20 },
        { signal: 'leakedPasswords', value: 3, tierUpTo: 5, penalty: 20 },
        { signal: 'unhandledAlerts', value: 2, tierUpTo: 3, penalty: 5 },
      ],
      totalPenalty: 45,
    });
    const { body: detail } = await api().get(`/api/protect/companies/${companyId}`).expect(200);
    expect(detail.draft).toMatchObject({ id: draft.id, score: 55, band: 'Weak' });
  });

  it('rejects signals out of range', async () => {
    const assessmentId = await givenADraft();

    await api()
      .put(`/api/protect/assessments/${assessmentId}`)
      .send({ ...acme, phishingClickRatePct: 101 })
      .expect(400);
    await api()
      .put(`/api/protect/assessments/${assessmentId}`)
      .send({ ...acme, leakedPasswords: -1 })
      .expect(400);
  });

  it('publishes a draft as a report, which is never re-scored', async () => {
    const assessmentId = await givenADraft();

    const { body: report } = await api()
      .post(`/api/protect/assessments/${assessmentId}/publish`)
      .expect(201);
    expect(report).toMatchObject({ status: 'published', score: 55, band: 'Weak' });
    expect(report.publishedAt).toEqual(expect.any(String));

    const { body } = await api()
      .put(`/api/protect/assessments/${assessmentId}`)
      .send({ phishingClickRatePct: 0, leakedPasswords: 0, unhandledAlerts: 0 })
      .expect(409);
    expect(body.code).toBe('protect.assessment.published');
    await api().post(`/api/protect/assessments/${assessmentId}/publish`).expect(409);

    const { body: read } = await api().get(`/api/protect/reports/${assessmentId}`).expect(200);
    expect(read).toMatchObject({
      score: 55,
      band: 'Weak',
      signals: acme,
      company: { id: companyId, name: 'Acme Logistics' },
    });
  });

  it('starts the next draft from the signals of the latest report', async () => {
    const assessmentId = await givenADraft();
    await api().post(`/api/protect/assessments/${assessmentId}/publish`).expect(201);

    const { body } = await api()
      .post(`/api/protect/companies/${companyId}/assessments`)
      .expect(201);

    expect(body).toMatchObject({ status: 'draft', signals: acme, score: 55 });
  });

  it('shows a draft as a report only once published', async () => {
    const assessmentId = await givenADraft();

    await api().get(`/api/protect/reports/${assessmentId}`).expect(404);
    await api().get('/api/protect/reports/unknown').expect(404);
  });

  it('lists the companies with their latest report and their draft', async () => {
    const first = await givenADraft();
    await api().post(`/api/protect/assessments/${first}/publish`).expect(201);
    const { body: second } = await api()
      .post(`/api/protect/companies/${companyId}/assessments`)
      .expect(201);
    await api()
      .put(`/api/protect/assessments/${second.id}`)
      .send({ ...acme, leakedPasswords: 0 })
      .expect(200);
    await db.insert(tables.company).values({ name: 'Zeta Corp' });

    const { body } = await api().get('/api/protect/companies').expect(200);

    expect(body).toEqual([
      expect.objectContaining({
        id: companyId,
        name: 'Acme Logistics',
        latestReport: expect.objectContaining({ id: first, score: 55, band: 'Weak' }),
        draft: { id: second.id, score: 75, band: 'Good' },
      }),
      expect.objectContaining({ name: 'Zeta Corp', latestReport: null, draft: null }),
    ]);
  });

  it('gives the reports of a company, newest first', async () => {
    const first = await givenADraft();
    await api().post(`/api/protect/assessments/${first}/publish`).expect(201);
    const { body: second } = await api()
      .post(`/api/protect/companies/${companyId}/assessments`)
      .expect(201);
    await api().post(`/api/protect/assessments/${second.id}/publish`).expect(201);

    const { body } = await api().get(`/api/protect/companies/${companyId}`).expect(200);

    expect(body.draft).toBeNull();
    expect(body.reports.map((report: { id: string }) => report.id)).toEqual([second.id, first]);
    await api().get('/api/protect/companies/unknown').expect(404);
  });

  it('gives the band legend of the scoring rules in force', async () => {
    const { body } = await api().get('/api/scoring/scale').expect(200);

    expect(body.bands.map((band: { band: string }) => band.band)).toEqual(['Weak', 'Good']);
  });
});
