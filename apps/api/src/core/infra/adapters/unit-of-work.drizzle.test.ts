import { DrizzleQueryError } from 'drizzle-orm/errors';

import { ConflictError } from 'src/core/domain/errors';
import { DrizzleUnitOfWork } from 'src/core/infra/adapters/unit-of-work.drizzle';
import type { Database } from 'src/core/infra/db/database';

const failingWith = (error: Error) =>
  new DrizzleUnitOfWork({
    runInTransaction: () => Promise.reject(error),
  } as unknown as Database);

/** What Drizzle throws when Postgres refuses a query: the driver's error is the cause. */
const refusedWith = (code: string) =>
  new DrizzleQueryError(
    'update "distribution"."quote" …',
    [],
    Object.assign(new Error(), { code }),
  );

describe('DrizzleUnitOfWork', () => {
  it.each([
    ['a deadlock', '40P01'],
    ['a write conflict', '40001'],
  ])('turns %s between two requests into a conflict to retry', async (_, code) => {
    const failure = failingWith(refusedWith(code)).runInTransaction(async () => {});

    await expect(failure).rejects.toThrow(ConflictError);
    await expect(
      failingWith(refusedWith(code)).runInTransaction(async () => {}),
    ).rejects.toMatchObject({ code: 'core.concurrentUpdate' });
  });

  it('lets any other failure through', async () => {
    const failure = new Error('connection lost');

    await expect(failingWith(failure).runInTransaction(async () => {})).rejects.toBe(failure);
  });
});
