import { apiClient } from "../../services/api-client";

export type ReportFilters = {
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
  warehouseId?: string;
  productId?: string;
  branchId?: string;
};
export type ReportPageMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
};
export type GeneralLedger = {
  ledger: {
    id: string;
    name: string;
    openingBalance: number;
    openingBalanceType: "DEBIT" | "CREDIT";
  };
  openingBalance: number;
  closingBalance: number;
  entries: Array<{
    journalId: string;
    transactionDate: string;
    voucherNumber: string;
    debit: number;
    credit: number;
    narration: string | null;
    runningBalance: number;
  }>;
  meta: ReportPageMeta;
};
export type TrialBalance = {
  data: Array<{
    ledgerId: string;
    ledgerName: string;
    debit: number;
    credit: number;
    closing: number;
  }>;
  totals: { debit: number; credit: number };
  isBalanced: boolean;
};
export type JournalRegister = {
  items: Array<{
    _id: string;
    voucherNumber: string;
    transactionDate: string;
    narration: string | null;
    totalDebit: number;
    totalCredit: number;
    isReversal: boolean;
  }>;
  meta: ReportPageMeta;
};
export type DayBook = {
  items: Array<{
    _id: string;
    transactionType: string;
    voucherType: string;
    voucherNumber: string | null;
    transactionDate: string;
    narration: string | null;
    status: string;
  }>;
  meta: ReportPageMeta;
};
export type StockSummary = {
  items: Array<{ productId: string; productName: string; productSku: string; warehouseId: string; warehouseName: string; quantityIn: number; quantityOut: number; quantityOnHand: number; stockValue: number }>;
  totals: { quantityIn: number; quantityOut: number; quantityOnHand: number; stockValue: number };
};
export type StockLedger = {
  product: { id: string; name: string; sku: string };
  openingQuantity: number;
  closingQuantity: number;
  closingValue: number;
  entries: Array<{ id: string; transactionId: string; transactionDate: string; warehouseId: string; movementType: string; quantityIn: number; quantityOut: number; runningQuantity: number; runningValue: number }>;
};
export type ProfitLoss = { income: Array<{ ledgerId: string; ledgerName: string; amount: number }>; expenses: Array<{ ledgerId: string; ledgerName: string; amount: number }>; totals: { income: number; expenses: number; netProfit: number } };
export type BalanceSheet = { assets: Array<{ ledgerId: string; ledgerName: string; amount: number }>; liabilities: Array<{ ledgerId: string; ledgerName: string; amount: number }>; equity: Array<{ ledgerId: string; ledgerName: string; amount: number }>; totals: { assets: number; liabilities: number; equity: number; currentEarnings: number; totalEquity: number; liabilitiesAndEquity: number }; isBalanced: boolean };
export type CashFlow = { openingBalance: number; closingBalance: number; operating: CashFlowEntry[]; investing: CashFlowEntry[]; financing: CashFlowEntry[]; totals: { operating: number; investing: number; financing: number; netCashFlow: number } };
type CashFlowEntry = { journalId: string; transactionDate: string; voucherNumber: string | null; narration: string | null; amount: number };
export type VoucherSummary = { items: Array<{ id: string; voucherNumber: string; transactionDate: string; narration: string | null; itemCount: number; amount: number }>; totals: { amount: number; count: number }; meta: ReportPageMeta };
export type VatRegister = { items: Array<{ id: string; voucherNumber: string; taxInvoiceNumber: string | null; transactionDate: string; partyName: string | null; panNumber: string | null; taxableAmount: number; vatAmount: number; totalAmount: number }>; totals: { taxableAmount: number; vatAmount: number; totalAmount: number }; meta: ReportPageMeta };
export type ProductMovementSummary = { items: Array<{ productId: string; productName: string; productSku: string; quantity: number; value: number; transactionCount: number }>; totals: { quantity: number; value: number; transactionCount: number } };
export type ExpenseSummary = { items: Array<{ ledgerId: string; ledgerName: string; amount: number }>; totals: { expenses: number } };
export type LowStock = { items: Array<{ productId: string; productName: string; productSku: string; reorderLevel: number; quantityOnHand: number; shortage: number }>; totals: { products: number; shortage: number } };
export type NegativeStock = { items: Array<{ productId: string; productName: string; productSku: string; quantityOnHand: number; deficit: number }>; totals: { products: number; deficit: number } };
export type ExpenseTrend = { items: Array<{ month: string; amount: number }>; totals: { expenses: number } };
export type SalesTrend = { items: Array<{ month: string; amount: number; voucherCount: number }>; totals: { amount: number; vouchers: number } };
export type ContactStatement = {
  contact: { id: string; contactCode: string; name: string; role: "CUSTOMER" | "SUPPLIER" };
  ledger: { id: string; name: string };
  openingBalance: number;
  closingBalance: number;
  entries: Array<{ journalId: string; transactionDate: string; voucherNumber: string | null; narration: string | null; debit: number; credit: number; runningBalance: number }>;
  meta: ReportPageMeta;
};

const query = (values: ReportFilters) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values))
    if (value !== undefined && value !== "") params.set(key, String(value));
  return params.size ? `?${params}` : "";
};

