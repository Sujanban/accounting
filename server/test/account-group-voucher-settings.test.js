const test = require("node:test");
const assert = require("node:assert/strict");

const { loadWithMocks } = require("./helpers/load-with-mocks");

test("getChartOfAccounts returns nested groups with ledgers", async () => {
  const { module: accountGroupService, restore } = loadWithMocks(
    "../../src/services/accountGroupService",
    {
      "../models/AccountGroup": {
        AccountGroup: {
          find: () => ({
            sort: () => ({
              lean: async () => [
                {
                  _id: "group-root",
                  companyId: "company-1",
                  name: "Current Assets",
                  category: "Assets",
                  type: "Assets",
                  parentId: null,
                  systemCode: "CURRENT_ASSETS",
                  isSystem: true,
                  isActive: true,
                  createdAt: new Date("2026-07-18T00:00:00Z")
                },
                {
                  _id: "group-child",
                  companyId: "company-1",
                  name: "Cash Accounts",
                  category: "Assets",
                  type: "Assets",
                  parentId: "group-root",
                  systemCode: null,
                  isSystem: false,
                  isActive: true,
                  createdAt: new Date("2026-07-18T00:00:00Z")
                }
              ]
            })
          })
        }
      },
      "../models/Ledger": {
        Ledger: {
          find: () => ({
            sort: () => ({
              lean: async () => [
                {
                  _id: "ledger-cash",
                  companyId: "company-1",
                  fiscalYearId: "fy-1",
                  groupId: "group-child",
                  name: "Main Cash",
                  systemCode: "CASH",
                  openingBalance: 0,
                  openingBalanceType: "DEBIT",
                  allowManualEntry: true,
                  isSystem: false,
                  isActive: true
                }
              ]
            })
          })
        }
      }
    }
  );

  try {
    const result = await accountGroupService.getChartOfAccounts("company-1", "fy-1");

    assert.equal(result.length, 1);
    assert.equal(result[0].name, "Current Assets");
    assert.equal(result[0].children.length, 1);
    assert.equal(result[0].children[0].name, "Cash Accounts");
    assert.equal(result[0].children[0].ledgers[0].name, "Main Cash");
  } finally {
    restore();
  }
});

test("updateVoucherSequence persists new prefix and next number", async () => {
  const sequence = {
    _id: "sequence-1",
    companyId: "company-1",
    fiscalYearId: "fy-1",
    voucherType: "JV",
    prefix: "JV-2082-",
    nextNumber: 2,
    padding: 6,
    resetEveryFiscalYear: true,
    createdAt: new Date("2026-07-18T00:00:00Z"),
    save: async () => {}
  };

  const { module: voucherSequenceService, restore } = loadWithMocks(
    "../../src/services/voucherSequenceService",
    {
      "../models/VoucherSequence": {
        VoucherSequence: {
          findOne: async () => sequence,
          findOneAndUpdate: async () => ({
            prefix: "JV-2082-",
            nextNumber: 2,
            padding: 6
          }),
          find: () => ({
            sort: () => ({
              lean: async () => [sequence]
            })
          })
        }
      }
    }
  );

  try {
    const updated = await voucherSequenceService.updateVoucherSequence(
      "company-1",
      "fy-1",
      "sequence-1",
      {
        prefix: "JV-2082A-",
        nextNumber: 10,
        actorUserId: "user-1"
      }
    );

    assert.equal(updated.prefix, "JV-2082A-");
    assert.equal(updated.nextNumber, 10);
  } finally {
    restore();
  }
});

test("assertFiscalYearWritable rejects journal dates before fiscal lock date", async () => {
  const { module: fiscalYearGuardService, restore } = loadWithMocks(
    "../../src/services/fiscalYearGuardService",
    {
      "../models/FiscalYear": {
        FiscalYear: {
          findOne: () => ({
            lean: async () => ({
              _id: "fy-1",
              companyId: "company-1",
              isLocked: false
            })
          })
        }
      },
      "../models/Setting": {
        Setting: {
          findOne: () => ({
            lean: async () => ({
              fiscalLock: {
                lockBeforeDate: new Date("2026-07-01T00:00:00Z")
              }
            })
          })
        }
      }
    }
  );

  try {
    await assert.rejects(
      () =>
        fiscalYearGuardService.assertFiscalYearWritable("company-1", "fy-1", {
          transactionDate: new Date("2026-06-30T00:00:00Z")
        }),
      (error) => error.statusCode === 403 && error.errorCode === "FISCAL_YEAR_LOCKED"
    );
  } finally {
    restore();
  }
});

test("assertFiscalYearWritable rejects a transaction date outside the fiscal year", async () => {
  const { module: guard, restore } = loadWithMocks("../../src/services/fiscalYearGuardService", {
    "../models/FiscalYear": { FiscalYear: { findOne: () => ({ lean: async () => ({ _id: "fy-1", isActive: true, isLocked: false, startDateAD: new Date("2026-07-16"), endDateAD: new Date("2027-07-15") }) }) } },
    "../models/Setting": { Setting: { findOne: () => ({ lean: async () => null }) } }
  });
  try {
    await assert.rejects(() => guard.assertFiscalYearWritable("company-1", "fy-1", { transactionDate: "2026-07-15" }), /must fall within the active fiscal year/);
  } finally { restore(); }
});
