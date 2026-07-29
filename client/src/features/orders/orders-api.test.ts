import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../services/api-client", () => ({ apiClient: vi.fn() }));

import { apiClient } from "../../services/api-client";
import { purchaseOrdersApi } from "../purchase-orders/purchase-orders-api";
import { salesOrdersApi } from "../sales-orders/sales-orders-api";

const mockApiClient = vi.mocked(apiClient);

describe("order fulfillment APIs", () => {
  beforeEach(() => mockApiClient.mockReset());

  it("posts delivery notes to the confirmed sales order endpoint", () => {
    const input = { warehouseId: "warehouse-1", fulfillmentDate: "2026-07-29" };

    salesOrdersApi.createDelivery("sales-order-1", input);

    expect(mockApiClient).toHaveBeenCalledWith("/sales-orders/sales-order-1/deliveries", {
      method: "POST",
      body: JSON.stringify(input),
    });
  });

  it("posts goods receipts to the confirmed purchase order endpoint", () => {
    const input = { warehouseId: "warehouse-1", fulfillmentDate: "2026-07-29" };

    purchaseOrdersApi.createGoodsReceipt("purchase-order-1", input);

    expect(mockApiClient).toHaveBeenCalledWith("/purchase-orders/purchase-order-1/goods-receipts", {
      method: "POST",
      body: JSON.stringify(input),
    });
  });
});
