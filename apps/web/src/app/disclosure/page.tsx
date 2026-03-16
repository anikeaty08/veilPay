"use client";

import { Eye, Files, KeyRound, ShieldCheck, UserRoundSearch } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Address } from "viem";

import { AppShell } from "@/components/app-shell";
import { MotionFade, MotionItem, MotionStagger } from "@/components/motion";
import { PayoutCards } from "@/components/payout-cards";
import { formatTokenAmount } from "@/lib/utils";
import {
  useActivityFeed,
  useLiveRefresh,
  useRolePayoutFeed,
  useVeilPayRuntime,
} from "@/lib/use-veilpay";

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
      await runtime
        .updateWorkflow({
          payoutId: item.summary.id,
          action: "revealed",
          note: "Auditor revealed permitted amount",
        })
        .catch(() => undefined);
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

  const disclosureActivity = activityItems
    .filter((item) => item.action === "shared_disclosure" || item.action === "revealed")
    .slice(0, 6);

  return (
    <AppShell
      title="Auditor disclosure"
      description="Grant record-level payout visibility to auditors and accountants without exposing the full treasury onchain."
      icon={<Files className="size-5 text-[var(--accent-3)]" />}
    >
      <div className="space-y-6">
        <MotionFade delay={0.04}>
          <section className="rounded-[1.9rem] border border-[var(--border)] bg-[linear-gradient(145deg,rgba(255,255,255,0.92),rgba(236,251,248,0.86))] p-6 shadow-[var(--shadow-soft)]">
            <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/78 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-3)]">
                  <ShieldCheck className="size-3.5" />
                  Selective disclosure controls
                </div>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight">
                  Share exactly what an auditor needs, and nothing more.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                  Disclosure in VeilPay is scoped to payout records. Operations stay coordinated, but
                  sensitive amounts are only revealed when a permitted wallet opens them.
                </p>
              </div>
              <MotionStagger className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                {[
                  {
                    label: "Creator records",
                    value: String(creatorFeed.items.length),
                    icon: <Files className="size-4 text-[var(--accent-3)]" />,
                  },
                  {
                    label: "Viewer records",
                    value: String(viewerFeed.items.length),
                    icon: <Eye className="size-4 text-[var(--accent-3)]" />,
                  },
                  {
                    label: "Disclosure events",
                    value: String(disclosureActivity.length),
                    icon: <KeyRound className="size-4 text-[var(--accent-3)]" />,
                  },
                ].map((item) => (
                  <MotionItem key={item.label}>
                    <div className="rounded-[1.25rem] border border-[var(--border)] bg-white/82 px-4 py-4 shadow-[var(--shadow-card)]">
                      <div className="flex items-center justify-between text-sm text-[var(--muted)]">
                        <span>{item.label}</span>
                        {item.icon}
                      </div>
                      <p className="mt-3 text-2xl font-semibold text-[var(--foreground)]">{item.value}</p>
                    </div>
                  </MotionItem>
                ))}
              </MotionStagger>
            </div>
          </section>
        </MotionFade>

        <div className="grid gap-5 xl:grid-cols-[0.92fr,1.08fr]">
          <MotionFade delay={0.1}>
            <section className="rounded-[1.8rem] border border-[var(--border)] bg-white/84 p-6 shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-3">
                <UserRoundSearch className="size-5 text-[var(--accent-3)]" />
                <div>
                  <p className="text-base font-semibold text-[var(--foreground)]">Auditor wallet</p>
                  <p className="text-sm text-[var(--muted)]">
                    Enter the wallet that should receive access to selected payout records.
                  </p>
                </div>
              </div>
              <input
                className="mt-4 w-full rounded-[1.2rem] border border-[var(--border)] bg-[var(--panel-2)] px-4 py-3 text-sm outline-none placeholder:text-[var(--foreground)]/35"
                onChange={(event) => setAuditorAddress(event.target.value)}
                placeholder="0x..."
                value={auditorAddress}
              />
              <div className="mt-4 rounded-[1.15rem] border border-[var(--border)] bg-[linear-gradient(145deg,rgba(233,251,247,0.9),rgba(255,255,255,0.86))] px-4 py-4 text-sm leading-6 text-[var(--muted)]">
                Shares are scoped to specific payout records and logged into the treasury activity stream.
                Active role:{" "}
                <span className="font-semibold text-[var(--foreground)]">{runtime.workspace.profile.role}</span>
              </div>
            </section>
          </MotionFade>

          <MotionFade delay={0.14}>
            <section className="rounded-[1.8rem] border border-[var(--border)] bg-white/84 p-6 shadow-[var(--shadow-card)]">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-3)]">Disclosure activity</p>
              <div className="mt-4 space-y-3">
                {disclosureActivity.map((item, index) => (
                  <div
                    key={`${item.payoutId}-${item.createdAt}-${item.action}`}
                    className="flex gap-3 rounded-[1.2rem] border border-[var(--border)] bg-[var(--panel-3)] px-4 py-4"
                  >
                    <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent-4)] text-sm font-semibold text-[var(--accent-3)]">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[var(--foreground)]">
                        #{item.payoutId} {item.action.replaceAll("_", " ")}
                      </p>
                      <p className="mt-1 text-sm text-[var(--muted)]">{item.createdAt.slice(0, 10)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </MotionFade>
        </div>

        <MotionFade delay={0.18}>
          <section>
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-[var(--foreground)]">Grant access from creator records</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Choose the payouts this auditor can inspect. Nothing outside those records is shared.
              </p>
            </div>
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
          </section>
        </MotionFade>

        <MotionFade delay={0.22}>
          <section>
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-[var(--foreground)]">Auditor view</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Once a creator grants access, those permitted payout records appear here for reveal.
              </p>
            </div>
            <PayoutCards
              items={viewerFeed.items}
              revealedAmounts={revealedAmounts}
              onReveal={handleReveal}
              revealingId={revealingId}
              emptyTitle="No viewer access yet"
              emptyBody="Once a creator grants access, those payout records will appear here for the connected auditor wallet."
            />
          </section>
        </MotionFade>
      </div>
    </AppShell>
  );
}
