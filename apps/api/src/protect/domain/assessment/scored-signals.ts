import type { SecuritySignals } from 'src/protect/domain/assessment/security-signals';
import type {
  AssessmentScore,
  ScoreCalculator,
} from 'src/protect/domain/ports/score-calculator.port';

/**
 * Signals with their score. Only `score` builds one, so an assessment never stores signals that
 * were not scored, nor a score of other signals.
 */
export class ScoredSignals {
  private constructor(
    readonly signals: SecuritySignals,
    readonly result: AssessmentScore,
  ) {}

  /** Throws a BusinessRuleError when the signals cannot be scored (see ScoreCalculator). */
  static async score(
    calculator: ScoreCalculator,
    signals: SecuritySignals,
  ): Promise<ScoredSignals> {
    const { phishingClickRatePct, leakedPasswords, unhandledAlerts } = signals;
    const copy = { phishingClickRatePct, leakedPasswords, unhandledAlerts };
    return new ScoredSignals(copy, await calculator.score(copy));
  }
}
