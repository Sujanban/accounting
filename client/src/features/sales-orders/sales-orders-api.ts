import { apiClient } from "../../services/api-client";
export type SalesOrderInput = { branchId: string; contactId: string; orderDate: string; items: Array<{ productId: string; quantity: number; unitPrice: number }>; notes?: string };
export type SalesOrder = SalesOrderInput & { id: string; orderNumber: string; status: "DRAFT" | "CONFIRMED" | "CANCELLED" };
export const salesOrdersApi = { list: (signal?: AbortSignal) => apiClient<{ items: SalesOrder[] }>("/sales-orders?page=1&limit=20", { signal }), create: (input: SalesOrderInput) => apiClient<SalesOrder>("/sales-orders", { method: "POST", body: JSON.stringify(input) }) };
