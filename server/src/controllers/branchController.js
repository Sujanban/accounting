const branchService = require("../services/branchService");
const { asyncHandler } = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const getBranches = asyncHandler(async (request, response) => sendSuccess(response, 200, "Branches fetched successfully.", await branchService.listBranches(request.auth.activeCompanyId)));
const postBranch = asyncHandler(async (request, response) => sendSuccess(response, 201, "Branch created successfully.", await branchService.createBranch(request.auth.activeCompanyId, request.auth.user._id, request.body)));
const getWarehouses = asyncHandler(async (request, response) => sendSuccess(response, 200, "Warehouses fetched successfully.", await branchService.listWarehouses(request.auth.activeCompanyId, request.query.branchId)));
const postWarehouse = asyncHandler(async (request, response) => sendSuccess(response, 201, "Warehouse created successfully.", await branchService.createWarehouse(request.auth.activeCompanyId, request.auth.user._id, request.body)));
module.exports = { getBranches, postBranch, getWarehouses, postWarehouse };
