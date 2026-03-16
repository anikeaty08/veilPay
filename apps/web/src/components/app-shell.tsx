"use client";

import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Files,
  Grid2X2,
  ReceiptText,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { usePathname } from "next/navigation";

import { MotionFade } from "@/components/motion";
import { WalletButton } from "@/components/wallet-button";
import { VeilPayLogo } from "@/components/logo";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: Grid2X2 },
  { href: "/create", label: "Create payout", icon: Wallet },
  { href: "/batch", label: "Batch payroll", icon: Building2 },
  { href: "/inbox", label: "Recipient inbox", icon: ReceiptText },
  { href: "/disclosure", label: "Auditor disclosure", icon: Files },
  { href: "/settings", label: "Settings", icon: ShieldCheck },
];

export function AppShell({
  title,
  description,
  children,
  actions,
  icon,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="veil-grid min-h-screen text-[var(--foreground)]">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <MotionFade delay={0.02}>
          <header className="sticky top-4 z-30 mb-8">
            <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/72 backdrop-blur-2xl shadow-[var(--shadow-soft)]">
              <div className="flex flex-col gap-5 px-4 py-4 lg:px-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex flex-col gap-3">
                    <Link
                      className="inline-flex items-center gap-3 text-lg font-semibold tracking-tight text-[var(--foreground)]"
                      href="/"
                    >
                      <VeilPayLogo size={44} />
                      <span className="flex flex-col leading-none">
                        <span className="text-lg font-semibold">VeilPay</span>
                        <span className="text-xs font-medium uppercase tracking-[0.24em] text-[var(--accent-3)]">
                          Confidential treasury OS
                        </span>
                      </span>
                    </Link>
                    <p className="max-w-2xl text-sm text-[var(--muted)]">
                      Confidential payouts, payroll, and treasury operations on EVM using FHE.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/88 px-4 py-2.5 text-sm font-medium text-[var(--foreground)] shadow-[var(--shadow-card)] transition hover:-translate-y-0.5"
                      href="/create"
                    >
                      Launch payout
                      <ArrowRight className="size-4" />
                    </Link>
                    <WalletButton />
                  </div>
                </div>

                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <nav className="flex flex-wrap gap-2">
                    {navigation.map((item) => {
                      const active = pathname.startsWith(item.href);
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.href}
                          className={
                            active
                              ? "inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-2))] px-4 py-2.5 text-sm font-semibold text-[var(--ink)] shadow-[0_14px_28px_rgba(25,182,162,0.2)]"
                              : "inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/78 px-4 py-2.5 text-sm font-medium text-[var(--foreground)]/76 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/35 hover:text-[var(--foreground)]"
                          }
                          href={item.href}
                        >
                          <Icon className="size-4" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </nav>

                  <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-[var(--accent-3)]">
                    <span className="rounded-full border border-[var(--border)] bg-[var(--accent-4)] px-3 py-2">
                      Encrypted amounts
                    </span>
                    <span className="rounded-full border border-[var(--border)] bg-white/82 px-3 py-2">
                      Permit-based disclosure
                    </span>
                    <span className="rounded-full border border-[var(--border)] bg-white/82 px-3 py-2">
                      Minimal public metadata
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </header>
        </MotionFade>

        <MotionFade delay={0.08}>
          <main className="rounded-[2rem] border border-white/75 bg-white/76 p-5 shadow-[var(--shadow-soft)] backdrop-blur-2xl sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--accent-3)]">VeilPay workspace</p>
                <div className="mt-3 flex items-center gap-3">
                  {icon ? (
                    <span className="inline-flex size-11 items-center justify-center rounded-[1.1rem] bg-[linear-gradient(135deg,rgba(25,182,162,0.16),rgba(125,231,215,0.32))] text-[var(--accent-3)]">
                      {icon}
                    </span>
                  ) : null}
                  <h1 className="text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl">
                    {title}
                  </h1>
                </div>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)] sm:text-base">
                  {description}
                </p>
              </div>
              {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
            </div>

            <div className="mt-8">{children}</div>
          </main>
        </MotionFade>

        <MotionFade delay={0.16}>
          <footer className="mt-10 overflow-hidden rounded-[2rem] border border-white/75 bg-[linear-gradient(135deg,rgba(255,255,255,0.84),rgba(238,251,248,0.96))] px-6 py-8 shadow-[var(--shadow-soft)] backdrop-blur-2xl">
            <div className="grid gap-8 lg:grid-cols-[1.4fr,1fr,1fr,1fr]">
              <div>
                <div className="flex items-center gap-3 text-[var(--foreground)]">
                  <VeilPayLogo size={36} />
                  <div>
                    <p className="text-base font-semibold">VeilPay</p>
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--accent-3)]">
                      Privacy-native treasury
                    </p>
                  </div>
                </div>
                <p className="mt-4 max-w-sm text-sm leading-6 text-[var(--muted)]">
                  Run confidential payouts, payroll, grants, reimbursements, and disclosure workflows on
                  EVM rails without turning financial operations into public salary leaks.
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-3)]">Product</p>
                <ul className="mt-4 space-y-3 text-sm text-[var(--muted)]">
                  <li>Confidential payouts</li>
                  <li>Batch payroll runs</li>
                  <li>Auditor-safe disclosure</li>
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-3)]">Explore</p>
                <ul className="mt-4 space-y-3 text-sm text-[var(--muted)]">
                  <li><Link href="/dashboard">Dashboard</Link></li>
                  <li><Link href="/create">Create payout</Link></li>
                  <li><Link href="/batch">Batch payroll</Link></li>
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-3)]">Trust layer</p>
                <ul className="mt-4 space-y-3 text-sm text-[var(--muted)]">
                  <li>FHE encrypted values</li>
                  <li>Permit-scoped reveals</li>
                  <li>Operational audit trails</li>
                </ul>
              </div>
            </div>
            <div className="mt-8 flex flex-col gap-3 border-t border-[var(--border)] pt-5 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
              <p>Confidential payouts, payroll, and treasury operations on EVM using FHE.</p>
              <div className="flex flex-wrap gap-3">
                <Link href="/inbox">Recipient inbox</Link>
                <Link href="/disclosure">Auditor disclosure</Link>
                <Link href="/settings">Workspace settings</Link>
              </div>
            </div>
          </footer>
        </MotionFade>
      </div>
    </div>
  );
}
