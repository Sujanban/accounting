const { Notification } = require("../models/Notification");
const { ApiError } = require("../utils/apiError");
const map = (item) => ({ id: item._id, type: item.type, title: item.title, message: item.message, resourcePath: item.resourcePath, readAt: item.readAt, createdAt: item.createdAt });
async function list(companyId, userId) { return (await Notification.find({ companyId, userId }).sort({ createdAt: -1, _id: -1 }).limit(100).lean()).map(map); }
async function markRead(companyId, userId, id) { const item = await Notification.findOneAndUpdate({ _id: id, companyId, userId }, { readAt: new Date(), updatedBy: userId }, { new: true }); if (!item) throw new ApiError(404, "Notification was not found."); return map(item); }
module.exports = { list, markRead };
