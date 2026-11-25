import { Company } from 'src/distribution/domain/company/company';
import type { CompanyView } from 'src/distribution/domain/ports/distribution-queries.port';
import type { CompanyRow } from 'src/distribution/infra/db/schema';

export class CompanyMapper {
  static fromRowToDomain(row: CompanyRow): Company {
    return Company.hydrate(
      { name: row.name, annualRevenueCents: row.annualRevenueCents, createdAt: row.createdAt },
      row.id,
    );
  }

  static fromDomainToRow(company: Company) {
    return { id: company.id, ...company.getProps() };
  }

  static fromRowToDto(row: CompanyRow): CompanyView {
    return {
      id: row.id,
      name: row.name,
      annualRevenueCents: row.annualRevenueCents,
      createdAt: row.createdAt,
    };
  }
}
