import { apiClient } from "../../services/api-client";

export type CompanyProfile = { id: string; name: string; phone: string | null; email: string | null; address: string | null; logo: string | null; panNumber: string; vatRegistered: boolean; vatNumber: string | null; activeFiscalYearId: string | null; onboardingCompleted: boolean };
export type AccountingSettings = { voucherNumbering: "AUTO" | "MANUAL"; decimalPlaces: number; allowJournalEditing: boolean; lockAfterClosing: boolean; defaultVoucherView: "STANDARD" | "COMPACT" };
export type FiscalLock = { lockBeforeDate: string | null; lockClosedFiscalYear: boolean; allowAdminOverride: boolean };
export type CompanySettings = { id: string; companyId: string; businessType: string; currency: string; currencySymbol: string; language: string; dateFormat: "BS" | "AD"; timezone: string; decimalPlaces: number; allowNegativeStock: boolean; accounting: AccountingSettings; fiscalLock: FiscalLock };
export type PanSettings = { panNumber: string; registrationDate: string | null; registrationOffice: string | null; validationStatus: "UNVERIFIED" | "VALIDATED"; vatRegistered: boolean; vatNumber: string | null };
export type VatSettings = { vatRegistered: boolean; vatNumber: string | null; defaultVatRate: number; vatMode: "EXCLUSIVE" | "INCLUSIVE" };
export type FiscalYear = { id: string; name: string; startDateBS: string; endDateBS: string; startDateAD: string | null; endDateAD: string | null; isActive: boolean; isLocked: boolean };

export const settingsKeys = { all: ["settings"] as const, company: (id: string) => [...settingsKeys.all, "company", id] as const, detail: () => [...settingsKeys.all, "detail"] as const, pan: () => [...settingsKeys.all, "pan"] as const, vat: () => [...settingsKeys.all, "vat"] as const, fiscalYears: () => [...settingsKeys.all, "fiscal-years"] as const };

export const settingsApi = {
  company: (companyId: string, signal?: AbortSignal) => apiClient<CompanyProfile>(`/companies/${companyId}`, { signal }),
  updateCompany: (companyId: string, input: Partial<Pick<CompanyProfile, "name" | "phone" | "email" | "address" | "logo">>) => apiClient<CompanyProfile>(`/companies/${companyId}`, { method: "PATCH", body: JSON.stringify(input) }),
  get: (signal?: AbortSignal) => apiClient<CompanySettings>("/settings", { signal }),
  update: (input: Partial<Pick<CompanySettings, "businessType" | "currency" | "currencySymbol" | "language" | "dateFormat" | "timezone" | "decimalPlaces" | "allowNegativeStock">>) => apiClient<CompanySettings>("/settings", { method: "PATCH", body: JSON.stringify(input) }),
  updateAccounting: (input: { accounting?: Partial<AccountingSettings>; fiscalLock?: Partial<FiscalLock> }) => apiClient<CompanySettings>("/settings/accounting", { method: "PATCH", body: JSON.stringify(input) }),
  pan: (signal?: AbortSignal) => apiClient<PanSettings>("/localization/pan", { signal }),
  updatePan: (input: Partial<Pick<PanSettings, "panNumber" | "registrationDate" | "registrationOffice">>) => apiClient<PanSettings>("/localization/pan", { method: "PATCH", body: JSON.stringify(input) }),
  vat: (signal?: AbortSignal) => apiClient<VatSettings>("/localization/vat", { signal }),
  updateVat: (input: VatSettings) => apiClient<VatSettings>("/localization/vat", { method: "PATCH", body: JSON.stringify(input) }),
  fiscalYears: (signal?: AbortSignal) => apiClient<FiscalYear[]>("/fiscal-years", { signal }),
  createFiscalYear: (input: Omit<FiscalYear, "id" | "isActive" | "isLocked">) => apiClient<FiscalYear>("/fiscal-years", { method: "POST", body: JSON.stringify(input) }),
  activateFiscalYear: (id: string) => apiClient<FiscalYear>(`/fiscal-years/${id}`, { method: "PATCH", body: JSON.stringify({ isActive: true }) }),
  closeFiscalYear: (id: string) => apiClient<FiscalYear>(`/fiscal-years/${id}/close`, { method: "POST" })
};
