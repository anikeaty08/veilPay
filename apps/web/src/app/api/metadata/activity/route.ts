import { NextRequest, NextResponse } from "next/server";

import { payoutActivitySchema } from "@/lib/metadata";
import { getActivityCollection, sanitizeMongoDocument } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const payoutId = Number(request.nextUrl.searchParams.get("payoutId"));
    const organizationSlug = request.nextUrl.searchParams.get("organizationSlug");
    const limit = Math.min(Number(request.nextUrl.searchParams.get("limit")) || 20, 50);

    const collection = await getActivityCollection();
    const filter: Record<string, unknown> = {};

    if (Number.isFinite(payoutId) && payoutId > 0) {
      filter.payoutId = payoutId;
    }
    if (organizationSlug) {
      filter.organizationSlug = organizationSlug;
    }

    const rawItems = await collection
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    const items = rawItems
      .map((item) => sanitizeMongoDocument(item))
      .map((item) => payoutActivitySchema.parse(item));

    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Activity service is unavailable",
      },
      { status: 503 },
    );
  }
}
