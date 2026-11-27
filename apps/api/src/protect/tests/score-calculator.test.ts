import { InProcessScoreCalculator } from 'src/protect/infra/adapters/score-calculator.in-process';
import { StubScoreCalculator } from 'src/protect/infra/adapters/score-calculator.stub';

import { describeScoreCalculator } from './contracts/score-calculator.contract';

describeScoreCalculator('stub', () => new StubScoreCalculator());
describeScoreCalculator('in-process', () => new InProcessScoreCalculator());
