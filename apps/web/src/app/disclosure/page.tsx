"use client";

import { Files } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Address } from "viem";

import { AppShell } from "@/components/app-shell";
import { PayoutCards } from "@/components/payout-cards";
import { formatTokenAmount } from "@/lib/utils";
import { useActivityFeed, useLiveRefresh, useRolePayoutFeed, useVeilPayRuntime } from "@/lib/use-veilpay";

export default function DisclosurePage() {
  const runtime = useVeilPayRuntime();
  const creatorFeed = useRolePayoutFeed("creator");
  const viewerFeed = useRolePayoutFeed("viewer");
  const { items: activityItems, refresh: refreshActivity } = useActivityFeed(
    runtime.workspace.profile.organizationSlug,
  );
  const [auditorAddress, setAuditorAddress] = useState("");
  const [revealingId, setRevealingId] = useState<number | null>(null);
  const [revealedAmounts, setRevealedAmounts] = useState<Record<number, string>>({});
  const [grantingId, setGrantingId] = useState<number | null>(null);

  useLiveRefresh(async () => {
    await Promise.all([creatorFeed.refresh(), viewerFeed.refresh(), refreshActivity()]);
  }, 15000);

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
      await runtime.updateWorkflow({
        payoutId: item.summary.id,
        action: "revealed",
        note: "Auditor revealed permitted amount",
      }).catch(() => undefined);
      await refreshActivity();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to reveal amount");
    } finally {
      setRevealingId(null);
    }
  }

  async function grantAccess(payoutId: number) {
    if (!runtime.workspace.permissions.canShareDisclosure) {
      toast.error("This workspace role cannot share disclosure access.");
      return;
    }

    try {
      setGrantingId(payoutId);
      await runtime.grantAccess(payoutId, auditorAddress as Address);
      toast.success(`Granted disclosure access for payout #${payoutId}`);
      await Promise.all([creatorFeed.refresh(), viewerFeed.refresh(), refreshActivity()]);
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
      icon={<Files className="size-5 text-[var(--accent-3)]" />}
    >
      <div className="grid gap-4 xl:grid-cols-[1fr,0.85fr]">
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
          <p className="mt-4 text-sm text-[var(--foreground)]/68">
            Shares are scoped to specific payout records and logged in the treasury activity stream.
          </p>
          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[var(--accent-3)]">
            Active role: {runtime.workspace.profile.role}
          </p>
        </div>

        <section className="rounded-[1.5rem] border border-[var(--border)] bg-white/82 p-5 shadow-[0_18px_42px_rgba(16,24,32,0.08)]">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-3)]">Disclosure activity</p>
          <div className="mt-4 space-y-3">
            {activityItems
              .filter((item) => item.action === "shared_disclosure" || item.action === "revealed")
              .slice(0, 6)
              .map((item) => (
                <div
                  key={`${item.payoutId}-${item.createdAt}-${item.action}`}
                  className="rounded-[1.2rem] border border-[var(--border)] bg-[var(--panel)] px-4 py-3"
                >
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    #{item.payoutId} {item.action.replaceAll("_", " ")}
                  </p>
                  <p className="mt-1 text-sm text-[var(--foreground)]/68">{item.createdAt.slice(0, 10)}</p>
                </div>
              ))}
          </div>
        </section>
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
              disabled={!auditorAddress || !runtime.workspace.permissions.canShareDisclosure}
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
