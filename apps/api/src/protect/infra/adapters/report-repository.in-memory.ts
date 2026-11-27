import { ConflictError } from 'src/core/domain/errors';
import { ReportRepository } from 'src/protect/domain/ports/report-repository.port';
import { ReportError } from 'src/protect/domain/report/error';
import { Report, type ReportProps } from 'src/protect/domain/report/report';

export class InMemoryReportRepository implements ReportRepository {
  readonly snapshots = new Map<string, ReportProps>();

  async findById(id: string): Promise<Report | null> {
    const props = this.snapshots.get(id);
    return props ? Report.hydrate(structuredClone(props), id) : null;
  }

  async findLatestOfCompany(companyId: string): Promise<Report | null> {
    const [latest] = [...this.snapshots]
      .filter(([, props]) => props.companyId === companyId)
      .sort(([, a], [, b]) => b.createdAt.getTime() - a.createdAt.getTime());
    return latest ? Report.hydrate(structuredClone(latest[1]), latest[0]) : null;
  }

  async save(report: Report): Promise<void> {
    const props = report.getProps();
    if (this.snapshots.get(report.id)?.status === 'published') {
      throw new ConflictError(ReportError.Published, 'A published report is read-only');
    }
    const anotherDraft = [...this.snapshots].some(
      ([id, saved]) =>
        id !== report.id &&
        saved.companyId === props.companyId &&
        saved.status === 'draft' &&
        props.status === 'draft',
    );
    if (anotherDraft) {
      throw new ConflictError(
        ReportError.DraftInProgress,
        'This company already has a report in progress',
      );
    }
    this.snapshots.set(report.id, structuredClone(props));
  }
}
