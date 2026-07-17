const express = require("express");

const { createCompany } = require("../controllers/companyController");
const { requireAuth } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const { validateCreateCompany } = require("../validators/companyValidators");

const companyRouter = express.Router();

companyRouter.post("/", requireAuth, validate(validateCreateCompany), createCompany);

module.exports = {
  companyRouter
};
