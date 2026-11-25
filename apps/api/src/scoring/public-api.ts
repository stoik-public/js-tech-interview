/**
 * What other contexts may use from scoring, from their `.in-process` adapters only.
 *
 * The security team owns the scoring rules: the tiers, the penalties and the bands. Other contexts
 * get a score, a band and its breakdown, never the rules themselves.
 */
export { scoreAssessment } from 'src/scoring/domain/scoring';
