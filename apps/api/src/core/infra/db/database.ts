import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { drizzle, type NodePgQueryResultHKT } from 'drizzle-orm/node-postgres';
import type { PgDatabase } from 'drizzle-orm/pg-core';
import { AsyncLocalStorage } from 'node:async_hooks';
import { Pool } from 'pg';

import { config } from 'src/core/infra/config';

/** A connection or a transaction: adapters write the same queries on both. */
export type Db = PgDatabase<NodePgQueryResultHKT>;

/** The one pool of the API, shared by every bounded context. */
@Injectable()
export class Database implements OnModuleDestroy {
  private readonly pool = new Pool({ connectionString: config.DATABASE_URL });
  private readonly root = drizzle(this.pool);
  private readonly transaction = new AsyncLocalStorage<Db>();

  /** What adapters must use: the current transaction when there is one. */
  get db(): Db {
    return this.transaction.getStore() ?? this.root;
  }

  /** Every `db` call made inside `work` joins the same transaction. */
  runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    if (this.transaction.getStore()) return work();
    return this.root.transaction((tx) => this.transaction.run(tx, work));
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
