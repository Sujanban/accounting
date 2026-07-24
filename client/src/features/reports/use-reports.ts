import { useQuery } from "@tanstack/react-query";
import { reportKeys, reportsApi, type ReportFilters } from "./reports-api";

const DASHBOARD_CACHE_OPTIONS = { staleTime: 60_000, gcTime: 300_000 };

export const useGeneralLedger = (ledgerId: string, filters: ReportFilters) =>
  useQuery({
    queryKey: reportKeys.generalLedger(ledgerId, filters),
    queryFn: ({ signal }) =>
      reportsApi.generalLedger(ledgerId, filters, signal),
    enabled: Boolean(ledgerId),
  });
export const useTrialBalance = (filters: ReportFilters) =>
  useQuery({
    queryKey: reportKeys.trialBalance(filters),
    queryFn: ({ signal }) => reportsApi.trialBalance(filters, signal),
    ...DASHBOARD_CACHE_OPTIONS,
  });
export const useJournalRegister = (filters: ReportFilters) =>
  useQuery({
    queryKey: reportKeys.journalRegister(filters),
    queryFn: ({ signal }) => reportsApi.journalRegister(filters, signal),
  });
export const useDayBook = (filters: ReportFilters) =>
  useQuery({
    queryKey: reportKeys.dayBook(filters),
    queryFn: ({ signal }) => reportsApi.dayBook(filters, signal),
  });
export const useStockSummary = (filters: ReportFilters) =>
  useQuery({
    queryKey: reportKeys.stockSummary(filters),
    queryFn: ({ signal }) => reportsApi.stockSummary(filters, signal),
    ...DASHBOARD_CACHE_OPTIONS,
  });
export const useStockLedger = (productId: string, filters: ReportFilters) =>
  useQuery({
    queryKey: reportKeys.stockLedger(productId, filters),
    queryFn: ({ signal }) => reportsApi.stockLedger(productId, filters, signal),
    enabled: Boolean(productId),
  });
export const useProfitLoss = (filters: ReportFilters) =>
  useQuery({
    queryKey: reportKeys.profitLoss(filters),
    queryFn: ({ signal }) => reportsApi.profitLoss(filters, signal),
    ...DASHBOARD_CACHE_OPTIONS,
  });
export const useBalanceSheet = (filters: ReportFilters) =>
  useQuery({
    queryKey: reportKeys.balanceSheet(filters),
    queryFn: ({ signal }) => reportsApi.balanceSheet(filters, signal),
    ...DASHBOARD_CACHE_OPTIONS,
  });
export const useContactStatement = (role: "customer" | "supplier", contactId: string, filters: ReportFilters) =>
  useQuery({
    queryKey: reportKeys.contactStatement(role, contactId, filters),
    queryFn: ({ signal }) => reportsApi.contactStatement(role, contactId, filters, signal),
    enabled: Boolean(contactId),
  });
export const useCashFlow = (filters: ReportFilters) =>
  useQuery({
    queryKey: reportKeys.cashFlow(filters),
    queryFn: ({ signal }) => reportsApi.cashFlow(filters, signal),
    ...DASHBOARD_CACHE_OPTIONS,
  });
export const useVoucherSummary = (type: "sales" | "purchase", filters: ReportFilters) =>
  useQuery({ queryKey: reportKeys.voucherSummary(type, filters), queryFn: ({ signal }) => reportsApi.voucherSummary(type, filters, signal) });
export const useProductMovementSummary = (type: "sales" | "purchases", filters: ReportFilters) =>
  useQuery({ queryKey: reportKeys.productMovementSummary(type, filters), queryFn: ({ signal }) => reportsApi.productMovementSummary(type, filters, signal) });
export const useExpenseSummary = (filters: ReportFilters) =>
  useQuery({ queryKey: reportKeys.expenseSummary(filters), queryFn: ({ signal }) => reportsApi.expenseSummary(filters, signal) });
export const useLowStock = () =>
  useQuery({ queryKey: reportKeys.lowStock(), queryFn: ({ signal }) => reportsApi.lowStock(signal) });
export const useNegativeStock = () =>
  useQuery({ queryKey: reportKeys.negativeStock(), queryFn: ({ signal }) => reportsApi.negativeStock(signal) });
export const useExpenseTrend = (filters: ReportFilters) =>
  useQuery({ queryKey: reportKeys.expenseTrend(filters), queryFn: ({ signal }) => reportsApi.expenseTrend(filters, signal) });
export const useSalesTrend = (filters: ReportFilters) =>
  useQuery({ queryKey: reportKeys.salesTrend(filters), queryFn: ({ signal }) => reportsApi.salesTrend(filters, signal) });
