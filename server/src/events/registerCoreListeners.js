const { DOMAIN_EVENTS } = require("../shared/constants/events");
const { eventBus } = require("./eventBus");
const { initializeCompanyDomain } = require("../services/companyInitializationService");
const { FixedAsset } = require("../models/FixedAsset");

let isRegistered = false;

function registerCoreListeners() {
  if (isRegistered) {
    return;
  }

  eventBus.on(DOMAIN_EVENTS.COMPANY_CREATED, async ({ company, fiscalYear, userId }) => {
    await initializeCompanyDomain({ company, fiscalYear, userId });
  });

  eventBus.on(DOMAIN_EVENTS.TRANSACTION_REVERSED, async ({ originalTransactionId, companyId }) => {
    await FixedAsset.findOneAndUpdate({ companyId, disposalTransactionId: originalTransactionId, status: "DISPOSED" }, { status: "ACTIVE", disposalTransactionId: null, disposedAt: null });
  });

  isRegistered = true;
}

module.exports = {
  registerCoreListeners
};
