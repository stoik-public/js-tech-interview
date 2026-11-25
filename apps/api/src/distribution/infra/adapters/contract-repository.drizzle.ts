import { Injectable } from '@nestjs/common';
import { count, eq } from 'drizzle-orm';

import { ConflictError } from 'src/core/domain/errors';
import { Database } from 'src/core/infra/db/database';
import { isPostgresError, PostgresErrorCode } from 'src/core/infra/db/postgres-error';
import type { Contract } from 'src/distribution/domain/contract/contract';
import { ContractRepository } from 'src/distribution/domain/ports/contract-repository.port';
import { QuoteError } from 'src/distribution/domain/quote/error';
import { contract } from 'src/distribution/infra/db/schema';
import { ContractMapper } from 'src/distribution/infra/mappers/contract.mapper';

@Injectable()
export class DrizzleContractRepository implements ContractRepository {
  constructor(private readonly database: Database) {}

  async existsForCompany(companyId: string): Promise<boolean> {
    const [{ contracts }] = await this.database.db
      .select({ contracts: count() })
      .from(contract)
      .where(eq(contract.companyId, companyId));
    return contracts > 0;
  }

  async save(entity: Contract): Promise<void> {
    const data = ContractMapper.fromDomainToRow(entity);
    try {
      await this.database.db
        .insert(contract)
        .values(data)
        .onConflictDoUpdate({ target: contract.id, set: { ...data, updatedAt: new Date() } });
    } catch (error) {
      // contract.quoteId is unique: another request signed the quote first.
      if (isPostgresError(error, PostgresErrorCode.UniqueViolation)) {
        throw new ConflictError(QuoteError.NotEditable, 'This quote is already signed');
      }
      throw error;
    }
  }
}
