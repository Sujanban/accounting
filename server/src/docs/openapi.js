const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Accounting Foundation API",
    version: "2.0.0",
    description:
      "Phase 2 accounting foundation APIs for company onboarding, accounting settings, account groups, chart of accounts, ledgers, and voucher sequences."
  },
  servers: [
    {
      url: "http://localhost:5000",
      description: "Local development server"
    }
  ],
  tags: [
    { name: "Auth", description: "Authentication and session endpoints" },
    { name: "Companies", description: "Company creation and onboarding endpoints" },
    { name: "Settings", description: "Company settings and accounting preferences" },
    { name: "Accounting", description: "Phase 2 accounting foundation endpoints" }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Validation failed." },
          errorCode: { type: "string", example: "VALIDATION_ERROR" },
          errors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                field: { type: "string", example: "name" },
                message: { type: "string", example: "Field is required." }
              }
            }
          }
        }
      },
      FiscalYear: {
        type: "object",
        properties: {
          id: { type: "string", example: "6878f8f6b2b52fb6c88ac110" },
          name: { type: "string", example: "2082/83" },
          startDateBS: { type: "string", example: "2082-04-01" },
          endDateBS: { type: "string", example: "2083-03-31" },
          startDateAD: { type: "string", format: "date", example: "2025-07-17" },
          endDateAD: { type: "string", format: "date", example: "2026-07-16" },
          isActive: { type: "boolean", example: true },
          isLocked: { type: "boolean", example: false }
        }
      },
      AccountGroup: {
        type: "object",
        properties: {
          id: { type: "string", example: "6878f8f6b2b52fb6c88ac210" },
          companyId: { type: "string", example: "6878f8f6b2b52fb6c88ac010" },
          systemCode: { type: "string", nullable: true, example: "CURRENT_ASSETS" },
          name: { type: "string", example: "Current Assets" },
          type: {
            type: "string",
            enum: ["Assets", "Liabilities", "Equity", "Income", "Expenses"],
            example: "Assets"
          },
          parentId: { type: "string", nullable: true, example: null },
          description: { type: "string", nullable: true, example: "Top-level current assets group" },
          isSystem: { type: "boolean", example: true },
          isActive: { type: "boolean", example: true }
        }
      },
      Ledger: {
        type: "object",
        properties: {
          id: { type: "string", example: "6878f8f6b2b52fb6c88ac310" },
          companyId: { type: "string", example: "6878f8f6b2b52fb6c88ac010" },
          fiscalYearId: { type: "string", example: "6878f8f6b2b52fb6c88ac110" },
          groupId: { type: "string", example: "6878f8f6b2b52fb6c88ac210" },
          systemCode: { type: "string", nullable: true, example: "CASH" },
          name: { type: "string", example: "Cash in Hand" },
          openingBalance: { type: "number", example: 0 },
          openingBalanceType: {
            type: "string",
            enum: ["DEBIT", "CREDIT"],
            example: "DEBIT"
          },
          description: { type: "string", nullable: true, example: "Main cash ledger" },
          allowManualEntry: { type: "boolean", example: false },
          isSystem: { type: "boolean", example: true },
          isActive: { type: "boolean", example: true }
        }
      },
      VoucherSequence: {
        type: "object",
        properties: {
          id: { type: "string", example: "6878f8f6b2b52fb6c88ac410" },
          companyId: { type: "string", example: "6878f8f6b2b52fb6c88ac010" },
          fiscalYearId: { type: "string", example: "6878f8f6b2b52fb6c88ac110" },
          voucherType: {
            type: "string",
            enum: ["JV", "SV", "PV", "RV", "CV", "PMV"],
            example: "JV"
          },
          prefix: { type: "string", example: "JV-2082/83-" },
          nextNumber: { type: "integer", example: 1 },
          padding: { type: "integer", example: 6 },
          resetEveryFiscalYear: { type: "boolean", example: true }
        }
      },
      Setting: {
        type: "object",
        properties: {
          id: { type: "string", example: "6878f8f6b2b52fb6c88ac030" },
          companyId: { type: "string", example: "6878f8f6b2b52fb6c88ac010" },
          businessType: { type: "string", example: "RETAIL" },
          currency: { type: "string", example: "NPR" },
          currencySymbol: { type: "string", example: "Rs." },
          language: { type: "string", example: "en" },
          dateFormat: { type: "string", enum: ["BS", "AD"], example: "BS" },
          timezone: { type: "string", example: "Asia/Kathmandu" },
          decimalPlaces: { type: "integer", example: 2 },
          allowNegativeStock: { type: "boolean", example: false },
          accounting: {
            type: "object",
            properties: {
              voucherNumbering: { type: "string", enum: ["AUTO", "MANUAL"], example: "AUTO" },
              decimalPlaces: { type: "integer", example: 2 },
              allowJournalEditing: { type: "boolean", example: false },
              lockAfterClosing: { type: "boolean", example: true },
              defaultVoucherView: { type: "string", enum: ["STANDARD", "COMPACT"], example: "STANDARD" }
            }
          },
          fiscalLock: {
            type: "object",
            properties: {
              lockBeforeDate: { type: "string", format: "date-time", nullable: true, example: "2026-07-01T00:00:00.000Z" },
              lockClosedFiscalYear: { type: "boolean", example: true },
              allowAdminOverride: { type: "boolean", example: false }
            }
          }
        }
      }
    }
  },
  paths: {
    "/api/accounting/account-groups": {
      get: {
        tags: ["Accounting"],
        summary: "List account groups",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Account groups fetched successfully."
          }
        }
      },
      post: {
        tags: ["Accounting"],
        summary: "Create account group",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "type"],
                properties: {
                  name: { type: "string", example: "Cash Accounts" },
                  type: { type: "string", enum: ["Assets", "Liabilities", "Equity", "Income", "Expenses"] },
                  parentId: { type: "string", nullable: true, example: "6878f8f6b2b52fb6c88ac210" },
                  description: { type: "string", nullable: true, example: "Nested cash sub-group" }
                }
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Account group created successfully."
          }
        }
      }
    },
    "/api/accounting/account-groups/{id}": {
      patch: {
        tags: ["Accounting"],
        summary: "Update account group",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string" }
          }
        ],
        responses: {
          "200": {
            description: "Account group updated successfully."
          }
        }
      },
      delete: {
        tags: ["Accounting"],
        summary: "Archive account group",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string" }
          }
        ],
        responses: {
          "200": {
            description: "Account group deleted successfully."
          }
        }
      }
    },
    "/api/accounting/chart-of-accounts": {
      get: {
        tags: ["Accounting"],
        summary: "Get chart of accounts hierarchy",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Chart of accounts fetched successfully."
          }
        }
      }
    },
    "/api/accounting/ledgers": {
      get: {
        tags: ["Accounting"],
        summary: "List ledgers",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Ledgers fetched successfully."
          }
        }
      },
      post: {
        tags: ["Accounting"],
        summary: "Create ledger",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "groupId"],
                properties: {
                  groupId: { type: "string", example: "6878f8f6b2b52fb6c88ac210" },
                  systemCode: { type: "string", nullable: true, example: null },
                  name: { type: "string", example: "Petty Cash" },
                  openingBalance: { type: "number", example: 0 },
                  openingBalanceType: { type: "string", enum: ["DEBIT", "CREDIT"], example: "DEBIT" },
                  description: { type: "string", nullable: true, example: "Small operating cash ledger" },
                  allowManualEntry: { type: "boolean", example: true }
                }
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Ledger created successfully."
          }
        }
      }
    },
    "/api/accounting/ledgers/{id}": {
      patch: {
        tags: ["Accounting"],
        summary: "Update ledger",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string" }
          }
        ],
        responses: {
          "200": {
            description: "Ledger updated successfully."
          }
        }
      },
      delete: {
        tags: ["Accounting"],
        summary: "Archive ledger",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string" }
          }
        ],
        responses: {
          "200": {
            description: "Ledger deleted successfully."
          }
        }
      }
    },
    "/api/accounting/voucher-sequences": {
      get: {
        tags: ["Accounting"],
        summary: "List voucher sequences",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Voucher sequences fetched successfully."
          }
        }
      }
    },
    "/api/accounting/voucher-sequences/{id}": {
      patch: {
        tags: ["Accounting"],
        summary: "Update voucher sequence",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            in: "path",
            name: "id",
            required: true,
            schema: { type: "string" }
          }
        ],
        responses: {
          "200": {
            description: "Voucher sequence updated successfully."
          }
        }
      }
    },
    "/api/settings": {
      post: {
        tags: ["Settings"],
        summary: "Create company settings",
        security: [{ bearerAuth: [] }],
        responses: {
          "201": {
            description: "Company settings created successfully."
          }
        }
      }
    },
    "/api/settings/accounting": {
      patch: {
        tags: ["Settings"],
        summary: "Update accounting preferences and fiscal lock rules",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Accounting preferences updated successfully."
          }
        }
      }
    }
  }
};

module.exports = {
  openApiDocument
};
