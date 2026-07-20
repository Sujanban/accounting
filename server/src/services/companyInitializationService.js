const { initializeAccountingForCompany } = require("./accountingBootstrapService");
const { initializeDefaultBranch } = require("./branchService");

async function initializeCompanyDomain({ company, fiscalYear, userId }) {
  await initializeAccountingForCompany(company, fiscalYear, userId);
  await initializeDefaultBranch(company, userId);
}

module.exports = {
  initializeCompanyDomain
};
