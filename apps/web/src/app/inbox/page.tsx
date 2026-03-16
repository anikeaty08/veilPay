"use client";

import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { PayoutCards } from "@/components/payout-cards";
import { formatTokenAmount } from "@/lib/utils";
import { useRolePayoutFeed, useVeilPayRuntime } from "@/lib/use-veilpay";

export default function InboxPage() {
  const runtime = useVeilPayRuntime();
  const { items, loading, refresh } = useRolePayoutFeed("recipient");
  const [revealingId, setRevealingId] = useState<number | null>(null);
  const [revealedAmounts, setRevealedAmounts] = useState<Record<number, string>>({});

  async function handleReveal(item: (typeof items)[number]) {
    try {
      setRevealingId(item.summary.id);
      const value = await runtime.revealAmount(item.summary.amountHandle);
      setRevealedAmounts((current) => ({
        ...current,
        [item.summary.id]: formatTokenAmount(
          value,
          item.metadata?.tokenDecimals ?? 6,
          item.metadata?.currencySymbol ?? "USDC",
        ),
      }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to reveal amount");
    } finally {
      setRevealingId(null);
    }
  }

  return (
    <AppShell
      title="Recipient inbox"
      description="Recipients can reveal and claim their confidential payouts with permit-based access."
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
      <PayoutCards
        items={items}
        revealedAmounts={revealedAmounts}
        onReveal={handleReveal}
        revealingId={revealingId}
        emptyTitle="Inbox is empty"
        emptyBody="No live payouts are currently routed to this connected address."
      />
    </AppShell>
  );
}
