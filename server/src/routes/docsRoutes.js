const express = require("express");
const swaggerUi = require("swagger-ui-express");

const { openApiDocument } = require("../docs/openapi");

const docsRouter = express.Router();

docsRouter.get("/openapi.json", (_request, response) => {
  response.status(200).json(openApiDocument);
});

docsRouter.use("/", swaggerUi.serve, swaggerUi.setup(openApiDocument));

module.exports = {
  docsRouter
};
