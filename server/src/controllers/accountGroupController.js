const {
  listAccountGroups,
  createAccountGroup,
  updateAccountGroup,
  archiveAccountGroup,
  getChartOfAccounts
} = require("../services/accountGroupService");
const { asyncHandler } = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

const getAccountGroups = asyncHandler(async (request, response) => {
  const data = await listAccountGroups(request.auth.activeCompanyId, request.query);
  return sendSuccess(response, 200, "Account groups fetched successfully.", data);
});

const postAccountGroup = asyncHandler(async (request, response) => {
  const data = await createAccountGroup(request.auth.activeCompanyId, {
    ...request.body,
    actorUserId: request.auth.user._id
  });
  return sendSuccess(response, 201, "Account group created successfully.", data);
});

const patchAccountGroup = asyncHandler(async (request, response) => {
  const data = await updateAccountGroup(
    request.auth.activeCompanyId,
    request.params.id,
    {
      ...request.body,
      actorUserId: request.auth.user._id
    }
  );
  return sendSuccess(response, 200, "Account group updated successfully.", data);
});

const archiveAccountGroupRecord = asyncHandler(async (request, response) => {
  const data = await archiveAccountGroup(
    request.auth.activeCompanyId,
    request.params.id,
    request.auth.user._id
  );
  return sendSuccess(response, 200, "Account group deleted successfully.", data);
});

const getChartOfAccountsTree = asyncHandler(async (request, response) => {
  const data = await getChartOfAccounts(
    request.auth.activeCompanyId,
    request.auth.activeFiscalYearId
  );
  return sendSuccess(response, 200, "Chart of accounts fetched successfully.", data);
});

module.exports = {
  getAccountGroups,
  postAccountGroup,
  patchAccountGroup,
  archiveAccountGroupRecord,
  getChartOfAccountsTree
};
