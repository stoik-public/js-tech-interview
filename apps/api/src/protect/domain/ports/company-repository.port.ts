import type { Company } from 'src/protect/domain/company/company';

export abstract class CompanyRepository {
  abstract findById(id: string): Promise<Company | null>;
  abstract save(company: Company): Promise<void>;
}
