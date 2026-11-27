/**
 * What other contexts may use from scoring, from their `.in-process` adapters only.
 *
 * The security team owns the scoring rules: the tiers, the penalties and the levels. Other contexts
 * get a score, a security level and its breakdown, never the rules themselves.
 */
export { scoreSignals } from 'src/scoring/domain/scoring';
