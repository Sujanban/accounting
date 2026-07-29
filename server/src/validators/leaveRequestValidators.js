function validateLeaveRequestDecision(body) {
  const errors = [];
  const allowed = new Set(["status"]);
  for (const key of Object.keys(body)) if (!allowed.has(key)) errors.push({ field: key, message: "This field cannot be modified." });
  if (!["APPROVED", "REJECTED"].includes(body.status)) errors.push({ field: "status", message: "Status must be APPROVED or REJECTED." });
  return errors;
}

module.exports = { validateLeaveRequestDecision };
