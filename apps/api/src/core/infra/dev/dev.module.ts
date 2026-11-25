import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';

import { DevRoutesController } from 'src/core/infra/dev/routes.controller';
import { DevTestsController } from 'src/core/infra/dev/tests.controller';

/** Introspection used by the client's test switcher and the developer toolbox. */
@Module({
  imports: [DiscoveryModule],
  controllers: [DevRoutesController, DevTestsController],
})
export class DevModule {}
