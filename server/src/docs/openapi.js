const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Accounting Software API",
    version: "1.0.0",
    description:
      "Foundation APIs for authentication, company onboarding, settings, and dashboard access."
  },
  servers: [
    {
      url: "http://localhost:5001",
      description: "Local development server"
    }
  ],
  tags: [
    { name: "Health", description: "Service health endpoints" },
    { name: "Auth", description: "Authentication and session endpoints" },
    { name: "Companies", description: "Company onboarding endpoints" },
    { name: "Settings", description: "Company settings onboarding endpoints" },
    { name: "Dashboard", description: "Dashboard bootstrap endpoints" }
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
          errors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                field: { type: "string", example: "email" },
                message: {
                  type: "string",
                  example: "A valid email is required."
                }
              }
            }
          }
        }
      },
      Tokens: {
        type: "object",
        properties: {
          accessToken: { type: "string", example: "jwt-access-token" },
          refreshToken: { type: "string", example: "jwt-refresh-token" }
        }
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string", example: "6878f8f6b2b52fb6c88ac001" },
          name: { type: "string", example: "Sujan Ban" },
          email: { type: "string", example: "sujan@example.com" },
          emailVerified: { type: "boolean", example: false },
          isActive: { type: "boolean", example: true }
        }
      },
      FiscalYear: {
        type: "object",
        properties: {
          name: { type: "string", example: "2082/83" },
          startDateBS: { type: "string", example: "2082-04-01" },
          endDateBS: { type: "string", example: "2083-03-31" },
          startDateAD: { type: "string", format: "date", example: "2025-07-17" },
          endDateAD: { type: "string", format: "date", example: "2026-07-16" }
        }
      },
      Company: {
        type: "object",
        properties: {
          id: { type: "string", example: "6878f8f6b2b52fb6c88ac010" },
          name: { type: "string", example: "Acme Accounting Pvt Ltd" },
          panNumber: { type: "string", example: "123456789" },
          vatRegistered: { type: "boolean", example: true },
          vatNumber: { type: "string", nullable: true, example: "VAT-123456" },
          phone: { type: "string", nullable: true, example: "+9779800000000" },
          email: { type: "string", nullable: true, example: "info@acme.com" },
          address: { type: "string", nullable: true, example: "Kathmandu, Nepal" },
          logo: { type: "string", nullable: true, example: "https://cdn.example.com/logo.png" },
          onboardingCompleted: { type: "boolean", example: false },
          activeFiscalYear: { $ref: "#/components/schemas/FiscalYear" },
          activeFiscalYearId: { type: "string", nullable: true, example: "6878f8f6b2b52fb6c88ac110" }
        }
      },
      Setting: {
        type: "object",
        properties: {
          id: { type: "string", example: "6878f8f6b2b52fb6c88ac030" },
          companyId: { type: "string", example: "6878f8f6b2b52fb6c88ac010" },
          businessType: {
            type: "string",
            enum: [
              "RETAIL",
              "WHOLESALE",
              "SERVICE",
              "MANUFACTURING",
              "PHARMACY",
              "RESTAURANT",
              "OTHER"
            ],
            example: "RETAIL"
          },
          currency: { type: "string", example: "NPR" },
          currencySymbol: { type: "string", example: "Rs." },
          language: { type: "string", example: "en" },
          dateFormat: { type: "string", enum: ["BS", "AD"], example: "BS" },
          timezone: { type: "string", example: "Asia/Kathmandu" },
          decimalPlaces: { type: "integer", example: 2 },
          allowNegativeStock: { type: "boolean", example: false }
        }
      },
      Membership: {
        type: "object",
        properties: {
          id: { type: "string", example: "6878f8f6b2b52fb6c88ac020" },
          role: { type: "string", enum: ["OWNER", "STAFF"], example: "OWNER" },
          company: {
            allOf: [{ $ref: "#/components/schemas/Company" }],
            nullable: true
          }
        }
      },
      Session: {
        type: "object",
        properties: {
          user: { $ref: "#/components/schemas/User" },
          activeCompany: {
            allOf: [{ $ref: "#/components/schemas/Company" }],
            nullable: true
          },
          activeMembership: {
            type: "object",
            nullable: true,
            properties: {
              id: { type: "string", example: "6878f8f6b2b52fb6c88ac020" },
              role: { type: "string", enum: ["OWNER", "STAFF"], example: "OWNER" }
            }
          },
          activeSettings: {
            allOf: [{ $ref: "#/components/schemas/Setting" }],
            nullable: true
          },
          memberships: {
            type: "array",
            items: { $ref: "#/components/schemas/Membership" }
          }
        }
      },
      RegisterRequest: {
        type: "object",
        required: ["name", "email", "password", "confirmPassword"],
        properties: {
          name: { type: "string", example: "Sujan Ban" },
          email: { type: "string", example: "sujan@example.com" },
          password: { type: "string", example: "StrongPass123!" },
          confirmPassword: { type: "string", example: "StrongPass123!" }
        }
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", example: "sujan@example.com" },
          password: { type: "string", example: "StrongPass123!" }
        }
      },
      RefreshRequest: {
        type: "object",
        description: "Refresh token is provided via an HTTP-only cookie."
      },
      CreateCompanyRequest: {
        type: "object",
        required: ["name", "panNumber", "vatRegistered", "fiscalYear"],
        properties: {
          name: { type: "string", example: "Acme Accounting Pvt Ltd" },
          panNumber: { type: "string", example: "123456789" },
          vatRegistered: { type: "boolean", example: true },
          vatNumber: { type: "string", example: "VAT-123456" },
          phone: { type: "string", example: "+9779800000000" },
          email: { type: "string", example: "info@acme.com" },
          address: { type: "string", example: "Kathmandu, Nepal" },
          logo: { type: "string", example: "https://cdn.example.com/logo.png" },
          fiscalYear: { $ref: "#/components/schemas/FiscalYear" }
        }
      },
      CreateSettingsRequest: {
        type: "object",
        required: ["businessType"],
        properties: {
          businessType: {
            type: "string",
            enum: [
              "RETAIL",
              "WHOLESALE",
              "SERVICE",
              "MANUFACTURING",
              "PHARMACY",
              "RESTAURANT",
              "OTHER"
            ],
            example: "RETAIL"
          },
          currency: { type: "string", example: "NPR" },
          currencySymbol: { type: "string", example: "Rs." },
          language: { type: "string", example: "en" },
          dateFormat: { type: "string", enum: ["BS", "AD"], example: "BS" },
          timezone: { type: "string", example: "Asia/Kathmandu" },
          decimalPlaces: { type: "integer", example: 2 },
          allowNegativeStock: { type: "boolean", example: false }
        }
      },
      AuthResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Login successful." },
          data: {
            type: "object",
            properties: {
              accessToken: { type: "string", example: "jwt-access-token" },
              session: { $ref: "#/components/schemas/Session" }
            }
          }
        }
      },
      SessionResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Session fetched successfully." },
          data: { $ref: "#/components/schemas/Session" }
        }
      },
      CompanyCreatedResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: {
            type: "string",
            example: "Company created successfully."
          },
          data: {
            type: "object",
            properties: {
              company: { $ref: "#/components/schemas/Company" },
              session: { $ref: "#/components/schemas/Session" }
            }
          }
        }
      },
      SettingsCreatedResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: {
            type: "string",
            example: "Company settings created successfully. Onboarding completed."
          },
          data: {
            type: "object",
            properties: {
              settings: { $ref: "#/components/schemas/Setting" },
              session: { $ref: "#/components/schemas/Session" }
            }
          }
        }
      },
      DashboardBootstrapResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: {
            type: "string",
            example: "Dashboard bootstrap fetched successfully."
          },
          data: {
            properties: {
              companyName: { type: "string", nullable: true, example: "Acme Accounting Pvt Ltd" },
              activeFiscalYear: {
                allOf: [{ $ref: "#/components/schemas/FiscalYear" }],
                nullable: true
              },
              currentUser: { $ref: "#/components/schemas/User" },
              currentDate: { type: "string", format: "date-time", example: "2026-07-17T10:30:00.000Z" },
              cards: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    key: { type: "string", example: "sales" },
                    label: { type: "string", example: "Sales" },
                    value: { nullable: true, example: null }
                  }
                }
              },
              recentTransactions: {
                type: "array",
                items: { type: "object" }
              }
            }
          }
        }
      }
    }
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: {
          200: {
            description: "Service is healthy"
          }
        }
      }
    },
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" }
            }
          }
        },
        responses: {
          201: {
            description: "User registered",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" }
              }
            }
          },
          409: {
            description: "Email already exists",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Authenticate a user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" }
            }
          }
        },
        responses: {
          200: {
            description: "Login successful",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" }
              }
            }
          },
          401: {
            description: "Invalid credentials",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/api/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Rotate refresh token and issue new tokens",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RefreshRequest" }
            }
          }
        },
        responses: {
          200: {
            description: "Tokens refreshed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" }
              }
            }
          },
          401: {
            description: "Invalid refresh token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Revoke the current refresh token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RefreshRequest" }
            }
          }
        },
        responses: {
          200: {
            description: "Logout successful"
          }
        }
      }
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get current session",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Current session",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SessionResponse" }
              }
            }
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/api/companies": {
      post: {
        tags: ["Companies"],
        summary: "Create the first company for the authenticated user",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateCompanyRequest" }
            }
          }
        },
        responses: {
          201: {
            description: "Company created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CompanyCreatedResponse" }
              }
            }
          },
          401: {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          },
          409: {
            description: "Initial company already created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/api/dashboard/bootstrap": {
      get: {
        tags: ["Dashboard"],
        summary: "Fetch dashboard bootstrap payload",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Dashboard bootstrap payload",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/DashboardBootstrapResponse"
                }
              }
            }
          },
          403: {
            description: "Onboarding incomplete",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    }
  }
};

module.exports = {
  openApiDocument
};
