import { NextRequest, NextResponse } from "next/server";

import { syncStateSchema, syncStateUpsertSchema } from "@/lib/metadata";
import { getSyncStateCollection, sanitizeMongoDocument } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const syncKey = request.nextUrl.searchParams.get("syncKey");
    const chainId = Number(request.nextUrl.searchParams.get("chainId"));
    const status = request.nextUrl.searchParams.get("status");

    const filter: Record<string, unknown> = {};
    if (syncKey) filter.syncKey = syncKey;
    if (Number.isFinite(chainId) && chainId > 0) filter.chainId = chainId;
    if (status) filter.status = status;

    const collection = await getSyncStateCollection();
    const items = await collection.find(filter).sort({ lastSyncAt: -1 }).toArray();

    return NextResponse.json({
      items: items.map((item) => syncStateSchema.parse(sanitizeMongoDocument(item))),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load sync state" },
      { status: 503 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = syncStateUpsertSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const now = new Date().toISOString();
    const payload = syncStateSchema.parse({
      ...parsed.data,
      status: parsed.data.status ?? "healthy",
      lastSyncAt: now,
    });

    const collection = await getSyncStateCollection();
    await collection.updateOne(
      { syncKey: payload.syncKey },
      {
        $set: payload,
      },
      { upsert: true },
    );

    return NextResponse.json({ ok: true, item: payload });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save sync state" },
      { status: 503 },
    );
  }
}
