import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { createTestApp } from './helpers';

describe('Developer routes (e2e)', () => {
  let app: INestApplication;

  const api = () => request(app.getHttpServer());

  beforeAll(async () => {
    ({ app } = await createTestApp());
  });
  afterAll(() => app.close());

  it('lists the API routes with their body schema', async () => {
    const { body } = await api().get('/api/dev/routes').expect(200);

    expect(body).toContainEqual(
      expect.objectContaining({
        method: 'PUT',
        path: '/api/distribution/quotes/:quoteId',
        context: 'distribution',
        bodySchema: expect.objectContaining({
          required: ['annualRevenueCents', 'coverageLimitCents', 'deductibleCents', 'options'],
        }),
      }),
    );
    expect(body.map((route: { path: string }) => route.path)).not.toContain('/api/dev/routes');
  });

  it('lists the routes of the bounded contexts of a test only', async () => {
    const { body } = await api().get('/api/dev/routes?test=insurance').expect(200);

    const contexts = new Set(body.map((route: { context: string }) => route.context));
    expect([...contexts].sort()).toEqual(['distribution', 'pricing']);
    await api().get('/api/dev/routes?test=unknown').expect(404);
  });

  it('lists the tests and their bounded contexts', async () => {
    const { body } = await api().get('/api/dev/tests').expect(200);

    expect(body).toEqual([
      { id: 'insurance', name: 'Insurance', contexts: ['distribution', 'pricing'] },
      { id: 'protect', name: 'Protect', contexts: ['protect', 'scoring'] },
    ]);
  });

  it('describes the tables of a test, with their keys and enums', async () => {
    const { body } = await api().get('/api/dev/data-model/insurance').expect(200);

    expect(body.tables.map((table: { id: string }) => table.id)).toEqual([
      'distribution.company',
      'distribution.quote',
      'distribution.contract',
    ]);
    const contract = body.tables.find((table: { name: string }) => table.name === 'contract');
    expect(contract.columns).toContainEqual(
      expect.objectContaining({ name: 'quoteId', primaryKey: false, unique: true }),
    );
    expect(contract.columns).toContainEqual(
      expect.objectContaining({
        name: 'options',
        type: 'CoverageOption',
        list: true,
        enumValues: expect.arrayContaining(['ransomware_extortion']),
      }),
    );
    expect(contract.foreignKeys).toContainEqual({
      columns: ['quoteId'],
      references: { table: 'distribution.quote', columns: ['id'] },
    });
    expect(body.enums).toContainEqual(
      expect.objectContaining({ name: 'QuoteStatus', values: ['draft', 'signed'] }),
    );
    await api().get('/api/dev/data-model/unknown').expect(404);
  });

  it('keeps each test to its own tables and routes', async () => {
    const { body: model } = await api().get('/api/dev/data-model/protect').expect(200);
    expect(model.tables.map((table: { id: string }) => table.id)).toEqual([
      'protect.company',
      'protect.report',
    ]);
    expect(model.enums).toContainEqual(
      expect.objectContaining({ name: 'SecurityLevel', values: ['Critical', 'Weak', 'Good'] }),
    );

    const { body: routes } = await api().get('/api/dev/routes?test=protect').expect(200);
    const contexts = new Set(routes.map((route: { context: string }) => route.context));
    expect([...contexts].sort()).toEqual(['protect', 'scoring']);
  });
});
