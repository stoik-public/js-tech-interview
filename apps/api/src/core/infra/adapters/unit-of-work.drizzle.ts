import { Injectable } from '@nestjs/common';

import { CoreError } from 'src/core/domain/error';
import { ConflictError } from 'src/core/domain/errors';
import { UnitOfWork } from 'src/core/domain/ports/unit-of-work.port';
import { Database } from 'src/core/infra/db/database';
import { isPostgresError, PostgresErrorCode } from 'src/core/infra/db/postgres-error';

@Injectable()
export class DrizzleUnitOfWork implements UnitOfWork {
  constructor(private readonly database: Database) {}

  async runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    try {
      return await this.database.runInTransaction(work);
    } catch (error) {
      // Two requests changing the same rows at once: the database aborted one (deadlock or write
      // conflict) and nothing was saved. It is the caller's to retry, not a server failure.
      if (
        isPostgresError(
          error,
          PostgresErrorCode.DeadlockDetected,
          PostgresErrorCode.SerializationFailure,
        )
      ) {
        throw new ConflictError(
          CoreError.ConcurrentUpdate,
          'The data was changed at the same time: try again',
        );
      }
      throw error;
    }
  }
}
