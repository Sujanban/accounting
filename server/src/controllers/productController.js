const {
  archiveProduct,
  createProduct,
  listProducts,
  updateProduct
} = require("../services/productService");
const { asyncHandler } = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

const getProducts = asyncHandler(async (request, response) => {
  const data = await listProducts(
    request.auth.activeCompanyId,
    request.auth.activeFiscalYearId,
    request.query
  );
  return sendSuccess(response, 200, "Products fetched successfully.", data);
});

const postProduct = asyncHandler(async (request, response) => {
  const data = await createProduct(
    request.auth.activeCompanyId,
    request.auth.activeFiscalYearId,
    request.body
  );
  return sendSuccess(response, 201, "Product created successfully.", data);
});

const patchProduct = asyncHandler(async (request, response) => {
  const data = await updateProduct(
    request.auth.activeCompanyId,
    request.auth.activeFiscalYearId,
    request.params.productId,
    request.body
  );
  return sendSuccess(response, 200, "Product updated successfully.", data);
});

const archiveProductRecord = asyncHandler(async (request, response) => {
  const data = await archiveProduct(
    request.auth.activeCompanyId,
    request.auth.activeFiscalYearId,
    request.params.productId
  );
  return sendSuccess(response, 200, "Product archived successfully.", data);
});

module.exports = {
  getProducts,
  postProduct,
  patchProduct,
  archiveProductRecord
};
