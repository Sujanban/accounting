import { apiClient } from "../../services/api-client";

export type TransactionStatus = "DRAFT" | "POSTED" | "REVERSED" | "CANCELLED";
export type Transaction = { id: string; transactionType: string; voucherType: string; voucherNumber: string | null; transactionDate: string; narration: string | null; accountingEntries: Array<{ ledgerId: string; debit: number; credit: number; narration?: string | null }>; inventoryEntries: Array<{ productId: string; warehouseId: string; quantity: number; direction: "IN" | "OUT"; unitCost: number }>; status: TransactionStatus; reversedById: string | null; /** Legacy-only; the server does not return or persist this value. */ referenceNo?: string | null; createdAt?: string; updatedAt?: string; postedAt?: string | null };
export type TransactionPage = { items: Transaction[]; meta: { page: number; totalPages: number; total: number; hasNextPage: boolean } };
export type VoucherTransactionType = "JOURNAL" | "RECEIPT" | "PAYMENT" | "CONTRA" | "SALE" | "PURCHASE";
const voucherPaths: Record<VoucherTransactionType, string> = { JOURNAL: "journal", RECEIPT: "receipt", PAYMENT: "payment", CONTRA: "contra", SALE: "sales", PURCHASE: "purchase" };
const query = (values: Record<string, string | number | undefined>) => { const params = new URLSearchParams(); Object.entries(values).forEach(([key, value]) => { if (value !== undefined && value !== "") params.set(key, String(value)); }); return params.size ? `?${params}` : ""; };
export const transactionsApi = {
  list: (filters: { page: number; status?: string; transactionType?: string }, signal?: AbortSignal) => apiClient<TransactionPage>(`/transactions${query(filters)}`, { signal }),
  listVouchers: (type: VoucherTransactionType, filters: { page: number; status?: string }, signal?: AbortSignal) => apiClient<TransactionPage>(`/${voucherPaths[type]}${query(filters)}`, { signal }),
  detail: (id: string, signal?: AbortSignal) => apiClient<Transaction>(`/transactions/${id}`, { signal }),
  createDraft: (input: Omit<Transaction, "id" | "voucherNumber" | "status" | "reversedById">) => apiClient<Transaction>("/transactions/draft", { method: "POST", body: JSON.stringify(input) }),
  createVoucherDraft: (type: VoucherTransactionType, input: Omit<Transaction, "id" | "voucherNumber" | "status" | "reversedById" | "transactionType" | "voucherType">) => apiClient<Transaction>(`/${voucherPaths[type]}`, { method: "POST", body: JSON.stringify(input) }),
  updateDraft: (id: string, input: Partial<Omit<Transaction, "id" | "voucherNumber" | "status" | "reversedById">>) => apiClient<Transaction>(`/transactions/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  updateVoucherDraft: (type: VoucherTransactionType, id: string, input: Partial<Omit<Transaction, "id" | "voucherNumber" | "status" | "reversedById" | "transactionType" | "voucherType">>) => apiClient<Transaction>(`/${voucherPaths[type]}/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  post: (id: string) => apiClient<Transaction>(`/transactions/${id}/post`, { method: "POST" }),
  postVoucher: (type: VoucherTransactionType, id: string) => apiClient<Transaction>(`/${voucherPaths[type]}/${id}/post`, { method: "POST" }),
  reverse: (id: string) => apiClient<Transaction>(`/transactions/${id}/reverse`, { method: "POST" }),
};
