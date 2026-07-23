import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  masterKeys,
  mastersApi,
  type CategoryInput,
  type ContactInput,
  type PaymentTermInput,
  type ProductInput,
  type TaxRateInput,
  type UnitInput,
} from "./masters-api";

function useMasterMutation<T>(mutationFn: (value: T) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    retry: false,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: masterKeys.all }),
  });
}

export const useContacts = (filters: {
  search?: string;
  role?: string;
  page?: number;
  isActive?: "true" | "false" | "all";
}) =>
  useQuery({
    queryKey: masterKeys.contacts(filters),
    queryFn: ({ signal }) => mastersApi.contacts(filters, signal),
  });
export const useContact = (id?: string) =>
  useQuery({
    queryKey: [...masterKeys.all, "contacts", "detail", id] as const,
    queryFn: ({ signal }) => mastersApi.contact(id!, signal),
    enabled: Boolean(id),
  });
export const useUnits = () =>
  useQuery({
    queryKey: masterKeys.units(),
    queryFn: ({ signal }) => mastersApi.units(signal),
  });
export const useCategories = () =>
  useQuery({
    queryKey: masterKeys.categories(),
    queryFn: ({ signal }) => mastersApi.categories(signal),
  });
export const useTaxRates = () =>
  useQuery({
    queryKey: masterKeys.taxRates(),
    queryFn: ({ signal }) => mastersApi.taxRates(signal),
  });
export const usePaymentTerms = () =>
  useQuery({
    queryKey: masterKeys.paymentTerms(),
    queryFn: ({ signal }) => mastersApi.paymentTerms(signal),
  });
export const useProducts = () =>
  useQuery({
    queryKey: masterKeys.products(),
    queryFn: ({ signal }) => mastersApi.products(signal),
  });
export const useCreateContact = () =>
  useMasterMutation((input: ContactInput) => mastersApi.createContact(input));
export const useUpdateContact = () =>
  useMasterMutation(
    ({ id, input }: { id: string; input: Partial<ContactInput> }) =>
      mastersApi.updateContact(id, input),
  );
export const useArchiveContact = () =>
  useMasterMutation((id: string) => mastersApi.archiveContact(id));
export const useRestoreContact = () =>
  useMasterMutation((id: string) => mastersApi.restoreContact(id));
export const useCreateUnit = () =>
  useMasterMutation((input: UnitInput) => mastersApi.createUnit(input));
export const useCreateCategory = () =>
  useMasterMutation((input: CategoryInput) => mastersApi.createCategory(input));
export const useCreateTaxRate = () =>
  useMasterMutation((input: TaxRateInput) => mastersApi.createTaxRate(input));
export const useCreatePaymentTerm = () =>
  useMasterMutation((input: PaymentTermInput) =>
    mastersApi.createPaymentTerm(input),
  );
export const useCreateProduct = () =>
  useMasterMutation((input: ProductInput) => mastersApi.createProduct(input));
