const test = require("node:test");
const assert = require("node:assert/strict");

const { loadWithMocks } = require("./helpers/load-with-mocks");

test("createParty creates linked ledger and party record with default opening balance type", async () => {
  const journalCalls = [];
  let savedLedger = null;

  const model = {
    create: async (payload) => ({
      _id: "customer-1",
      createdAt: new Date("2026-07-17T00:00:00Z"),
      ...payload
    })
  };

  const { module: partyService, restore } = loadWithMocks("../../src/services/partyService", {
    "../models/Ledger": {
      Ledger: {
        create: async (payload) => ({
          _id: "ledger-1",
          save: async function save() {
            savedLedger = {
              sourceId: this.sourceId
            };
          },
          ...payload
        }),
        findByIdAndUpdate: async () => {}
      }
    },
    "./journalService": {
      createOpeningBalanceJournal: async (payload) => {
        journalCalls.push(payload);
      }
    }
  });

  try {
    const result = await partyService.createParty({
      model,
      sourceType: "CUSTOMER",
      ledgerGroup: "Current Assets",
      defaultOpeningBalanceType: "DEBIT",
      companyId: "company-1",
      fiscalYearId: "fy-1",
      payload: {
        name: "ABC Customer",
        openingBalance: 500
      }
    });

    assert.equal(result.id, "customer-1");
    assert.equal(result.openingBalanceType, "DEBIT");
    assert.equal(savedLedger.sourceId, "customer-1");
    assert.equal(journalCalls[0].ledgerId, "ledger-1");
  } finally {
    restore();
  }
});

test("archiveParty disables both the party record and its ledger", async () => {
  let ledgerUpdate = null;

  const record = {
    _id: "supplier-1",
    ledgerId: "ledger-supplier-1",
    companyId: "company-1",
    fiscalYearId: "fy-1",
    name: "XYZ Supplier",
    isActive: true,
    save: async () => {}
  };

  const { module: partyService, restore } = loadWithMocks("../../src/services/partyService", {
    "../models/Ledger": {
      Ledger: {
        create: async () => ({}),
        findByIdAndUpdate: async (_id, payload) => {
          ledgerUpdate = payload;
        }
      }
    },
    "./journalService": {
      createOpeningBalanceJournal: async () => {}
    }
  });

  try {
    const result = await partyService.archiveParty({
      model: {
        findOne: async () => record
      },
      companyId: "company-1",
      fiscalYearId: "fy-1",
      partyId: "supplier-1"
    });

    assert.equal(result.isActive, false);
    assert.deepEqual(ledgerUpdate, { isActive: false });
  } finally {
    restore();
  }
});

test("updateProduct persists trimmed and numeric fields", async () => {
  const productRecord = {
    _id: "product-1",
    companyId: "company-1",
    fiscalYearId: "fy-1",
    name: "Old Name",
    sku: "OLD",
    category: null,
    unit: "Piece",
    purchasePrice: 0,
    sellingPrice: 0,
    openingQuantity: 0,
    openingRate: 0,
    minimumStock: 0,
    barcode: null,
    description: null,
    isActive: true,
    createdAt: new Date("2026-07-17T00:00:00Z"),
    save: async () => {}
  };

  const { updateProduct } = require("../src/services/productService");
  const { Product } = require("../src/models/Product");
  const originalFindOne = Product.findOne;
  Product.findOne = async () => productRecord;

  try {
    const result = await updateProduct("company-1", "fy-1", "product-1", {
      name: "  New Product  ",
      purchasePrice: "15",
      sellingPrice: "20",
      minimumStock: "3"
    });

    assert.equal(result.name, "New Product");
    assert.equal(result.purchasePrice, 15);
    assert.equal(result.sellingPrice, 20);
    assert.equal(result.minimumStock, 3);
  } finally {
    Product.findOne = originalFindOne;
  }
});

test("getAccountingDashboard returns counts and trial balance status", async () => {
  const { module: dashboardService, restore } = loadWithMocks(
    "../../src/services/accountingDashboardService",
    {
      "../models/Customer": {
        Customer: {
          countDocuments: async () => 2
        }
      },
      "../models/Supplier": {
        Supplier: {
          countDocuments: async () => 1
        }
      },
      "../models/Product": {
        Product: {
          countDocuments: async () => 4
        }
      },
      "../models/Ledger": {
        Ledger: {
          find: () => ({
            lean: async () => [
              { _id: "cash", name: "Cash in Hand" },
              { _id: "bank", name: "Bank Account" },
              { _id: "ar", name: "Accounts Receivable" },
              { _id: "ap", name: "Accounts Payable" }
            ]
          })
        }
      },
      "./ledgerService": {
        getTrialBalance: async () => ({
          isBalanced: true,
          rows: [
            { ledgerId: "cash", debit: 1000, credit: 0 },
            { ledgerId: "bank", debit: 500, credit: 0 },
            { ledgerId: "ar", debit: 200, credit: 0 },
            { ledgerId: "ap", debit: 0, credit: 150 }
          ]
        })
      }
    }
  );

  try {
    const result = await dashboardService.getAccountingDashboard("company-1", "fy-1");

    assert.equal(result.cashBalance, 1000);
    assert.equal(result.bankBalance, 500);
    assert.equal(result.totalReceivable, 200);
    assert.equal(result.totalPayable, 150);
    assert.equal(result.customerCount, 2);
    assert.equal(result.trialBalanceStatus, "BALANCED");
  } finally {
    restore();
  }
});
