const { DOMAIN_EVENTS } = require("../shared/constants/events");
const { eventBus } = require("./eventBus");
const { initializeCompanyDomain } = require("../services/companyInitializationService");

let isRegistered = false;

function registerCoreListeners() {
  if (isRegistered) {
    return;
  }

  eventBus.on(DOMAIN_EVENTS.COMPANY_CREATED, async ({ company, fiscalYear, userId }) => {
    await initializeCompanyDomain({ company, fiscalYear, userId });
  });

  isRegistered = true;
}

module.exports = {
  registerCoreListeners
};
