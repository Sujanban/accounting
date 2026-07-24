import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { transactionsApi } from "./transactions-api";
const key = ["transactions"] as const;
export const useTransactions = (filters: { page: number; status?: string; transactionType?: string }) => useQuery({ queryKey: [...key, filters], queryFn: ({ signal }) => transactionsApi.list(filters, signal) });
export const useTransaction = (id?: string) => useQuery({ queryKey: [...key, "detail", id] as const, queryFn: ({ signal }) => transactionsApi.detail(id!, signal), enabled: Boolean(id) });
export const usePostTransaction = () => { const client = useQueryClient(); return useMutation({ mutationFn: transactionsApi.post, onSuccess: () => client.invalidateQueries({ queryKey: key }) }); };
export const useReverseTransaction = () => { const client = useQueryClient(); return useMutation({ mutationFn: transactionsApi.reverse, onSuccess: () => client.invalidateQueries({ queryKey: key }) }); };
export const useCreateTransactionDraft = () => { const client = useQueryClient(); return useMutation({ mutationFn: transactionsApi.createDraft, onSuccess: () => client.invalidateQueries({ queryKey: key }) }); };
export const useUpdateTransactionDraft = () => { const client = useQueryClient(); return useMutation({ mutationFn: ({ id, input }: { id: string; input: Parameters<typeof transactionsApi.updateDraft>[1] }) => transactionsApi.updateDraft(id, input), onSuccess: () => client.invalidateQueries({ queryKey: key }) }); };
