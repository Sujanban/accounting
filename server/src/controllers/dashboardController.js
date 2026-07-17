const { asyncHandler } = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

const bootstrapDashboard = asyncHandler(async (request, response) => {
  return sendSuccess(response, 200, "Dashboard bootstrap fetched successfully.", {
    companyName: request.context.company.name,
    businessType: request.context.settings.businessType,
    activeFiscalYear: {
      id: request.context.fiscalYear._id,
      name: request.context.fiscalYear.name,
      startDateBS: request.context.fiscalYear.startDateBS,
      endDateBS: request.context.fiscalYear.endDateBS,
      startDateAD: request.context.fiscalYear.startDateAD,
      endDateAD: request.context.fiscalYear.endDateAD
    },
    currentUser: {
      id: request.context.user._id,
      name: request.context.user.name,
      email: request.context.user.email
    },
    currentDate: new Date().toISOString(),
    cards: [
      { key: "sales", label: "Sales", value: null },
      { key: "purchases", label: "Purchases", value: null },
      { key: "expenses", label: "Expenses", value: null },
      { key: "profit", label: "Profit", value: null },
      { key: "cash", label: "Cash", value: null }
    ],
    recentTransactions: []
  });
});

module.exports = {
  bootstrapDashboard
};
