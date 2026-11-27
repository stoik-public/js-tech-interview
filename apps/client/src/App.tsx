import { BrowserRouter, Navigate, Route, Routes } from 'react-router';

import { AppShell } from './layout/AppShell';
import { ContractPage } from './pages/contract/ContractPage';
import { ContractsPage } from './pages/ContractsPage';
import { ProspectPage } from './pages/prospect/ProspectPage';
import { ProspectsPage } from './pages/ProspectsPage';
import { CompaniesPage } from './pages/protect/CompaniesPage';
import { CompanyPage } from './pages/protect/company/CompanyPage';
import { ReportPage } from './pages/protect/report/ReportPage';
import { Toolbox } from './toolbox/Toolbox';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/insurance" replace />} />
          {/* Each hiring test has its pages under its own prefix. */}
          <Route path="insurance">
            <Route index element={<Navigate to="prospects" replace />} />
            <Route path="prospects" element={<ProspectsPage />} />
            <Route path="prospects/:companyId" element={<ProspectPage />} />
            <Route path="contracts" element={<ContractsPage />} />
            <Route path="contracts/:contractId" element={<ContractPage />} />
          </Route>
          <Route path="protect">
            <Route index element={<Navigate to="companies" replace />} />
            <Route path="companies" element={<CompaniesPage />} />
            <Route path="companies/:companyId" element={<CompanyPage />} />
            <Route path="reports/:reportId" element={<ReportPage />} />
          </Route>
        </Route>
      </Routes>
      <Toolbox />
    </BrowserRouter>
  );
}
