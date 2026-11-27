import { Module } from '@nestjs/common';

import { HttpGetScoreScaleController } from 'src/scoring/use-cases/get-score-scale/controller.http';

@Module({ controllers: [HttpGetScoreScaleController] })
export class ScoringModule {}
