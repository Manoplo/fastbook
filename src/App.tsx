import { BrowserRouter, Route, Routes } from "react-router-dom";
import { RequireAuth } from "@components/require-auth/require-auth";
import { AuthSessionProvider } from "@src/providers/auth-session-provider";
import { BookingPage } from "@src/pages/booking/booking";
import { EnterpriseDashboardPage } from "@src/pages/enterprise-dashboard/enterprise-dashboard";
import { EnterpriseLoginPage } from "@src/pages/enterprise-login/enterprise-login";
import { HomePage } from "@src/pages/home/home";

export default function App() {
  return (
    <BrowserRouter>
      <AuthSessionProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/enterprise/login" element={<EnterpriseLoginPage />} />
          <Route
            path="/enterprise/:tenantSlug"
            element={
              <RequireAuth>
                <EnterpriseDashboardPage />
              </RequireAuth>
            }
          />
          <Route path="/:tenantSlug" element={<BookingPage />} />
        </Routes>
      </AuthSessionProvider>
    </BrowserRouter>
  );
}
