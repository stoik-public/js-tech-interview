import { Controller, Get, Param } from '@nestjs/common';

import { ProtectQueries } from 'src/protect/domain/ports/protect-queries.port';

/** The company page: its draft and its reports. A read without business logic: no use case. */
@Controller('protect/companies')
export class HttpGetCompanyController {
  constructor(private readonly protectQueries: ProtectQueries) {}

  @Get(':companyId')
  get(@Param('companyId') companyId: string) {
    return this.protectQueries.getCompany(companyId);
  }
}
