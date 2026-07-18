const { initializeAccountingForCompany } = require("./accountingBootstrapService");

async function initializeCompanyDomain({ company, fiscalYear, userId }) {
  await initializeAccountingForCompany(company, fiscalYear, userId);
}

module.exports = {
  initializeCompanyDomain
};
