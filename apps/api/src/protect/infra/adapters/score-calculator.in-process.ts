import { Injectable } from '@nestjs/common';

import {
  type SecurityScore,
  ScoreCalculator,
} from 'src/protect/domain/ports/score-calculator.port';
import type { SecuritySignals } from 'src/protect/domain/report/security-signals';
import { scoreSignals } from 'src/scoring/public-api';

/** Scores reports with the scoring context, in the same process. */
@Injectable()
export class InProcessScoreCalculator implements ScoreCalculator {
  async score(signals: SecuritySignals): Promise<SecurityScore> {
    return scoreSignals(signals);
  }
}
