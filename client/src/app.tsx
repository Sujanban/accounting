import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/app-shell";
import { LoginPage, RegisterPage } from "./features/auth/auth-page";
import { RequireAuth } from "./features/auth/require-auth";
import { OnboardingPage } from "./features/onboarding/onboarding-page";
import { RequireOnboarding } from "./features/onboarding/require-onboarding";
import { DashboardPage } from "./pages/dashboard-page";
import { PlaceholderPage } from "./pages/placeholder-page";
import { SettingsPage } from "./pages/settings-page";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route element={<RequireOnboarding />}>
          <Route element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route path="vouchers" element={<PlaceholderPage title="All vouchers" description="Review every voucher and its posting status." />} />
            <Route path="vouchers/drafts" element={<PlaceholderPage title="Voucher drafts" />} />
            <Route path="vouchers/:voucherType" element={<PlaceholderPage title="Vouchers" />} />
            <Route path="vouchers/:voucherType/new" element={<PlaceholderPage title="Create voucher" description="Enter a new voucher for the active company and fiscal year." />} />
            <Route path="masters/:masterType" element={<PlaceholderPage title="Masters" />} />
            <Route path="accounting/:section" element={<PlaceholderPage title="Accounting" />} />
            <Route path="reports/:report" element={<PlaceholderPage title="Reports" />} />
            <Route path="company/:section" element={<SettingsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
