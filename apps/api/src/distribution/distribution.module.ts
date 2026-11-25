import { Module } from '@nestjs/common';

import { CompanyRepository } from 'src/distribution/domain/ports/company-repository.port';
import { ContractRepository } from 'src/distribution/domain/ports/contract-repository.port';
import { DistributionQueries } from 'src/distribution/domain/ports/distribution-queries.port';
import { PremiumCalculator } from 'src/distribution/domain/ports/premium-calculator.port';
import { QuoteRepository } from 'src/distribution/domain/ports/quote-repository.port';
import { DrizzleCompanyRepository } from 'src/distribution/infra/adapters/company-repository.drizzle';
import { DrizzleContractRepository } from 'src/distribution/infra/adapters/contract-repository.drizzle';
import { DrizzleDistributionQueries } from 'src/distribution/infra/adapters/distribution-queries.drizzle';
import { InProcessPremiumCalculator } from 'src/distribution/infra/adapters/premium-calculator.in-process';
import { DrizzleQuoteRepository } from 'src/distribution/infra/adapters/quote-repository.drizzle';
import { HttpCreateProspectController } from 'src/distribution/use-cases/create-prospect/controller.http';
import { CreateProspectUseCase } from 'src/distribution/use-cases/create-prospect/use-case';
import { HttpDeleteProspectController } from 'src/distribution/use-cases/delete-prospect/controller.http';
import { DeleteProspectUseCase } from 'src/distribution/use-cases/delete-prospect/use-case';
import { HttpGetContractController } from 'src/distribution/use-cases/get-contract/controller.http';
import { HttpGetProspectController } from 'src/distribution/use-cases/get-prospect/controller.http';
import { HttpListContractsController } from 'src/distribution/use-cases/list-contracts/controller.http';
import { HttpListProspectsController } from 'src/distribution/use-cases/list-prospects/controller.http';
import { HttpUpdateQuoteController } from 'src/distribution/use-cases/update-quote/controller.http';
import { UpdateQuoteUseCase } from 'src/distribution/use-cases/update-quote/use-case';
import { HttpValidateQuoteController } from 'src/distribution/use-cases/validate-quote/controller.http';
import { ValidateQuoteUseCase } from 'src/distribution/use-cases/validate-quote/use-case';

/** Prospects, quotes and the contracts they become. */
@Module({
  controllers: [
    HttpListProspectsController,
    HttpCreateProspectController,
    HttpGetProspectController,
    HttpDeleteProspectController,
    HttpUpdateQuoteController,
    HttpValidateQuoteController,
    HttpListContractsController,
    HttpGetContractController,
  ],
  providers: [
    { provide: CompanyRepository, useClass: DrizzleCompanyRepository },
    { provide: QuoteRepository, useClass: DrizzleQuoteRepository },
    { provide: ContractRepository, useClass: DrizzleContractRepository },
    { provide: DistributionQueries, useClass: DrizzleDistributionQueries },
    { provide: PremiumCalculator, useClass: InProcessPremiumCalculator },
    CreateProspectUseCase,
    DeleteProspectUseCase,
    UpdateQuoteUseCase,
    ValidateQuoteUseCase,
  ],
})
export class DistributionModule {}
