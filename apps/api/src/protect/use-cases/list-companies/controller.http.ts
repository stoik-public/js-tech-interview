import { Controller, Get } from '@nestjs/common';

import { ProtectQueries } from 'src/protect/domain/ports/protect-queries.port';

/** A read without business logic: no use case. */
@Controller('protect/companies')
export class HttpListCompaniesController {
  constructor(private readonly protectQueries: ProtectQueries) {}

  @Get()
  list() {
    return this.protectQueries.listCompanies();
  }
}
