const test = require("node:test");
const assert = require("node:assert/strict");

const { loadWithMocks } = require("./helpers/load-with-mocks");

test("bootstrapAccountingForCompany creates default fiscal year, groups, ledgers, and voucher sequence", async () => {
  const calls = {
    fiscalYear: null,
    groups: null,
    ledgers: null,
    sequences: null
  };

  const { module: bootstrapService, restore } = loadWithMocks(
    "../../src/services/accountingBootstrapService",
    {
      "../models/FiscalYear": {
        FiscalYear: {
          create: async (payload) => {
            calls.fiscalYear = payload;
            return { _id: "fy-1", ...payload };
          }
        }
      },
      "../models/AccountGroup": {
        AccountGroup: {
          insertMany: async (payload) => {
            calls.groups = payload;
            return payload.map((item, index) => ({ _id: `group-${index + 1}`, ...item }));
          },
          find: () => ({
            lean: async () => []
          }),
          updateOne: async () => {}
        }
      },
      "../models/Ledger": {
        Ledger: {
          insertMany: async (payload) => {
            calls.ledgers = payload;
          }
        }
      },
      "../models/VoucherSequence": {
        VoucherSequence: {
          insertMany: async (payload) => {
            calls.sequences = payload;
          }
        }
      },
      "../models/Setting": {
        Setting: {
          updateOne: async () => {}
        }
      }
    }
  );

  try {
    const company = {
      _id: "company-1",
      activeFiscalYear: {
        name: "2082/83",
        startDateBS: "2082-04-01",
        endDateBS: "2083-03-31",
        startDateAD: new Date("2025-07-17T00:00:00Z"),
        endDateAD: new Date("2026-07-16T00:00:00Z")
      }
    };

    const fiscalYear = await bootstrapService.bootstrapAccountingForCompany(company);

    assert.equal(fiscalYear._id, "fy-1");
    assert.equal(calls.fiscalYear.companyId, "company-1");
    assert.equal(
      calls.fiscalYear.startDateAD.toISOString(),
      "2025-07-17T00:00:00.000Z"
    );
    assert.equal(calls.groups.length, 16);
    assert.equal(calls.groups[0].systemCode, "ASSETS");
    assert.equal(calls.ledgers.length, 13);
    assert.equal(calls.ledgers[0].fiscalYearId, "fy-1");
    assert.equal(calls.ledgers[0].systemCode, "CASH");
    assert.equal(calls.ledgers[0].groupId, "group-2");
    assert.equal(calls.sequences.length, 6);
    assert.deepEqual(calls.sequences.map((item) => item.voucherType), [
      "JV",
      "SV",
      "PV",
      "RV",
      "PMV",
      "CV"
    ]);
    assert.equal(calls.sequences[0].prefix, "JV-2082/83-");
  } finally {
    restore();
  }
});

test("initializeAccountingForCompany seeds defaults against an existing fiscal year", async () => {
  const calls = {
    groups: null,
    ledgers: null,
    sequences: null
  };

  const { module: bootstrapService, restore } = loadWithMocks(
    "../../src/services/accountingBootstrapService",
    {
      "../models/FiscalYear": {
        FiscalYear: {
          create: async () => {
            throw new Error("should not create fiscal year");
          }
        }
      },
      "../models/AccountGroup": {
        AccountGroup: {
          insertMany: async (payload) => {
            calls.groups = payload;
            return payload.map((item, index) => ({ _id: `group-${index + 1}`, ...item }));
          },
          find: () => ({
            lean: async () => []
          }),
          updateOne: async () => {}
        }
      },
      "../models/Ledger": {
        Ledger: {
          insertMany: async (payload) => {
            calls.ledgers = payload;
          }
        }
      },
      "../models/VoucherSequence": {
        VoucherSequence: {
          insertMany: async (payload) => {
            calls.sequences = payload;
          }
        }
      },
      "../models/Setting": {
        Setting: {
          updateOne: async () => {}
        }
      }
    }
  );

  try {
    await bootstrapService.initializeAccountingForCompany(
      { _id: "company-1" },
      { _id: "fy-existing" },
      "user-1"
    );

    assert.equal(calls.groups.length, 16);
    assert.equal(calls.groups[0].createdBy, "user-1");
    assert.equal(calls.ledgers[0].fiscalYearId, "fy-existing");
    assert.equal(calls.ledgers[0].systemCode, "CASH");
    assert.equal(calls.ledgers[0].groupId, "group-2");
    assert.equal(calls.sequences[0].createdBy, "user-1");
  } finally {
    restore();
  }
});

test("createFiscalYear deactivates the current year and updates company active fiscal year", async () => {
  let saved = false;
  let companyUpdate = null;

  const activeFiscalYear = {
    isActive: true,
    save: async () => {
      saved = true;
    }
  };

  const { module: fiscalYearService, restore } = loadWithMocks(
    "../../src/services/fiscalYearService",
    {
      "../models/FiscalYear": {
        FiscalYear: {
          findOne: async () => activeFiscalYear,
          create: async (payload) => ({
            _id: "fy-2",
            createdAt: new Date("2026-07-17T00:00:00Z"),
            isLocked: false,
            ...payload
          })
        }
      },
      "../models/Company": {
        Company: {
          findByIdAndUpdate: async (_companyId, payload) => {
            companyUpdate = payload;
          },
          findById: () => ({
            lean: async () => ({ _id: "company-1" })
          })
        }
      },
      "./accountingBootstrapService": {
        initializeAccountingForFiscalYear: async () => {}
      }
    }
  );

  try {
    const result = await fiscalYearService.createFiscalYear("company-1", {
      name: "2081/82",
      startDateBS: "2081-04-01",
      endDateBS: "2082-03-31",
      startDateAD: new Date("2024-07-16T00:00:00Z"),
      endDateAD: new Date("2025-07-16T00:00:00Z")
    });

    assert.equal(saved, true);
    assert.equal(activeFiscalYear.isActive, false);
    assert.equal(result.id, "fy-2");
    assert.equal(companyUpdate.activeFiscalYearId, "fy-2");
    assert.equal(companyUpdate.activeFiscalYear.name, "2081/82");
    assert.equal(
      companyUpdate.activeFiscalYear.startDateAD.toISOString(),
      "2024-07-16T00:00:00.000Z"
    );
  } finally {
    restore();
  }
});

test("switchFiscalYear throws when the fiscal year does not belong to the company", async () => {
  const { module: fiscalYearService, restore } = loadWithMocks(
    "../../src/services/fiscalYearService",
    {
      "../models/FiscalYear": {
        FiscalYear: {
          findOne: async () => null
        }
      },
      "../models/Company": {
        Company: {
          findByIdAndUpdate: async () => {}
        }
      }
    }
  );

  try {
    await assert.rejects(
      () => fiscalYearService.switchFiscalYear("company-1", "fy-missing"),
      (error) => error.statusCode === 404
    );
  } finally {
    restore();
  }
});
