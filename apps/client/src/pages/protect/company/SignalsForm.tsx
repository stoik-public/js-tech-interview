import { useState } from 'react';

import type { Signal } from '../../../lib/types';
import { Card } from '../../../ui/Card';
import { TextInput } from '../../../ui/TextInput';
import { SIGNAL_DESCRIPTIONS, SIGNAL_LABELS, SIGNALS } from '../score';
import type { ReportSession } from './useLiveReport';

/** Every valid change is saved and re-scored by the API (see useLiveReport). */
export function SignalsForm({ session }: { session: ReportSession }) {
  // An error shows once the field was left, not while the broker is typing.
  const [touched, setTouched] = useState<Set<Signal>>(new Set());

  return (
    <Card title="Signals">
      <div className="space-y-5">
        {SIGNALS.map((signal) => (
          <TextInput
            key={signal}
            name={signal}
            label={SIGNAL_LABELS[signal]}
            description={SIGNAL_DESCRIPTIONS[signal]}
            inputMode="numeric"
            value={session.inputs[signal]}
            error={touched.has(signal) ? session.fieldErrors[signal] : null}
            onChange={(event) => session.update(signal, event.target.value)}
            onBlur={() => setTouched((current) => new Set(current).add(signal))}
          />
        ))}
      </div>
    </Card>
  );
}
