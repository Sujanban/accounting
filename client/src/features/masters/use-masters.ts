import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  masterKeys,
  mastersApi,
  archiveCatalog,
  catalogPage,
  restoreCatalog,
  updateCatalog,
  type CategoryInput,
  type ContactGroupInput,
  type ContactInput,
  type PaymentTermInput,
  type PriceListInput,
  type ProductInput,
  type TaxRateInput,
  type UnitInput,
  type WarehouseInput,
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
export const useUnits = (isActive = "true") =>
  useQuery({
    queryKey: masterKeys.units(isActive),
    queryFn: ({ signal }) => mastersApi.units(isActive, signal),
  });
export const useCategories = (isActive = "true") =>
  useQuery({
    queryKey: masterKeys.categories(isActive),
    queryFn: ({ signal }) => mastersApi.categories(isActive, signal),
  });
export const useTaxRates = (isActive = "true") =>
  useQuery({
    queryKey: masterKeys.taxRates(isActive),
    queryFn: ({ signal }) => mastersApi.taxRates(isActive, signal),
  });
export const usePaymentTerms = (isActive = "true") =>
  useQuery({
    queryKey: masterKeys.paymentTerms(isActive),
    queryFn: ({ signal }) => mastersApi.paymentTerms(isActive, signal),
  });
export const useContactGroups = (isActive = "true") => useQuery({ queryKey: masterKeys.contactGroups(isActive), queryFn: ({ signal }) => mastersApi.contactGroups(isActive, signal) });
export const useWarehouses = (isActive = "true") => useQuery({ queryKey: masterKeys.warehouses(isActive), queryFn: ({ signal }) => mastersApi.warehouses(isActive, signal) });
export const usePriceLists = (isActive = "true") => useQuery({ queryKey: masterKeys.priceLists(isActive), queryFn: ({ signal }) => mastersApi.priceLists(isActive, signal) });
export const useProducts = (isActive = "true") =>
  useQuery({
    queryKey: masterKeys.products(isActive),
    queryFn: ({ signal }) => mastersApi.products(isActive, signal),
  });
export const useProduct = (id?: string) => useQuery({ queryKey: [...masterKeys.all, "products", "detail", id] as const, queryFn: ({ signal }) => mastersApi.product(id!, signal), enabled: Boolean(id) });
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
export const useCreateContactGroup = () => useMasterMutation((input: ContactGroupInput) => mastersApi.createContactGroup(input));
export const useCreateWarehouse = () => useMasterMutation((input: WarehouseInput) => mastersApi.createWarehouse(input));
export const useCreatePriceList = () => useMasterMutation((input: PriceListInput) => mastersApi.createPriceList(input));
export const useUploadAttachment = () => useMutation({ mutationFn: ({ file, entityType, entityId }: { file: File; entityType: string; entityId: string }) => mastersApi.uploadAttachment(file, entityType, entityId), retry: false });
export const useDeleteAttachment = () => useMutation({ mutationFn: mastersApi.deleteAttachment, retry: false });
export const useAttachments = (entityType: string, entityId: string) => useQuery({ queryKey: [...masterKeys.all, "attachments", entityType, entityId], queryFn: ({ signal }) => mastersApi.attachments(entityType, entityId, signal), enabled: Boolean(entityId) });
export const useCreateProduct = () =>
  useMasterMutation((input: ProductInput) => mastersApi.createProduct(input));
export const useCatalogPage = <T>(resource: "units" | "categories" | "tax-rates" | "payment-terms" | "contact-groups" | "warehouses" | "price-lists" | "products", filters: { page: number; limit: number; search?: string; isActive?: "true" | "false" | "all" }) => useQuery({ queryKey: [...masterKeys.all, resource, "page", filters] as const, queryFn: ({ signal }) => catalogPage<T>(resource, filters, signal) });
export const useUpdateCatalog = <T>(resource: "units" | "categories" | "tax-rates" | "payment-terms" | "contact-groups" | "warehouses" | "price-lists" | "products") => useMasterMutation(({ id, input }: { id: string; input: Partial<T> }) => updateCatalog<T>(resource, id, input));
export const useArchiveCatalog = <T>(resource: "units" | "categories" | "tax-rates" | "payment-terms" | "contact-groups" | "warehouses" | "price-lists" | "products") => useMasterMutation((id: string) => archiveCatalog<T>(resource, id));
export const useRestoreCatalog = <T>(resource: "units" | "categories" | "tax-rates" | "payment-terms" | "contact-groups" | "warehouses" | "price-lists" | "products") => useMasterMutation((id: string) => restoreCatalog<T>(resource, id));
