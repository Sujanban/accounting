import { apiClient } from "../../services/api-client";

export type MasterAddress = {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  district?: string | null;
  country?: string | null;
};
export type ContactRole =
  | "CUSTOMER"
  | "SUPPLIER"
  | "EMPLOYEE"
  | "VENDOR"
  | "TRANSPORTER"
  | "OTHER";
export type Contact = {
  id: string;
  contactCode: string;
  name: string;
  displayName: string | null;
  roles: ContactRole[];
  contactGroupId: string | null;
  panNumber: string | null;
  vatNumber: string | null;
  phone: string | null;
  mobile: string | null;
  email: string | null;
  website: string | null;
  shippingAddress: MasterAddress;
  creditLimit: number;
  paymentTermId: string | null;
  ledgerId: string | null;
  notes: string | null;
  billingAddress: MasterAddress;
  isActive: boolean;
};
export type Unit = {
  id: string;
  name: string;
  symbol: string;
  decimalAllowed: boolean;
  isActive: boolean;
};
export type ProductCategory = {
  id: string;
  categoryCode: string;
  name: string;
  parentId: string | null;
  description: string | null;
  isActive: boolean;
};
export type TaxRate = {
  id: string;
  taxCode: string;
  name: string;
  percentage: number;
  type: "VAT" | "EXEMPT" | "ZERO_RATED";
  effectiveDate: string;
  isDefault: boolean;
  isActive: boolean;
};
export type PaymentTerm = {
  id: string;
  name: string;
  dueDays: number;
  description: string | null;
  isActive: boolean;
};
export type ContactGroup = { id: string; name: string; description: string | null; parentId: string | null; isActive: boolean };
export type Warehouse = { id: string; warehouseCode: string; name: string; address: string | null; description: string | null; isDefault: boolean; isActive: boolean };
export type PriceList = { id: string; name: string; description: string | null; currency: string; isDefault: boolean; isActive: boolean };
export type Attachment = { id: string; entityType: string; entityId: string; fileName: string; mimeType: string; sizeBytes: number; storageKey: string; url?: string; createdAt: string };
export type Product = {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  categoryId: string | null;
  unitId: string;
  purchasePrice: number;
  sellingPrice: number;
  taxId: string | null;
  reorderLevel: number;
  minimumStock: number;
  description: string | null;
  isService: boolean;
  isActive: boolean;
};
export type PaginatedMasters<T> = { items: T[]; meta: { page: number; limit: number; total: number; totalPages: number; hasNextPage: boolean } };

export type ContactInput = {
  contactCode: string;
  name: string;
  displayName?: string | null;
  roles: ContactRole[];
  contactGroupId?: string | null;
  panNumber?: string | null;
  vatNumber?: string | null;
  phone?: string | null;
  mobile?: string | null;
  email?: string | null;
  website?: string | null;
  billingAddress?: MasterAddress;
  shippingAddress?: MasterAddress;
  creditLimit?: number;
  paymentTermId?: string | null;
  notes?: string | null;
};
export type UnitInput = Pick<Unit, "name" | "symbol" | "decimalAllowed">;
export type CategoryInput = Pick<
  ProductCategory,
  "categoryCode" | "name" | "parentId" | "description"
>;
export type TaxRateInput = Pick<
  TaxRate,
  "taxCode" | "name" | "percentage" | "type" | "effectiveDate"
>;
export type PaymentTermInput = Pick<
  PaymentTerm,
  "name" | "dueDays" | "description"
>;
export type ContactGroupInput = Pick<ContactGroup, "name" | "description" | "parentId">;
export type WarehouseInput = Pick<Warehouse, "warehouseCode" | "name" | "address" | "description" | "isDefault">;
export type PriceListInput = Pick<PriceList, "name" | "description" | "currency" | "isDefault">;
export type ProductInput = Pick<
  Product,
  | "sku"
  | "barcode"
  | "name"
  | "categoryId"
  | "unitId"
  | "purchasePrice"
  | "sellingPrice"
  | "taxId"
  | "reorderLevel"
  | "minimumStock"
  | "description"
  | "isService"
>;

export const masterKeys = {
  all: ["masters"] as const,
  contacts: (filters: { search?: string; role?: string; page?: number; isActive?: "true" | "false" | "all" }) =>
    [...masterKeys.all, "contacts", filters] as const,
  units: (isActive = "true") => [...masterKeys.all, "units", isActive] as const,
  categories: (isActive = "true") => [...masterKeys.all, "categories", isActive] as const,
  taxRates: (isActive = "true") => [...masterKeys.all, "tax-rates", isActive] as const,
  paymentTerms: (isActive = "true") => [...masterKeys.all, "payment-terms", isActive] as const,
  contactGroups: (isActive = "true") => [...masterKeys.all, "contact-groups", isActive] as const,
  warehouses: (isActive = "true") => [...masterKeys.all, "warehouses", isActive] as const,
  priceLists: (isActive = "true") => [...masterKeys.all, "price-lists", isActive] as const,
  products: (isActive = "true") => [...masterKeys.all, "products", isActive] as const,
};

