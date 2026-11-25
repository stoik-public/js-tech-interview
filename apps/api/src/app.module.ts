import { Module, StandardSchemaValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';

import { CoreModule } from 'src/core/core.module';
import { DatabaseModule } from 'src/core/infra/db/database.module';
import { DevModule } from 'src/core/infra/dev/dev.module';
import { DomainErrorFilter } from 'src/core/infra/http/domain-error.filter';
import { DistributionModule } from 'src/distribution/distribution.module';
import { PricingModule } from 'src/pricing/pricing.module';
import { ProtectModule } from 'src/protect/protect.module';
import { ScoringModule } from 'src/scoring/scoring.module';

@Module({
  imports: [
    DatabaseModule,
    CoreModule,
    PricingModule,
    DistributionModule,
    ScoringModule,
    ProtectModule,
    DevModule,
  ],
  providers: [
    // Validates every `@Body({ schema })` with its zod schema.
    { provide: APP_PIPE, useClass: StandardSchemaValidationPipe },
    { provide: APP_FILTER, useClass: DomainErrorFilter },
  ],
})
export class AppModule {}
