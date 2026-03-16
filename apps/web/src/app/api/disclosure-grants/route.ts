import { NextRequest, NextResponse } from "next/server";

import { buildActivityEventKey, writeActivityEvent } from "@/lib/backend";
import { disclosureGrantMutationSchema, disclosureGrantSchema } from "@/lib/metadata";
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
    const now = Date.now();

    return NextResponse.json({
      items: items.map((item) => {
        const sanitized = sanitizeMongoDocument(item);
        const expired =
          sanitized.status === "active" &&
          sanitized.expiresAt &&
          new Date(sanitized.expiresAt).getTime() <= now;

        return disclosureGrantSchema.parse({
          ...sanitized,
          status: expired ? "expired" : sanitized.status,
        });
      }),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load disclosure grants" },
      { status: 503 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = disclosureGrantMutationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const collection = await getDisclosureGrantsCollection();
    const existing = await collection.findOne({
      payoutId: parsed.data.payoutId,
      viewer: parsed.data.viewer,
    });
    const now = new Date().toISOString();
    const nextStatus = parsed.data.status ?? "active";

    const item = disclosureGrantSchema.parse({
      payoutId: parsed.data.payoutId,
      organizationSlug: existing?.organizationSlug ?? "default-org",
      grantedBy: existing?.grantedBy ?? parsed.data.requestedBy,
      viewer: parsed.data.viewer,
      status: nextStatus,
      note: parsed.data.note ?? existing?.note,
      expiresAt: parsed.data.expiresAt ?? existing?.expiresAt,
      revokedAt: nextStatus === "revoked" ? now : undefined,
      revokeReason: nextStatus === "revoked" ? parsed.data.revokeReason : undefined,
      grantedAt: existing?.grantedAt ?? now,
      updatedAt: now,
    });

    await collection.updateOne(
      { payoutId: parsed.data.payoutId, viewer: parsed.data.viewer },
      { $set: item },
      { upsert: true },
    );

    await writeActivityEvent({
      payoutId: parsed.data.payoutId,
      actor: parsed.data.requestedBy,
      action: "shared_disclosure",
      organizationSlug: item.organizationSlug,
      note:
        nextStatus === "revoked"
          ? parsed.data.revokeReason || "Disclosure access revoked"
          : parsed.data.note || "Disclosure access created",
      target: parsed.data.viewer,
      eventKey: buildActivityEventKey([
        "disclosure-grant",
        parsed.data.payoutId,
        parsed.data.viewer,
        nextStatus,
        parsed.data.requestId,
      ]),
      createdAt: now,
    });

    return NextResponse.json({ ok: true, item });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to save disclosure grant" },
      { status: 503 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = disclosureGrantMutationSchema.safeParse(body);

    if (!parsed.success || !parsed.data.status) {
      return NextResponse.json(
        { error: parsed.success ? "status is required for updates" : parsed.error.flatten() },
        { status: 400 },
      );
    }

    const collection = await getDisclosureGrantsCollection();
    const existing = await collection.findOne({
      payoutId: parsed.data.payoutId,
      viewer: parsed.data.viewer,
    });

    if (!existing) {
      return NextResponse.json({ error: "Disclosure grant not found" }, { status: 404 });
    }

    const now = new Date().toISOString();
    const updated = disclosureGrantSchema.parse({
      ...sanitizeMongoDocument(existing),
      status: parsed.data.status,
      note: parsed.data.note ?? existing.note,
      expiresAt: parsed.data.expiresAt ?? existing.expiresAt,
      revokedAt: parsed.data.status === "revoked" ? now : existing.revokedAt,
      revokeReason:
        parsed.data.status === "revoked"
          ? parsed.data.revokeReason ?? existing.revokeReason
          : undefined,
      updatedAt: now,
    });

    await collection.updateOne(
      { payoutId: parsed.data.payoutId, viewer: parsed.data.viewer },
      { $set: updated },
    );

    await writeActivityEvent({
      payoutId: parsed.data.payoutId,
      actor: parsed.data.requestedBy,
      action: "shared_disclosure",
      organizationSlug: updated.organizationSlug,
      note:
        parsed.data.status === "revoked"
          ? parsed.data.revokeReason || "Disclosure access revoked"
          : parsed.data.note || `Disclosure status set to ${parsed.data.status}`,
      target: parsed.data.viewer,
      eventKey: buildActivityEventKey([
        "disclosure-grant-update",
        parsed.data.payoutId,
        parsed.data.viewer,
        parsed.data.status,
        parsed.data.requestId,
      ]),
      createdAt: now,
    });

    return NextResponse.json({ ok: true, item: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update disclosure grant" },
      { status: 503 },
    );
  }
}
