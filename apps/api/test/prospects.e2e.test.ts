import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

import type { Db } from 'src/core/infra/db/database';
import { company, quote } from 'src/distribution/infra/db/schema';

import { createTestApp, prospectInput } from './helpers';

describe('Prospects (e2e)', () => {
  let app: INestApplication;
  let db: Db;

  const api = () => request(app.getHttpServer());

  beforeAll(async () => {
    ({ app, db } = await createTestApp());
  });
  afterAll(() => app.close());

  it('creates a company and its draft quote, priced by the pricing context', async () => {
    const { body: created } = await api()
      .post('/api/distribution/prospects')
      .send(prospectInput)
      .expect(201);
    const { body } = await api().get(`/api/distribution/prospects/${created.id}`).expect(200);

    expect(body.company).toMatchObject(prospectInput);
    expect(body.quote).toMatchObject({
      status: 'draft',
      coverageLimitCents: 50_000_000,
      deductibleCents: 500_000,
      options: [],
      premiumCents: 150_000, // 1,500 EUR base premium, every factor at 1
      contract: null,
    });
  });

  it('rejects a company above the maximum eligible revenue and saves nothing', async () => {
    const { body } = await api()
      .post('/api/distribution/prospects')
      .send({ ...prospectInput, annualRevenueCents: 5_000_000_001 })
      .expect(422);

    expect(body).toMatchObject({ code: 'pricing.revenueNotEligible' });
    expect(await db.$count(company)).toBe(0);
  });

  it('rejects an invalid body', async () => {
    await api()
      .post('/api/distribution/prospects')
      .send({ ...prospectInput, name: ' ' })
      .expect(400);
  });

  it('lists the prospects', async () => {
    await api().post('/api/distribution/prospects').send(prospectInput).expect(201);

    const { body } = await api().get('/api/distribution/prospects').expect(200);

    expect(body).toEqual([
      expect.objectContaining({
        name: 'Acme Robotics',
        latestQuote: expect.objectContaining({
          premiumCents: 150_000,
          coverageLimitCents: 50_000_000,
          deductibleCents: 500_000,
          options: [],
        }),
      }),
    ]);
  });

  it('deletes a prospect, with its quote', async () => {
    const { body: created } = await api()
      .post('/api/distribution/prospects')
      .send(prospectInput)
      .expect(201);

    await api().delete(`/api/distribution/prospects/${created.id}`).expect(204);

    await api().get(`/api/distribution/prospects/${created.id}`).expect(404);
    expect(await db.$count(quote)).toBe(0);
  });
});
