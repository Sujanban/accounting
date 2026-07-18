const { AccountGroup } = require("../models/AccountGroup");
const { Ledger } = require("../models/Ledger");
const { ApiError } = require("../utils/apiError");

function mapAccountGroup(group) {
  return {
    id: group._id,
    companyId: group.companyId,
    systemCode: group.systemCode,
    name: group.name,
    type: group.type || group.category,
    parentId: group.parentId,
    description: group.description,
    isSystem: group.isSystem,
    isActive: group.isActive,
    createdAt: group.createdAt
  };
}

async function listAccountGroups(companyId, query = {}) {
  const filters = { companyId };

  if (query.isActive !== undefined) {
    filters.isActive = query.isActive === "true";
  }

  const groups = await AccountGroup.find(filters)
    .sort({ category: 1, name: 1 })
    .lean();

  return groups.map(mapAccountGroup);
}

async function getAccountGroupById(companyId, groupId) {
  const group = await AccountGroup.findOne({ _id: groupId, companyId });

  if (!group) {
    throw new ApiError(404, "Account group was not found.");
  }

  return group;
}

async function getAccountGroupBySystemCode(companyId, systemCode) {
  const group = await AccountGroup.findOne({ companyId, systemCode }).lean();

  if (!group) {
    throw new ApiError(404, "Required system account group was not found.");
  }

  return group;
}

async function assertValidParent(companyId, parentId, currentGroupId = null) {
  if (!parentId) {
    return null;
  }

  const parentGroup = await AccountGroup.findOne({
    _id: parentId,
    companyId
  }).lean();

  if (!parentGroup) {
    throw new ApiError(400, "Parent account group is invalid.");
  }

  if (currentGroupId && String(parentGroup._id) === String(currentGroupId)) {
    throw new ApiError(400, "An account group cannot be its own parent.");
  }

  if (!currentGroupId) {
    return parentGroup;
  }

  let cursor = parentGroup;

  while (cursor && cursor.parentId) {
    if (String(cursor.parentId) === String(currentGroupId)) {
      throw new ApiError(400, "Account group hierarchy cannot be circular.");
    }

    cursor = await AccountGroup.findOne({
      _id: cursor.parentId,
      companyId
    }).lean();
  }

  return parentGroup;
}

async function createAccountGroup(companyId, payload) {
  await assertValidParent(companyId, payload.parentId || null);

  const group = await AccountGroup.create({
    companyId,
    name: payload.name.trim(),
    systemCode: null,
    category: payload.type,
    type: payload.type,
    parentId: payload.parentId || null,
    description: payload.description ? payload.description.trim() : null,
    isSystem: false,
    isActive: true,
    createdBy: payload.actorUserId || null,
    updatedBy: payload.actorUserId || null
  });

  return mapAccountGroup(group);
}

async function updateAccountGroup(companyId, groupId, payload) {
  const group = await getAccountGroupById(companyId, groupId);

  if (group.isSystem) {
    throw new ApiError(403, "System account groups cannot be edited.");
  }

  const nextParentGroupId =
    payload.parentId !== undefined ? payload.parentId : group.parentId;
  await assertValidParent(companyId, nextParentGroupId || null, group._id);

  if (payload.name) {
    group.name = payload.name.trim();
  }

  if (payload.type) {
    group.category = payload.type;
    group.type = payload.type;
  }

  if (payload.parentId !== undefined) {
    group.parentId = payload.parentId || null;
  }

  if (payload.description !== undefined) {
    group.description = payload.description ? payload.description.trim() : null;
  }

  group.updatedBy = payload.actorUserId || group.updatedBy || null;
  await group.save();

  return mapAccountGroup(group);
}

async function archiveAccountGroup(companyId, groupId, actorUserId = null) {
  const group = await getAccountGroupById(companyId, groupId);

  if (group.isSystem) {
    throw new ApiError(403, "System account groups cannot be archived.");
  }

  const childGroup = await AccountGroup.findOne({
    companyId,
    parentId: group._id,
    isActive: true
  }).lean();

  if (childGroup) {
    throw new ApiError(409, "Account group has active child groups.");
  }

  const linkedLedger = await Ledger.findOne({
    companyId,
    groupId: group._id,
    isActive: true
  }).lean();

  if (linkedLedger) {
    throw new ApiError(409, "Account group has active ledgers.");
  }

  group.isActive = false;
  group.deletedAt = new Date();
  group.deletedBy = actorUserId;
  group.updatedBy = actorUserId || group.updatedBy || null;
  await group.save();

  return mapAccountGroup(group);
}

async function getChartOfAccounts(companyId, fiscalYearId) {
  const [groups, ledgers] = await Promise.all([
    AccountGroup.find({ companyId, isActive: true }).sort({ category: 1, name: 1 }).lean(),
    Ledger.find({ companyId, fiscalYearId, isActive: true }).sort({ name: 1 }).lean()
  ]);

  const groupNodeById = new Map();

  for (const group of groups) {
    groupNodeById.set(String(group._id), {
      ...mapAccountGroup(group),
      children: [],
      ledgers: []
    });
  }

  for (const ledger of ledgers) {
    const targetGroup = groupNodeById.get(String(ledger.groupId));

    if (!targetGroup) {
      continue;
    }

    targetGroup.ledgers.push({
      id: ledger._id,
      name: ledger.name,
      systemCode: ledger.systemCode,
      openingBalance: ledger.openingBalance,
      openingBalanceType: ledger.openingBalanceType,
      allowManualEntry: ledger.allowManualEntry,
      isSystem: ledger.isSystem,
      isActive: ledger.isActive
    });
  }

  const roots = [];

  for (const group of groups) {
    const node = groupNodeById.get(String(group._id));

    if (group.parentId) {
      const parentNode = groupNodeById.get(String(group.parentId));

      if (parentNode) {
        parentNode.children.push(node);
        continue;
      }
    }

    roots.push(node);
  }

  return roots;
}

module.exports = {
  mapAccountGroup,
  listAccountGroups,
  createAccountGroup,
  updateAccountGroup,
  archiveAccountGroup,
  getChartOfAccounts,
  getAccountGroupBySystemCode,
  getAccountGroupById
};