export const reportKeys = {
  all: ["reports"] as const,
  generalLedger: (ledgerId: string, filters: ReportFilters) =>
    [...reportKeys.all, "general-ledger", ledgerId, filters] as const,
  trialBalance: (filters: ReportFilters) =>
    [...reportKeys.all, "trial-balance", filters] as const,
  journalRegister: (filters: ReportFilters) =>
    [...reportKeys.all, "journal-register", filters] as const,
  dayBook: (filters: ReportFilters) =>
    [...reportKeys.all, "day-book", filters] as const,
  stockSummary: (filters: ReportFilters) =>
    [...reportKeys.all, "stock-summary", filters] as const,
  stockLedger: (productId: string, filters: ReportFilters) =>
    [...reportKeys.all, "stock-ledger", productId, filters] as const,
  profitLoss: (filters: ReportFilters) =>
    [...reportKeys.all, "profit-loss", filters] as const,
  balanceSheet: (filters: ReportFilters) =>
    [...reportKeys.all, "balance-sheet", filters] as const,
  contactStatement: (role: "customer" | "supplier", contactId: string, filters: ReportFilters) =>
    [...reportKeys.all, `${role}-statement`, contactId, filters] as const,
  cashFlow: (filters: ReportFilters) => [...reportKeys.all, "cash-flow", filters] as const,
  voucherSummary: (type: "sales" | "purchase", filters: ReportFilters) => [...reportKeys.all, `${type}-summary`, filters] as const,
  vatRegister: (type: "sales" | "purchase", filters: ReportFilters) => [...reportKeys.all, `vat-${type}-register`, filters] as const,
  productMovementSummary: (type: "sales" | "purchases", filters: ReportFilters) => [...reportKeys.all, `${type}-by-product`, filters] as const,
  expenseSummary: (filters: ReportFilters) => [...reportKeys.all, "expense-summary", filters] as const,
  lowStock: () => [...reportKeys.all, "low-stock"] as const,
  negativeStock: () => [...reportKeys.all, "negative-stock"] as const,
  expenseTrend: (filters: ReportFilters) => [...reportKeys.all, "expense-trend", filters] as const,
  salesTrend: (filters: ReportFilters) => [...reportKeys.all, "sales-trend", filters] as const,
};

export const reportsApi = {
  generalLedger: (
    ledgerId: string,
    filters: ReportFilters,
    signal?: AbortSignal,
  ) =>
    apiClient<GeneralLedger>(
      `/reports/general-ledger${query({ ...filters, ledgerId } as ReportFilters & { ledgerId: string })}`,
      { signal },
    ),
  trialBalance: (filters: ReportFilters, signal?: AbortSignal) =>
    apiClient<TrialBalance>(`/reports/trial-balance${query(filters)}`, {
      signal,
    }),
  journalRegister: (filters: ReportFilters, signal?: AbortSignal) =>
    apiClient<JournalRegister>(`/reports/journal-register${query(filters)}`, {
      signal,
    }),
  dayBook: (filters: ReportFilters, signal?: AbortSignal) =>
    apiClient<DayBook>(`/reports/day-book${query(filters)}`, { signal }),
  stockSummary: (filters: ReportFilters, signal?: AbortSignal) =>
    apiClient<StockSummary>(`/reports/stock-summary${query(filters)}`, { signal }),
  stockLedger: (productId: string, filters: ReportFilters, signal?: AbortSignal) =>
    apiClient<StockLedger>(`/reports/stock-ledger${query({ ...filters, productId })}`, { signal }),
  profitLoss: (filters: ReportFilters, signal?: AbortSignal) =>
    apiClient<ProfitLoss>(`/reports/profit-loss${query(filters)}`, { signal }),
  balanceSheet: (filters: ReportFilters, signal?: AbortSignal) =>
    apiClient<BalanceSheet>(`/reports/balance-sheet${query(filters)}`, { signal }),
  contactStatement: (role: "customer" | "supplier", contactId: string, filters: ReportFilters, signal?: AbortSignal) =>
    apiClient<ContactStatement>(`/reports/${role}-statement${query({ ...filters, contactId } as ReportFilters & { contactId: string })}`, { signal }),
  cashFlow: (filters: ReportFilters, signal?: AbortSignal) =>
    apiClient<CashFlow>(`/reports/cash-flow${query(filters)}`, { signal }),
  voucherSummary: (type: "sales" | "purchase", filters: ReportFilters, signal?: AbortSignal) =>
    apiClient<VoucherSummary>(`/reports/${type}-summary${query(filters)}`, { signal }),
  vatRegister: (type: "sales" | "purchase", filters: ReportFilters, signal?: AbortSignal) => apiClient<VatRegister>(`/reports/vat-${type}-register${query(filters)}`, { signal }),
  productMovementSummary: (type: "sales" | "purchases", filters: ReportFilters, signal?: AbortSignal) =>
    apiClient<ProductMovementSummary>(`/reports/${type}-by-product${query(filters)}`, { signal }),
  expenseSummary: (filters: ReportFilters, signal?: AbortSignal) =>
    apiClient<ExpenseSummary>(`/reports/expense-summary${query(filters)}`, { signal }),
  lowStock: (signal?: AbortSignal) => apiClient<LowStock>("/reports/low-stock", { signal }),
  negativeStock: (signal?: AbortSignal) => apiClient<NegativeStock>("/reports/negative-stock", { signal }),
  expenseTrend: (filters: ReportFilters, signal?: AbortSignal) => apiClient<ExpenseTrend>(`/reports/expense-trend${query(filters)}`, { signal }),
  salesTrend: (filters: ReportFilters, signal?: AbortSignal) => apiClient<SalesTrend>(`/reports/sales-trend${query(filters)}`, { signal }),
};
