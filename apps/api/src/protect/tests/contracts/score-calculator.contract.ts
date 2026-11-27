import { BusinessRuleError } from 'src/core/domain/errors';
import type { ScoreCalculator } from 'src/protect/domain/ports/score-calculator.port';
import { SECURITY_LEVELS, NO_SIGNALS } from 'src/protect/domain/report/security-signals';

import { ACME_SIGNALS } from '../builders';

/**
 * What every ScoreCalculator adapter promises, so the stub cannot drift from the real one. Nothing
 * here depends on the values of the scoring rules in force.
 */
export function describeScoreCalculator(name: string, calculator: () => ScoreCalculator) {
  describe(`ScoreCalculator: ${name}`, () => {
    it('scores signals as a whole number from 0 to 100, with a level', async () => {
      const { score, level } = await calculator().score(ACME_SIGNALS);

      expect(Number.isInteger(score)).toBe(true);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
      expect(SECURITY_LEVELS).toContain(level);
    });

    it('scores 100, Good, when nothing went wrong', async () => {
      await expect(calculator().score(NO_SIGNALS)).resolves.toMatchObject({
        score: 100,
        level: 'Good',
      });
    });

    it('never scores worse signals higher', async () => {
      const worse = { ...ACME_SIGNALS, leakedPasswords: ACME_SIGNALS.leakedPasswords + 10 };

      const [acme, worst] = await Promise.all([
        calculator().score(ACME_SIGNALS),
        calculator().score(worse),
      ]);

      expect(worst.score).toBeLessThanOrEqual(acme.score);
    });

    it('rejects a click rate above 100% with a business rule', async () => {
      const failure = await calculator()
        .score({ ...ACME_SIGNALS, phishingClickRatePct: 101 })
        .catch((error: unknown) => error);

      expect(failure).toBeInstanceOf(BusinessRuleError);
      expect(failure).toMatchObject({ code: 'scoring.signalOutOfRange' });
    });
  });
}
