import { NextResponse } from "next/server";

import {
  getActivityCollection,
  getDisclosureGrantsCollection,
  getMetadataCollection,
  getMongoClient,
  getOrganizationsCollection,
  getSyncStateCollection,
} from "@/lib/mongodb";

export async function GET() {
  try {
    const [client, metadata, activity, organizations, grants, syncState] = await Promise.all([
      getMongoClient(),
      getMetadataCollection(),
      getActivityCollection(),
      getOrganizationsCollection(),
      getDisclosureGrantsCollection(),
      getSyncStateCollection(),
    ]);
    await client.db(process.env.MONGODB_DB || "veilpay").command({ ping: 1 });

    const [metadataCount, activityCount, orgCount, grantCount, syncItems] = await Promise.all([
      metadata.estimatedDocumentCount(),
      activity.estimatedDocumentCount(),
      organizations.estimatedDocumentCount(),
      grants.estimatedDocumentCount(),
      syncState.find({}).sort({ lastSyncAt: -1 }).limit(5).toArray(),
    ]);

    return NextResponse.json({
      ok: true,
      mongoConnected: true,
      configured: {
        contractAddress: process.env.NEXT_PUBLIC_VEILPAY_MANAGER_ADDRESS || null,
        mongoDb: process.env.MONGODB_DB || "veilpay",
      },
      counts: {
        metadata: metadataCount,
        activity: activityCount,
        organizations: orgCount,
        disclosureGrants: grantCount,
      },
      syncState: syncItems.map((item) => ({
        syncKey: item.syncKey,
        chainId: item.chainId,
        status: item.status,
        lastProcessedBlock: item.lastProcessedBlock,
        lastSyncAt: item.lastSyncAt,
        lastError: item.lastError,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Health check failed",
      },
      { status: 503 },
    );
  }
}
