import type { SecurityLevel, ScoringRules } from 'src/scoring/domain/scoring-rules';

/** The security level legend: the scores each level covers, from the lowest level up. */
export type ScoreScale = {
  levels: { level: SecurityLevel; minScore: number; maxScore: number }[];
};

export function scaleOf(rules: ScoringRules): ScoreScale {
  return {
    levels: rules.levels.map(({ level, below }, index) => ({
      level,
      minScore: rules.levels[index - 1]?.below ?? 0,
      maxScore: below === undefined ? 100 : below - 1,
    })),
  };
}
