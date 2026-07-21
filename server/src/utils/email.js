const isEmail = require("validator/lib/isEmail");

function isValidEmail(value) {
  return typeof value === "string" && isEmail(value.trim(), {
    allow_display_name: false,
    allow_utf8_local_part: false,
    allow_underscores: false,
    require_tld: true
  });
}

module.exports = {
  isValidEmail
};
