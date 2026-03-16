"use client";

import Link from "next/link";
import { CircleDollarSign, FileClock, ShieldCheck, Users } from "lucide-react";

import { entryKindLabels, statusLabels, type PayoutRecord } from "@/lib/contracts/veilpay";
import { MotionItem, MotionStagger } from "@/components/motion";
import { formatTimestamp } from "@/lib/utils";

export function PayoutCards({
  items,
  revealedAmounts,
  onReveal,
  revealingId,
  emptyTitle,
  emptyBody,
  footerAction,
}: {
  items: PayoutRecord[];
  revealedAmounts: Record<number, string>;
  onReveal?: (item: PayoutRecord) => void;
  revealingId?: number | null;
  emptyTitle: string;
  emptyBody: string;
  footerAction?: (item: PayoutRecord) => React.ReactNode;
}) {
  if (!items.length) {
    return (
      <div className="rounded-[1.8rem] border border-dashed border-[var(--border-strong)] bg-[linear-gradient(145deg,rgba(255,255,255,0.65),rgba(238,251,248,0.84))] p-10 text-center">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">{emptyTitle}</h3>
        <p className="mt-2 text-sm text-[var(--muted)]">{emptyBody}</p>
      </div>
    );
  }

  return (
    <MotionStagger className="grid gap-4 lg:grid-cols-2">
      {items.map((item) => (
        <MotionItem key={item.summary.id}>
          <article className="rounded-[1.6rem] border border-[var(--border)] bg-[linear-gradient(145deg,rgba(255,255,255,0.92),rgba(246,253,252,0.88))] p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--accent-3)]">
                  {item.metadata?.organizationName || "Organization"}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
                  {item.metadata?.label || `Payout #${item.summary.id}`}
                </h3>
              </div>
              <span className="rounded-full border border-[var(--border)] bg-[var(--accent-4)] px-3 py-1 text-xs font-medium text-[var(--foreground)]/75">
                {statusLabels[item.summary.status]}
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                ["Category", item.metadata?.category || entryKindLabels[item.summary.kind]],
                ["Due date", formatTimestamp(item.summary.dueDate)],
                ["Amount", revealedAmounts[item.summary.id] || "Encrypted until permit-based reveal"],
                ["Record", `#${item.summary.id}`],
                ["Workflow", item.metadata?.workflowStatus || "needs_review"],
                ["Approvals", `${item.metadata?.approvalCount ?? 0}/${item.metadata?.requiredApprovals ?? 1}`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[1.1rem] border border-[var(--border)] bg-white/72 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-[var(--foreground)]/48">{label}</p>
                  <p className="mt-2 text-sm font-medium text-[var(--foreground)]">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--panel-2)] px-3 py-1 text-xs text-[var(--foreground)]/74">
                <ShieldCheck className="size-3 text-[var(--accent-2)]" />
                Encrypted amount
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--panel-2)] px-3 py-1 text-xs text-[var(--foreground)]/74">
                <FileClock className="size-3 text-[var(--accent)]" />
                Permit-based reveal
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--panel-2)] px-3 py-1 text-xs text-[var(--foreground)]/74">
                <CircleDollarSign className="size-3 text-[var(--accent-3)]" />
                {entryKindLabels[item.summary.kind]}
              </span>
              {item.metadata?.teamName ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--panel-2)] px-3 py-1 text-xs text-[var(--foreground)]/74">
                  <Users className="size-3 text-[var(--accent-3)]" />
                  {item.metadata.teamName}
                </span>
              ) : null}
              {item.metadata?.tags?.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full border border-[var(--border)] bg-white/80 px-3 py-1 text-xs text-[var(--foreground)]/74"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                className="rounded-full border border-[var(--border)] bg-white/80 px-4 py-2 text-sm text-[var(--foreground)] transition hover:border-[var(--foreground)]/30"
                href={`/payouts/${item.summary.id}`}
              >
                View detail
              </Link>
              {onReveal ? (
                <button
                  className="rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-2))] px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:brightness-105"
                  onClick={() => onReveal(item)}
                  type="button"
                >
                  {revealingId === item.summary.id ? "Revealing..." : "Reveal amount"}
                </button>
              ) : null}
              {footerAction ? footerAction(item) : null}
            </div>
          </article>
        </MotionItem>
      ))}
    </MotionStagger>
  );
}
