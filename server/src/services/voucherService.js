const { Transaction } = require("../models/Transaction");
const transactionService = require("./transactionService");
const { ApiError } = require("../utils/apiError");
const { eventBus } = require("../events/eventBus");
const { DOMAIN_EVENTS } = require("../shared/constants/events");

async function createVoucher(companyId, fiscalYearId, actorUserId, definition, payload) {
  const transaction = await transactionService.createDraft(companyId, fiscalYearId, {
    ...payload,
    transactionType: definition.transactionType,
    voucherType: definition.voucherType,
    actorUserId
  });
  await eventBus.emitAsync(DOMAIN_EVENTS.VOUCHER_CREATED, { transaction, companyId, fiscalYearId, actorUserId });
  return transaction;
}

async function assertVoucherType(companyId, transactionId, expectedType) {
  const transaction = await Transaction.findOne({ _id: transactionId, companyId }).lean();
  if (!transaction) throw new ApiError(404, "Voucher was not found.");
  if (transaction.transactionType !== expectedType) throw new ApiError(404, "Voucher was not found.");
  return transaction;
}

async function postVoucher(companyId, fiscalYearId, transactionId, actorUserId, expectedType) {
  await assertVoucherType(companyId, transactionId, expectedType);
  const transaction = await transactionService.postTransaction(companyId, fiscalYearId, transactionId, actorUserId);
  await eventBus.emitAsync(DOMAIN_EVENTS.VOUCHER_POSTED, { transaction, companyId, fiscalYearId, actorUserId });
  return transaction;
}

module.exports = { createVoucher, postVoucher };
