import { NextRequest, NextResponse } from "next/server";

import {
  disclosureGrantSchema,
  payoutMetadataDocumentSchema,
  payoutMetadataUpsertSchema,
  payoutWorkflowUpdateSchema,
} from "@/lib/metadata";
import { buildActivityEventKey, writeActivityEvent } from "@/lib/backend";
import {
  getDisclosureGrantsCollection,
  getMetadataCollection,
  sanitizeMongoDocument,
} from "@/lib/mongodb";

export async function GET(request: NextRequest) {
  try {
    const collection = await getMetadataCollection();
    const ids = request.nextUrl.searchParams
      .get("ids")
      ?.split(",")
      .filter(Boolean)
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value));
    const role = request.nextUrl.searchParams.get("role");
    const actor = request.nextUrl.searchParams.get("actor")?.toLowerCase();
    const organizationSlug = request.nextUrl.searchParams.get("organizationSlug");
    const workflowStatus = request.nextUrl.searchParams.get("workflowStatus");
    const query = request.nextUrl.searchParams.get("query")?.trim().toLowerCase();
    const limit = Math.min(Number(request.nextUrl.searchParams.get("limit")) || 50, 100);
    const page = Math.max(Number(request.nextUrl.searchParams.get("page")) || 1, 1);

    const filter: Record<string, unknown> = {};
    if (ids?.length) {
      filter.payoutId = { $in: ids };
    }
    if (organizationSlug) {
      filter.organizationSlug = organizationSlug;
    }
    if (workflowStatus) {
      filter.workflowStatus = workflowStatus;
    }
    if (role === "creator" && actor) {
      filter.creator = actor;
    }
    if ((role === "recipient" || role === "viewer") && actor) {
      filter.recipient = actor;
    }
    if (query) {
      filter.$or = [
        { label: { $regex: query, $options: "i" } },
        { organizationName: { $regex: query, $options: "i" } },
        { teamName: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } },
        { reference: { $regex: query, $options: "i" } },
        { tags: { $elemMatch: { $regex: query, $options: "i" } } },
      ];
    }

    const rawItems = await collection
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
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

    await Promise.all(
      normalizedItems.map((item) =>
        writeActivityEvent({
          payoutId: item.payoutId ?? 0,
          actor: item.creator,
          action: "created",
          organizationSlug: item.organizationSlug,
          createdAt: now,
          eventKey: buildActivityEventKey(["created", item.metadataHash, item.payoutId]),
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
    const disclosureGrantsCollection = await getDisclosureGrantsCollection();
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

    await writeActivityEvent({
        payoutId: parsed.data.payoutId,
        actor: parsed.data.actor,
        action: parsed.data.action,
        organizationSlug: record.organizationSlug,
        note: parsed.data.note,
        target: parsed.data.target ?? parsed.data.addDisclosureViewer,
        createdAt: now,
        eventKey: buildActivityEventKey([
          parsed.data.action,
          parsed.data.payoutId,
          parsed.data.actor,
          parsed.data.target ?? parsed.data.addDisclosureViewer,
          parsed.data.note,
        ]),
      });

    if (parsed.data.addDisclosureViewer) {
      await disclosureGrantsCollection.updateOne(
        { payoutId: parsed.data.payoutId, viewer: parsed.data.addDisclosureViewer },
        {
          $set: disclosureGrantSchema.parse({
            payoutId: parsed.data.payoutId,
            organizationSlug: record.organizationSlug,
            grantedBy: parsed.data.actor,
            viewer: parsed.data.addDisclosureViewer,
            status: "active",
            note: parsed.data.note,
            expiresAt: undefined,
            revokedAt: undefined,
            revokeReason: undefined,
            grantedAt: now,
            updatedAt: now,
          }),
        },
        { upsert: true },
      );
    }

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
