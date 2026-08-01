const assert = require("node:assert/strict");
const test = require("node:test");

const { getRefreshCookieOptions, parseCookies } = require("../src/utils/cookies");

test("refresh cookies remain available during localhost HTTP development", () => {
  assert.deepEqual(getRefreshCookieOptions(false), {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/api/auth"
  });
});

test("refresh cookies are secure when the request arrived over HTTPS", () => {
  assert.equal(getRefreshCookieOptions(true).secure, true);
});

test("refresh token cookies can be parsed after a subsequent request", () => {
  assert.equal(parseCookies("theme=dark; refreshToken=token-value").refreshToken, "token-value");
});
