import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/app-shell";
import { LoginPage, RegisterPage } from "./features/auth/auth-page";
import { AccountGroupCreatePage, AccountGroupEditPage, AccountingPage, LedgerCreatePage, LedgerEditPage, VoucherSequenceEditPage } from "./features/accounting/accounting-page";
import { RequireAuth } from "./features/auth/require-auth";
import { OnboardingPage } from "./features/onboarding/onboarding-page";
import { RequireOnboarding } from "./features/onboarding/require-onboarding";
import { MastersPage, PartyCreatePage, PartyEditPage, ProductEditPage } from "./features/masters/masters-page";
import { DashboardPage } from "./pages/dashboard-page";
import { PlaceholderPage } from "./pages/placeholder-page";
import { SettingsPage } from "./pages/settings-page";
import { TransactionEditPage, TransactionsPage } from "./features/transactions/transactions-page";

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
            <Route path="vouchers" element={<TransactionsPage />} />
            <Route path="vouchers/transactions/:transactionId" element={<TransactionsPage />} />
            <Route path="vouchers/transactions/:transactionId/edit" element={<TransactionEditPage />} />
            <Route path="vouchers/drafts" element={<TransactionsPage drafts />} />
            <Route path="vouchers/:voucherType" element={<TransactionsPage />} />
            <Route path="vouchers/:voucherType/new" element={<TransactionsPage create />} />
            <Route path="masters/parties/new" element={<PartyCreatePage />} />
            <Route path="masters/parties/:partyId/edit" element={<PartyEditPage />} />
            <Route path="masters/products/:productId/edit" element={<ProductEditPage />} />
            <Route path="masters/:masterType/:masterId/edit" element={<MastersPage />} />
            <Route path="masters/:masterType/new" element={<MastersPage />} />
            <Route path="masters/:masterType" element={<MastersPage />} />
            <Route path="accounting/voucher-numbering/:voucherSequenceId/edit" element={<VoucherSequenceEditPage />} />
            <Route path="accounting/ledgers/new" element={<LedgerCreatePage />} />
            <Route path="accounting/ledgers/:ledgerId/edit" element={<LedgerEditPage />} />
            <Route path="accounting/account-groups/new" element={<AccountGroupCreatePage />} />
            <Route path="accounting/account-groups/:accountGroupId/edit" element={<AccountGroupEditPage />} />
            <Route path="accounting/:section" element={<AccountingPage />} />
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
