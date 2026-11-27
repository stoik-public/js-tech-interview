/** The signals a security score is computed from, one per squad. */
export const SIGNALS = ['phishingClickRatePct', 'leakedPasswords', 'unhandledAlerts'] as const;

export type Signal = (typeof SIGNALS)[number];

/**
 * Whole numbers: the percentage of employees who clicked the last fake phishing email (Human
 * Security), the company passwords found leaked online (Technical Risk), and the security alerts
 * left unhandled for more than a week (Managed Defense).
 */
export type SecuritySignals = Record<Signal, number>;

export const SECURITY_LEVELS = ['Critical', 'Weak', 'Good'] as const;

export type SecurityLevel = (typeof SECURITY_LEVELS)[number];

/** "Up to `upTo`, take `penalty` points off". `upTo: null` is the last tier: any value above. */
export type PenaltyTier = { upTo: number | null; penalty: number };

/** The penalty tiers and levels a security score is computed from. */
export type ScoringRules = {
  /** Sorted by ascending `upTo`, per signal. A value above the last tier cannot be scored. */
  penalties: Record<Signal, PenaltyTier[]>;
  /** Sorted by ascending `below`. The last level has no `below`: it goes up to 100. */
  levels: { level: SecurityLevel; below?: number }[];
};

// Fictional scoring rules, owned by the security team.
export const SCORING_RULES: ScoringRules = {
  penalties: {
    phishingClickRatePct: [
      { upTo: 5, penalty: 0 },
      { upTo: 15, penalty: 10 },
      { upTo: 30, penalty: 20 },
      { upTo: 100, penalty: 30 },
    ],
    leakedPasswords: [
      { upTo: 0, penalty: 0 },
      { upTo: 2, penalty: 10 },
      { upTo: 5, penalty: 20 },
      { upTo: null, penalty: 30 },
    ],
    unhandledAlerts: [
      { upTo: 0, penalty: 0 },
      { upTo: 3, penalty: 5 },
      { upTo: 10, penalty: 15 },
      { upTo: null, penalty: 25 },
    ],
  },
  levels: [{ level: 'Weak', below: 70 }, { level: 'Good' }],
};
