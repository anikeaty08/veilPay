import { NextRequest, NextResponse } from "next/server";

import { organizationSchema, organizationUpsertSchema } from "@/lib/metadata";
import { getOrganizationsCollection, sanitizeMongoDocument } from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const slug = request.nextUrl.searchParams.get("slug");
    const treasuryAdmin = request.nextUrl.searchParams.get("treasuryAdmin")?.toLowerCase();
    const limit = Math.min(Number(request.nextUrl.searchParams.get("limit")) || 50, 100);

    const collection = await getOrganizationsCollection();
    const filter: Record<string, unknown> = {};
    if (slug) filter.slug = slug;
    if (treasuryAdmin) filter.treasuryAdmin = treasuryAdmin;

    const items = await collection.find(filter).sort({ updatedAt: -1 }).limit(limit).toArray();

    return NextResponse.json({
      items: items.map((item) => organizationSchema.parse(sanitizeMongoDocument(item))),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load organizations" },
      { status: 503 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = organizationUpsertSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const collection = await getOrganizationsCollection();
    const now = new Date().toISOString();
    const payload = organizationSchema.parse({
      ...parsed.data,
      financeViewers: parsed.data.financeViewers ?? [],
      auditors: parsed.data.auditors ?? [],
      tags: parsed.data.tags ?? [],
      createdAt: now,
      updatedAt: now,
    });

    await collection.updateOne(
      { slug: payload.slug },
      {
        $set: { ...payload, updatedAt: now },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true },
    );

    return NextResponse.json({ ok: true, item: payload });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save organization" },
      { status: 503 },
    );
  }
}