function query(values: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  return params.size ? `?${params}` : "";
}

export const mastersApi = {
  contacts: (
    filters: { search?: string; role?: string; page?: number },
    signal?: AbortSignal,
  ) =>
    apiClient<{
      items: Contact[];
      meta: {
        page: number;
        totalPages: number;
        total: number;
        hasNextPage: boolean;
      };
    }>(`/contacts${query(filters)}`, { signal }),
  contact: (id: string, signal?: AbortSignal) =>
    apiClient<Contact>(`/contacts/${id}`, { signal }),
  createContact: (input: ContactInput) =>
    apiClient<Contact>("/contacts", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateContact: (id: string, input: Partial<ContactInput>) =>
    apiClient<Contact>(`/contacts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  archiveContact: (id: string) =>
    apiClient<Contact>(`/contacts/${id}`, { method: "DELETE" }),
  restoreContact: (id: string) =>
    apiClient<Contact>(`/contacts/${id}/restore`, { method: "POST" }),
  units: (isActive = "true", signal?: AbortSignal) =>
    apiClient<Unit[]>(`/units${query({ isActive })}`, { signal }),
  createUnit: (input: UnitInput) =>
    apiClient<Unit>("/units", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  categories: (isActive = "true", signal?: AbortSignal) =>
    apiClient<ProductCategory[]>(`/categories${query({ isActive })}`, { signal }),
  createCategory: (input: CategoryInput) =>
    apiClient<ProductCategory>("/categories", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  taxRates: (isActive = "true", signal?: AbortSignal) =>
    apiClient<TaxRate[]>(`/tax-rates${query({ isActive })}`, { signal }),
  createTaxRate: (input: TaxRateInput) =>
    apiClient<TaxRate>("/tax-rates", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  paymentTerms: (isActive = "true", signal?: AbortSignal) =>
    apiClient<PaymentTerm[]>(`/payment-terms${query({ isActive })}`, { signal }),
  createPaymentTerm: (input: PaymentTermInput) =>
    apiClient<PaymentTerm>("/payment-terms", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  contactGroups: (isActive = "true", signal?: AbortSignal) => apiClient<ContactGroup[]>(`/contact-groups${query({ isActive })}`, { signal }),
  createContactGroup: (input: ContactGroupInput) => apiClient<ContactGroup>("/contact-groups", { method: "POST", body: JSON.stringify(input) }),
  warehouses: (isActive = "true", signal?: AbortSignal) => apiClient<Warehouse[]>(`/warehouses${query({ isActive })}`, { signal }),
  createWarehouse: (input: WarehouseInput) => apiClient<Warehouse>("/warehouses", { method: "POST", body: JSON.stringify(input) }),
  priceLists: (isActive = "true", signal?: AbortSignal) => apiClient<PriceList[]>(`/price-lists${query({ isActive })}`, { signal }),
  createPriceList: (input: PriceListInput) => apiClient<PriceList>("/price-lists", { method: "POST", body: JSON.stringify(input) }),
  uploadAttachment: (file: File, entityType: string, entityId: string) => {
    const body = new FormData();
    body.set("file", file);
    body.set("entityType", entityType);
    body.set("entityId", entityId);
    return apiClient<Attachment>("/attachments", { method: "POST", body });
  },
  attachments: (entityType: string, entityId: string, signal?: AbortSignal) => apiClient<Attachment[]>(`/attachments?${new URLSearchParams({ entityType, entityId })}`, { signal }),
  deleteAttachment: (id: string) => apiClient<void>(`/attachments/${id}`, { method: "DELETE" }),
  attachmentDownload: (id: string) => apiClient<{ url: string | null; fileName: string }>(`/attachments/${id}/download`),
  products: (isActive = "true", signal?: AbortSignal) =>
    apiClient<Product[]>(`/products${query({ isActive })}`, { signal }),
  product: (id: string, signal?: AbortSignal) => apiClient<Product>(`/products/${id}`, { signal }),
  createProduct: (input: ProductInput) =>
    apiClient<Product>("/products", {
      method: "POST",
      body: JSON.stringify(input),
    }),
};

type CatalogResource = "units" | "categories" | "tax-rates" | "payment-terms" | "contact-groups" | "warehouses" | "price-lists" | "products";
export const catalogPage = <T>(resource: CatalogResource, filters: { page: number; limit: number; search?: string; isActive?: "true" | "false" | "all" }, signal?: AbortSignal) =>
  apiClient<PaginatedMasters<T>>(`/${resource}${query(filters)}`, { signal });
export const updateCatalog = <T>(resource: CatalogResource, id: string, input: Partial<T>) =>
  apiClient<T>(`/${resource}/${id}`, { method: "PATCH", body: JSON.stringify(input) });
export const archiveCatalog = <T>(resource: CatalogResource, id: string) =>
  apiClient<T>(`/${resource}/${id}`, { method: "DELETE" });
export const restoreCatalog = <T>(resource: CatalogResource, id: string) =>
  apiClient<T>(`/${resource}/${id}/restore`, { method: "POST" });
