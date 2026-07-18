const {
  createJournalEntry,
  listJournalEntries,
  mapJournalEntry
} = require("../services/journalService");
const { asyncHandler } = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

const getJournalEntries = asyncHandler(async (request, response) => {
  const data = await listJournalEntries(
    request.auth.activeCompanyId,
    request.auth.activeFiscalYearId
  );
  return sendSuccess(response, 200, "Journal entries fetched successfully.", data);
});

const postJournalEntry = asyncHandler(async (request, response) => {
  const data = await createJournalEntry({
    companyId: request.auth.activeCompanyId,
    fiscalYearId: request.auth.activeFiscalYearId,
    date: new Date(request.body.date),
    narration: request.body.narration,
    rows: request.body.rows,
    userId: request.auth.user._id
  });

  return sendSuccess(
    response,
    201,
    "Journal entry created successfully.",
    mapJournalEntry(data.entry, data.lines)
  );
});

module.exports = {
  getJournalEntries,
  postJournalEntry
};
