import { Entity } from 'src/core/domain/entity';
import { ConflictError } from 'src/core/domain/errors';
import { AssessmentError } from 'src/protect/domain/assessment/error';
import type { ScoredSignals } from 'src/protect/domain/assessment/scored-signals';
import type { SecuritySignals } from 'src/protect/domain/assessment/security-signals';
import type { AssessmentScore } from 'src/protect/domain/ports/score-calculator.port';

export type AssessmentStatus = 'draft' | 'published';

export type AssessmentProps = {
  companyId: string;
  status: AssessmentStatus;
  signals: SecuritySignals;
  result: AssessmentScore;
  createdAt: Date;
  updatedAt: Date;
  /** When the assessment became a report. Null for a draft. */
  publishedAt: Date | null;
};

/**
 * A company's security score for one month. A draft is re-scored whenever a signal changes.
 * Publishing it freezes it as the monthly report sent to the client.
 */
export class Assessment extends Entity<AssessmentProps> {
  static start({ companyId, scored }: { companyId: string; scored: ScoredSignals }, now: Date) {
    return new Assessment({
      companyId,
      status: 'draft',
      signals: scored.signals,
      result: scored.result,
      createdAt: now,
      updatedAt: now,
      publishedAt: null,
    });
  }

  static hydrate(props: AssessmentProps, id: string): Assessment {
    return new Assessment(props, id);
  }

  get companyId(): string {
    return this.props.companyId;
  }

  get signals(): SecuritySignals {
    return { ...this.props.signals };
  }

  /** Lets a use case refuse a report before it spends time scoring. `rescore` checks again. */
  assertDraft(): void {
    if (this.props.status !== 'draft') {
      throw new ConflictError(AssessmentError.Published, 'A published assessment is read-only');
    }
  }

  /** New signals with their score. Only a draft can change. */
  rescore(scored: ScoredSignals, now: Date): void {
    this.assertDraft();
    this.props.signals = scored.signals;
    this.props.result = scored.result;
    this.props.updatedAt = now;
  }

  /** Freezes the draft as the report sent to the client: its score never changes again. */
  publish(now: Date): void {
    this.assertDraft();
    this.props.status = 'published';
    this.props.publishedAt = now;
    this.props.updatedAt = now;
  }
}
