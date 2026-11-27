import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { Database } from 'src/core/infra/db/database';
import type { Company } from 'src/protect/domain/company/company';
import { CompanyRepository } from 'src/protect/domain/ports/company-repository.port';
import { company } from 'src/protect/infra/db/schema';
import { CompanyMapper } from 'src/protect/infra/mappers/company.mapper';

@Injectable()
export class DrizzleCompanyRepository implements CompanyRepository {
  constructor(private readonly database: Database) {}

  async findById(id: string): Promise<Company | null> {
    const [row] = await this.database.db.select().from(company).where(eq(company.id, id));
    return row ? CompanyMapper.fromRowToDomain(row) : null;
  }

  async save(entity: Company): Promise<void> {
    const data = CompanyMapper.fromDomainToRow(entity);
    await this.database.db
      .insert(company)
      .values(data)
      .onConflictDoUpdate({ target: company.id, set: { ...data, updatedAt: new Date() } });
  }
}
