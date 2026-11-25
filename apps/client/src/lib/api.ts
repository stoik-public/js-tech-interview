import type {
  Assessment,
  Contract,
  ContractDetail,
  ContractListItem,
  HiringTest,
  PricingCatalog,
  ProspectDetail,
  ProtectCompanyDetail,
  ProtectCompanyListItem,
  ProspectListItem,
  Quote,
  QuoteConfiguration,
  ReportDetail,
  ScoreScale,
  SecuritySignals,
} from './types';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    /** Validation errors have one message per field, as `field: message`. */
    readonly messages: string[],
    /** Domain errors have a stable code, such as `pricing.revenueNotEligible`. */
    readonly code?: string,
  ) {
    super(messages.join('. '));
  }
}

type ErrorBody = { message?: string | string[]; code?: string };

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method,
    headers: body === undefined ? undefined : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    const error: ErrorBody | null = await response.json().catch(() => null);
    throw new ApiError(
      response.status,
      [error?.message ?? response.statusText].flat(),
      error?.code,
    );
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

export const api = {
  tests: () => request<HiringTest[]>('GET', '/dev/tests'),
  pricingCatalog: () => request<PricingCatalog>('GET', '/pricing/catalog'),
  prospects: () => request<ProspectListItem[]>('GET', '/distribution/prospects'),
  prospect: (companyId: string) =>
    request<ProspectDetail>('GET', `/distribution/prospects/${companyId}`),
  deleteProspect: (companyId: string) =>
    request<void>('DELETE', `/distribution/prospects/${companyId}`),
  createProspect: (input: { name: string; annualRevenueCents: number }) =>
    request<{ id: string }>('POST', '/distribution/prospects', input),
  updateQuote: (quoteId: string, configuration: QuoteConfiguration) =>
    request<Quote>('PUT', `/distribution/quotes/${quoteId}`, configuration),
  validateQuote: (quoteId: string) =>
    request<Contract>('POST', `/distribution/quotes/${quoteId}/validate`),
  contracts: () => request<ContractListItem[]>('GET', '/distribution/contracts'),
  contract: (contractId: string) =>
    request<ContractDetail>('GET', `/distribution/contracts/${contractId}`),

  // Protect
  scoreScale: () => request<ScoreScale>('GET', '/scoring/scale'),
  protectCompanies: () => request<ProtectCompanyListItem[]>('GET', '/protect/companies'),
  protectCompany: (companyId: string) =>
    request<ProtectCompanyDetail>('GET', `/protect/companies/${companyId}`),
  startAssessment: (companyId: string) =>
    request<Assessment>('POST', `/protect/companies/${companyId}/assessments`),
  updateSignals: (assessmentId: string, signals: SecuritySignals) =>
    request<Assessment>('PUT', `/protect/assessments/${assessmentId}`, signals),
  publishAssessment: (assessmentId: string) =>
    request<Assessment>('POST', `/protect/assessments/${assessmentId}/publish`),
  report: (assessmentId: string) =>
    request<ReportDetail>('GET', `/protect/reports/${assessmentId}`),
};
