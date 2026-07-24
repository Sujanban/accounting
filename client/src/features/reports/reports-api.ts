import { apiClient } from "../../services/api-client";

export type ReportFilters = {
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
  warehouseId?: string;
  productId?: string;
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
};
