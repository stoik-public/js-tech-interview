import { InMemoryReportRepository } from 'src/protect/infra/adapters/report-repository.in-memory';

import { describeReportRepository } from './contracts/report-repository.contract';

describeReportRepository('in-memory', async () => ({
  repository: new InMemoryReportRepository(),
  givenCompany: async () => {},
}));
