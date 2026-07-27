import { apiClient } from "../../services/api-client";
export type LeadInput = { branchId: string; name: string; phone?: string; email?: string; source?: string; stage?: "NEW" | "QUALIFIED" | "PROPOSAL" | "WON" | "LOST"; notes?: string };
export type Lead = LeadInput & { id: string; stage: NonNullable<LeadInput["stage"]> };
export const leadsApi = { list: (signal?: AbortSignal) => apiClient<Lead[]>("/leads", { signal }), create: (input: LeadInput) => apiClient<Lead>("/leads", { method: "POST", body: JSON.stringify(input) }) };
