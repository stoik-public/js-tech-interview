import { scaleOf, type ScoreScale } from 'src/scoring/domain/scale';
import { SCORING_RULES, type SecuritySignals } from 'src/scoring/domain/scoring-rules';
import { computeSecurityScore, type ScoreResult } from 'src/scoring/domain/security-score';

// The only place that decides which scoring rules are in force.

/** The security score of a report's signals under the scoring rules in force. */
export const scoreSignals = (signals: SecuritySignals): ScoreResult =>
  computeSecurityScore(signals, SCORING_RULES);

/** The security level legend under the scoring rules in force. */
export const scoreScale = (): ScoreScale => scaleOf(SCORING_RULES);
