const { Product } = require("../models/Product");
const { ApiError } = require("../utils/apiError");
const { assertFiscalYearWritable } = require("./fiscalYearGuardService");

function mapProduct(product) {
  return {
    id: product._id,
    companyId: product.companyId,
    fiscalYearId: product.fiscalYearId,
    name: product.name,
    sku: product.sku,
    category: product.category,
    unit: product.unit,
    purchasePrice: product.purchasePrice,
    sellingPrice: product.sellingPrice,
    openingQuantity: product.openingQuantity,
    openingRate: product.openingRate,
    minimumStock: product.minimumStock,
    barcode: product.barcode,
    description: product.description,
    isActive: product.isActive,
    createdAt: product.createdAt
  };
}

async function listProducts(companyId, fiscalYearId, query = {}) {
  const filters = { companyId, fiscalYearId };

  if (query.search) {
    filters.name = { $regex: query.search, $options: "i" };
  }

  if (query.isActive !== undefined) {
    filters.isActive = query.isActive === "true";
  }

  const products = await Product.find(filters).sort({ name: 1 }).lean();
  return products.map(mapProduct);
}

async function createProduct(companyId, fiscalYearId, payload) {
  await assertFiscalYearWritable(companyId, fiscalYearId);
  const product = await Product.create({
    companyId,
    fiscalYearId,
    name: payload.name.trim(),
    sku: payload.sku ? payload.sku.trim() : null,
    category: payload.category ? payload.category.trim() : null,
    unit: payload.unit.trim(),
    purchasePrice: Number(payload.purchasePrice || 0),
    sellingPrice: Number(payload.sellingPrice || 0),
    openingQuantity: Number(payload.openingQuantity || 0),
    openingRate: Number(payload.openingRate || 0),
    minimumStock: Number(payload.minimumStock || 0),
    barcode: payload.barcode ? payload.barcode.trim() : null,
    description: payload.description ? payload.description.trim() : null,
    isActive: payload.isActive !== undefined ? payload.isActive : true,
    createdBy: payload.actorUserId || null,
    updatedBy: payload.actorUserId || null
  });

  return mapProduct(product);
}

async function updateProduct(companyId, fiscalYearId, productId, payload) {
  await assertFiscalYearWritable(companyId, fiscalYearId);
  const product = await Product.findOne({ _id: productId, companyId, fiscalYearId });

  if (!product) {
    throw new ApiError(404, "Product was not found.");
  }

  product.name = payload.name ? payload.name.trim() : product.name;
  product.sku = payload.sku !== undefined ? (payload.sku ? payload.sku.trim() : null) : product.sku;
  product.category =
    payload.category !== undefined
      ? payload.category
        ? payload.category.trim()
        : null
      : product.category;
  product.unit = payload.unit ? payload.unit.trim() : product.unit;
  product.purchasePrice =
    payload.purchasePrice !== undefined ? Number(payload.purchasePrice) : product.purchasePrice;
  product.sellingPrice =
    payload.sellingPrice !== undefined ? Number(payload.sellingPrice) : product.sellingPrice;
  product.openingQuantity =
    payload.openingQuantity !== undefined ? Number(payload.openingQuantity) : product.openingQuantity;
  product.openingRate =
    payload.openingRate !== undefined ? Number(payload.openingRate) : product.openingRate;
  product.minimumStock =
    payload.minimumStock !== undefined ? Number(payload.minimumStock) : product.minimumStock;
  product.barcode =
    payload.barcode !== undefined ? (payload.barcode ? payload.barcode.trim() : null) : product.barcode;
  product.description =
    payload.description !== undefined
      ? payload.description
        ? payload.description.trim()
        : null
      : product.description;
  if (payload.isActive !== undefined) {
    product.isActive = payload.isActive;
  }

  product.updatedBy = payload.actorUserId || product.updatedBy || null;
  await product.save();
  return mapProduct(product);
}

async function archiveProduct(companyId, fiscalYearId, productId, actorUserId = null) {
  await assertFiscalYearWritable(companyId, fiscalYearId);
  const product = await Product.findOne({ _id: productId, companyId, fiscalYearId });

  if (!product) {
    throw new ApiError(404, "Product was not found.");
  }

  product.isActive = false;
  product.deletedAt = new Date();
  product.deletedBy = actorUserId;
  product.updatedBy = actorUserId || product.updatedBy || null;
  await product.save();
  return mapProduct(product);
}

module.exports = {
  listProducts,
  createProduct,
  updateProduct,
  archiveProduct,
  mapProduct
};
