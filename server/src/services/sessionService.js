const { Membership } = require("../models/Membership");
const { Setting } = require("../models/Setting");

function mapCompany(company) {
  if (!company) {
    return null;
  }

  return {
    id: company._id,
    name: company.name,
    panNumber: company.panNumber,
    vatRegistered: company.vatRegistered,
    vatNumber: company.vatNumber,
    phone: company.phone,
    email: company.email,
    address: company.address,
    logo: company.logo,
    onboardingCompleted: company.onboardingCompleted,
    activeFiscalYearId: company.activeFiscalYearId,
    activeFiscalYear: company.activeFiscalYear
  };
}

function mapSettings(settings) {
  if (!settings) {
    return null;
  }

  return {
    id: settings._id,
    companyId: settings.companyId,
    businessType: settings.businessType,
    currency: settings.currency,
    currencySymbol: settings.currencySymbol,
    language: settings.language,
    dateFormat: settings.dateFormat,
    timezone: settings.timezone,
    decimalPlaces: settings.decimalPlaces,
    allowNegativeStock: settings.allowNegativeStock
  };
}

async function buildSessionPayload(user, activeCompanyId = null) {
  const memberships = await Membership.find({ userId: user._id })
    .populate("companyId")
    .lean();

  const normalizedMemberships = memberships.map((membership) => ({
    id: membership._id,
    role: membership.role,
    company: mapCompany(membership.companyId)
  }));

  const resolvedActiveMembership =
    normalizedMemberships.find(
      (membership) =>
        membership.company &&
        activeCompanyId &&
        String(membership.company.id) === String(activeCompanyId)
    ) || normalizedMemberships[0] || null;

  const settings = resolvedActiveMembership && resolvedActiveMembership.company
    ? await Setting.findOne({ companyId: resolvedActiveMembership.company.id }).lean()
    : null;

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      isActive: user.isActive
    },
    activeCompany: resolvedActiveMembership ? resolvedActiveMembership.company : null,
    activeMembership: resolvedActiveMembership
      ? {
          id: resolvedActiveMembership.id,
          role: resolvedActiveMembership.role
        }
      : null,
    activeSettings: mapSettings(settings),
    memberships: normalizedMemberships
  };
}

module.exports = {
  buildSessionPayload
};
