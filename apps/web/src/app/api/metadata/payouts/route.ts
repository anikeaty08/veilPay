import { NextRequest, NextResponse } from "next/server";

import {
  payoutActivitySchema,
  payoutMetadataDocumentSchema,
  payoutMetadataUpsertSchema,
  payoutWorkflowUpdateSchema,
} from "@/lib/metadata";
import {
  getActivityCollection,
  getMetadataCollection,
  sanitizeMongoDocument,
} from "@/lib/mongodb";

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

    const activityCollection = await getActivityCollection();
    await activityCollection.insertMany(
      normalizedItems.map((item) =>
        payoutActivitySchema.parse({
          payoutId: item.payoutId,
          actor: item.creator,
          action: "created",
          organizationSlug: item.organizationSlug,
          createdAt: now,
        }),
      ),
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

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = payoutWorkflowUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const collection = await getMetadataCollection();
    const activityCollection = await getActivityCollection();
    const now = new Date().toISOString();

    const record = await collection.findOne({ payoutId: parsed.data.payoutId });
    if (!record) {
      return NextResponse.json({ error: "Payout metadata not found" }, { status: 404 });
    }

    const nextApprovalCount = parsed.data.incrementApprovalCount
      ? Math.min((record.approvalCount ?? 0) + 1, record.requiredApprovals ?? 1)
      : record.approvalCount;
    const nextDisclosureList = parsed.data.addDisclosureViewer
      ? Array.from(
          new Set([...(record.disclosureSharedWith ?? []), parsed.data.addDisclosureViewer]),
        )
      : record.disclosureSharedWith;

    await collection.updateOne(
      { payoutId: parsed.data.payoutId },
      {
        $set: {
          updatedAt: now,
          latestAction: parsed.data.action,
          workflowStatus: parsed.data.workflowStatus ?? record.workflowStatus,
          approvalCount: nextApprovalCount,
          disclosureSharedWith: nextDisclosureList,
        },
      },
    );

    await activityCollection.insertOne(
      payoutActivitySchema.parse({
        payoutId: parsed.data.payoutId,
        actor: parsed.data.actor,
        action: parsed.data.action,
        organizationSlug: record.organizationSlug,
        note: parsed.data.note,
        target: parsed.data.target ?? parsed.data.addDisclosureViewer,
        createdAt: now,
      }),
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Metadata workflow update failed",
      },
      { status: 503 },
    );
  }
}
