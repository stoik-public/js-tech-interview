import { Global, Module } from '@nestjs/common';

import { Clock } from 'src/core/domain/ports/clock.port';
import { UnitOfWork } from 'src/core/domain/ports/unit-of-work.port';
import { SystemClock } from 'src/core/infra/adapters/clock.system';
import { DrizzleUnitOfWork } from 'src/core/infra/adapters/unit-of-work.drizzle';

@Global()
@Module({
  providers: [
    { provide: Clock, useClass: SystemClock },
    { provide: UnitOfWork, useClass: DrizzleUnitOfWork },
  ],
  exports: [Clock, UnitOfWork],
})
export class CoreModule {}
