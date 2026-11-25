import { IconBuildingSkyscraper } from '@tabler/icons-react';

import { Page } from '../../layout/Page';
import { PageHeader } from '../../layout/PageHeader';
import { useProtectCompanies } from '../../lib/server-state';
import { useListFilters } from '../../lib/use-list-filters';
import { ErrorAlert } from '../../ui/Alert';
import { EmptyState } from '../../ui/EmptyState';
import { SearchInput } from '../../ui/SearchInput';
import { TableSkeleton } from '../../ui/Skeleton';
import { RowLink, Table, Td, Th, Tr } from '../../ui/Table';
import { BandBadge, formatMonth } from './score';

/** Every client of Stoïk Protect, with its latest report and its assessment in progress. */
export function CompaniesPage() {
  const companies = useProtectCompanies();
  const { search, setSearch, matches } = useListFilters();

  const visible = companies.data?.filter((c) => matches(c.name)) ?? [];

  return (
    <>
      <PageHeader icon={IconBuildingSkyscraper} breadcrumbs={[{ label: 'Companies' }]} />
      <Page>
        <div className="mb-4 flex justify-end">
          <SearchInput label="Search companies" value={search} onChange={setSearch} />
        </div>
        <ErrorAlert error={companies.error} />
        {companies.isPending && <TableSkeleton columns={4} />}
        {companies.data && visible.length > 0 && (
          <Table>
            <thead>
              <tr>
                <Th>Company</Th>
                <Th align="right">Latest report</Th>
                <Th>Published</Th>
                <Th align="right">In progress</Th>
              </tr>
            </thead>
            <tbody>
              {visible.map((company) => (
                <Tr key={company.id}>
                  <Td>
                    <RowLink to={`/protect/companies/${company.id}`}>{company.name}</RowLink>
                  </Td>
                  <Td align="right">
                    {company.latestReport ? (
                      <ScoreCell {...company.latestReport} />
                    ) : (
                      <span className="text-gray-6">None yet</span>
                    )}
                  </Td>
                  <Td>
                    {company.latestReport && (
                      <span className="whitespace-nowrap">
                        {formatMonth(company.latestReport.publishedAt)}
                      </span>
                    )}
                  </Td>
                  <Td align="right">
                    {company.draft ? (
                      <ScoreCell {...company.draft} />
                    ) : (
                      <span className="text-gray-6">No draft</span>
                    )}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
        {companies.data && visible.length === 0 && (
          <EmptyState icon={IconBuildingSkyscraper}>
            {companies.data.length === 0 ? 'No companies yet.' : 'No company matches your search.'}
          </EmptyState>
        )}
      </Page>
    </>
  );
}

function ScoreCell({
  score,
  band,
}: {
  score: number;
  band: Parameters<typeof BandBadge>[0]['band'];
}) {
  return (
    <span className="inline-flex items-center gap-2">
      {score}
      <BandBadge band={band} />
    </span>
  );
}
