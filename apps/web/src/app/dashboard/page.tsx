"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  ArrowUpRight,
  Banknote,
  BriefcaseBusiness,
  Clock3,
  Eye,
  ShieldCheck,
  Sparkles,
  Timer,
  Wallet,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { PayoutCards } from "@/components/payout-cards";
import { formatTokenAmount, formatTimestamp } from "@/lib/utils";
import { useRolePayoutFeed, useVeilPayRuntime } from "@/lib/use-veilpay";

export default function DashboardPage() {
  const runtime = useVeilPayRuntime();
  const { items, loading, refresh } = useRolePayoutFeed("creator");
  const [revealingId, setRevealingId] = useState<number | null>(null);
  const [revealedAmounts, setRevealedAmounts] = useState<Record<number, string>>({});

  const stats = useMemo(() => {
    const total = items.length;
    const pending = items.filter((item) => item.summary.status === 0).length;
    const claimed = items.filter((item) => item.summary.status === 1).length;
    const last = items[0]?.summary?.createdAt ?? 0;

    return {
      total,
      pending,
      claimed,
      lastActivity: last ? formatTimestamp(last) : "No activity yet",
    };
  }, [items]);

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
      title="Admin dashboard"
      description="Operate payroll, grants, invoices, and payout approvals from one privacy-first treasury workspace."
      icon={<Wallet className="size-5 text-[var(--accent-3)]" />}
      actions={
        <div className="flex flex-wrap gap-3">
          <Link
            className="rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-2))] px-4 py-2 text-sm font-semibold text-[var(--ink)] shadow-[0_12px_28px_rgba(24,183,161,0.22)]"
            href="/create"
          >
            New payout
          </Link>
          <Link
            className="rounded-full border border-[var(--border)] bg-white/80 px-4 py-2 text-sm text-[var(--foreground)]/80"
            href="/batch"
          >
            Batch payroll
          </Link>
          <button
            className="rounded-full border border-[var(--border)] bg-white/80 px-4 py-2 text-sm text-[var(--foreground)]/80"
            onClick={() => refresh()}
            type="button"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      }
    >
      <section className="overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(111,227,212,0.18))] p-6 shadow-[0_24px_60px_rgba(16,24,32,0.08)]">
        <div className="grid gap-6 xl:grid-cols-[1.3fr,0.9fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-3)]">
              <Sparkles className="size-3.5" />
              Treasury overview
            </div>
            <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl">
              Keep operational visibility high while keeping compensation data encrypted.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--foreground)]/72 sm:text-base">
              Admins can create live payouts, watch claim progress, and selectively disclose only what
              auditors need. Public rails show activity. VeilPay keeps the sensitive layer protected.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-2))] px-5 py-3 text-sm font-semibold text-[var(--ink)] shadow-[0_12px_28px_rgba(24,183,161,0.22)]"
                href="/create"
              >
                Launch confidential payout
                <ArrowRight className="size-4" />
              </Link>
              <Link
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/80 px-5 py-3 text-sm font-medium text-[var(--foreground)]"
                href="/disclosure"
              >
                Open auditor disclosure
              </Link>
            </div>
          </div>

          <div className="grid gap-3 rounded-[1.75rem] border border-[var(--border)] bg-white/70 p-4">
            {[
              {
                title: "What stays encrypted",
                body: "Amounts, allocations, and sensitive notes remain protected until an authorized reveal.",
              },
              {
                title: "What stays public",
                body: "Payout IDs, status, creator, timestamps, and minimal routing metadata for operations.",
              },
              {
                title: "Best next move",
                body: "Create one live payout, then share a permitted reveal with an auditor for the demo.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--panel)] p-4"
              >
                <p className="text-sm font-semibold text-[var(--foreground)]">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--foreground)]/68">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-4 lg:grid-cols-4">
        {[
          {
            label: "Total payouts",
            value: stats.total,
            icon: <Banknote className="size-4 text-[var(--accent-3)]" />,
          },
          {
            label: "Pending",
            value: stats.pending,
            icon: <Timer className="size-4 text-[var(--accent-2)]" />,
          },
          {
            label: "Claimed",
            value: stats.claimed,
            icon: <ShieldCheck className="size-4 text-[var(--accent)]" />,
          },
          {
            label: "Last activity",
            value: stats.lastActivity,
            icon: <ArrowUpRight className="size-4 text-[var(--accent-2)]" />,
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-[1.5rem] border border-[var(--border)] bg-white/85 p-4 shadow-[0_18px_40px_rgba(16,24,32,0.08)]"
          >
            <div className="flex items-center justify-between text-sm text-[var(--foreground)]/60">
              {card.label}
              {card.icon}
            </div>
            <div className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
              {card.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-4 xl:grid-cols-[1.15fr,0.95fr,0.9fr]">
        {[
          {
            eyebrow: "Operational posture",
            title: "Encrypted amounts with visible progress",
            body: "Status updates, creators, and timestamps remain available so teams can coordinate without revealing compensation data to the whole chain.",
            icon: <Eye className="size-5 text-[var(--accent-3)]" />,
          },
          {
            eyebrow: "Recommended flow",
            title: "Run the hackathon demo in three clicks",
            body: "Create a payout, reveal it as the recipient, then share permit-scoped details with an auditor to show selective disclosure in action.",
            icon: <BriefcaseBusiness className="size-5 text-[var(--accent-3)]" />,
          },
          {
            eyebrow: "Status guidance",
            title: "Move claims before their due date",
            body: "Use the inbox to verify recipient visibility and keep payouts from sitting in pending longer than planned.",
            icon: <Clock3 className="size-5 text-[var(--accent-3)]" />,
          },
        ].map((panel) => (
          <section
            key={panel.title}
            className="rounded-[1.6rem] border border-[var(--border)] bg-white/82 p-5 shadow-[0_18px_42px_rgba(16,24,32,0.08)]"
          >
            <div className="inline-flex size-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(24,183,161,0.16),rgba(111,227,212,0.28))]">
              {panel.icon}
            </div>
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent-3)]">
              {panel.eyebrow}
            </p>
            <h3 className="mt-3 text-xl font-semibold text-[var(--foreground)]">{panel.title}</h3>
            <p className="mt-3 text-sm leading-6 text-[var(--foreground)]/70">{panel.body}</p>
          </section>
        ))}
      </div>

      <div className="mt-8 grid gap-4 xl:grid-cols-[1.15fr,0.85fr]">
        <section className="rounded-[1.75rem] border border-[var(--border)] bg-[linear-gradient(135deg,rgba(233,247,244,0.95),rgba(255,255,255,0.9))] p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-3)]">
            Privacy posture
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-[var(--foreground)]">
            Built for real treasury workflows, not transparent salary leaks
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--foreground)]/72">
            VeilPay keeps payout amounts and payroll allocations encrypted while exposing only the minimum
            metadata needed for operations. Reveal amounts only when a permit allows it.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3 text-sm">
              Encrypted euint64 amounts
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3 text-sm">
              Permit-based disclosure
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3 text-sm">
              Auditor access control
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3 text-sm">
              Minimal public routing
            </div>
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-[var(--border)] bg-white/82 p-6 shadow-[0_18px_42px_rgba(16,24,32,0.08)]">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-3)]">
            Action stack
          </p>
          <div className="mt-4 space-y-3">
            {[
              { href: "/create", label: "Create a single confidential payout" },
              { href: "/batch", label: "Upload a batch payroll or grant run" },
              { href: "/disclosure", label: "Share permit-scoped access with an auditor" },
            ].map((item) => (
              <Link
                key={item.href}
                className="flex items-center justify-between rounded-[1.2rem] border border-[var(--border)] bg-[var(--panel)] px-4 py-4 text-sm font-medium text-[var(--foreground)] transition hover:-translate-y-0.5"
                href={item.href}
              >
                <span>{item.label}</span>
                <ArrowUpRight className="size-4 text-[var(--accent-3)]" />
              </Link>
            ))}
          </div>
          <div className="mt-5 rounded-[1.25rem] border border-[var(--border)] bg-[linear-gradient(135deg,rgba(24,183,161,0.12),rgba(111,227,212,0.12))] p-4 text-sm text-[var(--foreground)]/72">
            For the strongest judge flow, create one payout first so the inbox and disclosure pages show a live operational trail.
          </div>
        </section>
      </div>

      <div className="mt-10">
        <PayoutCards
          items={items}
          revealedAmounts={revealedAmounts}
          onReveal={handleReveal}
          revealingId={revealingId}
          emptyTitle="No live payouts yet"
          emptyBody="Connect the configured chain and create your first confidential payout or payroll batch."
        />
      </div>
    </AppShell>
  );
}
