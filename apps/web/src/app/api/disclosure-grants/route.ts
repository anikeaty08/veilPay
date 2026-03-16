import { NextRequest, NextResponse } from "next/server";

import { disclosureGrantSchema } from "@/lib/metadata";
import { getDisclosureGrantsCollection, sanitizeMongoDocument } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const payoutId = Number(request.nextUrl.searchParams.get("payoutId"));
    const viewer = request.nextUrl.searchParams.get("viewer")?.toLowerCase();
    const organizationSlug = request.nextUrl.searchParams.get("organizationSlug");
    const status = request.nextUrl.searchParams.get("status");
    const limit = Math.min(Number(request.nextUrl.searchParams.get("limit")) || 50, 100);

    const filter: Record<string, unknown> = {};
    if (Number.isFinite(payoutId) && payoutId > 0) filter.payoutId = payoutId;
    if (viewer) filter.viewer = viewer;
    if (organizationSlug) filter.organizationSlug = organizationSlug;
    if (status) filter.status = status;

    const collection = await getDisclosureGrantsCollection();
    const items = await collection.find(filter).sort({ grantedAt: -1 }).limit(limit).toArray();

    return NextResponse.json({
      items: items.map((item) => disclosureGrantSchema.parse(sanitizeMongoDocument(item))),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load disclosure grants" },
      { status: 503 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      payoutId?: number;
      viewer?: string;
      status?: "active" | "revoked";
      note?: string;
    };

    if (!body.payoutId || !body.viewer || !body.status) {
      return NextResponse.json(
        { error: "payoutId, viewer, and status are required" },
        { status: 400 },
      );
    }

    const collection = await getDisclosureGrantsCollection();
    const existing = await collection.findOne({
      payoutId: body.payoutId,
      viewer: body.viewer.toLowerCase(),
    });

    if (!existing) {
      return NextResponse.json({ error: "Disclosure grant not found" }, { status: 404 });
    }

    const updated = disclosureGrantSchema.parse({
      ...sanitizeMongoDocument(existing),
      status: body.status,
      note: body.note ?? existing.note,
      updatedAt: new Date().toISOString(),
    });

    await collection.updateOne(
      { payoutId: body.payoutId, viewer: body.viewer.toLowerCase() },
      { $set: updated },
    );

    return NextResponse.json({ ok: true, item: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update disclosure grant" },
      { status: 503 },
    );
  }
}
