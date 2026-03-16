import { NextRequest, NextResponse } from "next/server";

import { syncStateSchema } from "@/lib/metadata";
import { getMetadataCollection, getSyncStateCollection, sanitizeMongoDocument } from "@/lib/mongodb";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      syncKey?: string;
      chainId?: number;
      contractAddress?: string;
      upToBlock?: number;
      note?: string;
    };

    if (!body.syncKey || !body.chainId || !body.contractAddress || !body.upToBlock) {
      return NextResponse.json(
        { error: "syncKey, chainId, contractAddress, and upToBlock are required" },
        { status: 400 },
      );
    }

    const metadataCollection = await getMetadataCollection();
    const syncStateCollection = await getSyncStateCollection();
    const now = new Date().toISOString();

    const latestMetadata = await metadataCollection.find({}).sort({ createdAt: -1 }).limit(1).toArray();
    const payload = syncStateSchema.parse({
      syncKey: body.syncKey,
      chainId: body.chainId,
      contractAddress: body.contractAddress.toLowerCase(),
      lastProcessedBlock: body.upToBlock,
      status: "healthy",
      lastSyncAt: now,
      lastError: body.note,
      lastProcessedTxHash: undefined,
      lastProcessedLogIndex: undefined,
    });

    await syncStateCollection.updateOne(
      { syncKey: payload.syncKey },
      { $set: payload },
      { upsert: true },
    );

    return NextResponse.json({
      ok: true,
      sync: payload,
      snapshot: latestMetadata.map((item) => sanitizeMongoDocument(item)),
      note: "Manual sync marker updated. This is a lightweight indexer scaffold for local/admin workflows.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Manual sync failed" },
      { status: 503 },
    );
  }
}
