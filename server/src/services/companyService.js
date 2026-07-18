const { Company } = require("../models/Company");
const { FiscalYear } = require("../models/FiscalYear");
const { Membership } = require("../models/Membership");
const { User } = require("../models/User");
const { ApiError } = require("../utils/apiError");
const { buildSessionPayload } = require("./sessionService");
const { eventBus } = require("../events/eventBus");
const { registerCoreListeners } = require("../events/registerCoreListeners");
const { DOMAIN_EVENTS } = require("../shared/constants/events");

registerCoreListeners();

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
      endDateBS: payload.fiscalYear.endDateBS.trim(),
      startDateAD: payload.fiscalYear.startDateAD
        ? new Date(payload.fiscalYear.startDateAD)
        : null,
      endDateAD: payload.fiscalYear.endDateAD
        ? new Date(payload.fiscalYear.endDateAD)
        : null
    },
    createdBy: user._id,
    updatedBy: user._id
  });

  await Membership.create({
    userId: user._id,
    companyId: company._id,
    role: "OWNER",
    createdBy: user._id,
    updatedBy: user._id
  });

  const fiscalYear = await FiscalYear.create({
    companyId: company._id,
    name: company.activeFiscalYear.name,
    startDateBS: company.activeFiscalYear.startDateBS,
    endDateBS: company.activeFiscalYear.endDateBS,
    startDateAD: company.activeFiscalYear.startDateAD || null,
    endDateAD: company.activeFiscalYear.endDateAD || null,
    isActive: true,
    isLocked: false,
    createdBy: user._id,
    updatedBy: user._id
  });

  company.activeFiscalYearId = fiscalYear._id;
  company.updatedBy = user._id;
  await company.save();

  await eventBus.emitAsync(DOMAIN_EVENTS.COMPANY_CREATED, {
    company,
    fiscalYear,
    userId: user._id
  });

  const session = await buildSessionPayload(user, company._id);

  return {
    company: session.activeCompany,
    session
  };
}

module.exports = {
  createCompanyForUser
};
