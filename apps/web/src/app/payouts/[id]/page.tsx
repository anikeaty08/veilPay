"use client";

import { ReceiptText } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { entryKindLabels, statusLabels } from "@/lib/contracts/veilpay";
import { formatTimestamp, formatTokenAmount, shortAddress } from "@/lib/utils";
import { useActivityFeed, usePayoutDetail, useVeilPayRuntime } from "@/lib/use-veilpay";

export default function PayoutDetailPage() {
  const params = useParams<{ id: string }>();
  const payoutId = Number(params.id);
  const runtime = useVeilPayRuntime();
  const { item, loading, refresh } = usePayoutDetail(payoutId);
  const { items: activityItems, refresh: refreshActivity } = useActivityFeed(undefined, payoutId);
  const [revealedAmount, setRevealedAmount] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<"reveal" | "claim" | null>(null);

  async function reveal() {
    if (!item) return;
    try {
      setBusyAction("reveal");
      const value = await runtime.revealAmount(item.summary.amountHandle);
      setRevealedAmount(
        formatTokenAmount(
          value,
          item.metadata?.tokenDecimals ?? 6,
          item.metadata?.currencySymbol ?? "USDC",
        ),
      );
      await runtime.updateWorkflow({
        payoutId,
        action: "revealed",
        note: "Amount revealed from payout detail view",
      }).catch(() => undefined);
      await refreshActivity();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to reveal amount");
    } finally {
      setBusyAction(null);
    }
  }

  async function claim() {
    try {
      setBusyAction("claim");
      await runtime.claimPayout(payoutId);
      toast.success(`Payout #${payoutId} claimed`);
      await Promise.all([refresh(), refreshActivity()]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to claim payout");
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <AppShell
      title={`Payout detail #${payoutId}`}
      description="Inspect workflow state, reveal the encrypted amount, and review the full payout activity trail."
      icon={<ReceiptText className="size-5 text-[var(--accent-3)]" />}
      actions={
        <button
          className="rounded-full border border-[var(--border)] bg-[var(--panel-2)] px-4 py-2 text-sm text-[var(--foreground)]/80"
          onClick={() => Promise.all([refresh(), refreshActivity()])}
          type="button"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      }
    >
      {!item ? (
        <div className="rounded-[1.5rem] border border-dashed border-[var(--border)] bg-[var(--panel-2)] p-8 text-center text-[var(--foreground)]/70">
          No live payout was found for this ID.
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1fr,0.9fr]">
          <section className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel)] p-5">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              {item.metadata?.label || `Payout #${item.summary.id}`}
            </h2>
            <div className="mt-4 grid gap-3 text-sm text-[var(--foreground)]/75 sm:grid-cols-2">
              <p>Organization: {item.metadata?.organizationName || "Not stored"}</p>
              <p>Organization slug: {item.metadata?.organizationSlug || "default-org"}</p>
              <p>Team: {item.metadata?.teamName || "Operations"}</p>
              <p>Cost center: {item.metadata?.costCenter || "Treasury"}</p>
              <p>Kind: {entryKindLabels[item.summary.kind]}</p>
              <p>Status: {statusLabels[item.summary.status]}</p>
              <p>Workflow: {item.metadata?.workflowStatus || "needs_review"}</p>
              <p>Category: {item.metadata?.category || "Not stored"}</p>
              <p>Due date: {formatTimestamp(item.summary.dueDate)}</p>
              <p>Recipient: {shortAddress(item.summary.recipient)}</p>
              <p>Creator: {shortAddress(item.summary.creator)}</p>
              <p>Reviewer: {shortAddress(item.metadata?.assignedReviewer)}</p>
              <p>Approvals: {(item.metadata?.approvalCount ?? 0)}/{item.metadata?.requiredApprovals ?? 1}</p>
              <p>Reference: {item.metadata?.reference || "Not provided"}</p>
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel-2)] p-5">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Confidential amount</h2>
            <p className="mt-4 text-2xl font-semibold text-[var(--foreground)]">
              {revealedAmount || "Encrypted until permit-based reveal"}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--ink)]"
                onClick={() => reveal()}
                type="button"
              >
                {busyAction === "reveal" ? "Revealing..." : "Reveal amount"}
              </button>
              <button
                className="rounded-full border border-[var(--border)] bg-[var(--panel)] px-4 py-2 text-sm text-[var(--foreground)]/80"
                onClick={() => claim()}
                type="button"
              >
                {busyAction === "claim" ? "Claiming..." : "Claim payout"}
              </button>
            </div>

            <div className="mt-8">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-3)]">Activity trail</p>
              <div className="mt-4 space-y-3">
                {activityItems.map((activity) => (
                  <div
                    key={`${activity.createdAt}-${activity.action}`}
                    className="rounded-[1.2rem] border border-[var(--border)] bg-white/80 px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      {activity.action.replaceAll("_", " ")}
                    </p>
                    <p className="mt-1 text-sm text-[var(--foreground)]/68">
                      {shortAddress(activity.actor)} on {activity.createdAt.slice(0, 10)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
}
