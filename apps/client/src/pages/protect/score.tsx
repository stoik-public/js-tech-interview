import type { Band, ScoreBreakdown, Signal } from '../../lib/types';
import { Badge, type Tone } from '../../ui/Badge';

const BAND_TONES: Record<Band, Tone> = { Critical: 'red', Weak: 'orange', Good: 'green' };

/** Bar fills of the score chart: different lightness too, so the bands differ without color. */
export const BAND_FILLS: Record<Band, string> = {
  Critical: 'bg-red-7',
  Weak: 'bg-orange-5',
  Good: 'bg-green-6',
};

export const SIGNAL_LABELS: Record<Signal, string> = {
  phishingClickRatePct: 'Phishing click rate',
  leakedPasswords: 'Leaked passwords',
  unhandledAlerts: 'Unhandled alerts',
};

/** What each signal measures, and the squad that owns it. */
export const SIGNAL_DESCRIPTIONS: Record<Signal, string> = {
  phishingClickRatePct: 'Employees who clicked the fake phishing email, in %. Human Security.',
  leakedPasswords: 'Company passwords found leaked online. Technical Risk.',
  unhandledAlerts: 'Security alerts left unhandled for more than a week. Managed Defense.',
};

export const SIGNALS: Signal[] = ['phishingClickRatePct', 'leakedPasswords', 'unhandledAlerts'];

export const formatSignal = (signal: Signal, value: number) =>
  signal === 'phishingClickRatePct' ? `${value}%` : String(value);

export function BandBadge({ band }: { band: Band }) {
  return <Badge tone={BAND_TONES[band]}>{band}</Badge>;
}

/** "Nov 2026": a report is the one of its month. */
export const formatMonth = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' });

/** The score as a receipt: 100, one penalty per signal, then the score. */
export function ScoreLines({ breakdown, score }: { breakdown: ScoreBreakdown; score: number }) {
  return (
    <dl className="space-y-2">
      <Line label="Starting score" value="100" />
      {breakdown.lines.map(({ signal, value, tierUpTo, penalty }) => (
        <Line
          key={signal}
          label={SIGNAL_LABELS[signal]}
          detail={`${formatSignal(signal, value)}, ${tierUpTo === null ? 'top tier' : `tier up to ${formatSignal(signal, tierUpTo)}`}`}
          value={penalty === 0 ? '0' : `−${penalty}`}
        />
      ))}
      <div className="border-gray-2 border-t pt-2 font-medium">
        <Line label="Security score" value={String(score)} />
      </div>
    </dl>
  );
}

function Line({ label, detail, value }: { label: string; detail?: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt>
        {label}
        {detail && <span className="text-gray-6 block text-xs">{detail}</span>}
      </dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
