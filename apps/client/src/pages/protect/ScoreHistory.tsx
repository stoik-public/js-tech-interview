import { Link } from 'react-router';

import type { ReportSummary, ScoreScale } from '../../lib/types';
import { Tooltip } from '../../ui/Tooltip';
import { LEVEL_FILLS, formatMonth } from './score';

const MONTHS = 12;

/**
 * The scores of the latest 12 reports, oldest first, one bar per month. The level limits are drawn
 * and labeled, each bar says its level on hover, and the reports table lists the same numbers.
 */
export function ScoreHistory({ reports, scale }: { reports: ReportSummary[]; scale?: ScoreScale }) {
  const months = reports.slice(0, MONTHS).reverse();
  const limits = scale?.levels.slice(1).map(({ level, minScore }) => ({ level, minScore })) ?? [];
  const latest = months.at(-1);

  return (
    <figure aria-label="Security score, last 12 reports">
      <div className="relative h-48 pl-8">
        {limits.map(({ level, minScore }) => (
          <div
            key={level}
            aria-hidden
            className="border-gray-3 absolute right-0 left-8 border-t border-dashed"
            style={{ bottom: `${minScore}%` }}
          >
            <span className="text-gray-6 absolute -top-2 -left-8 w-7 text-right text-[11px] tabular-nums">
              {minScore}
            </span>
            <span className="text-gray-6 absolute right-0 bottom-0.5 text-[11px]">
              {level} from here
            </span>
          </div>
        ))}
        <div className="border-gray-3 absolute right-0 bottom-0 left-8 border-t" aria-hidden />
        <ol className="relative flex h-full items-end gap-1.5">
          {months.map((report) => (
            <li key={report.id} className="flex h-full flex-1 flex-col justify-end">
              <Tooltip
                content={`${formatMonth(report.publishedAt)}: ${report.score}, ${report.level}`}
              >
                <Link
                  to={`/protect/reports/${report.id}`}
                  aria-label={`${formatMonth(report.publishedAt)}: ${report.score}, ${report.level}`}
                  className="group flex h-full flex-col justify-end"
                >
                  {report === latest && (
                    <span className="mb-1 text-center text-xs font-medium tabular-nums">
                      {report.score}
                    </span>
                  )}
                  <span
                    className={`block rounded-t-[4px] transition-opacity group-hover:opacity-80 ${LEVEL_FILLS[report.level]}`}
                    style={{ height: `${report.score}%` }}
                  />
                </Link>
              </Tooltip>
            </li>
          ))}
        </ol>
      </div>
      <ol aria-hidden className="mt-1.5 flex gap-1.5 pl-8">
        {months.map((report) => (
          <li key={report.id} className="text-gray-6 flex-1 truncate text-center text-[11px]">
            {new Date(report.publishedAt).toLocaleDateString('en-GB', {
              month: 'short',
              timeZone: 'UTC',
            })}
          </li>
        ))}
      </ol>
    </figure>
  );
}

/** What each level means, from the scoring rules in force. */
export function LevelLegend({ scale }: { scale: ScoreScale }) {
  return (
    <ul aria-label="Security levels" className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
      {[...scale.levels].reverse().map(({ level, minScore, maxScore }) => (
        <li key={level} className="flex items-center gap-1.5">
          <span aria-hidden className={`size-2.5 rounded-[2px] ${LEVEL_FILLS[level]}`} />
          <span>
            {level}{' '}
            <span className="text-gray-6 tabular-nums">
              {minScore}–{maxScore}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
