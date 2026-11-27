import type { INestApplication } from '@nestjs/common';

import { CompanyRepository } from 'src/protect/domain/ports/company-repository.port';
import { ReportRepository } from 'src/protect/domain/ports/report-repository.port';
import { describeReportRepository } from 'src/protect/tests/contracts/report-repository.contract';

import { createTestApp } from './helpers';

// The Drizzle adapters keep the promises of the in-memory ones (see src/protect/tests/contracts).
let app: INestApplication;

beforeAll(async () => {
  ({ app } = await createTestApp());
});
afterAll(() => app.close());

describeReportRepository('Drizzle', async () => ({
  repository: app.get(ReportRepository),
  givenCompany: (company) => app.get(CompanyRepository).save(company),
}));
