import { Entity } from 'src/core/domain/entity';
import { ConflictError } from 'src/core/domain/errors';
import type { SecurityScore } from 'src/protect/domain/ports/score-calculator.port';
import { ReportError } from 'src/protect/domain/report/error';
import type { ScoredSignals } from 'src/protect/domain/report/scored-signals';
import type { SecuritySignals } from 'src/protect/domain/report/security-signals';

export type ReportStatus = 'draft' | 'published';

export type ReportProps = {
  companyId: string;
  status: ReportStatus;
  signals: SecuritySignals;
  result: SecurityScore;
  createdAt: Date;
  updatedAt: Date;
  /** When the report became a report. Null for a draft. */
  publishedAt: Date | null;
};

/**
 * A company's security score for one month. A draft is re-scored whenever a signal changes.
 * Publishing it freezes it as the monthly report sent to the client.
 */
export class Report extends Entity<ReportProps> {
  static start({ companyId, scored }: { companyId: string; scored: ScoredSignals }, now: Date) {
    return new Report({
      companyId,
      status: 'draft',
      signals: scored.signals,
      result: scored.result,
      createdAt: now,
      updatedAt: now,
      publishedAt: null,
    });
  }

  static hydrate(props: ReportProps, id: string): Report {
    return new Report(props, id);
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
      throw new ConflictError(ReportError.Published, 'A published report is read-only');
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
