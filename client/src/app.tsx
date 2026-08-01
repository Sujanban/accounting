import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/app-shell";
import { LoginPage, RegisterPage } from "./features/auth/auth-page";
import { AccountGroupCreatePage, AccountGroupEditPage, AccountingPage, LedgerCreatePage, LedgerEditPage, VoucherSequenceEditPage } from "./features/accounting/accounting-page";
import { RequireAuth } from "./features/auth/require-auth";
import { OnboardingPage } from "./features/onboarding/onboarding-page";
import { RequireOnboarding } from "./features/onboarding/require-onboarding";
import { MastersPage, PartyCreatePage, PartyEditPage, ProductEditPage } from "./features/masters/masters-page";
import { DashboardPage } from "./pages/dashboard-page";
import { CompanyPanVatPage, CompanyPreferencesPage, CompanyProfilePage, FiscalYearCreatePage, FiscalYearsPage, SettingsPage } from "./pages/settings-page";
import { TransactionEditPage, TransactionsPage } from "./features/transactions/transactions-page";
import { ReportsPage } from "./features/reports/reports-page";
import { EnterpriseOperationsReportPage } from "./features/reports/enterprise-operations-report-page";
import { OpeningBalancesPage } from "./pages/opening-balances-page";
import { BranchCreatePage, BranchesPage, WarehouseCreatePage, WarehouseEditPage, WarehousesPage } from "./pages/branches-page";
import { SalesOrderCreatePage, SalesOrderDeliveryPage, SalesOrdersPage } from "./features/sales-orders/sales-orders-page";
import { PurchaseOrderCreatePage, PurchaseOrderReceiptPage, PurchaseOrdersPage } from "./features/purchase-orders/purchase-orders-page";
import { FixedAssetCreatePage, FixedAssetDepreciationPage, FixedAssetDisposalPage, FixedAssetEditPage, FixedAssetsPage } from "./features/fixed-assets/fixed-assets-page";
import { AttendanceCreatePage, EmployeeCreatePage, EmployeeEditPage, LeaveRequestCreatePage, PayrollPage } from "./features/payroll/payroll-page";

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
            <Route path="accounting/opening-balances" element={<OpeningBalancesPage />} />
            <Route path="accounting/ledgers/new" element={<LedgerCreatePage />} />
            <Route path="accounting/ledgers/:ledgerId/edit" element={<LedgerEditPage />} />
            <Route path="accounting/account-groups/new" element={<AccountGroupCreatePage />} />
            <Route path="accounting/account-groups/:accountGroupId/edit" element={<AccountGroupEditPage />} />
            <Route path="accounting/:section" element={<AccountingPage />} />
            <Route path="reports/enterprise-operations" element={<EnterpriseOperationsReportPage />} />
            <Route path="reports/:report" element={<ReportsPage />} />
            <Route path="company/profile" element={<CompanyProfilePage />} />
            <Route path="company/preferences" element={<CompanyPreferencesPage />} />
            <Route path="company/pan-vat" element={<CompanyPanVatPage />} />
            <Route path="company/fiscal-years/new" element={<FiscalYearCreatePage />} />
            <Route path="company/fiscal-years" element={<FiscalYearsPage />} />
            <Route path="company/branches/new" element={<BranchCreatePage />} />
            <Route path="company/branches/:branchId/warehouses/new" element={<WarehouseCreatePage />} />
            <Route path="company/branches/:branchId/warehouses/:warehouseId/edit" element={<WarehouseEditPage />} />
            <Route path="company/branches" element={<BranchesPage />} />
            <Route path="company/warehouses/:branchId/new" element={<WarehouseCreatePage />} />
            <Route path="company/warehouses/:branchId/:warehouseId/edit" element={<WarehouseEditPage />} />
            <Route path="company/warehouses" element={<WarehousesPage />} />
            <Route path="company/:section" element={<Navigate to="/company/profile" replace />} />
            <Route path="sales-orders/new" element={<SalesOrderCreatePage />} />
            <Route path="sales-orders/:orderId/edit" element={<SalesOrdersPage />} />
            <Route path="sales-orders/:orderId/delivery" element={<SalesOrderDeliveryPage />} />
            <Route path="sales-orders" element={<SalesOrdersPage />} />
            <Route path="purchase-orders/new" element={<PurchaseOrderCreatePage />} />
            <Route path="purchase-orders/:orderId/edit" element={<PurchaseOrdersPage />} />
            <Route path="purchase-orders/:orderId/receipt" element={<PurchaseOrderReceiptPage />} />
            <Route path="purchase-orders" element={<PurchaseOrdersPage />} />
            <Route path="fixed-assets/new" element={<FixedAssetCreatePage />} />
            <Route path="fixed-assets/:assetId/edit" element={<FixedAssetEditPage />} />
            <Route path="fixed-assets/:assetId/depreciation" element={<FixedAssetDepreciationPage />} />
            <Route path="fixed-assets/:assetId/disposal" element={<FixedAssetDisposalPage />} />
            <Route path="fixed-assets" element={<FixedAssetsPage />} />
            <Route path="payroll/employees/new" element={<EmployeeCreatePage />} />
            <Route path="payroll/employees/:employeeId/edit" element={<EmployeeEditPage />} />
            <Route path="payroll/attendance/new" element={<AttendanceCreatePage />} />
            <Route path="payroll/leave-requests/new" element={<LeaveRequestCreatePage />} />
            <Route path="payroll" element={<PayrollPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
