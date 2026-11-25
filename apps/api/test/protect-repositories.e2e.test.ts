import type { INestApplication } from '@nestjs/common';

import { AssessmentRepository } from 'src/protect/domain/ports/assessment-repository.port';
import { CompanyRepository } from 'src/protect/domain/ports/company-repository.port';
import { describeAssessmentRepository } from 'src/protect/tests/contracts/assessment-repository.contract';

import { createTestApp } from './helpers';

// The Drizzle adapters keep the promises of the in-memory ones (see src/protect/tests/contracts).
let app: INestApplication;

beforeAll(async () => {
  ({ app } = await createTestApp());
});
afterAll(() => app.close());

describeAssessmentRepository('Drizzle', async () => ({
  repository: app.get(AssessmentRepository),
  givenCompany: (company) => app.get(CompanyRepository).save(company),
}));
