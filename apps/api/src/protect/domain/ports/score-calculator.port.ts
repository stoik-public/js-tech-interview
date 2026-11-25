import type { Band, SecuritySignals } from 'src/protect/domain/assessment/security-signals';

/** A score out of 100, its band and what explains it. The breakdown is only stored and displayed here. */
export type AssessmentScore = {
  score: number;
  band: Band;
  breakdown: Record<string, unknown>;
};

/**
 * Implemented by the scoring context. Every adapter keeps these promises (see
 * tests/contracts/score-calculator.contract.ts): a score is a whole number from 0 to 100, worse
 * signals never score higher, and signals that cannot be scored are a BusinessRuleError.
 */
export abstract class ScoreCalculator {
  /** Throws a BusinessRuleError when the signals cannot be scored (out of range). */
  abstract score(signals: SecuritySignals): Promise<AssessmentScore>;
}
