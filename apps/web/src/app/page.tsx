export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(111,227,212,0.35),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(24,183,161,0.28),_transparent_30%),radial-gradient(circle_at_bottom,_rgba(15,141,124,0.18),_transparent_40%)] px-4 py-10 text-[var(--foreground)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[0_28px_70px_rgba(16,24,32,0.15)] sm:p-10">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--accent-3)]">
            VeilPay
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl">
            Confidential payouts, payroll, and treasury operations on EVM using FHE.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-[var(--foreground)]/70">
            VeilPay gives DAOs, startups, and onchain teams a privacy-first way to run payroll, grants,
            reimbursements, invoices, and selective disclosure workflows without exposing sensitive amounts
            on transparent rails.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--ink)] shadow-[0_10px_20px_rgba(255,138,91,0.25)]"
              href="/dashboard"
            >
              Open dashboard
            </a>
            <a
              className="rounded-full border border-[var(--border)] bg-[var(--panel-2)] px-5 py-3 text-sm text-[var(--foreground)]/80"
              href="/create"
            >
              Create confidential payout
            </a>
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-3">
          {[
            ["Why it matters", "Transparent payment rails leak salary bands, contractor rates, and treasury disbursement patterns."],
            ["What stays encrypted", "Payout amounts and payroll allocations stay protected until an authorized user reveals them with a permit."],
            ["What stays public", "Transaction existence, payout IDs, creators, and minimal routing metadata remain visible for operational integrity."],
          ].map(([title, body]) => (
            <article key={title} className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel)] p-5">
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="mt-3 text-sm text-[var(--foreground)]/70">{body}</p>
            </article>
          ))}
        </section>

        <section className="mt-12 grid gap-6 lg:grid-cols-[1.2fr,1fr]">
          <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-3)]">Confidential rails</p>
            <h2 className="mt-3 text-2xl font-semibold">Run sensitive payouts without exposing the treasury</h2>
            <p className="mt-4 text-sm text-[var(--foreground)]/70">
              VeilPay replaces transparent payment rails with encrypted onchain amounts. Admins can issue
              payouts, payroll runs, and grants without publishing compensation data to the public.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                "Encrypted euint64 amounts",
                "Permit-based reveal",
                "Auditor-safe disclosure",
                "Minimal public metadata",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-[var(--border)] bg-[var(--panel-2)] px-4 py-3 text-sm">
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel-2)] p-6">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-3)]">Primary demo flow</p>
            <ol className="mt-4 space-y-3 text-sm text-[var(--foreground)]/70">
              <li>1. Admin connects wallet.</li>
              <li>2. Create confidential payout or payroll batch.</li>
              <li>3. Recipient reveals and claims payout.</li>
              <li>4. Admin shares selective details with auditor.</li>
              <li>5. Status updates stay public, amounts stay encrypted.</li>
            </ol>
          </div>
        </section>

        <section className="mt-12 grid gap-4 lg:grid-cols-3">
          {[
            ["DAO payroll", "Pay contributors on EVM without exposing salary bands or payroll schedules."],
            ["Grant programs", "Distribute funding with encrypted allocations and limited auditor access."],
            ["Treasury ops", "Record internal reimbursements without publishing amounts to the entire chain."],
          ].map(([title, body]) => (
            <article key={title} className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel)] p-5">
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-3 text-sm text-[var(--foreground)]/70">{body}</p>
            </article>
          ))}
        </section>

        <section className="mt-12 rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-8">
          <div className="grid gap-6 lg:grid-cols-[1.1fr,1fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-3)]">Auditor ready</p>
              <h2 className="mt-3 text-2xl font-semibold">Selective disclosure, not full transparency</h2>
              <p className="mt-4 text-sm text-[var(--foreground)]/70">
                Share exactly the payouts an auditor needs using CoFHE permits. Nothing else is exposed.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel-2)] p-5 text-sm text-[var(--foreground)]/70">
              <p className="font-semibold text-[var(--foreground)]">What the auditor sees</p>
              <ul className="mt-3 space-y-2">
                <li>Permitted payout IDs</li>
                <li>Decrypted amount after permit</li>
                <li>Public status and timestamps</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
