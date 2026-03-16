"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { entryKindLabels, statusLabels } from "@/lib/contracts/veilpay";
import { formatTimestamp, formatTokenAmount, shortAddress } from "@/lib/utils";
import { usePayoutDetail, useVeilPayRuntime } from "@/lib/use-veilpay";

export default function PayoutDetailPage() {
  const params = useParams<{ id: string }>();
  const payoutId = Number(params.id);
  const runtime = useVeilPayRuntime();
  const { item, loading, refresh } = usePayoutDetail(payoutId);
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
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to claim payout");
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <AppShell
      title={`Payout detail #${payoutId}`}
      description="Inspect the live payout record, reveal its encrypted amount with a permit, and claim it if you are the recipient."
      icon={<span className="text-[var(--accent-3)]">▣</span>}
      actions={
        <button
          className="rounded-full border border-[var(--border)] bg-[var(--panel-2)] px-4 py-2 text-sm text-[var(--foreground)]/80"
          onClick={() => refresh()}
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
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel)] p-5">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              {item.metadata?.label || `Payout #${item.summary.id}`}
            </h2>
            <div className="mt-4 space-y-3 text-sm text-[var(--foreground)]/75">
              <p>Organization: {item.metadata?.organizationName || "Not stored"}</p>
              <p>Kind: {entryKindLabels[item.summary.kind]}</p>
              <p>Status: {statusLabels[item.summary.status]}</p>
              <p>Category: {item.metadata?.category || "Not stored"}</p>
              <p>Due date: {formatTimestamp(item.summary.dueDate)}</p>
              <p>Recipient: {shortAddress(item.summary.recipient)}</p>
              <p>Creator: {shortAddress(item.summary.creator)}</p>
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
          </section>
        </div>
      )}
    </AppShell>
  );
}
