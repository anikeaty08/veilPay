import { MongoClient, type Collection, type Document } from "mongodb";

import type { PayoutMetadata } from "@/lib/metadata";

declare global {
  var _veilPayMongoClientPromise: Promise<MongoClient> | undefined;
  var _veilPayMetadataReadyPromise: Promise<Collection<PayoutMetadata>> | undefined;
}

export async function getMongoClient() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not configured");
  }

  if (!global._veilPayMongoClientPromise) {
    const client = new MongoClient(uri);
    global._veilPayMongoClientPromise = client.connect();
  }

  return global._veilPayMongoClientPromise;
}

async function ensureMetadataCollection() {
  const client = await getMongoClient();
  const dbName = process.env.MONGODB_DB || "veilpay";
  const db = client.db(dbName);
  const collectionName = "payout_metadata";

  const collections = await db
    .listCollections({ name: collectionName }, { nameOnly: true })
    .toArray();

  if (!collections.length) {
    await db.createCollection(collectionName, {
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: [
            "metadataHash",
            "creator",
            "recipient",
            "organizationName",
            "label",
            "category",
            "dueDate",
            "settlementToken",
            "kind",
            "tokenDecimals",
            "currencySymbol",
            "createdAt",
            "updatedAt",
          ],
          additionalProperties: false,
          properties: {
            payoutId: { bsonType: ["int", "long", "double"] },
            batchId: { bsonType: ["int", "long", "double"] },
            metadataHash: { bsonType: "string" },
            creator: { bsonType: "string" },
            recipient: { bsonType: "string" },
            organizationName: { bsonType: "string" },
            label: { bsonType: "string" },
            category: { bsonType: "string" },
            dueDate: { bsonType: ["int", "long", "double"] },
            settlementToken: { bsonType: "string" },
            kind: { bsonType: ["int", "long", "double"] },
            tokenDecimals: { bsonType: ["int", "long", "double"] },
            currencySymbol: { bsonType: "string" },
            attachmentUrl: { bsonType: "string" },
            reference: { bsonType: "string" },
            createdAt: { bsonType: "string" },
            updatedAt: { bsonType: "string" },
          },
        },
      },
    });
  } else {
    try {
      await db.command({
        collMod: collectionName,
        validator: {
          $jsonSchema: {
            bsonType: "object",
            required: [
              "metadataHash",
              "creator",
              "recipient",
              "organizationName",
              "label",
              "category",
              "dueDate",
              "settlementToken",
              "kind",
              "tokenDecimals",
              "currencySymbol",
              "createdAt",
              "updatedAt",
            ],
            additionalProperties: false,
            properties: {
              payoutId: { bsonType: ["int", "long", "double"] },
              batchId: { bsonType: ["int", "long", "double"] },
              metadataHash: { bsonType: "string" },
              creator: { bsonType: "string" },
              recipient: { bsonType: "string" },
              organizationName: { bsonType: "string" },
              label: { bsonType: "string" },
              category: { bsonType: "string" },
              dueDate: { bsonType: ["int", "long", "double"] },
              settlementToken: { bsonType: "string" },
              kind: { bsonType: ["int", "long", "double"] },
              tokenDecimals: { bsonType: ["int", "long", "double"] },
              currencySymbol: { bsonType: "string" },
              attachmentUrl: { bsonType: "string" },
              reference: { bsonType: "string" },
              createdAt: { bsonType: "string" },
              updatedAt: { bsonType: "string" },
            },
          },
        },
      });
    } catch {
      // Some Mongo deployments restrict collMod; indexes below still keep the collection safe enough for MVP.
    }
  }

  const collection = db.collection<PayoutMetadata>(collectionName);

  await Promise.all([
    collection.createIndex({ metadataHash: 1 }, { unique: true, name: "uniq_metadata_hash" }),
    collection.createIndex(
      { payoutId: 1 },
      {
        unique: true,
        sparse: true,
        name: "uniq_payout_id",
      },
    ),
    collection.createIndex({ creator: 1, createdAt: -1 }, { name: "creator_created_at" }),
    collection.createIndex({ recipient: 1, createdAt: -1 }, { name: "recipient_created_at" }),
    collection.createIndex({ batchId: 1 }, { sparse: true, name: "batch_id" }),
    collection.createIndex({ category: 1, dueDate: -1 }, { name: "category_due_date" }),
  ]);

  return collection;
}

export async function getMetadataCollection() {
  if (!global._veilPayMetadataReadyPromise) {
    global._veilPayMetadataReadyPromise = ensureMetadataCollection();
  }

  return global._veilPayMetadataReadyPromise;
}

export function sanitizeMongoDocument<T extends Document>(document: T) {
  const sanitized = { ...document };
  delete sanitized._id;
  return sanitized;
}
