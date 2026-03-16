"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Address } from "viem";

import { AppShell } from "@/components/app-shell";
import { PayoutCards } from "@/components/payout-cards";
import { formatTokenAmount } from "@/lib/utils";
import { useRolePayoutFeed, useVeilPayRuntime } from "@/lib/use-veilpay";

export default function DisclosurePage() {
  const runtime = useVeilPayRuntime();
  const creatorFeed = useRolePayoutFeed("creator");
  const viewerFeed = useRolePayoutFeed("viewer");
  const [auditorAddress, setAuditorAddress] = useState("");
  const [revealingId, setRevealingId] = useState<number | null>(null);
  const [revealedAmounts, setRevealedAmounts] = useState<Record<number, string>>({});
  const [grantingId, setGrantingId] = useState<number | null>(null);

  async function handleReveal(item: (typeof viewerFeed.items)[number]) {
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

  async function grantAccess(payoutId: number) {
    try {
      setGrantingId(payoutId);
      await runtime.grantAccess(payoutId, auditorAddress as Address);
      toast.success(`Granted disclosure access for payout #${payoutId}`);
      await Promise.all([creatorFeed.refresh(), viewerFeed.refresh()]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to grant access");
    } finally {
      setGrantingId(null);
    }
  }

  return (
    <AppShell
      title="Auditor disclosure"
      description="Grant selective payout visibility to an auditor or accountant without publishing every amount to the whole chain."
      icon={<span className="text-[var(--accent-3)]">▣</span>}
    >
      <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel)] p-5">
        <label className="text-sm font-medium text-[var(--foreground)]" htmlFor="auditor">
          Auditor wallet
        </label>
        <input
          className="mt-3 w-full rounded-2xl border border-[var(--border)] bg-[var(--panel-2)] px-4 py-3 text-sm outline-none placeholder:text-[var(--foreground)]/35"
          id="auditor"
          onChange={(event) => setAuditorAddress(event.target.value)}
          placeholder="0x..."
          value={auditorAddress}
        />
      </div>

      <div className="mt-6">
        <PayoutCards
          items={creatorFeed.items}
          revealedAmounts={{}}
          emptyTitle="No creator payouts available"
          emptyBody="Create live payouts before sharing selective disclosure access."
          footerAction={(item) => (
            <button
              className="rounded-full border border-[var(--border)] bg-[var(--panel-2)] px-4 py-2 text-sm text-[var(--foreground)]/80"
              disabled={!auditorAddress}
              onClick={() => grantAccess(item.summary.id)}
              type="button"
            >
              {grantingId === item.summary.id ? "Granting..." : "Grant auditor access"}
            </button>
          )}
        />
      </div>

      <div className="mt-10">
        <PayoutCards
          items={viewerFeed.items}
          revealedAmounts={revealedAmounts}
          onReveal={handleReveal}
          revealingId={revealingId}
          emptyTitle="No viewer access yet"
          emptyBody="Once a creator grants access, those payout records will appear here for the connected auditor wallet."
        />
      </div>
    </AppShell>
  );
}
