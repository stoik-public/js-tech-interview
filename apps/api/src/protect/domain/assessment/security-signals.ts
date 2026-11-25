/** The signals of an assessment, one per squad. */
export const SIGNALS = ['phishingClickRatePct', 'leakedPasswords', 'unhandledAlerts'] as const;

export type Signal = (typeof SIGNALS)[number];

/**
 * Whole numbers: the percentage of employees who clicked the last fake phishing email (Human
 * Security), the company passwords found leaked online (Technical Risk), and the security alerts
 * left unhandled for more than a week (Managed Defense).
 */
export type SecuritySignals = Record<Signal, number>;

/** The signals of a company's first assessment, before anyone measured anything. */
export const NO_SIGNALS: SecuritySignals = {
  phishingClickRatePct: 0,
  leakedPasswords: 0,
  unhandledAlerts: 0,
};

/** The label of a range of scores, from the worst. */
export const BANDS = ['Critical', 'Weak', 'Good'] as const;

export type Band = (typeof BANDS)[number];
