import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  EyeOff,
  Files,
  Landmark,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { MotionFade, MotionItem, MotionStagger } from "@/components/motion";
import { VeilPayLogo } from "@/components/logo";

export default function Home() {
  return (
    <main className="veil-grid min-h-screen px-4 py-6 text-[var(--foreground)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <MotionFade>
          <header className="rounded-[2rem] border border-white/75 bg-white/74 px-5 py-4 shadow-[var(--shadow-soft)] backdrop-blur-2xl sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <Link className="inline-flex items-center gap-3" href="/">
                <VeilPayLogo size={44} />
                <div>
                  <p className="text-lg font-semibold">VeilPay</p>
                  <p className="text-xs uppercase tracking-[0.24em] text-[var(--accent-3)]">
                    Fhenix treasury suite
                  </p>
                </div>
              </Link>
              <nav className="flex flex-wrap gap-2">
                {[
                  ["/dashboard", "Dashboard"],
                  ["/create", "Create payout"],
                  ["/batch", "Batch payroll"],
                  ["/inbox", "Recipient inbox"],
                  ["/disclosure", "Disclosure"],
                ].map(([href, label]) => (
                  <Link
                    key={href}
                    className="rounded-full border border-[var(--border)] bg-white/82 px-4 py-2 text-sm font-medium text-[var(--foreground)]/78 transition hover:-translate-y-0.5"
                    href={href}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            </div>
          </header>
        </MotionFade>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
          <MotionFade delay={0.08}>
            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.94),rgba(233,251,247,0.9))] px-6 py-8 shadow-[var(--shadow-soft)] sm:px-8 sm:py-10">
              <div className="absolute -right-16 top-8 size-48 rounded-full bg-[radial-gradient(circle,rgba(125,231,215,0.7),transparent_62%)]" />
              <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(25,182,162,0.18),transparent_70%)]" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-3)]">
                  <Sparkles className="size-3.5" />
                  Confidential treasury operations
                </div>
                <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl">
                  Payroll, grants, invoices, and payouts with privacy built into the operating layer.
                </h1>
                <p className="mt-6 max-w-2xl text-base leading-7 text-[var(--muted)] sm:text-lg">
                  VeilPay gives DAOs, startups, and onchain teams a cleaner way to run sensitive treasury
                  workflows on EVM. Status stays operational. Amounts stay confidential until authorized
                  disclosure is granted.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-2))] px-5 py-3 text-sm font-semibold text-[var(--ink)] shadow-[0_16px_36px_rgba(25,182,162,0.24)]"
                    href="/dashboard"
                  >
                    Open workspace
                    <ArrowRight className="size-4" />
                  </Link>
                  <Link
                    className="rounded-full border border-[var(--border)] bg-white/85 px-5 py-3 text-sm font-medium text-[var(--foreground)]"
                    href="/create"
                  >
                    Create confidential payout
                  </Link>
                </div>

                <MotionStagger className="mt-10 grid gap-3 sm:grid-cols-3">
                  {[
                    ["What stays encrypted", "Amounts, allocations, and private notes stay protected."],
                    ["What stays visible", "IDs, timestamps, status, and minimum routing metadata."],
                    ["Why it matters", "Transparent rails leak salary bands, grants, and vendor rates."],
                  ].map(([title, body]) => (
                    <MotionItem key={title}>
                      <article className="rounded-[1.6rem] border border-[var(--border)] bg-white/76 p-4 backdrop-blur-xl">
                        <h2 className="text-base font-semibold">{title}</h2>
                        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{body}</p>
                      </article>
                    </MotionItem>
                  ))}
                </MotionStagger>
              </div>
            </div>
          </MotionFade>

          <MotionFade delay={0.14}>
            <div className="grid gap-4">
              <section className="rounded-[2rem] border border-white/80 bg-white/82 p-6 shadow-[var(--shadow-card)]">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--accent-3)]">Primary flow</p>
                <ol className="mt-4 space-y-4">
                  {[
                    "Admin connects wallet and creates a confidential payout or invoice.",
                    "Recipients open a private inbox to reveal and claim their record.",
                    "Admins track status without exposing the full compensation map.",
                    "Auditors receive permit-based selective disclosure when needed.",
                  ].map((step, index) => (
                    <li key={step} className="flex gap-3">
                      <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent-4)] text-sm font-semibold text-[var(--accent-3)]">
                        {index + 1}
                      </span>
                      <span className="text-sm leading-6 text-[var(--muted)]">{step}</span>
                    </li>
                  ))}
                </ol>
              </section>
              <section className="rounded-[2rem] border border-[var(--border)] bg-[linear-gradient(145deg,rgba(25,182,162,0.12),rgba(255,255,255,0.9))] p-6 shadow-[var(--shadow-card)]">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--accent-3)]">Public vs protected</p>
                <div className="mt-4 grid gap-3">
                  <div className="rounded-[1.25rem] border border-[var(--border)] bg-white/84 p-4">
                    <p className="text-sm font-semibold">Protected</p>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      Payout amounts, payroll allocations, grant values, sensitive internal notes.
                    </p>
                  </div>
                  <div className="rounded-[1.25rem] border border-[var(--border)] bg-white/84 p-4">
                    <p className="text-sm font-semibold">Public</p>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      Existence, creator, timestamp, status, and minimum routing metadata.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </MotionFade>
        </section>

        <MotionStagger className="mt-8 grid gap-4 lg:grid-cols-3">
          {[
            {
              icon: <Users className="size-5 text-[var(--accent-3)]" />,
              title: "DAO contributor payroll",
              body: "Pay contributors without turning salary bands and workstreams into public chain data.",
            },
            {
              icon: <Landmark className="size-5 text-[var(--accent-3)]" />,
              title: "Treasury disbursements",
              body: "Keep operational status visible while protecting grant, vendor, and internal finance details.",
            },
            {
              icon: <Files className="size-5 text-[var(--accent-3)]" />,
              title: "Selective disclosure",
              body: "Share only the records an auditor or accountant needs with permit-scoped access.",
            },
          ].map((item) => (
            <MotionItem key={item.title}>
              <article className="rounded-[1.8rem] border border-white/80 bg-white/82 p-6 shadow-[var(--shadow-card)]">
                <div className="inline-flex size-11 items-center justify-center rounded-[1.1rem] bg-[linear-gradient(135deg,rgba(25,182,162,0.14),rgba(125,231,215,0.26))]">
                  {item.icon}
                </div>
                <h3 className="mt-5 text-xl font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{item.body}</p>
              </article>
            </MotionItem>
          ))}
        </MotionStagger>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.05fr,0.95fr]">
          <MotionFade delay={0.18}>
            <div className="rounded-[2.2rem] border border-white/80 bg-white/82 p-7 shadow-[var(--shadow-soft)]">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--accent-3)]">Why transparent rails fail</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight">
                Treasury operations need nuance, not permanent public compensation maps.
              </h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  {
                    icon: <EyeOff className="size-5 text-[var(--accent-3)]" />,
                    title: "Compensation privacy",
                    body: "Teams should not expose salary, contractor, or grant values to the whole internet.",
                  },
                  {
                    icon: <ShieldCheck className="size-5 text-[var(--accent-3)]" />,
                    title: "Controlled visibility",
                    body: "Finance stakeholders still need verifiable workflows, approvals, and disclosure tools.",
                  },
                  {
                    icon: <BriefcaseBusiness className="size-5 text-[var(--accent-3)]" />,
                    title: "Operational integrity",
                    body: "Payout IDs, timestamps, and statuses stay available for coordination and reporting.",
                  },
                  {
                    icon: <Sparkles className="size-5 text-[var(--accent-3)]" />,
                    title: "Fhenix-native fit",
                    body: "FHE lets VeilPay keep sensitive values protected while preserving EVM-native operations.",
                  },
                ].map((item) => (
                  <div key={item.title} className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel-3)] p-5">
                    <div className="inline-flex size-10 items-center justify-center rounded-2xl bg-[var(--accent-4)]">
                      {item.icon}
                    </div>
                    <p className="mt-4 text-base font-semibold">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </MotionFade>

          <MotionFade delay={0.24}>
            <div className="rounded-[2.2rem] border border-[var(--border)] bg-[linear-gradient(145deg,rgba(232,250,246,0.95),rgba(255,255,255,0.92))] p-7 shadow-[var(--shadow-soft)]">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--accent-3)]">What teams can do now</p>
              <div className="mt-5 space-y-4">
                {[
                  "Create single confidential payouts for vendors, contractors, reimbursements, or invoices.",
                  "Run batch payroll or grant distributions with encrypted amounts and safe metadata.",
                  "Give recipients a private inbox with reveal and claim actions.",
                  "Track workflow status, approvals, and activity without exposing every amount publicly.",
                  "Share scoped payout details with auditors or accountants through disclosure controls.",
                ].map((item) => (
                  <div key={item} className="rounded-[1.4rem] border border-[var(--border)] bg-white/84 px-4 py-4 text-sm leading-6 text-[var(--muted)]">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </MotionFade>
        </section>

        <MotionFade delay={0.3}>
          <footer className="mt-8 rounded-[2rem] border border-white/80 bg-white/78 px-6 py-8 shadow-[var(--shadow-soft)] backdrop-blur-2xl">
            <div className="grid gap-8 lg:grid-cols-[1.5fr,1fr,1fr,1fr]">
              <div>
                <div className="flex items-center gap-3">
                  <VeilPayLogo size={36} />
                  <div>
                    <p className="text-base font-semibold">VeilPay</p>
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--accent-3)]">
                      Confidential treasury operations
                    </p>
                  </div>
                </div>
                <p className="mt-4 max-w-sm text-sm leading-6 text-[var(--muted)]">
                  Built for teams that need privacy without leaving the EVM ecosystem.
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-3)]">Pages</p>
                <div className="mt-4 space-y-3 text-sm text-[var(--muted)]">
                  <Link href="/dashboard">Dashboard</Link>
                  <Link href="/create">Create payout</Link>
                  <Link href="/batch">Batch payroll</Link>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-3)]">Capabilities</p>
                <div className="mt-4 space-y-3 text-sm text-[var(--muted)]">
                  <p>Encrypted amounts</p>
                  <p>Recipient inbox</p>
                  <p>Selective disclosure</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-3)]">Positioning</p>
                <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
                  Confidential, not anonymous. Operationally visible, financially protected.
                </p>
              </div>
            </div>
          </footer>
        </MotionFade>
      </div>
    </main>
  );
}
