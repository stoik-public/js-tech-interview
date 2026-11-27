import { usePublishReport } from '../../../lib/server-state';
import type { Report } from '../../../lib/types';
import { ErrorAlert } from '../../../ui/Alert';
import { Button } from '../../../ui/Button';
import { ConfirmedAction } from '../../../ui/ConfirmedAction';
import { Loader } from '../../../ui/Loader';
import { useToast } from '../../../ui/Toast';
import { Tooltip } from '../../../ui/Tooltip';
import { LevelBadge, ScoreLines } from '../score';
import type { ReportSession } from './useLiveReport';

type Props = { report: Report; session: ReportSession };

/** The score computed by the API, line by line, and the publication of the report. */
export function ScoreReceipt({ report, session }: Props) {
  const { isUpdating, error, blockedReason } = session;
  const stale = isUpdating || error;

  return (
    <aside aria-label="Score" className="border-gray-2 rounded-md border bg-white shadow-md">
      <div className="px-5 py-4">
        <div className="text-gray-7 flex items-center justify-between">
          <span>Security score</span>
          {isUpdating && <Loader className="size-4" />}
        </div>
        <p
          aria-live="polite"
          className={`mt-1 flex items-center gap-3 transition-opacity ${stale ? 'opacity-40' : ''}`}
        >
          <span className="text-[34px] leading-[1.2] font-medium tabular-nums">{report.score}</span>
          <LevelBadge level={report.level} />
        </p>
      </div>

      <div
        className={`border-gray-2 border-t px-5 py-4 transition-opacity ${stale ? 'opacity-40' : ''}`}
      >
        <ScoreLines breakdown={report.scoreBreakdown} score={report.score} />
      </div>

      <div className="border-gray-2 space-y-3 border-t px-5 py-4">
        <ErrorAlert error={error} />
        <Publication report={report} blockedReason={blockedReason} />
      </div>
    </aside>
  );
}

function Publication({ report, blockedReason }: { report: Report; blockedReason: string | null }) {
  const publish = usePublishReport();
  const toast = useToast();

  return (
    <ConfirmedAction
      trigger={(ask) => (
        <Tooltip content={blockedReason}>
          <Button
            className="w-full"
            aria-disabled={blockedReason !== null}
            onClick={() => blockedReason === null && ask()}
          >
            Publish report
          </Button>
        </Tooltip>
      )}
      title="Publish this report?"
      confirmLabel="Publish report"
      onConfirm={() => publish.mutateAsync(report.id)}
      onSuccess={() => toast('Report published')}
    >
      <p className="text-gray-7 mt-2">
        The report is sent to the client with a score of {report.score} ({report.level}). It can no
        longer be changed.
      </p>
    </ConfirmedAction>
  );
}
