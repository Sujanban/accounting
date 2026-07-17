const { Company } = require("../models/Company");
const { Membership } = require("../models/Membership");
const { User } = require("../models/User");
const { ApiError } = require("../utils/apiError");
const { bootstrapAccountingForCompany } = require("./accountingBootstrapService");
const { buildSessionPayload } = require("./sessionService");

async function createCompanyForUser(userId, payload) {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User was not found.");
  }

  const existingMembership = await Membership.findOne({ userId: user._id }).lean();

  if (existingMembership) {
    throw new ApiError(409, "The initial company has already been created.");
  }

  const company = await Company.create({
    name: payload.name.trim(),
    panNumber: payload.panNumber.trim(),
    vatRegistered: payload.vatRegistered,
    vatNumber: payload.vatRegistered ? payload.vatNumber.trim() : null,
    phone: payload.phone ? payload.phone.trim() : null,
    email: payload.email ? payload.email.trim().toLowerCase() : null,
    address: payload.address ? payload.address.trim() : null,
    logo: payload.logo ? payload.logo.trim() : null,
    activeFiscalYear: {
      name: payload.fiscalYear.name.trim(),
      startDateBS: payload.fiscalYear.startDateBS.trim(),
      endDateBS: payload.fiscalYear.endDateBS.trim()
    },
    businessType: payload.businessType,
    createdBy: user._id
  });

  await Membership.create({
    userId: user._id,
    companyId: company._id,
    role: "OWNER"
  });

  const fiscalYear = await bootstrapAccountingForCompany(company);

  company.activeFiscalYearId = fiscalYear._id;
  await company.save();

  user.onboardingStatus = "completed";
  await user.save();

  const session = await buildSessionPayload(user, company._id);

  return {
    company: session.activeCompany,
    session
  };
}

module.exports = {
  createCompanyForUser
};
