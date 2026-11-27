import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

import { ConflictError } from 'src/core/domain/errors';
import { Database } from 'src/core/infra/db/database';
import { isPostgresError, PostgresErrorCode } from 'src/core/infra/db/postgres-error';
import { QuoteRepository } from 'src/distribution/domain/ports/quote-repository.port';
import { QuoteError } from 'src/distribution/domain/quote/error';
import type { Quote } from 'src/distribution/domain/quote/quote';
import { quote } from 'src/distribution/infra/db/schema';
import { QuoteMapper } from 'src/distribution/infra/mappers/quote.mapper';

@Injectable()
export class DrizzleQuoteRepository implements QuoteRepository {
  constructor(private readonly database: Database) {}

  async findById(id: string): Promise<Quote | null> {
    const [row] = await this.database.db.select().from(quote).where(eq(quote.id, id));
    return row ? QuoteMapper.fromRowToDomain(row) : null;
  }

  async save(entity: Quote): Promise<void> {
    const data = QuoteMapper.fromDomainToRow(entity);
    // Only a stored draft is overwritten. Another request may have signed the quote since it
    // was read: the update then matches no row, and a rewrite as a draft is never applied.
    const updated = await this.database.db
      .update(quote)
      .set(data)
      .where(and(eq(quote.id, entity.id), eq(quote.status, 'draft')))
      .returning({ id: quote.id });
    if (updated.length > 0) return;
    try {
      await this.database.db.insert(quote).values(data);
    } catch (error) {
      // The id exists: the stored quote is signed.
      if (isPostgresError(error, PostgresErrorCode.UniqueViolation)) {
        throw new ConflictError(QuoteError.NotEditable, 'A signed quote is read-only');
      }
      throw error;
    }
  }
}
