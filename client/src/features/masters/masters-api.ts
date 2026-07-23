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
  units: () => [...masterKeys.all, "units"] as const,
  categories: () => [...masterKeys.all, "categories"] as const,
  taxRates: () => [...masterKeys.all, "tax-rates"] as const,
  paymentTerms: () => [...masterKeys.all, "payment-terms"] as const,
  products: () => [...masterKeys.all, "products"] as const,
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
  units: (signal?: AbortSignal) =>
    apiClient<Unit[]>("/units", { signal }),
  createUnit: (input: UnitInput) =>
    apiClient<Unit>("/units", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  categories: (signal?: AbortSignal) =>
    apiClient<ProductCategory[]>("/categories", { signal }),
  createCategory: (input: CategoryInput) =>
    apiClient<ProductCategory>("/categories", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  taxRates: (signal?: AbortSignal) =>
    apiClient<TaxRate[]>("/tax-rates", { signal }),
  createTaxRate: (input: TaxRateInput) =>
    apiClient<TaxRate>("/tax-rates", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  paymentTerms: (signal?: AbortSignal) =>
    apiClient<PaymentTerm[]>("/payment-terms", { signal }),
  createPaymentTerm: (input: PaymentTermInput) =>
    apiClient<PaymentTerm>("/payment-terms", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  products: (signal?: AbortSignal) =>
    apiClient<Product[]>("/products", { signal }),
  createProduct: (input: ProductInput) =>
    apiClient<Product>("/products", {
      method: "POST",
      body: JSON.stringify(input),
    }),
};
