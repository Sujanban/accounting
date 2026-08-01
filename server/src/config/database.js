const mongoose = require("mongoose");

const { env } = require("./env");

async function removeLegacyWarehouseCodeIndex() {
  const collection = mongoose.connection.collection("warehouses");
  const indexes = await collection.indexes().catch((error) => {
    if (error?.codeName === "NamespaceNotFound") return [];
    throw error;
  });
  const legacyIndex = indexes.find((index) => index.key?.companyId === 1 && index.key?.warehouseCode === 1);
  if (!legacyIndex) return;
  await collection.dropIndex(legacyIndex.name);
  console.info(JSON.stringify({ level: "info", event: "legacy_index_removed", collection: "warehouses", index: legacyIndex.name }));
}

async function connectDatabase() {
  mongoose.set("strictQuery", true);

  await mongoose.connect(env.mongoUri);
  await removeLegacyWarehouseCodeIndex();

  console.log("Connected to MongoDB");
}

module.exports = {
  connectDatabase,
  removeLegacyWarehouseCodeIndex
};
