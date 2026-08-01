const test = require("node:test");
const assert = require("node:assert/strict");
const { apiRouter } = require("../src/routes");
const { enterpriseRouter } = require("../src/routes/enterpriseRoutes");
const { businessMasterRouter } = require("../src/routes/businessMasterRoutes");

test("branch-scoped warehouse routes take precedence over legacy master routes", () => {
  const enterpriseIndex = apiRouter.stack.findIndex((layer) => layer.handle === enterpriseRouter);
  const businessMasterIndex = apiRouter.stack.findIndex((layer) => layer.handle === businessMasterRouter);

  assert.notEqual(enterpriseIndex, -1);
  assert.notEqual(businessMasterIndex, -1);
  assert.ok(enterpriseIndex < businessMasterIndex);
});
