import { InMemoryAssessmentRepository } from 'src/protect/infra/adapters/assessment-repository.in-memory';

import { describeAssessmentRepository } from './contracts/assessment-repository.contract';

describeAssessmentRepository('in-memory', async () => ({
  repository: new InMemoryAssessmentRepository(),
  givenCompany: async () => {},
}));
