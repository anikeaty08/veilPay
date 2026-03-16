import { payoutActivitySchema, type PayoutActivity } from "@/lib/metadata";
import { getActivityCollection } from "@/lib/mongodb";

export function buildActivityEventKey(parts: Array<string | number | undefined>) {
  return parts
    .filter((value) => value !== undefined && value !== null && value !== "")
    .join(":");
}

export async function writeActivityEvent(activity: Omit<PayoutActivity, "createdAt"> & { createdAt?: string }) {
  const collection = await getActivityCollection();
  const payload = payoutActivitySchema.parse({
    ...activity,
    createdAt: activity.createdAt ?? new Date().toISOString(),
  });

  if (payload.eventKey) {
    await collection.updateOne(
      { eventKey: payload.eventKey },
      {
        $setOnInsert: payload,
      },
      { upsert: true },
    );
    return;
  }

  await collection.insertOne(payload);
}
