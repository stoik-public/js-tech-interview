import type { Band, ScoringRules } from 'src/scoring/domain/scoring-rules';

/** The band legend: the scores each band covers, from the lowest band up. */
export type ScoreScale = {
  bands: { band: Band; minScore: number; maxScore: number }[];
};

export function scaleOf(rules: ScoringRules): ScoreScale {
  return {
    bands: rules.bands.map(({ band, below }, index) => ({
      band,
      minScore: rules.bands[index - 1]?.below ?? 0,
      maxScore: below === undefined ? 100 : below - 1,
    })),
  };
}
