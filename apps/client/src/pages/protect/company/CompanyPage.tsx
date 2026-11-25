import { IconBuildingSkyscraper, IconPlus } from '@tabler/icons-react';
import { useParams } from 'react-router';

import { Page } from '../../../layout/Page';
import { PageHeader } from '../../../layout/PageHeader';
import { useProtectCompany, useScoreScale, useStartAssessment } from '../../../lib/server-state';
import type { Assessment, ReportSummary, ScoreScale } from '../../../lib/types';
import { ErrorAlert } from '../../../ui/Alert';
import { Badge } from '../../../ui/Badge';
import { Button } from '../../../ui/Button';
import { Card } from '../../../ui/Card';
import { EmptyState } from '../../../ui/EmptyState';
import { Skeleton } from '../../../ui/Skeleton';
import { RowLink, Table, Td, Th, Tr } from '../../../ui/Table';
import { useToast } from '../../../ui/Toast';
import { BandBadge, formatMonth } from '../score';
import { BandLegend, ScoreHistory } from '../ScoreHistory';
import { ScoreReceipt } from './ScoreReceipt';
import { SignalsForm } from './SignalsForm';
import { useLiveAssessment } from './useLiveAssessment';

/** A company: its assessment in progress, then its reports. */
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
        {detail.data && !draft && <StartAssessment companyId={companyId} />}
      </PageHeader>
      <Page width="wide">
        <ErrorAlert error={detail.error ?? scale.error} />
        {detail.isPending && <CompanySkeleton />}
        {company && <h1 className="mb-6 text-[22px] leading-[1.4] font-medium">{company.name}</h1>}
        {draft && (
          // Remount when the draft changes so the form starts from its saved signals.
          <AssessmentWorkspace key={draft.id} assessment={draft} />
        )}
        {detail.data && <Reports reports={detail.data.reports} scale={scale.data} />}
      </Page>
    </>
  );
}

function AssessmentWorkspace({ assessment }: { assessment: Assessment }) {
  const session = useLiveAssessment(assessment);
  return (
    <div className="mb-8 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <SignalsForm session={session} />
      <div className="lg:sticky lg:top-[66px]">
        <ScoreReceipt assessment={assessment} session={session} />
      </div>
    </div>
  );
}

function StartAssessment({ companyId }: { companyId: string }) {
  const start = useStartAssessment();
  const toast = useToast();
  return (
    <Button
      size="xs"
      loading={start.isPending}
      onClick={() => start.mutate(companyId, { onSuccess: () => toast('Assessment started') })}
    >
      <IconPlus aria-hidden size={16} stroke={1.5} />
      Start assessment
    </Button>
  );
}

function Reports({ reports, scale }: { reports: ReportSummary[]; scale?: ScoreScale }) {
  if (reports.length === 0) {
    return <EmptyState icon={IconBuildingSkyscraper}>No report published yet.</EmptyState>;
  }
  return (
    <div className="space-y-4">
      <Card title="Last 12 reports" actions={scale && <BandLegend scale={scale} />}>
        <ScoreHistory reports={reports} scale={scale} />
      </Card>
      <Table>
        <thead>
          <tr>
            <Th>Report</Th>
            <Th align="right">Score</Th>
            <Th>Band</Th>
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
                <BandBadge band={report.band} />
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
