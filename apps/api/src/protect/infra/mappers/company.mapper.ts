import { Company } from 'src/protect/domain/company/company';
import type { CompanyView } from 'src/protect/domain/ports/protect-queries.port';
import type { CompanyRow } from 'src/protect/infra/db/schema';

export class CompanyMapper {
  static fromRowToDomain(row: CompanyRow): Company {
    return Company.hydrate({ name: row.name, createdAt: row.createdAt }, row.id);
  }

  static fromDomainToRow(company: Company) {
    return { id: company.id, ...company.getProps() };
  }

  static fromRowToDto(row: CompanyRow): CompanyView {
    return { id: row.id, name: row.name, createdAt: row.createdAt };
  }
}
