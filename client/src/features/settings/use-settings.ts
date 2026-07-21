import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { settingsApi, settingsKeys } from "./settings-api";

export function useSettings(companyId: string | null) {
  return useQuery({ queryKey: settingsKeys.detail(), queryFn: ({ signal }) => settingsApi.get(signal), enabled: Boolean(companyId) });
}
export function useCompanyProfile(companyId: string | null) { return useQuery({ queryKey: settingsKeys.company(companyId ?? ""), queryFn: ({ signal }) => settingsApi.company(companyId!, signal), enabled: Boolean(companyId) }); }
export function usePan() { return useQuery({ queryKey: settingsKeys.pan(), queryFn: ({ signal }) => settingsApi.pan(signal) }); }
export function useVat() { return useQuery({ queryKey: settingsKeys.vat(), queryFn: ({ signal }) => settingsApi.vat(signal) }); }
export function useFiscalYears() { return useQuery({ queryKey: settingsKeys.fiscalYears(), queryFn: ({ signal }) => settingsApi.fiscalYears(signal) }); }

function useSettingsMutation<TVariables>(mutationFn: (variables: TVariables) => Promise<unknown>, keys: ReadonlyArray<readonly unknown[]>) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn, retry: false, onSuccess: () => Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey }))) });
}
export function useUpdateCompany(companyId: string) { return useSettingsMutation((input: Parameters<typeof settingsApi.updateCompany>[1]) => settingsApi.updateCompany(companyId, input), [settingsKeys.company(companyId)]); }
export function useUpdateSettings() { return useSettingsMutation(settingsApi.update, [settingsKeys.detail()]); }
export function useUpdateAccounting() { return useSettingsMutation(settingsApi.updateAccounting, [settingsKeys.detail()]); }
export function useUpdatePan() { return useSettingsMutation(settingsApi.updatePan, [settingsKeys.pan()]); }
export function useUpdateVat() { return useSettingsMutation(settingsApi.updateVat, [settingsKeys.vat()]); }
export function useFiscalYearMutation() { return useSettingsMutation(settingsApi.createFiscalYear, [settingsKeys.fiscalYears(), settingsKeys.detail()]); }
export function useActivateFiscalYear() { return useSettingsMutation(settingsApi.activateFiscalYear, [settingsKeys.fiscalYears(), settingsKeys.detail()]); }
export function useCloseFiscalYear() { return useSettingsMutation(settingsApi.closeFiscalYear, [settingsKeys.fiscalYears()]); }
