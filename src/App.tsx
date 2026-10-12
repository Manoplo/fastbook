import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "@components/require-auth/require-auth";
import { AuthSessionProvider } from "@src/providers/auth-session-provider";
import { BookingPage } from "@src/pages/booking/booking";
import { EnterpriseAgendaPage } from "@src/pages/enterprise-agenda/enterprise-agenda";
import { EnterpriseCheckEmailPage } from "@src/pages/enterprise-check-email/enterprise-check-email";
import { EnterpriseDashboardPage } from "@src/pages/enterprise-dashboard/enterprise-dashboard";
import { EnterpriseLoginPage } from "@src/pages/enterprise-login/enterprise-login";
import { EnterpriseMetricsPage } from "@src/pages/enterprise-metrics/enterprise-metrics";
import { EnterpriseSchedulesPage } from "@src/pages/enterprise-schedules/enterprise-schedules";
import { EnterpriseSettingsPage } from "@src/pages/enterprise-settings/enterprise-settings";
import { HomePage } from "@src/pages/home/home";
import {
  ENTERPRISE_CHECK_EMAIL_PATH,
  ENTERPRISE_LOGIN_PATH,
} from "@src/lib/enterprise-auth-paths";

export default function App() {
  return (
    <BrowserRouter>
      <AuthSessionProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path={ENTERPRISE_LOGIN_PATH} element={<EnterpriseLoginPage />} />
          <Route path={ENTERPRISE_CHECK_EMAIL_PATH} element={<EnterpriseCheckEmailPage />} />
          <Route
            path="/enterprise/:tenantSlug"
            element={
              <RequireAuth>
                <EnterpriseDashboardPage />
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to="agenda" replace />} />
            <Route path="agenda" element={<EnterpriseAgendaPage />} />
            <Route path="schedules" element={<EnterpriseSchedulesPage />} />
            <Route path="metrics" element={<EnterpriseMetricsPage />} />
            <Route path="settings" element={<EnterpriseSettingsPage />} />
          </Route>
          <Route path="/:tenantSlug" element={<BookingPage />} />
        </Routes>
      </AuthSessionProvider>
    </BrowserRouter>
  );
}
