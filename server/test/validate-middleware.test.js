const test = require("node:test");
const assert = require("node:assert/strict");

const { validateQuery } = require("../src/middleware/validate");

test("query validation preserves normalized BS dates with Express-style getter semantics", () => {
  const prototype = {};
  Object.defineProperty(prototype, "query", {
    get() {
      return { from: "2083-01-01", page: "1" };
    }
  });
  const request = Object.create(prototype);
  let nextError;

  validateQuery(() => [])(request, {}, (error) => { nextError = error; });

  assert.equal(nextError, undefined);
  assert.ok(request.query.from instanceof Date);
  assert.equal(request.query.from.toISOString(), "2026-04-14T00:00:00.000Z");
  assert.equal(request.query.page, "1");
});
