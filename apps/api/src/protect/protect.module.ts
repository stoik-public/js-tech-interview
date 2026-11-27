import { Module } from '@nestjs/common';

import { CompanyRepository } from 'src/protect/domain/ports/company-repository.port';
import { ProtectQueries } from 'src/protect/domain/ports/protect-queries.port';
import { ReportRepository } from 'src/protect/domain/ports/report-repository.port';
import { ScoreCalculator } from 'src/protect/domain/ports/score-calculator.port';
import { DrizzleCompanyRepository } from 'src/protect/infra/adapters/company-repository.drizzle';
import { DrizzleProtectQueries } from 'src/protect/infra/adapters/protect-queries.drizzle';
import { DrizzleReportRepository } from 'src/protect/infra/adapters/report-repository.drizzle';
import { InProcessScoreCalculator } from 'src/protect/infra/adapters/score-calculator.in-process';
import { HttpGetCompanyController } from 'src/protect/use-cases/get-company/controller.http';
import { HttpGetReportController } from 'src/protect/use-cases/get-report/controller.http';
import { HttpListCompaniesController } from 'src/protect/use-cases/list-companies/controller.http';
import { HttpPublishReportController } from 'src/protect/use-cases/publish-report/controller.http';
import { PublishReportUseCase } from 'src/protect/use-cases/publish-report/use-case';
import { HttpStartReportController } from 'src/protect/use-cases/start-report/controller.http';
import { StartReportUseCase } from 'src/protect/use-cases/start-report/use-case';
import { HttpUpdateSignalsController } from 'src/protect/use-cases/update-signals/controller.http';
import { UpdateSignalsUseCase } from 'src/protect/use-cases/update-signals/use-case';

/** Companies and their monthly security reports, draft then published. */
@Module({
  controllers: [
    HttpListCompaniesController,
    HttpGetCompanyController,
    HttpStartReportController,
    HttpUpdateSignalsController,
    HttpPublishReportController,
    HttpGetReportController,
  ],
  providers: [
    { provide: CompanyRepository, useClass: DrizzleCompanyRepository },
    { provide: ReportRepository, useClass: DrizzleReportRepository },
    { provide: ProtectQueries, useClass: DrizzleProtectQueries },
    { provide: ScoreCalculator, useClass: InProcessScoreCalculator },
    StartReportUseCase,
    UpdateSignalsUseCase,
    PublishReportUseCase,
  ],
})
export class ProtectModule {}
