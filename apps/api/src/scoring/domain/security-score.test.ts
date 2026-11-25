import { BusinessRuleError } from 'src/core/domain/errors';
import {
  SCORING_RULES,
  type ScoringRules,
  type SecuritySignals,
} from 'src/scoring/domain/scoring-rules';
import { computeSecurityScore } from 'src/scoring/domain/security-score';

const clean: SecuritySignals = { phishingClickRatePct: 0, leakedPasswords: 0, unhandledAlerts: 0 };

const score = (signals: SecuritySignals) => computeSecurityScore(signals, SCORING_RULES);

const scoreFor = (signals: Partial<SecuritySignals>) => score({ ...clean, ...signals }).score;

describe('computeSecurityScore', () => {
  it('scores Acme Logistics 55, Weak', () => {
    const acme = { phishingClickRatePct: 18, leakedPasswords: 3, unhandledAlerts: 2 };

    expect(score(acme)).toMatchObject({ score: 55, band: 'Weak' });
  });

  it('scores 100, Good, when no signal costs anything', () => {
    expect(score(clean)).toMatchObject({ score: 100, band: 'Good' });
  });

  it('scores with the rules it is given', () => {
    const rules: ScoringRules = {
      penalties: {
        phishingClickRatePct: [{ upTo: 100, penalty: 1 }],
        leakedPasswords: [{ upTo: null, penalty: 2 }],
        unhandledAlerts: [{ upTo: null, penalty: 3 }],
      },
      bands: [{ band: 'Critical', below: 95 }, { band: 'Good' }],
    };

    expect(computeSecurityScore(clean, rules)).toMatchObject({ score: 94, band: 'Critical' });
  });

  it('returns a breakdown with the inputs, the tiers and the penalties', () => {
    const { breakdown } = score({
      phishingClickRatePct: 18,
      leakedPasswords: 3,
      unhandledAlerts: 2,
    });

    expect(breakdown).toEqual({
      lines: [
        { signal: 'phishingClickRatePct', value: 18, tierUpTo: 30, penalty: 20 },
        { signal: 'leakedPasswords', value: 3, tierUpTo: 5, penalty: 20 },
        { signal: 'unhandledAlerts', value: 2, tierUpTo: 3, penalty: 5 },
      ],
      totalPenalty: 45,
    });
  });

  it('makes the score 100 minus the sum of the lines', () => {
    const { score: result, breakdown } = score({
      phishingClickRatePct: 40,
      leakedPasswords: 12,
      unhandledAlerts: 7,
    });

    expect(breakdown.lines.map((line) => line.penalty)).toEqual([30, 30, 15]);
    expect(result).toBe(100 - 30 - 30 - 15);
  });

  describe('penalty tiers', () => {
    it('uses the tier whose upper bound includes the value', () => {
      expect([5, 6, 15, 16, 30, 31, 100].map((p) => scoreFor({ phishingClickRatePct: p }))).toEqual(
        [100, 90, 90, 80, 80, 70, 70],
      );
      expect([0, 1, 2, 3, 5, 6, 500].map((n) => scoreFor({ leakedPasswords: n }))).toEqual([
        100, 90, 90, 80, 80, 70, 70,
      ]);
      expect([0, 1, 3, 4, 10, 11].map((n) => scoreFor({ unhandledAlerts: n }))).toEqual([
        100, 95, 95, 85, 85, 75,
      ]);
    });

    it('rejects a click rate above 100%', () => {
      expect(() => scoreFor({ phishingClickRatePct: 101 })).toThrow(
        new BusinessRuleError(
          'scoring.signalOutOfRange',
          'phishingClickRatePct cannot be above 100',
        ),
      );
    });

    it('rejects a signal that is negative or not a whole number', () => {
      expect(() => scoreFor({ leakedPasswords: -1 })).toThrow(BusinessRuleError);
      expect(() => scoreFor({ unhandledAlerts: 1.5 })).toThrow(BusinessRuleError);
    });
  });

  describe('bands', () => {
    it('is Weak below 70, Good from 70', () => {
      expect(score({ ...clean, phishingClickRatePct: 31 }).band).toBe('Good'); // 70
      expect(score({ ...clean, phishingClickRatePct: 31, unhandledAlerts: 1 }).band).toBe('Weak'); // 65
    });

    it('never goes below 0: the worst signals cost less than 100 points', () => {
      const worst = score({ phishingClickRatePct: 100, leakedPasswords: 99, unhandledAlerts: 99 });

      expect(worst.score).toBe(15);
      expect(worst.band).toBe('Weak');
    });
  });
});
