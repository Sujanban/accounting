import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { accountingApi, accountingKeys, type AccountGroupInput, type LedgerInput, type VoucherSequenceInput } from "./accounting-api";

const accountingInvalidationKeys = [accountingKeys.all];

function useAccountingMutation<TVariables>(mutationFn: (variables: TVariables) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    retry: false,
    onSuccess: () => Promise.all(accountingInvalidationKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey }))),
  });
}

export function useAccountGroups(isActive?: boolean) {
  return useQuery({ queryKey: accountingKeys.accountGroups(isActive), queryFn: ({ signal }) => accountingApi.accountGroups(isActive, signal) });
}

export function useChartOfAccounts() {
  return useQuery({ queryKey: accountingKeys.chart(), queryFn: ({ signal }) => accountingApi.chart(signal) });
}

export function useLedgers(filters: { search?: string; groupId?: string; isActive?: boolean }) {
  return useQuery({ queryKey: accountingKeys.ledgers(filters), queryFn: ({ signal }) => accountingApi.ledgers(filters, signal) });
}

export function useVoucherSequences() {
  return useQuery({ queryKey: accountingKeys.voucherSequences(), queryFn: ({ signal }) => accountingApi.voucherSequences(signal) });
}

export const useCreateAccountGroup = () => useAccountingMutation((input: AccountGroupInput) => accountingApi.createAccountGroup(input));
export const useUpdateAccountGroup = () => useAccountingMutation(({ id, input }: { id: string; input: Partial<AccountGroupInput> }) => accountingApi.updateAccountGroup(id, input));
export const useArchiveAccountGroup = () => useAccountingMutation((id: string) => accountingApi.archiveAccountGroup(id));
export const useRestoreAccountGroup = () => useAccountingMutation((id: string) => accountingApi.restoreAccountGroup(id));
export const useCreateLedger = () => useAccountingMutation((input: LedgerInput) => accountingApi.createLedger(input));
export const useUpdateLedger = () => useAccountingMutation(({ id, input }: { id: string; input: Partial<LedgerInput> }) => accountingApi.updateLedger(id, input));
export const useArchiveLedger = () => useAccountingMutation((id: string) => accountingApi.archiveLedger(id));
export const useRestoreLedger = () => useAccountingMutation((id: string) => accountingApi.restoreLedger(id));
export const useUpdateVoucherSequence = () => useAccountingMutation(({ id, input }: { id: string; input: VoucherSequenceInput }) => accountingApi.updateVoucherSequence(id, input));
