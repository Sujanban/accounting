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

async function removeLegacyContactCodeIndex() {
  const collection = mongoose.connection.collection("contacts");
  const indexes = await collection.indexes().catch((error) => {
    if (error?.codeName === "NamespaceNotFound") return [];
    throw error;
  });
  const legacyIndex = indexes.find(
    (index) => index.key?.companyId === 1 && index.key?.contactCode === 1
  );
  if (!legacyIndex) return;
  await collection.dropIndex(legacyIndex.name);
  console.info(JSON.stringify({ level: "info", event: "legacy_index_removed", collection: "contacts", index: legacyIndex.name }));
}

async function removeLegacyAssetCodeIndex() {
  const collection = mongoose.connection.collection("fixedassets");
  const indexes = await collection.indexes().catch((error) => {
    if (error?.codeName === "NamespaceNotFound") return [];
    throw error;
  });
  const legacyIndex = indexes.find(
    (index) => index.key?.companyId === 1 && index.key?.assetCode === 1
  );
  if (!legacyIndex) return;
  await collection.dropIndex(legacyIndex.name);
  console.info(JSON.stringify({ level: "info", event: "legacy_index_removed", collection: "fixedassets", index: legacyIndex.name }));
}

async function connectDatabase() {
  mongoose.set("strictQuery", true);

  await mongoose.connect(env.mongoUri);
  await Promise.all([
    removeLegacyWarehouseCodeIndex(),
    removeLegacyContactCodeIndex(),
    removeLegacyAssetCodeIndex()
  ]);

  console.log("Connected to MongoDB");
}

module.exports = {
  connectDatabase,
  removeLegacyAssetCodeIndex,
  removeLegacyContactCodeIndex,
  removeLegacyWarehouseCodeIndex
};
