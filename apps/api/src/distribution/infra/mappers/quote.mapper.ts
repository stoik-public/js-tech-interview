import type { QuoteView } from 'src/distribution/domain/ports/distribution-queries.port';
import { Quote } from 'src/distribution/domain/quote/quote';
import type { QuoteRow } from 'src/distribution/infra/db/schema';

export class QuoteMapper {
  static fromRowToDomain(row: QuoteRow): Quote {
    return Quote.hydrate(
      {
        companyId: row.companyId,
        status: row.status,
        terms: {
          coverageLimitCents: row.coverageLimitCents,
          deductibleCents: row.deductibleCents,
          options: row.options,
        },
        pricing: {
          premiumCents: row.premiumCents,
          breakdown: row.pricingBreakdown,
        },
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }

  static fromDomainToRow(quote: Quote) {
    const { terms, pricing, ...props } = quote.getProps();
    return {
      id: quote.id,
      ...props,
      ...terms,
      premiumCents: pricing.premiumCents,
      pricingBreakdown: pricing.breakdown,
    };
  }

  static fromDomainToDto(quote: Quote): QuoteView {
    const { terms, pricing, ...props } = quote.getProps();
    return {
      id: quote.id,
      ...props,
      ...terms,
      premiumCents: pricing.premiumCents,
      pricingBreakdown: pricing.breakdown,
    };
  }
}
