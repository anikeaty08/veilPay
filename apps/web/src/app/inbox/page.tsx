"use client";

import { BellRing, CheckCircle2, Eye, RefreshCcw, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { MotionFade, MotionItem, MotionStagger } from "@/components/motion";
import { PayoutCards } from "@/components/payout-cards";
import { formatTokenAmount } from "@/lib/utils";
import { useLiveRefresh, useRolePayoutFeed, useVeilPayRuntime } from "@/lib/use-veilpay";

export default function InboxPage() {
  const runtime = useVeilPayRuntime();
  const { items, loading, refresh } = useRolePayoutFeed("recipient");
  const [revealingId, setRevealingId] = useState<number | null>(null);
  const [revealedAmounts, setRevealedAmounts] = useState<Record<number, string>>({});

  useLiveRefresh(async () => {
    await refresh();
  }, 12000);

  const stats = useMemo(
    () => ({
      total: items.length,
      revealed: Object.keys(revealedAmounts).length,
      claimable: items.filter((item) => item.summary.status === 0).length,
    }),
    [items, revealedAmounts],
  );

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
      await runtime
        .updateWorkflow({
          payoutId: item.summary.id,
          action: "revealed",
          note: "Recipient revealed confidential amount",
        })
        .catch(() => undefined);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to reveal amount");
    } finally {
      setRevealingId(null);
    }
  }

  async function claimPayout(payoutId: number) {
    try {
      await runtime.claimPayout(payoutId);
      toast.success(`Payout #${payoutId} claimed`);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to claim payout");
    }
  }

  return (
    <AppShell
      title="Recipient inbox"
      description="A cleaner private inbox for contributors, contractors, and recipients to reveal and claim confidential payouts."
      icon={<BellRing className="size-5 text-[var(--accent-3)]" />}
      actions={
        <button
          className="rounded-full border border-[var(--border)] bg-white/80 px-4 py-2.5 text-sm text-[var(--foreground)]/80"
          onClick={() => refresh()}
          type="button"
        >
          {loading ? "Refreshing..." : "Refresh inbox"}
        </button>
      }
    >
      <div className="space-y-6">
        <MotionFade delay={0.04}>
          <section className="rounded-[1.9rem] border border-[var(--border)] bg-[linear-gradient(145deg,rgba(255,255,255,0.92),rgba(234,250,246,0.84))] p-6 shadow-[var(--shadow-soft)]">
            <div className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/78 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-3)]">
                  <Wallet className="size-3.5" />
                  Private payout inbox
                </div>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight">
                  Reveal only what belongs to you, then claim it without exposing everyone else’s payout map.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                  This inbox keeps the recipient experience simple: reveal your own confidential amount, claim
                  the payout, and keep the rest of the treasury invisible.
                </p>
              </div>

              <MotionStagger className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                {[
                  ["Records in inbox", String(stats.total), <BellRing className="size-4 text-[var(--accent-3)]" key="a" />],
                  ["Amounts revealed", String(stats.revealed), <Eye className="size-4 text-[var(--accent-3)]" key="b" />],
                  ["Ready to claim", String(stats.claimable), <CheckCircle2 className="size-4 text-[var(--accent-3)]" key="c" />],
                ].map(([label, value, icon]) => (
                  <MotionItem key={label}>
                    <div className="rounded-[1.3rem] border border-[var(--border)] bg-white/82 px-4 py-4 shadow-[var(--shadow-card)]">
                      <div className="flex items-center justify-between text-sm text-[var(--muted)]">
                        <span>{label}</span>
                        {icon}
                      </div>
                      <p className="mt-3 text-2xl font-semibold text-[var(--foreground)]">{value}</p>
                    </div>
                  </MotionItem>
                ))}
              </MotionStagger>
            </div>
          </section>
        </MotionFade>

        <div className="grid gap-5 xl:grid-cols-[1.18fr,0.82fr]">
          <MotionFade delay={0.1}>
            <section>
              <PayoutCards
                items={items}
                revealedAmounts={revealedAmounts}
                onReveal={handleReveal}
                revealingId={revealingId}
                emptyTitle="Inbox is empty"
                emptyBody="No live payouts are currently routed to this connected address."
                footerAction={(item) => (
                  <button
                    className="rounded-full border border-[var(--border)] bg-[var(--panel-2)] px-4 py-2 text-sm text-[var(--foreground)]/80"
                    onClick={() => claimPayout(item.summary.id)}
                    type="button"
                  >
                    Claim payout
                  </button>
                )}
              />
            </section>
          </MotionFade>

          <div className="space-y-5">
            <MotionFade delay={0.14}>
              <section className="rounded-[1.7rem] border border-[var(--border)] bg-white/84 p-6 shadow-[var(--shadow-card)]">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-3)]">How it works</p>
                <div className="mt-4 space-y-3">
                  {[
                    "Open the payout card that belongs to your connected wallet.",
                    "Use reveal to decrypt only your own permitted amount.",
                    "Claim the payout once the workflow is ready.",
                  ].map((item, index) => (
                    <div key={item} className="flex gap-3 rounded-[1.2rem] border border-[var(--border)] bg-[var(--panel-3)] px-4 py-4">
                      <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent-4)] text-sm font-semibold text-[var(--accent-3)]">
                        {index + 1}
                      </span>
                      <p className="text-sm leading-6 text-[var(--muted)]">{item}</p>
                    </div>
                  ))}
                </div>
              </section>
            </MotionFade>

            <MotionFade delay={0.18}>
              <section className="rounded-[1.7rem] border border-[var(--border)] bg-[linear-gradient(145deg,rgba(25,182,162,0.12),rgba(255,255,255,0.86))] p-6 shadow-[var(--shadow-card)]">
                <div className="flex items-center gap-3">
                  <RefreshCcw className="size-5 text-[var(--accent-3)]" />
                  <div>
                    <p className="text-base font-semibold text-[var(--foreground)]">Live refresh</p>
                    <p className="text-sm text-[var(--muted)]">The inbox automatically refreshes every few seconds.</p>
                  </div>
                </div>
                <div className="mt-4 rounded-[1.2rem] border border-[var(--border)] bg-white/82 px-4 py-4 text-sm leading-6 text-[var(--muted)]">
                  Use manual refresh if you expect a new record right after an admin creates it or after you claim.
                </div>
              </section>
            </MotionFade>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
