const { Customer } = require("../models/Customer");
const { Supplier } = require("../models/Supplier");
const {
  archiveParty,
  createParty,
  listParties,
  updateParty
} = require("../services/partyService");
const { asyncHandler } = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

const getCustomers = asyncHandler(async (request, response) => {
  const data = await listParties(
    Customer,
    request.auth.activeCompanyId,
    request.auth.activeFiscalYearId,
    request.query
  );
  return sendSuccess(response, 200, "Customers fetched successfully.", data);
});

const postCustomer = asyncHandler(async (request, response) => {
  const data = await createParty({
    model: Customer,
    sourceType: "CUSTOMER",
    ledgerGroup: "Current Assets",
    defaultOpeningBalanceType: "DEBIT",
    companyId: request.auth.activeCompanyId,
    fiscalYearId: request.auth.activeFiscalYearId,
    payload: request.body
  });

  return sendSuccess(response, 201, "Customer created successfully.", data);
});

const patchCustomer = asyncHandler(async (request, response) => {
  const data = await updateParty({
    model: Customer,
    companyId: request.auth.activeCompanyId,
    fiscalYearId: request.auth.activeFiscalYearId,
    partyId: request.params.customerId,
    payload: request.body
  });

  return sendSuccess(response, 200, "Customer updated successfully.", data);
});

const archiveCustomer = asyncHandler(async (request, response) => {
  const data = await archiveParty({
    model: Customer,
    companyId: request.auth.activeCompanyId,
    fiscalYearId: request.auth.activeFiscalYearId,
    partyId: request.params.customerId
  });

  return sendSuccess(response, 200, "Customer archived successfully.", data);
});

const getSuppliers = asyncHandler(async (request, response) => {
  const data = await listParties(
    Supplier,
    request.auth.activeCompanyId,
    request.auth.activeFiscalYearId,
    request.query
  );
  return sendSuccess(response, 200, "Suppliers fetched successfully.", data);
});

const postSupplier = asyncHandler(async (request, response) => {
  const data = await createParty({
    model: Supplier,
    sourceType: "SUPPLIER",
    ledgerGroup: "Current Liabilities",
    defaultOpeningBalanceType: "CREDIT",
    companyId: request.auth.activeCompanyId,
    fiscalYearId: request.auth.activeFiscalYearId,
    payload: request.body
  });

  return sendSuccess(response, 201, "Supplier created successfully.", data);
});

const patchSupplier = asyncHandler(async (request, response) => {
  const data = await updateParty({
    model: Supplier,
    companyId: request.auth.activeCompanyId,
    fiscalYearId: request.auth.activeFiscalYearId,
    partyId: request.params.supplierId,
    payload: request.body
  });

  return sendSuccess(response, 200, "Supplier updated successfully.", data);
});

const archiveSupplier = asyncHandler(async (request, response) => {
  const data = await archiveParty({
    model: Supplier,
    companyId: request.auth.activeCompanyId,
    fiscalYearId: request.auth.activeFiscalYearId,
    partyId: request.params.supplierId
  });

  return sendSuccess(response, 200, "Supplier archived successfully.", data);
});

module.exports = {
  getCustomers,
  postCustomer,
  patchCustomer,
  archiveCustomer,
  getSuppliers,
  postSupplier,
  patchSupplier,
  archiveSupplier
};
