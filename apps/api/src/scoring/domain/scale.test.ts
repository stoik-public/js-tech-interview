import { scaleOf } from 'src/scoring/domain/scale';
import { SCORING_RULES, type ScoringRules } from 'src/scoring/domain/scoring-rules';

describe('scaleOf', () => {
  it('gives the scores of each band, from 0 to 100', () => {
    expect(scaleOf(SCORING_RULES)).toEqual({
      bands: [
        { band: 'Weak', minScore: 0, maxScore: 69 },
        { band: 'Good', minScore: 70, maxScore: 100 },
      ],
    });
  });

  it('follows the bands of the rules it is given, without the penalties', () => {
    const rules: ScoringRules = {
      ...SCORING_RULES,
      bands: [{ band: 'Critical', below: 50 }, { band: 'Weak', below: 70 }, { band: 'Good' }],
    };

    expect(scaleOf(rules).bands).toEqual([
      { band: 'Critical', minScore: 0, maxScore: 49 },
      { band: 'Weak', minScore: 50, maxScore: 69 },
      { band: 'Good', minScore: 70, maxScore: 100 },
    ]);
  });
});
