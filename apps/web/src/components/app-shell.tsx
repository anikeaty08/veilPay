"use client";

import Link from "next/link";
import { ArrowRight, Building2, Files, Grid2X2, ReceiptText, ShieldCheck, Wallet } from "lucide-react";
import { usePathname } from "next/navigation";

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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(111,227,212,0.35),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(24,183,161,0.28),_transparent_30%),radial-gradient(circle_at_bottom,_rgba(15,141,124,0.18),_transparent_40%)] text-[var(--foreground)]">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <header className="sticky top-4 z-30 mb-8">
          <div className="overflow-hidden rounded-[2rem] border border-white/60 bg-white/78 backdrop-blur-xl shadow-[0_28px_80px_rgba(16,24,32,0.14)]">
            <div className="flex flex-col gap-5 px-4 py-4 lg:px-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-col gap-3">
                  <Link className="inline-flex items-center gap-3 text-lg font-semibold tracking-tight text-[var(--foreground)]" href="/">
                    <VeilPayLogo size={42} />
                    <span className="flex flex-col leading-none">
                      <span className="text-lg font-semibold">VeilPay</span>
                      <span className="text-xs font-medium uppercase tracking-[0.24em] text-[var(--accent-3)]">
                        Treasury privacy suite
                      </span>
                    </span>
                  </Link>
                  <p className="max-w-2xl text-sm text-[var(--foreground)]/68">
                    Confidential payouts, payroll, and treasury operations on EVM using FHE.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--panel)] px-4 py-2 text-sm font-medium text-[var(--foreground)] shadow-[0_10px_24px_rgba(16,24,32,0.06)] transition hover:-translate-y-0.5"
                    href="/create"
                  >
                    Launch payout
                    <ArrowRight className="size-4" />
                  </Link>
                  <WalletButton />
                </div>
              </div>

              <div className="grid gap-3 xl:grid-cols-[1.5fr,0.85fr] xl:items-center">
                <nav className="flex flex-wrap gap-2">
                  {navigation.map((item) => {
                    const active = pathname.startsWith(item.href);
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        className={
                          active
                            ? "inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-2))] px-4 py-2.5 text-sm font-semibold text-[var(--ink)] shadow-[0_10px_24px_rgba(24,183,161,0.22)]"
                            : "inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--panel)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)]/72 transition hover:-translate-y-0.5 hover:border-[var(--accent)]/35 hover:text-[var(--foreground)]"
                        }
                        href={item.href}
                      >
                        <Icon className="size-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>

                <div className="grid gap-3 rounded-[1.5rem] border border-[var(--border)] bg-[linear-gradient(135deg,rgba(24,183,161,0.1),rgba(255,255,255,0.8))] p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent-3)]">
                      Product mode
                    </p>
                    <p className="mt-2 text-sm font-medium text-[var(--foreground)]">
                      Confidential treasury operations
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--accent-3)]">
                      Public by design
                    </p>
                    <p className="mt-2 text-sm text-[var(--foreground)]/72">
                      Status, IDs, and timestamps only. Amounts stay protected.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-6">
          <main className="rounded-[2rem] border border-white/70 bg-white/82 p-5 shadow-[0_28px_70px_rgba(16,24,32,0.1)] backdrop-blur-xl sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--accent-2)]">
                  VeilPay
                </p>
                <div className="mt-2 flex items-center gap-3">
                  {icon ? (
                    <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-[var(--panel-2)] text-[var(--accent-2)] shadow-[0_10px_20px_rgba(47,128,237,0.18)]">
                      {icon}
                    </span>
                  ) : null}
                  <h1 className="text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl">
                    {title}
                  </h1>
                </div>
                <p className="mt-3 max-w-2xl text-sm text-[var(--foreground)]/70 sm:text-base">
                  {description}
                </p>
              </div>
              {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
            </div>

            <div className="mt-8">{children}</div>
          </main>
        </div>

        <footer className="mt-10 rounded-[2rem] border border-white/70 bg-white/82 px-6 py-8 text-sm text-[var(--foreground)]/70 shadow-[0_20px_60px_rgba(16,24,32,0.08)] backdrop-blur-xl">
          <div className="grid gap-6 lg:grid-cols-[1.2fr,1fr,1fr,1fr]">
            <div>
              <div className="flex items-center gap-3 text-[var(--foreground)]">
                <VeilPayLogo size={32} />
                <span className="text-base font-semibold">VeilPay</span>
              </div>
              <p className="mt-3">
                Confidential payouts, payroll, and treasury operations on EVM using FHE.
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-3)]">Product</p>
              <ul className="mt-3 space-y-2">
                <li>Encrypted amounts</li>
                <li>Selective disclosure</li>
                <li>DAO payroll and grants</li>
              </ul>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-3)]">Navigation</p>
              <ul className="mt-3 space-y-2">
                <li>
                  <Link href="/dashboard">Dashboard</Link>
                </li>
                <li>
                  <Link href="/create">Create payout</Link>
                </li>
                <li>
                  <Link href="/inbox">Recipient inbox</Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-3)]">Security</p>
              <ul className="mt-3 space-y-2">
                <li>CoFHE permits</li>
                <li>Access-controlled reveals</li>
                <li>Minimal public metadata</li>
              </ul>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
