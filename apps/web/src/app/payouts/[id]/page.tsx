"use client";

import { CalendarClock, Eye, ReceiptText, ShieldCheck, Sparkles } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { MotionFade, MotionItem, MotionStagger } from "@/components/motion";
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
      await runtime
        .updateWorkflow({
          payoutId,
          action: "revealed",
          note: "Amount revealed from payout detail view",
        })
        .catch(() => undefined);
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

  if (!item) {
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
        <div className="rounded-[1.8rem] border border-dashed border-[var(--border)] bg-[linear-gradient(145deg,rgba(255,255,255,0.7),rgba(238,251,248,0.84))] p-10 text-center text-[var(--muted)]">
          No live payout was found for this ID.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={`Payout detail #${payoutId}`}
      description="Inspect workflow state, reveal the encrypted amount, and review the full payout activity trail."
      icon={<ReceiptText className="size-5 text-[var(--accent-3)]" />}
      actions={
        <button
          className="rounded-full border border-[var(--border)] bg-[var(--panel-2)] px-4 py-2.5 text-sm text-[var(--foreground)]/80"
          onClick={() => Promise.all([refresh(), refreshActivity()])}
          type="button"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      }
    >
      <div className="space-y-6">
        <MotionFade delay={0.04}>
          <section className="rounded-[1.9rem] border border-[var(--border)] bg-[linear-gradient(145deg,rgba(255,255,255,0.92),rgba(236,251,248,0.86))] p-6 shadow-[var(--shadow-soft)]">
            <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/78 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-3)]">
                  <Sparkles className="size-3.5" />
                  Confidential payout record
                </div>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight">
                  {item.metadata?.label || `Payout #${item.summary.id}`}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                  Review the workflow state, recipient routing, approvals, and selective reveal status from one cleaner detail page.
                </p>
              </div>

              <MotionStagger className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                {[
                  { label: "Status", value: statusLabels[item.summary.status], icon: <ShieldCheck className="size-4 text-[var(--accent-3)]" /> },
                  { label: "Kind", value: entryKindLabels[item.summary.kind], icon: <ReceiptText className="size-4 text-[var(--accent-3)]" /> },
                  { label: "Due date", value: formatTimestamp(item.summary.dueDate), icon: <CalendarClock className="size-4 text-[var(--accent-3)]" /> },
                ].map((detail) => (
                  <MotionItem key={detail.label}>
                    <div className="rounded-[1.25rem] border border-[var(--border)] bg-white/82 px-4 py-4 shadow-[var(--shadow-card)]">
                      <div className="flex items-center justify-between text-sm text-[var(--muted)]">
                        <span>{detail.label}</span>
                        {detail.icon}
                      </div>
                      <p className="mt-3 text-lg font-semibold text-[var(--foreground)]">{detail.value}</p>
                    </div>
                  </MotionItem>
                ))}
              </MotionStagger>
            </div>
          </section>
        </MotionFade>

        <div className="grid gap-5 xl:grid-cols-[1.02fr,0.98fr]">
          <MotionFade delay={0.1}>
            <section className="rounded-[1.8rem] border border-[var(--border)] bg-white/84 p-6 shadow-[var(--shadow-card)]">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-3)]">Record metadata</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  { label: "Organization", value: item.metadata?.organizationName || "Not stored" },
                  { label: "Organization slug", value: item.metadata?.organizationSlug || "default-org" },
                  { label: "Team", value: item.metadata?.teamName || "Operations" },
                  { label: "Cost center", value: item.metadata?.costCenter || "Treasury" },
                  { label: "Workflow", value: item.metadata?.workflowStatus || "needs_review" },
                  { label: "Category", value: item.metadata?.category || "Not stored" },
                  { label: "Recipient", value: shortAddress(item.summary.recipient) },
                  { label: "Creator", value: shortAddress(item.summary.creator) },
                  { label: "Reviewer", value: shortAddress(item.metadata?.assignedReviewer) },
                  { label: "Approvals", value: `${item.metadata?.approvalCount ?? 0}/${item.metadata?.requiredApprovals ?? 1}` },
                  { label: "Reference", value: item.metadata?.reference || "Not provided" },
                ].map((detail) => (
                  <div key={detail.label} className="rounded-[1.15rem] border border-[var(--border)] bg-[var(--panel-3)] px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--accent-3)]">{detail.label}</p>
                    <p className="mt-2 text-sm text-[var(--foreground)]">{detail.value}</p>
                  </div>
                ))}
              </div>
            </section>
          </MotionFade>

          <MotionFade delay={0.14}>
            <section className="rounded-[1.8rem] border border-[var(--border)] bg-[linear-gradient(145deg,rgba(233,251,247,0.88),rgba(255,255,255,0.92))] p-6 shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-3">
                <Eye className="size-5 text-[var(--accent-3)]" />
                <div>
                  <p className="text-base font-semibold text-[var(--foreground)]">Confidential amount</p>
                  <p className="text-sm text-[var(--muted)]">
                    Reveal only when the permit allows it, then claim from this same view.
                  </p>
                </div>
              </div>
              <p className="mt-5 text-3xl font-semibold text-[var(--foreground)]">
                {revealedAmount || "Encrypted until permit-based reveal"}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  className="rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-2))] px-4 py-2.5 text-sm font-semibold text-[var(--ink)] shadow-[0_14px_30px_rgba(25,182,162,0.2)]"
                  onClick={() => reveal()}
                  type="button"
                >
                  {busyAction === "reveal" ? "Revealing..." : "Reveal amount"}
                </button>
                <button
                  className="rounded-full border border-[var(--border)] bg-white/82 px-4 py-2.5 text-sm text-[var(--foreground)]/80"
                  onClick={() => claim()}
                  type="button"
                >
                  {busyAction === "claim" ? "Claiming..." : "Claim payout"}
                </button>
              </div>

              <div className="mt-8">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-3)]">Activity trail</p>
                <div className="mt-4 space-y-3">
                  {activityItems.map((activity, index) => (
                    <div
                      key={`${activity.createdAt}-${activity.action}`}
                      className="flex gap-3 rounded-[1.2rem] border border-[var(--border)] bg-white/82 px-4 py-4"
                    >
                      <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent-4)] text-sm font-semibold text-[var(--accent-3)]">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-[var(--foreground)]">
                          {activity.action.replaceAll("_", " ")}
                        </p>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {shortAddress(activity.actor)} on {activity.createdAt.slice(0, 10)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </MotionFade>
        </div>
      </div>
    </AppShell>
  );
}
