import { Global, Module } from '@nestjs/common';

import { Database } from 'src/core/infra/db/database';

@Global()
@Module({
  providers: [Database],
  exports: [Database],
})
export class DatabaseModule {}
