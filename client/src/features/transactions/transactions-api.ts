import { apiClient } from "../../services/api-client";

export type TransactionStatus = "DRAFT" | "POSTED" | "REVERSED" | "CANCELLED";
export type Transaction = { id: string; transactionType: string; voucherType: string; voucherNumber: string | null; transactionDate: string; referenceNo: string | null; narration: string | null; accountingEntries: Array<{ ledgerId: string; debit: number; credit: number; narration?: string | null }>; inventoryEntries: Array<{ productId: string; warehouseId: string; quantity: number; direction: "IN" | "OUT"; unitCost: number }>; status: TransactionStatus; reversedById: string | null };
export type TransactionPage = { items: Transaction[]; meta: { page: number; totalPages: number; total: number; hasNextPage: boolean } };
const query = (values: Record<string, string | number | undefined>) => { const params = new URLSearchParams(); Object.entries(values).forEach(([key, value]) => { if (value !== undefined && value !== "") params.set(key, String(value)); }); return params.size ? `?${params}` : ""; };
export const transactionsApi = {
  list: (filters: { page: number; status?: string; transactionType?: string }, signal?: AbortSignal) => apiClient<TransactionPage>(`/transactions${query(filters)}`, { signal }),
  detail: (id: string, signal?: AbortSignal) => apiClient<Transaction>(`/transactions/${id}`, { signal }),
  createDraft: (input: Omit<Transaction, "id" | "voucherNumber" | "status" | "reversedById">) => apiClient<Transaction>("/transactions/draft", { method: "POST", body: JSON.stringify(input) }),
  updateDraft: (id: string, input: Partial<Omit<Transaction, "id" | "voucherNumber" | "status" | "reversedById">>) => apiClient<Transaction>(`/transactions/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  post: (id: string) => apiClient<Transaction>(`/transactions/${id}/post`, { method: "POST" }),
  reverse: (id: string) => apiClient<Transaction>(`/transactions/${id}/reverse`, { method: "POST" }),
};
