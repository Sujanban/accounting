const transactionService = require("../services/transactionService");
const { asyncHandler } = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

const withActor = (request) => ({ ...request.body, actorUserId: request.auth.user._id, actorRole: request.auth.membership.role });

const createTransactionDraft = asyncHandler(async (request, response) => sendSuccess(response, 201, "Transaction draft created successfully.", await transactionService.createDraft(request.auth.activeCompanyId, request.auth.activeFiscalYearId, withActor(request))));
const patchTransactionDraft = asyncHandler(async (request, response) => sendSuccess(response, 200, "Transaction draft updated successfully.", await transactionService.updateDraft(request.auth.activeCompanyId, request.auth.activeFiscalYearId, request.params.id, withActor(request))));
const submitTransactionDraft = asyncHandler(async (request, response) => sendSuccess(response, 200, "Transaction submitted for approval successfully.", await transactionService.submitTransaction(request.auth.activeCompanyId, request.auth.activeFiscalYearId, request.params.id, request.auth.user._id, request.auth.membership.role)));
const approveTransactionDraft = asyncHandler(async (request, response) => sendSuccess(response, 200, "Transaction approved successfully.", await transactionService.approveTransaction(request.auth.activeCompanyId, request.auth.activeFiscalYearId, request.params.id, request.auth.user._id)));
const postTransactionDraft = asyncHandler(async (request, response) => sendSuccess(response, 200, "Transaction posted successfully.", await transactionService.postTransaction(request.auth.activeCompanyId, request.auth.activeFiscalYearId, request.params.id, request.auth.user._id)));
const reverseTransactionRecord = asyncHandler(async (request, response) => sendSuccess(response, 201, "Transaction reversed successfully.", await transactionService.reverseTransaction(request.auth.activeCompanyId, request.auth.activeFiscalYearId, request.params.id, request.auth.user._id)));
const getTransactionRecord = asyncHandler(async (request, response) => sendSuccess(response, 200, "Transaction fetched successfully.", await transactionService.getTransaction(request.auth.activeCompanyId, request.params.id, request.auth.membership.role)));
const getTransactions = asyncHandler(async (request, response) => sendSuccess(response, 200, "Transactions fetched successfully.", await transactionService.listTransactions(request.auth.activeCompanyId, request.auth.activeFiscalYearId, request.query, request.auth.membership.role)));

module.exports = { createTransactionDraft, patchTransactionDraft, submitTransactionDraft, approveTransactionDraft, postTransactionDraft, reverseTransactionRecord, getTransactionRecord, getTransactions };
