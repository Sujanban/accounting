const { Membership } = require("../models/Membership");

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
    activeFiscalYear: company.activeFiscalYear,
    businessType: company.businessType
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

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      emailVerified: user.emailVerified,
      onboardingStatus: user.onboardingStatus,
      isActive: user.isActive
    },
    activeCompany: resolvedActiveMembership ? resolvedActiveMembership.company : null,
    activeMembership: resolvedActiveMembership
      ? {
          id: resolvedActiveMembership.id,
          role: resolvedActiveMembership.role
        }
      : null,
    memberships: normalizedMemberships
  };
}

module.exports = {
  buildSessionPayload
};
