import { Injectable } from '@nestjs/common';
import { asc, desc, eq, getTableColumns } from 'drizzle-orm';

import { ResourceNotFoundError } from 'src/core/domain/errors';
import { Database } from 'src/core/infra/db/database';
import { CompanyError } from 'src/distribution/domain/company/error';
import { ContractError } from 'src/distribution/domain/contract/error';
import {
  DistributionQueries,
  type ContractDetail,
  type ContractSummary,
  type ProspectSummary,
  type ProspectView,
} from 'src/distribution/domain/ports/distribution-queries.port';
import { company, contract, quote } from 'src/distribution/infra/db/schema';
import { CompanyMapper } from 'src/distribution/infra/mappers/company.mapper';
import { ContractMapper } from 'src/distribution/infra/mappers/contract.mapper';
import { QuoteMapper } from 'src/distribution/infra/mappers/quote.mapper';

/** Read models for the HTTP API. */
@Injectable()
export class DrizzleDistributionQueries implements DistributionQueries {
  constructor(private readonly database: Database) {}

  /** The latest quote of each company. */
  private latestQuotes() {
    return this.database.db
      .selectDistinctOn([quote.companyId])
      .from(quote)
      .orderBy(quote.companyId, desc(quote.createdAt))
      .as('latest_quote');
  }

  async listProspects(): Promise<ProspectSummary[]> {
    const latest = this.latestQuotes();
    const rows = await this.database.db
      .select({
        company: getTableColumns(company),
        quote: {
          id: latest.id,
          status: latest.status,
          premiumCents: latest.premiumCents,
          coverageLimitCents: latest.coverageLimitCents,
          deductibleCents: latest.deductibleCents,
          options: latest.options,
        },
      })
      .from(company)
      .innerJoin(latest, eq(latest.companyId, company.id))
      // A company whose latest quote is signed is a client, not a prospect.
      .where(eq(latest.status, 'draft'))
      .orderBy(asc(company.name));
    return rows.map((row) => ({
      ...CompanyMapper.fromRowToDto(row.company),
      latestQuote: row.quote,
    }));
  }

  async getProspect(companyId: string): Promise<ProspectView> {
    const db = this.database.db;
    const [row] = await db.select().from(company).where(eq(company.id, companyId));
    if (!row) throw new ResourceNotFoundError(CompanyError.NotFound, 'Prospect not found');

    const [latest] = await db
      .select({ quote, contract })
      .from(quote)
      .leftJoin(contract, eq(contract.quoteId, quote.id))
      .where(eq(quote.companyId, companyId))
      .orderBy(desc(quote.createdAt))
      .limit(1);
    return {
      company: CompanyMapper.fromRowToDto(row),
      quote: latest
        ? {
            ...QuoteMapper.fromDomainToDto(QuoteMapper.fromRowToDomain(latest.quote)),
            contract: latest.contract
              ? ContractMapper.fromDomainToDto(ContractMapper.fromRowToDomain(latest.contract))
              : null,
          }
        : null,
    };
  }

  async listContracts(): Promise<ContractSummary[]> {
    const rows = await this.database.db
      .select({ contract, company: { id: company.id, name: company.name } })
      .from(contract)
      .innerJoin(company, eq(company.id, contract.companyId))
      .orderBy(desc(contract.startDate));
    return rows.map((row) => ({
      ...ContractMapper.fromDomainToDto(ContractMapper.fromRowToDomain(row.contract)),
      company: row.company,
    }));
  }

  async getContract(contractId: string): Promise<ContractDetail> {
    const [row] = await this.database.db
      .select({ contract, company })
      .from(contract)
      .innerJoin(company, eq(company.id, contract.companyId))
      .where(eq(contract.id, contractId));
    if (!row) throw new ResourceNotFoundError(ContractError.NotFound, 'Contract not found');

    return {
      ...ContractMapper.fromDomainToDto(ContractMapper.fromRowToDomain(row.contract)),
      company: CompanyMapper.fromRowToDto(row.company),
    };
  }
}
