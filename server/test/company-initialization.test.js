const test = require("node:test");
const assert = require("node:assert/strict");

const { loadWithMocks } = require("./helpers/load-with-mocks");

test("createCompanyForUser emits company created event after company and fiscal year creation", async () => {
  const emittedEvents = [];

  const user = { _id: "user-1" };
  const company = {
    _id: "company-1",
    activeFiscalYear: {
      name: "2082/83",
      startDateBS: "2082-04-01",
      endDateBS: "2083-03-31",
      startDateAD: new Date("2025-07-17T00:00:00Z"),
      endDateAD: new Date("2026-07-16T00:00:00Z")
    },
    save: async function save() {
      return this;
    }
  };
  const fiscalYear = { _id: "fy-1" };

  const { module: companyService, restore } = loadWithMocks(
    "../../src/services/companyService",
    {
      "../models/User": {
        User: {
          findById: async () => user
        }
      },
      "../models/Membership": {
        Membership: {
          findOne: () => ({
            lean: async () => null
          }),
          create: async () => ({})
        }
      },
      "../models/Company": {
        Company: {
          create: async () => company
        }
      },
      "../models/FiscalYear": {
        FiscalYear: {
          create: async () => fiscalYear
        }
      },
      "./sessionService": {
        buildSessionPayload: async () => ({
          activeCompany: { id: "company-1" },
          activeMembership: { id: "membership-1", role: "OWNER" },
          memberships: []
        })
      },
      "../events/eventBus": {
        eventBus: {
          emitAsync: async (eventName, payload) => {
            emittedEvents.push({ eventName, payload });
          }
        }
      },
      "../events/registerCoreListeners": {
        registerCoreListeners: () => {}
      }
    }
  );

  try {
    const result = await companyService.createCompanyForUser("user-1", {
      name: "Acme",
      panNumber: "123456",
      vatRegistered: false,
      fiscalYear: {
        name: "2082/83",
        startDateBS: "2082-04-01",
        endDateBS: "2083-03-31",
        startDateAD: "2025-07-17",
        endDateAD: "2026-07-16"
      }
    });

    assert.equal(result.company.id, "company-1");
    assert.equal(emittedEvents.length, 1);
    assert.equal(emittedEvents[0].eventName, "company.created");
    assert.equal(emittedEvents[0].payload.company._id, "company-1");
    assert.equal(emittedEvents[0].payload.fiscalYear._id, "fy-1");
    assert.equal(emittedEvents[0].payload.userId, "user-1");
  } finally {
    restore();
  }
});
