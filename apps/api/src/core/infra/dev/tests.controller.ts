import { Controller, Get, NotFoundException, Param } from '@nestjs/common';

import { dataModelOf, type DataModel } from 'src/core/infra/dev/data-model';
import { type Test, TESTS } from 'src/core/infra/dev/tests';

/** The hiring tests, and the data model of each, for the client's test switcher and the toolbox. */
@Controller('dev')
export class DevTestsController {
  @Get('tests')
  list(): readonly Test[] {
    return TESTS;
  }

  @Get('data-model/:test')
  dataModel(@Param('test') id: string): DataModel {
    const test = TESTS.find((candidate) => candidate.id === id);
    if (!test) throw new NotFoundException(`Unknown test: ${id}`);
    return dataModelOf(test.contexts);
  }
}
