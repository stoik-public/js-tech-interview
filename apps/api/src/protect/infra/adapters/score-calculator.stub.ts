import { BusinessRuleError } from 'src/core/domain/errors';
import type { SecuritySignals } from 'src/protect/domain/assessment/security-signals';
import {
  type AssessmentScore,
  ScoreCalculator,
} from 'src/protect/domain/ports/score-calculator.port';

/**
 * Predictable scores for tests: 100, minus 1 point per 2% of clicks, minus 5 points per leaked
 * password and per unhandled alert, never below 0. Critical below 50, Weak below 70.
 */
export class StubScoreCalculator implements ScoreCalculator {
  async score(signals: SecuritySignals): Promise<AssessmentScore> {
    if (signals.phishingClickRatePct > 100) {
      throw new BusinessRuleError('scoring.signalOutOfRange', 'Out of range');
    }
    const penalty =
      Math.floor(signals.phishingClickRatePct / 2) +
      5 * signals.leakedPasswords +
      5 * signals.unhandledAlerts;
    const score = Math.max(0, 100 - penalty);
    const band = score < 50 ? 'Critical' : score < 70 ? 'Weak' : 'Good';
    return { score, band, breakdown: { ...signals } };
  }
}
