import { IconBuildingSkyscraper } from '@tabler/icons-react';
import { useParams } from 'react-router';

import { Page } from '../../../layout/Page';
import { PageHeader } from '../../../layout/PageHeader';
import { formatDate } from '../../../lib/format';
import { useReport } from '../../../lib/server-state';
import type { ReportDetail } from '../../../lib/types';
import { ErrorAlert } from '../../../ui/Alert';
import { Skeleton } from '../../../ui/Skeleton';
import { LevelBadge, formatMonth, ScoreLines } from '../score';

/** A monthly report as the client received it: read-only. */
export function ReportPage() {
  const { reportId = '' } = useParams();
  const report = useReport(reportId);
  const company = report.data?.company;

  return (
    <>
      <PageHeader
        icon={IconBuildingSkyscraper}
        breadcrumbs={[
          { label: 'Companies', to: '/protect/companies' },
          ...(company ? [{ label: company.name, to: `/protect/companies/${company.id}` }] : []),
          { label: report.data?.publishedAt ? formatMonth(report.data.publishedAt) : 'Report' },
        ]}
      />
      <Page width="narrow">
        <ErrorAlert error={report.error} />
        {report.isPending && <ReportSkeleton />}
        {report.data && <ReportRecord report={report.data} />}
      </Page>
    </>
  );
}

function ReportRecord({ report }: { report: ReportDetail }) {
  return (
    <>
      <h1 className="text-[22px] leading-[1.4] font-medium">{report.company.name}</h1>
      {report.publishedAt && (
        <p className="text-gray-7 mt-1">Published on {formatDate(report.publishedAt)}</p>
      )}

      <div className="bg-gray-0 mt-6 flex items-center gap-3 rounded-md px-4 py-3">
        <span className="text-gray-7 text-xs">Security score</span>
        <span className="text-lg font-medium tabular-nums">{report.score}</span>
        <LevelBadge level={report.level} />
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-base font-medium">Score breakdown</h2>
        <ScoreLines breakdown={report.scoreBreakdown} score={report.score} />
      </section>
    </>
  );
}

function ReportSkeleton() {
  return (
    <div role="status" aria-label="Loading">
      <Skeleton className="mb-2 h-7 w-64" />
      <Skeleton className="mb-6 h-4 w-40" />
      <Skeleton className="h-[52px] rounded-md" />
      <Skeleton className="mt-8 h-[180px] rounded-md" />
    </div>
  );
}
