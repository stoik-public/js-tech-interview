import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';

import { AppModule } from 'src/app.module';
import { configureApp } from 'src/app.setup';
import { Database } from 'src/core/infra/db/database';

/** The whole API on the test database, whose tables are emptied after each test. */
export async function createTestApp() {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

  const app = moduleRef.createNestApplication<NestExpressApplication>();
  configureApp(app);
  await app.init();
  return { app, db: app.get(Database).db };
}

export const prospectInput = {
  name: 'Acme Robotics',
  annualRevenueCents: 800_000_000, // 8M EUR
};
