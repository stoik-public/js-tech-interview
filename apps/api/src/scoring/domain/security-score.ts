import { BusinessRuleError } from 'src/core/domain/errors';
import { ScoringError } from 'src/scoring/domain/error';
import {
  type SecurityLevel,
  SIGNALS,
  type ScoringRules,
  type SecuritySignals,
  type Signal,
} from 'src/scoring/domain/scoring-rules';

/** One line per signal: its value, the tier it falls in and the points that tier takes off. */
export type ScoreBreakdownLine = {
  signal: Signal;
  value: number;
  /** The upper bound of the tier, or null for the last, open-ended tier. */
  tierUpTo: number | null;
  penalty: number;
};

/** Everything needed to explain a score: 100 minus `totalPenalty`, the sum of the lines. */
export type ScoreBreakdown = {
  lines: ScoreBreakdownLine[];
  totalPenalty: number;
};

export type ScoreResult = {
  score: number;
  level: SecurityLevel;
  breakdown: ScoreBreakdown;
};

/**
 * score = 100 - penalty(phishing click rate) - penalty(leaked passwords) - penalty(unhandled alerts)
 *
 * Each penalty comes from the first tier of its signal whose `upTo` includes the value. The level
 * is the first one whose `below` is above the score. Pure function: no database, no clock, and the
 * scoring rules are an argument. The lines of the breakdown always add up to the score.
 */
export function computeSecurityScore(signals: SecuritySignals, rules: ScoringRules): ScoreResult {
  const lines = SIGNALS.map((signal): ScoreBreakdownLine => {
    const value = signals[signal];
    if (!Number.isInteger(value) || value < 0) {
      throw new BusinessRuleError(
        ScoringError.InvalidSignal,
        `${signal} must be a whole number, 0 or more`,
      );
    }
    const tier = rules.penalties[signal].find((t) => t.upTo === null || value <= t.upTo);
    if (!tier) {
      throw new BusinessRuleError(
        ScoringError.SignalOutOfRange,
        `${signal} cannot be above ${rules.penalties[signal].at(-1)?.upTo}`,
      );
    }
    return { signal, value, tierUpTo: tier.upTo, penalty: tier.penalty };
  });

  const totalPenalty = lines.reduce((sum, line) => sum + line.penalty, 0);
  const score = 100 - totalPenalty;
  const level = rules.levels.find((b) => b.below === undefined || score < b.below);
  if (!level) throw new Error(`The scoring rules have no level for a score of ${score}`);

  return { score, level: level.level, breakdown: { lines, totalPenalty } };
}
