import { Module } from '@nestjs/common';

import { AssessmentRepository } from 'src/protect/domain/ports/assessment-repository.port';
import { CompanyRepository } from 'src/protect/domain/ports/company-repository.port';
import { ProtectQueries } from 'src/protect/domain/ports/protect-queries.port';
import { ScoreCalculator } from 'src/protect/domain/ports/score-calculator.port';
import { DrizzleAssessmentRepository } from 'src/protect/infra/adapters/assessment-repository.drizzle';
import { DrizzleCompanyRepository } from 'src/protect/infra/adapters/company-repository.drizzle';
import { DrizzleProtectQueries } from 'src/protect/infra/adapters/protect-queries.drizzle';
import { InProcessScoreCalculator } from 'src/protect/infra/adapters/score-calculator.in-process';
import { HttpGetCompanyController } from 'src/protect/use-cases/get-company/controller.http';
import { HttpGetReportController } from 'src/protect/use-cases/get-report/controller.http';
import { HttpListCompaniesController } from 'src/protect/use-cases/list-companies/controller.http';
import { HttpPublishAssessmentController } from 'src/protect/use-cases/publish-assessment/controller.http';
import { PublishAssessmentUseCase } from 'src/protect/use-cases/publish-assessment/use-case';
import { HttpStartAssessmentController } from 'src/protect/use-cases/start-assessment/controller.http';
import { StartAssessmentUseCase } from 'src/protect/use-cases/start-assessment/use-case';
import { HttpUpdateSignalsController } from 'src/protect/use-cases/update-signals/controller.http';
import { UpdateSignalsUseCase } from 'src/protect/use-cases/update-signals/use-case';

/** Companies, their monthly assessments and the reports they become. */
@Module({
  controllers: [
    HttpListCompaniesController,
    HttpGetCompanyController,
    HttpStartAssessmentController,
    HttpUpdateSignalsController,
    HttpPublishAssessmentController,
    HttpGetReportController,
  ],
  providers: [
    { provide: CompanyRepository, useClass: DrizzleCompanyRepository },
    { provide: AssessmentRepository, useClass: DrizzleAssessmentRepository },
    { provide: ProtectQueries, useClass: DrizzleProtectQueries },
    { provide: ScoreCalculator, useClass: InProcessScoreCalculator },
    StartAssessmentUseCase,
    UpdateSignalsUseCase,
    PublishAssessmentUseCase,
  ],
})
export class ProtectModule {}
