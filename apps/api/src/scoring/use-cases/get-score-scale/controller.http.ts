import { Controller, Get } from '@nestjs/common';

import { scoreScale } from 'src/scoring/domain/scoring';

@Controller('scoring/scale')
export class HttpGetScoreScaleController {
  @Get()
  get() {
    return scoreScale();
  }
}
