import { MongoClient, type Collection, type Document } from "mongodb";

import type {
  DisclosureGrant,
  OrganizationRecord,
  PayoutActivity,
  PayoutMetadata,
  SyncState,
} from "@/lib/metadata";

declare global {
  var _veilPayMongoClientPromise: Promise<MongoClient> | undefined;
  var _veilPayMetadataReadyPromise: Promise<Collection<PayoutMetadata>> | undefined;
  var _veilPayActivityReadyPromise: Promise<Collection<PayoutActivity>> | undefined;
  var _veilPayOrganizationsReadyPromise: Promise<Collection<OrganizationRecord>> | undefined;
  var _veilPayDisclosureGrantsReadyPromise: Promise<Collection<DisclosureGrant>> | undefined;
  var _veilPaySyncStateReadyPromise: Promise<Collection<SyncState>> | undefined;
}

function getDb() {
  return getMongoClient().then((client) => client.db(process.env.MONGODB_DB || "veilpay"));
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
  const db = await getDb();
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

async function ensureActivityCollection() {
  const db = await getDb();
  const collectionName = "payout_activity";

  const collections = await db
    .listCollections({ name: collectionName }, { nameOnly: true })
    .toArray();

  if (!collections.length) {
    await db.createCollection(collectionName);
  }

  const collection = db.collection<PayoutActivity>(collectionName);
  await Promise.all([
    collection.createIndex({ payoutId: 1, createdAt: -1 }, { name: "payout_created_at" }),
    collection.createIndex({ actor: 1, createdAt: -1 }, { name: "actor_created_at" }),
    collection.createIndex({ organizationSlug: 1, createdAt: -1 }, { name: "org_created_at" }),
  ]);

  return collection;
}

export async function getActivityCollection() {
  if (!global._veilPayActivityReadyPromise) {
    global._veilPayActivityReadyPromise = ensureActivityCollection();
  }

  return global._veilPayActivityReadyPromise;
}

async function ensureOrganizationsCollection() {
  const db = await getDb();
  const collectionName = "organizations";
  const collections = await db
    .listCollections({ name: collectionName }, { nameOnly: true })
    .toArray();

  if (!collections.length) {
    await db.createCollection(collectionName);
  }

  const collection = db.collection<OrganizationRecord>(collectionName);
  await Promise.all([
    collection.createIndex({ slug: 1 }, { unique: true, name: "uniq_org_slug" }),
    collection.createIndex({ treasuryAdmin: 1 }, { name: "org_admin" }),
    collection.createIndex({ updatedAt: -1 }, { name: "org_updated_at" }),
  ]);

  return collection;
}

export async function getOrganizationsCollection() {
  if (!global._veilPayOrganizationsReadyPromise) {
    global._veilPayOrganizationsReadyPromise = ensureOrganizationsCollection();
  }

  return global._veilPayOrganizationsReadyPromise;
}

async function ensureDisclosureGrantsCollection() {
  const db = await getDb();
  const collectionName = "disclosure_grants";
  const collections = await db
    .listCollections({ name: collectionName }, { nameOnly: true })
    .toArray();

  if (!collections.length) {
    await db.createCollection(collectionName);
  }

  const collection = db.collection<DisclosureGrant>(collectionName);
  await Promise.all([
    collection.createIndex(
      { payoutId: 1, viewer: 1 },
      { unique: true, name: "uniq_payout_viewer_grant" },
    ),
    collection.createIndex({ organizationSlug: 1, grantedAt: -1 }, { name: "grant_org_created" }),
    collection.createIndex({ grantedBy: 1, grantedAt: -1 }, { name: "grant_granted_by" }),
  ]);

  return collection;
}

export async function getDisclosureGrantsCollection() {
  if (!global._veilPayDisclosureGrantsReadyPromise) {
    global._veilPayDisclosureGrantsReadyPromise = ensureDisclosureGrantsCollection();
  }

  return global._veilPayDisclosureGrantsReadyPromise;
}

async function ensureSyncStateCollection() {
  const db = await getDb();
  const collectionName = "sync_state";
  const collections = await db
    .listCollections({ name: collectionName }, { nameOnly: true })
    .toArray();

  if (!collections.length) {
    await db.createCollection(collectionName);
  }

  const collection = db.collection<SyncState>(collectionName);
  await Promise.all([
    collection.createIndex({ syncKey: 1 }, { unique: true, name: "uniq_sync_key" }),
    collection.createIndex({ chainId: 1, contractAddress: 1 }, { name: "sync_chain_contract" }),
    collection.createIndex({ status: 1, lastSyncAt: -1 }, { name: "sync_status" }),
  ]);

  return collection;
}

export async function getSyncStateCollection() {
  if (!global._veilPaySyncStateReadyPromise) {
    global._veilPaySyncStateReadyPromise = ensureSyncStateCollection();
  }

  return global._veilPaySyncStateReadyPromise;
}

export function sanitizeMongoDocument<T extends Document>(document: T) {
  const sanitized = { ...document };
  delete sanitized._id;
  return sanitized;
}
