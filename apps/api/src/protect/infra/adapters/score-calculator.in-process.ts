import { Injectable } from '@nestjs/common';

import type { SecuritySignals } from 'src/protect/domain/assessment/security-signals';
import {
  type AssessmentScore,
  ScoreCalculator,
} from 'src/protect/domain/ports/score-calculator.port';
import { scoreAssessment } from 'src/scoring/public-api';

/** Scores assessments with the scoring context, in the same process. */
@Injectable()
export class InProcessScoreCalculator implements ScoreCalculator {
  async score(signals: SecuritySignals): Promise<AssessmentScore> {
    return scoreAssessment(signals);
  }
}
