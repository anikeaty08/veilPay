import { NextRequest, NextResponse } from "next/server";

import {
  payoutMetadataDocumentSchema,
  payoutMetadataUpsertSchema,
} from "@/lib/metadata";
import { getMetadataCollection, sanitizeMongoDocument } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const ids = request.nextUrl.searchParams
      .get("ids")
      ?.split(",")
      .filter(Boolean)
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value));

    if (!ids?.length) {
      return NextResponse.json({ items: [] });
    }

    const collection = await getMetadataCollection();
    const rawItems = await collection
      .find({ payoutId: { $in: ids } })
      .toArray();
    const items = rawItems
      .map((item) => sanitizeMongoDocument(item))
      .map((item) => payoutMetadataDocumentSchema.parse(item));

    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Metadata service is unavailable",
      },
      { status: 503 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = payoutMetadataUpsertSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const collection = await getMetadataCollection();
    const now = new Date().toISOString();
    const normalizedItems = parsed.data.items.map((item) => ({
      ...item,
      createdAt: now,
      updatedAt: now,
    }));

    await collection.bulkWrite(
      normalizedItems.map((item) => ({
        updateOne: {
          filter: { metadataHash: item.metadataHash },
          update: {
            $set: { ...item, updatedAt: now },
            $setOnInsert: { createdAt: now },
          },
          upsert: true,
        },
      })),
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Metadata service is unavailable",
      },
      { status: 503 },
    );
  }
}
