const { VoucherSequence } = require("../models/VoucherSequence");
const { ApiError } = require("../utils/apiError");
const { buildVoucherPrefix } = require("./accountingBootstrapService");

function mapVoucherSequence(sequence) {
  return {
    id: sequence._id,
    companyId: sequence.companyId,
    fiscalYearId: sequence.fiscalYearId,
    voucherType: sequence.voucherType,
    prefix: sequence.prefix,
    nextNumber: sequence.nextNumber,
    padding: sequence.padding,
    resetEveryFiscalYear: sequence.resetEveryFiscalYear,
    createdAt: sequence.createdAt
  };
}

function formatVoucherNumber(sequence) {
  return `${sequence.prefix}${String(sequence.nextNumber).padStart(sequence.padding, "0")}`;
}

async function listVoucherSequences(companyId, fiscalYearId) {
  const sequences = await VoucherSequence.find({
    companyId,
    fiscalYearId
  })
    .sort({ voucherType: 1 })
    .lean();

  return sequences.map(mapVoucherSequence);
}

async function updateVoucherSequence(companyId, fiscalYearId, voucherSequenceId, payload) {
  const sequence = await VoucherSequence.findOne({
    _id: voucherSequenceId,
    companyId,
    fiscalYearId
  });

  if (!sequence) {
    throw new ApiError(404, "Voucher sequence was not found.");
  }

  if (payload.prefix !== undefined) {
    sequence.prefix = payload.prefix.trim();
  }

  if (payload.nextNumber !== undefined) {
    sequence.nextNumber = Number(payload.nextNumber);
  }

  if (payload.padding !== undefined) {
    sequence.padding = Number(payload.padding);
  }

  if (payload.resetEveryFiscalYear !== undefined) {
    sequence.resetEveryFiscalYear = payload.resetEveryFiscalYear;
  }

  sequence.updatedBy = payload.actorUserId || sequence.updatedBy || null;
  await sequence.save();

  return mapVoucherSequence(sequence);
}

async function getNextVoucherNumber(companyId, fiscalYearId, voucherType) {
  const sequence = await VoucherSequence.findOneAndUpdate(
    { companyId, fiscalYearId, voucherType },
    { $inc: { nextNumber: 1 } },
    { new: false }
  );

  if (!sequence) {
    throw new ApiError(500, "Voucher sequence is not initialized.");
  }

  return formatVoucherNumber(sequence);
}

function buildDefaultVoucherSequencePayload(company, fiscalYear, voucherType, userId = null) {
  return {
    companyId: company._id,
    fiscalYearId: fiscalYear._id,
    voucherType,
    prefix: buildVoucherPrefix(voucherType, fiscalYear),
    nextNumber: 1,
    padding: 6,
    resetEveryFiscalYear: true,
    createdBy: userId,
    updatedBy: userId
  };
}

module.exports = {
  mapVoucherSequence,
  listVoucherSequences,
  updateVoucherSequence,
  getNextVoucherNumber,
  buildDefaultVoucherSequencePayload
};
