const { Customer } = require("../models/Customer");
const { Supplier } = require("../models/Supplier");
const {
  archiveParty,
  createParty,
  listParties,
  updateParty,
  ACCOUNT_GROUPS
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
    ledgerGroup: ACCOUNT_GROUPS.CURRENT_ASSETS.name,
    defaultOpeningBalanceType: "DEBIT",
    companyId: request.auth.activeCompanyId,
    fiscalYearId: request.auth.activeFiscalYearId,
    payload: {
      ...request.body,
      actorUserId: request.auth.user._id
    }
  });

  return sendSuccess(response, 201, "Customer created successfully.", data);
});

const patchCustomer = asyncHandler(async (request, response) => {
  const data = await updateParty({
    model: Customer,
    companyId: request.auth.activeCompanyId,
    fiscalYearId: request.auth.activeFiscalYearId,
    partyId: request.params.customerId,
    payload: {
      ...request.body,
      actorUserId: request.auth.user._id
    }
  });

  return sendSuccess(response, 200, "Customer updated successfully.", data);
});

const archiveCustomer = asyncHandler(async (request, response) => {
  const data = await archiveParty({
    model: Customer,
    companyId: request.auth.activeCompanyId,
    fiscalYearId: request.auth.activeFiscalYearId,
    partyId: request.params.customerId,
    actorUserId: request.auth.user._id
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
    ledgerGroup: ACCOUNT_GROUPS.CURRENT_LIABILITIES.name,
    defaultOpeningBalanceType: "CREDIT",
    companyId: request.auth.activeCompanyId,
    fiscalYearId: request.auth.activeFiscalYearId,
    payload: {
      ...request.body,
      actorUserId: request.auth.user._id
    }
  });

  return sendSuccess(response, 201, "Supplier created successfully.", data);
});

const patchSupplier = asyncHandler(async (request, response) => {
  const data = await updateParty({
    model: Supplier,
    companyId: request.auth.activeCompanyId,
    fiscalYearId: request.auth.activeFiscalYearId,
    partyId: request.params.supplierId,
    payload: {
      ...request.body,
      actorUserId: request.auth.user._id
    }
  });

  return sendSuccess(response, 200, "Supplier updated successfully.", data);
});

const archiveSupplier = asyncHandler(async (request, response) => {
  const data = await archiveParty({
    model: Supplier,
    companyId: request.auth.activeCompanyId,
    fiscalYearId: request.auth.activeFiscalYearId,
    partyId: request.params.supplierId,
    actorUserId: request.auth.user._id
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
