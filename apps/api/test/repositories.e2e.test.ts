import type { INestApplication } from '@nestjs/common';

import { CompanyRepository } from 'src/distribution/domain/ports/company-repository.port';
import { ContractRepository } from 'src/distribution/domain/ports/contract-repository.port';
import { QuoteRepository } from 'src/distribution/domain/ports/quote-repository.port';
import { describeContractRepository } from 'src/distribution/tests/contracts/contract-repository.contract';
import { describeQuoteRepository } from 'src/distribution/tests/contracts/quote-repository.contract';

import { createTestApp } from './helpers';

// The Drizzle adapters keep the promises of the in-memory ones (see src/distribution/tests/contracts).
let app: INestApplication;

beforeAll(async () => {
  ({ app } = await createTestApp());
});
afterAll(() => app.close());

describeQuoteRepository('Drizzle', async () => ({
  repository: app.get(QuoteRepository),
  givenCompany: (company) => app.get(CompanyRepository).save(company),
}));

describeContractRepository('Drizzle', async () => ({
  repository: app.get(ContractRepository),
  givenQuote: async (company, quote) => {
    await app.get(CompanyRepository).save(company);
    await app.get(QuoteRepository).save(quote);
  },
}));
