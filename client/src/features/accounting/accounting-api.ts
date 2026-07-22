import { apiClient } from "../../services/api-client";

export const accountGroupTypes = [
  "Assets",
  "Liabilities",
  "Equity",
  "Income",
  "Expenses",
] as const;
export type AccountGroupType = (typeof accountGroupTypes)[number];
export type BalanceType = "DEBIT" | "CREDIT";

export const voucherTypeLabels: Record<string, string> = {
  JV: "Journal voucher",
  SV: "Sales voucher",
  PV: "Purchase voucher",
  RV: "Receipt voucher",
  PMV: "Payment voucher",
  CV: "Contra voucher",
};

export type AccountGroup = {
  id: string;
  companyId: string;
  systemCode: string | null;
  name: string;
  type: AccountGroupType;
  parentId: string | null;
  description: string | null;
  isSystem: boolean;
  isActive: boolean;
};

export type Ledger = {
  id: string;
  companyId: string;
  fiscalYearId: string;
  groupId: string;
  systemCode: string | null;
  name: string;
  openingBalance: number;
  openingBalanceType: BalanceType;
  description: string | null;
  allowManualEntry: boolean;
  isSystem: boolean;
  isActive: boolean;
};

export type ChartAccountGroup = AccountGroup & {
  children: ChartAccountGroup[];
  ledgers: Pick<
    Ledger,
    | "id"
    | "name"
    | "systemCode"
    | "openingBalance"
    | "openingBalanceType"
    | "allowManualEntry"
    | "isSystem"
    | "isActive"
  >[];
};

export type VoucherSequence = {
  id: string;
  companyId: string;
  fiscalYearId: string;
  voucherType: string;
  prefix: string;
  nextNumber: number;
  padding: number;
  resetEveryFiscalYear: boolean;
};

export type AccountGroupInput = Pick<AccountGroup, "name" | "type"> & {
  parentId?: string | null;
  description?: string | null;
};
export type LedgerInput = Pick<
  Ledger,
  | "name"
  | "groupId"
  | "openingBalance"
  | "openingBalanceType"
  | "allowManualEntry"
> & { description?: string | null };
export type VoucherSequenceInput = Pick<
  VoucherSequence,
  "prefix" | "nextNumber" | "padding" | "resetEveryFiscalYear"
>;

function queryString(values: Record<string, string | boolean | undefined>) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}

export const accountingKeys = {
  all: ["accounting"] as const,
  accountGroups: (isActive?: boolean) =>
    [...accountingKeys.all, "account-groups", { isActive }] as const,
  chart: () => [...accountingKeys.all, "chart-of-accounts"] as const,
  ledgers: (filters: {
    search?: string;
    groupId?: string;
    isActive?: boolean;
  }) => [...accountingKeys.all, "ledgers", filters] as const,
  voucherSequences: () => [...accountingKeys.all, "voucher-sequences"] as const,
};

export const accountingApi = {
  accountGroups: (isActive?: boolean, signal?: AbortSignal) =>
    apiClient<AccountGroup[]>(
      `/accounting/account-groups${queryString({ isActive })}`,
      { signal },
    ),
  createAccountGroup: (input: AccountGroupInput) =>
    apiClient<AccountGroup>("/accounting/account-groups", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateAccountGroup: (id: string, input: Partial<AccountGroupInput>) =>
    apiClient<AccountGroup>(`/accounting/account-groups/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  archiveAccountGroup: (id: string) =>
    apiClient<AccountGroup>(`/accounting/account-groups/${id}`, {
      method: "DELETE",
    }),
  restoreAccountGroup: (id: string) =>
    apiClient<AccountGroup>(`/accounting/account-groups/${id}/restore`, {
      method: "PATCH",
    }),
  chart: (signal?: AbortSignal) =>
    apiClient<ChartAccountGroup[]>("/accounting/chart-of-accounts", { signal }),
  ledgers: (
    filters: { search?: string; groupId?: string; isActive?: boolean },
    signal?: AbortSignal,
  ) =>
    apiClient<Ledger[]>(`/accounting/ledgers${queryString(filters)}`, {
      signal,
    }),
  createLedger: (input: LedgerInput) =>
    apiClient<Ledger>("/accounting/ledgers", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateLedger: (id: string, input: Partial<LedgerInput>) =>
    apiClient<Ledger>(`/accounting/ledgers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  archiveLedger: (id: string) =>
    apiClient<Ledger>(`/accounting/ledgers/${id}`, { method: "DELETE" }),
  restoreLedger: (id: string) =>
    apiClient<Ledger>(`/accounting/ledgers/${id}/restore`, { method: "PATCH" }),
  voucherSequences: (signal?: AbortSignal) =>
    apiClient<VoucherSequence[]>("/accounting/voucher-sequences", { signal }),
  updateVoucherSequence: (id: string, input: VoucherSequenceInput) =>
    apiClient<VoucherSequence>(`/accounting/voucher-sequences/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
};
