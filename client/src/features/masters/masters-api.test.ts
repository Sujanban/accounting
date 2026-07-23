import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../services/api-client", () => ({ apiClient: vi.fn() }));

import { apiClient } from "../../services/api-client";
import { mastersApi } from "./masters-api";

const mockApiClient = vi.mocked(apiClient);

describe("mastersApi", () => {
  beforeEach(() => mockApiClient.mockReset());

  it("serializes party filters and preserves cancellation support", () => {
    const signal = new AbortController().signal;
    mastersApi.contacts(
      { search: "ABC Traders", role: "CUSTOMER", page: 2 },
      signal,
    );

    expect(mockApiClient).toHaveBeenCalledWith(
      "/contacts?search=ABC+Traders&role=CUSTOMER&page=2",
      { signal },
    );
  });

  it("creates a product through the scoped master endpoint", () => {
    const input = {
      sku: "ITEM-001",
      name: "Desk",
      unitId: "unit-1",
      categoryId: null,
      barcode: null,
      purchasePrice: 100,
      sellingPrice: 125,
      taxId: null,
      reorderLevel: 0,
      minimumStock: 0,
      description: null,
      isService: false,
    };
    mastersApi.createProduct(input);

    expect(mockApiClient).toHaveBeenCalledWith("/products", {
      method: "POST",
      body: JSON.stringify(input),
    });
  });

  it("uses the party-specific update and archive endpoints", () => {
    mastersApi.updateContact("contact-1", { name: "Updated party" });
    mastersApi.archiveContact("contact-1");

    expect(mockApiClient).toHaveBeenNthCalledWith(
      1,
      "/contacts/contact-1",
      {
        method: "PATCH",
        body: JSON.stringify({ name: "Updated party" }),
      },
    );
    expect(mockApiClient).toHaveBeenNthCalledWith(
      2,
      "/contacts/contact-1",
      { method: "DELETE" },
    );
  });

  it("loads a party by ID for the dedicated edit page", () => {
    const signal = new AbortController().signal;
    mastersApi.contact("contact-1", signal);

    expect(mockApiClient).toHaveBeenCalledWith("/contacts/contact-1", {
      signal,
    });
  });
});
