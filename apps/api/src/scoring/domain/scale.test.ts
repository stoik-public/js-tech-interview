import { scaleOf } from 'src/scoring/domain/scale';
import { SCORING_RULES, type ScoringRules } from 'src/scoring/domain/scoring-rules';

describe('scaleOf', () => {
  it('gives the scores of each level, from 0 to 100', () => {
    expect(scaleOf(SCORING_RULES)).toEqual({
      levels: [
        { level: 'Weak', minScore: 0, maxScore: 69 },
        { level: 'Good', minScore: 70, maxScore: 100 },
      ],
    });
  });

  it('follows the levels of the rules it is given, without the penalties', () => {
    const rules: ScoringRules = {
      ...SCORING_RULES,
      levels: [{ level: 'Critical', below: 50 }, { level: 'Weak', below: 70 }, { level: 'Good' }],
    };

    expect(scaleOf(rules).levels).toEqual([
      { level: 'Critical', minScore: 0, maxScore: 49 },
      { level: 'Weak', minScore: 50, maxScore: 69 },
      { level: 'Good', minScore: 70, maxScore: 100 },
    ]);
  });
});
