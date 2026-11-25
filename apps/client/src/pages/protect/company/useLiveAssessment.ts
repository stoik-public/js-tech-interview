import { useCallback, useEffect, useRef, useState } from 'react';

import { useSignalUpdates } from '../../../lib/server-state';
import type { Assessment, SecuritySignals, Signal } from '../../../lib/types';
import { SIGNALS } from '../score';

const DEBOUNCE_MS = 300;

/** What the inputs hold: text, so a field can be emptied while typing. */
export type SignalInputs = Record<Signal, string>;

export type AssessmentSession = {
  inputs: SignalInputs;
  update: (signal: Signal, value: string) => void;
  /** Why each field cannot be saved, or null. */
  fieldErrors: Record<Signal, string | null>;
  /** A change is waiting or being saved: the score shown is out of date. */
  isUpdating: boolean;
  /** Why the last change could not be saved. The signals shown are kept. */
  error: Error | null;
  /** Why the assessment cannot be published now, or null. */
  blockedReason: string | null;
};

type Change = { assessmentId: string; signals: SecuritySignals; changeId: number };

export function signalError(signal: Signal, input: string): string | null {
  if (input.trim() === '') return 'Enter a value';
  const value = Number(input);
  if (!Number.isInteger(value) || value < 0) return 'Enter a whole number, 0 or more';
  if (signal === 'phishingClickRatePct' && value > 100) return 'Enter a percentage up to 100';
  return null;
}

const toInputs = (signals: SecuritySignals): SignalInputs => ({
  phishingClickRatePct: String(signals.phishingClickRatePct),
  leakedPasswords: String(signals.leakedPasswords),
  unhandledAlerts: String(signals.unhandledAlerts),
});

const errorsOf = (inputs: SignalInputs) =>
  Object.fromEntries(
    SIGNALS.map((signal) => [signal, signalError(signal, inputs[signal])]),
  ) as Record<Signal, string | null>;

/**
 * Local signals of a draft assessment, saved and re-scored by the API after each change
 * (debounced). Only the response to the latest change is applied, as for a quote (see useLiveQuote).
 */
export function useLiveAssessment(assessment: Assessment): AssessmentSession {
  const updates = useSignalUpdates(assessment.companyId);
  const [inputs, setInputs] = useState(() => toInputs(assessment.signals));
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [syncedAt, setSyncedAt] = useState(assessment.updatedAt);
  const latestChangeId = useRef(0);
  const debounceTimer = useRef<number | undefined>(undefined);
  const waiting = useRef<Change | null>(null);

  // The draft changed elsewhere (another tab, the API explorer) while nothing is being saved here.
  if (assessment.updatedAt !== syncedAt && !isUpdating) {
    setSyncedAt(assessment.updatedAt);
    setInputs(toInputs(assessment.signals));
  }

  const save = useCallback(
    async ({ assessmentId, signals, changeId }: Change) => {
      let response: Assessment | null = null;
      let failure: Error | null = null;
      try {
        response = await updates.save(assessmentId, signals);
      } catch (e) {
        failure = e instanceof Error ? e : new Error('Could not update the signals');
      }
      if (changeId !== latestChangeId.current) return;

      setIsUpdating(false);
      setError(failure);
      if (response) {
        setSyncedAt(response.updatedAt);
        updates.applySaved(response);
      }
    },
    [updates],
  );

  // A change made just before leaving the page is saved now: waiting for the debounce would drop it.
  useEffect(
    () => () => {
      if (!waiting.current) return;
      window.clearTimeout(debounceTimer.current);
      void save(waiting.current);
      waiting.current = null;
    },
    [save],
  );

  const fieldErrors = errorsOf(inputs);

  function update(signal: Signal, value: string) {
    const next = { ...inputs, [signal]: value };
    setInputs(next);
    const changeId = ++latestChangeId.current;
    window.clearTimeout(debounceTimer.current);
    waiting.current = null;
    setError(null);

    if (Object.values(errorsOf(next)).some(Boolean)) {
      setIsUpdating(false);
      return;
    }
    const signals = {
      phishingClickRatePct: Number(next.phishingClickRatePct),
      leakedPasswords: Number(next.leakedPasswords),
      unhandledAlerts: Number(next.unhandledAlerts),
    };
    setIsUpdating(true);
    waiting.current = { assessmentId: assessment.id, signals, changeId };
    debounceTimer.current = window.setTimeout(() => {
      const change = waiting.current;
      waiting.current = null;
      if (change) void save(change);
    }, DEBOUNCE_MS);
  }

  const invalid = Object.values(fieldErrors).some(Boolean);
  const blockedReason = isUpdating
    ? 'Saving your changes…'
    : invalid
      ? 'Fix the signals first'
      : (error?.message ?? null);

  return { inputs, update, fieldErrors, isUpdating, error, blockedReason };
}
