const transactionService = require("../services/transactionService");
const { asyncHandler } = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

const withActor = (request) => ({ ...request.body, actorUserId: request.auth.user._id });

const createTransactionDraft = asyncHandler(async (request, response) => sendSuccess(response, 201, "Transaction draft created successfully.", await transactionService.createDraft(request.auth.activeCompanyId, request.auth.activeFiscalYearId, withActor(request))));
const patchTransactionDraft = asyncHandler(async (request, response) => sendSuccess(response, 200, "Transaction draft updated successfully.", await transactionService.updateDraft(request.auth.activeCompanyId, request.auth.activeFiscalYearId, request.params.id, withActor(request))));
const postTransactionDraft = asyncHandler(async (request, response) => sendSuccess(response, 200, "Transaction posted successfully.", await transactionService.postTransaction(request.auth.activeCompanyId, request.auth.activeFiscalYearId, request.params.id, request.auth.user._id)));
const reverseTransactionRecord = asyncHandler(async (request, response) => sendSuccess(response, 201, "Transaction reversed successfully.", await transactionService.reverseTransaction(request.auth.activeCompanyId, request.auth.activeFiscalYearId, request.params.id, request.auth.user._id)));
const getTransactionRecord = asyncHandler(async (request, response) => sendSuccess(response, 200, "Transaction fetched successfully.", await transactionService.getTransaction(request.auth.activeCompanyId, request.params.id)));
const getTransactions = asyncHandler(async (request, response) => sendSuccess(response, 200, "Transactions fetched successfully.", await transactionService.listTransactions(request.auth.activeCompanyId, request.auth.activeFiscalYearId, request.query)));

module.exports = { createTransactionDraft, patchTransactionDraft, postTransactionDraft, reverseTransactionRecord, getTransactionRecord, getTransactions };
