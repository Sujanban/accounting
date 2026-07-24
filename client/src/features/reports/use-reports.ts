import { useQuery } from "@tanstack/react-query";
import { reportKeys, reportsApi, type ReportFilters } from "./reports-api";

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
