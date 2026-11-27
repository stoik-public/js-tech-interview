import { IconBuildingSkyscraper, IconPlus } from '@tabler/icons-react';
import { useParams } from 'react-router';

import { Page } from '../../../layout/Page';
import { PageHeader } from '../../../layout/PageHeader';
import { useProtectCompany, useScoreScale, useStartReport } from '../../../lib/server-state';
import type { Report, ReportSummary, ScoreScale } from '../../../lib/types';
import { ErrorAlert } from '../../../ui/Alert';
import { Badge } from '../../../ui/Badge';
import { Button } from '../../../ui/Button';
import { Card } from '../../../ui/Card';
import { EmptyState } from '../../../ui/EmptyState';
import { Skeleton } from '../../../ui/Skeleton';
import { RowLink, Table, Td, Th, Tr } from '../../../ui/Table';
import { useToast } from '../../../ui/Toast';
import { LevelBadge, formatMonth } from '../score';
import { LevelLegend, ScoreHistory } from '../ScoreHistory';
import { ScoreReceipt } from './ScoreReceipt';
import { SignalsForm } from './SignalsForm';
import { useLiveReport } from './useLiveReport';

/** A company: its draft report, then its published reports. */
export function CompanyPage() {
  const { companyId = '' } = useParams();
  const detail = useProtectCompany(companyId);
  const scale = useScoreScale();
  const company = detail.data?.company;
  const draft = detail.data?.draft;

  return (
    <>
      <PageHeader
        icon={IconBuildingSkyscraper}
        breadcrumbs={[
          { label: 'Companies', to: '/protect/companies' },
          { label: company?.name ?? 'Company' },
        ]}
        status={draft && <Badge tone="blue">Draft</Badge>}
      >
        {detail.data && !draft && <StartReport companyId={companyId} />}
      </PageHeader>
      <Page width="wide">
        <ErrorAlert error={detail.error ?? scale.error} />
        {detail.isPending && <CompanySkeleton />}
        {company && <h1 className="mb-6 text-[22px] leading-[1.4] font-medium">{company.name}</h1>}
        {draft && (
          // Remount when the draft changes so the form starts from its saved signals.
          <DraftReportWorkspace key={draft.id} report={draft} />
        )}
        {detail.data && <Reports reports={detail.data.reports} scale={scale.data} />}
      </Page>
    </>
  );
}

function DraftReportWorkspace({ report }: { report: Report }) {
  const session = useLiveReport(report);
  return (
    <div className="mb-8 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <SignalsForm session={session} />
      <div className="lg:sticky lg:top-[66px]">
        <ScoreReceipt report={report} session={session} />
      </div>
    </div>
  );
}

function StartReport({ companyId }: { companyId: string }) {
  const start = useStartReport();
  const toast = useToast();
  return (
    <Button
      size="xs"
      loading={start.isPending}
      onClick={() => start.mutate(companyId, { onSuccess: () => toast('Draft report started') })}
    >
      <IconPlus aria-hidden size={16} stroke={1.5} />
      Start report
    </Button>
  );
}

function Reports({ reports, scale }: { reports: ReportSummary[]; scale?: ScoreScale }) {
  if (reports.length === 0) {
    return <EmptyState icon={IconBuildingSkyscraper}>No report published yet.</EmptyState>;
  }
  return (
    <div className="space-y-4">
      <Card title="Last 12 reports" actions={scale && <LevelLegend scale={scale} />}>
        <ScoreHistory reports={reports} scale={scale} />
      </Card>
      <Table>
        <thead>
          <tr>
            <Th>Report</Th>
            <Th align="right">Score</Th>
            <Th>Security level</Th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <Tr key={report.id}>
              <Td>
                <RowLink to={`/protect/reports/${report.id}`}>
                  {formatMonth(report.publishedAt)}
                </RowLink>
              </Td>
              <Td align="right">{report.score}</Td>
              <Td>
                <LevelBadge level={report.level} />
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

function CompanySkeleton() {
  return (
    <div role="status" aria-label="Loading">
      <Skeleton className="mb-6 h-7 w-64" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Skeleton className="h-[320px] rounded-md" />
        <Skeleton className="h-[320px] rounded-md" />
      </div>
      <Skeleton className="mt-8 h-[260px] rounded-md" />
    </div>
  );
}
