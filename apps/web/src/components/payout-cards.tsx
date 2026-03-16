"use client";

import Link from "next/link";
import { CircleDollarSign, FileClock, ShieldCheck, Users } from "lucide-react";

import { entryKindLabels, statusLabels, type PayoutRecord } from "@/lib/contracts/veilpay";
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
      <div className="rounded-[1.5rem] border border-dashed border-white/15 bg-black/20 p-8 text-center">
        <h3 className="text-lg font-semibold text-white">{emptyTitle}</h3>
        <p className="mt-2 text-sm text-white/70">{emptyBody}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {items.map((item) => (
        <article
          key={item.summary.id}
          className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel)] p-5 shadow-[0_16px_30px_rgba(16,24,32,0.08)]"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--accent)]">
                {item.metadata?.organizationName || "Organization"}
              </p>
              <h3 className="mt-2 text-xl font-semibold text-white">
                {item.metadata?.label || `Payout #${item.summary.id}`}
              </h3>
            </div>
            <span className="rounded-full border border-[var(--border)] bg-[var(--panel-2)] px-3 py-1 text-xs text-[var(--foreground)]/70">
              {statusLabels[item.summary.status]}
            </span>
          </div>

          <div className="mt-4 grid gap-3 text-sm text-[var(--foreground)]/70 sm:grid-cols-2">
            <div>
              <p className="text-[var(--foreground)]/50">Category</p>
              <p className="mt-1">{item.metadata?.category || entryKindLabels[item.summary.kind]}</p>
            </div>
            <div>
              <p className="text-[var(--foreground)]/50">Due date</p>
              <p className="mt-1">{formatTimestamp(item.summary.dueDate)}</p>
            </div>
            <div>
              <p className="text-[var(--foreground)]/50">Amount</p>
              <p className="mt-1 text-[var(--foreground)]">
                {revealedAmounts[item.summary.id] || "Encrypted until permit-based reveal"}
              </p>
            </div>
            <div>
              <p className="text-[var(--foreground)]/50">Record</p>
              <p className="mt-1">#{item.summary.id}</p>
            </div>
            <div>
              <p className="text-[var(--foreground)]/50">Workflow</p>
              <p className="mt-1">{item.metadata?.workflowStatus || "needs_review"}</p>
            </div>
            <div>
              <p className="text-[var(--foreground)]/50">Approvals</p>
              <p className="mt-1">
                {(item.metadata?.approvalCount ?? 0)}/{item.metadata?.requiredApprovals ?? 1}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--panel-2)] px-3 py-1 text-xs text-[var(--foreground)]/70">
              <ShieldCheck className="size-3 text-[var(--accent-2)]" />
              Encrypted amount
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--panel-2)] px-3 py-1 text-xs text-[var(--foreground)]/70">
              <FileClock className="size-3 text-[var(--accent)]" />
              Permit-based reveal
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--panel-2)] px-3 py-1 text-xs text-[var(--foreground)]/70">
              <CircleDollarSign className="size-3 text-[var(--accent-3)]" />
              {entryKindLabels[item.summary.kind]}
            </span>
            {item.metadata?.teamName ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--panel-2)] px-3 py-1 text-xs text-[var(--foreground)]/70">
                <Users className="size-3 text-[var(--accent-3)]" />
                {item.metadata.teamName}
              </span>
            ) : null}
            {item.metadata?.tags?.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full border border-[var(--border)] bg-white/80 px-3 py-1 text-xs text-[var(--foreground)]/70"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              className="rounded-full border border-[var(--border)] bg-[var(--panel-2)] px-4 py-2 text-sm text-[var(--foreground)] transition hover:border-[var(--foreground)]/30"
              href={`/payouts/${item.summary.id}`}
            >
              View detail
            </Link>
            {onReveal ? (
              <button
                className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:brightness-110"
                onClick={() => onReveal(item)}
                type="button"
              >
                {revealingId === item.summary.id ? "Revealing..." : "Reveal amount"}
              </button>
            ) : null}
            {footerAction ? footerAction(item) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
