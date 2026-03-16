"use client";

import { Building2, CheckCircle2, FileSpreadsheet, ShieldCheck, Sparkles, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Address } from "viem";

import { AppShell } from "@/components/app-shell";
import { MotionFade, MotionItem, MotionStagger } from "@/components/motion";
import { useVeilPayRuntime } from "@/lib/use-veilpay";

const starterRows = `recipient,organizationName,label,category,amount,dueDate,reference
0x000000000000000000000000000000000000dead,North Star DAO,April payroll - Ops,Payroll,5200.00,2026-04-30,PAY-001
0x000000000000000000000000000000000000beef,North Star DAO,April payroll - Growth,Payroll,4700.00,2026-04-30,PAY-002`;

export default function BatchPage() {
  const runtime = useVeilPayRuntime();
  const [csv, setCsv] = useState(starterRows);
  const [batchLabel, setBatchLabel] = useState("April payroll run");
  const [organizationSlug, setOrganizationSlug] = useState("north-star-dao");
  const [teamName, setTeamName] = useState("Operations");
  const [costCenter, setCostCenter] = useState("Payroll");
  const [requiredApprovals, setRequiredApprovals] = useState("2");
  const [assignedReviewer, setAssignedReviewer] = useState("");
  const [tags, setTags] = useState("payroll,monthly");
  const [tokenDecimals, setTokenDecimals] = useState("6");
  const [currencySymbol, setCurrencySymbol] = useState("USDC");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    try {
      setSubmitting(true);
      const [header, ...rows] = csv.trim().split(/\r?\n/);
      if (!header || rows.length === 0) {
        throw new Error("Paste at least one CSV row");
      }

      const items = rows.map((row) => {
        const [recipient, organizationName, label, category, amount, dueDate, reference] =
          row.split(",");
        return {
          recipient: recipient.trim() as Address,
          organizationSlug: organizationSlug.trim(),
          organizationName: organizationName.trim(),
          teamName: teamName.trim(),
          costCenter: costCenter.trim(),
          label: label.trim(),
          category: category.trim(),
          amount: amount.trim(),
          dueDate: dueDate.trim(),
          reference: reference?.trim(),
        };
      });

      const result = await runtime.createBatchPayouts({
        rows: items,
        kind: 1,
        tokenDecimals: Number(tokenDecimals),
        currencySymbol,
        batchLabel,
        requiredApprovals: Number(requiredApprovals),
        assignedReviewer: (assignedReviewer || undefined) as Address | undefined,
        tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      });

      toast.success(`Batch #${result.batchId} created`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create batch");
    } finally {
      setSubmitting(false);
    }
  }

  const details = [
    ["Batch label", batchLabel, setBatchLabel, "April payroll run"],
    ["Organization slug", organizationSlug, setOrganizationSlug, "north-star-dao"],
    ["Team", teamName, setTeamName, "Operations"],
    ["Cost center", costCenter, setCostCenter, "Payroll"],
    ["Required approvals", requiredApprovals, setRequiredApprovals, "2"],
    ["Assigned reviewer", assignedReviewer, setAssignedReviewer, "0x..."],
    ["Tags", tags, setTags, "payroll,monthly"],
    ["Token decimals", tokenDecimals, setTokenDecimals, "6"],
    ["Currency symbol", currencySymbol, setCurrencySymbol, "USDC"],
  ] as const;

  return (
    <AppShell
      title="Batch payroll or grant run"
      description="Upload a multi-recipient run with encrypted allocations, workflow controls, and cleaner finance ops metadata."
      icon={<Building2 className="size-5" />}
    >
      <div className="grid gap-5 xl:grid-cols-[1.2fr,0.8fr]">
        <div className="space-y-5">
          <MotionFade delay={0.04}>
            <section className="rounded-[1.8rem] border border-[var(--border)] bg-[linear-gradient(145deg,rgba(255,255,255,0.92),rgba(237,251,248,0.88))] p-6 shadow-[var(--shadow-card)]">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/78 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-3)]">
                    <Sparkles className="size-3.5" />
                    Batch command center
                  </div>
                  <h2 className="mt-4 text-3xl font-semibold tracking-tight">
                    Run payroll, grants, or multi-recipient treasury disbursements from one structured upload.
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                    Keep each allocation encrypted while preserving the operational metadata your finance team
                    needs for routing, review, and auditing.
                  </p>
                </div>
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-2))] px-5 py-3 text-sm font-semibold text-[var(--ink)] shadow-[0_14px_32px_rgba(25,182,162,0.22)]"
                  onClick={() => submit()}
                  type="button"
                >
                  <Upload className="size-4" />
                  {submitting ? "Encrypting batch..." : "Create confidential batch"}
                </button>
              </div>
            </section>
          </MotionFade>

          <MotionStagger className="grid gap-4 lg:grid-cols-2">
            {details.map(([label, value, setter, placeholder]) => (
              <MotionItem key={label}>
                <label className="block rounded-[1.5rem] border border-[var(--border)] bg-white/82 p-4 shadow-[var(--shadow-card)]">
                  <span className="text-sm font-medium text-[var(--foreground)]">{label}</span>
                  <input
                    className="mt-3 w-full rounded-[1rem] border border-[var(--border)] bg-[var(--panel-2)] px-4 py-3 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--foreground)]/34"
                    onChange={(event) => setter(event.target.value)}
                    placeholder={placeholder}
                    value={value}
                  />
                </label>
              </MotionItem>
            ))}
          </MotionStagger>

          <MotionFade delay={0.12}>
            <section className="rounded-[1.8rem] border border-[var(--border)] bg-white/84 p-5 shadow-[var(--shadow-soft)]">
              <div className="flex items-center gap-3">
                <span className="inline-flex size-11 items-center justify-center rounded-[1.1rem] bg-[var(--accent-4)] text-[var(--accent-3)]">
                  <FileSpreadsheet className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">CSV upload</p>
                  <p className="text-sm text-[var(--muted)]">
                    Format: recipient, organizationName, label, category, amount, dueDate, reference
                  </p>
                </div>
              </div>
              <textarea
                className="mt-4 min-h-80 w-full rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel-3)] px-4 py-4 font-mono text-sm text-[var(--foreground)] outline-none"
                onChange={(event) => setCsv(event.target.value)}
                value={csv}
              />
            </section>
          </MotionFade>
        </div>

        <div className="space-y-5">
          <MotionFade delay={0.1}>
            <section className="rounded-[1.8rem] border border-[var(--border)] bg-white/84 p-6 shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-3 text-[var(--foreground)]">
                <ShieldCheck className="size-5 text-[var(--accent-3)]" />
                <p className="text-base font-semibold">Batch safeguards</p>
              </div>
              <div className="mt-5 space-y-3">
                {[
                  "Each payout amount is encrypted before submission.",
                  "Operational routing stays visible without exposing every allocation.",
                  "Reviewer and approval metadata keep large runs controlled.",
                  "Recipient claims happen from the private inbox after creation.",
                ].map((item) => (
                  <div key={item} className="flex gap-3 rounded-[1.2rem] border border-[var(--border)] bg-[var(--panel-2)] px-4 py-4">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--accent-3)]" />
                    <p className="text-sm leading-6 text-[var(--muted)]">{item}</p>
                  </div>
                ))}
              </div>
            </section>
          </MotionFade>

          <MotionFade delay={0.16}>
            <section className="rounded-[1.8rem] border border-[var(--border)] bg-[linear-gradient(145deg,rgba(25,182,162,0.12),rgba(255,255,255,0.88))] p-6 shadow-[var(--shadow-card)]">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-3)]">Operator notes</p>
              <div className="mt-4 space-y-3">
                {[
                  "Use a real reviewer address when finance approvals are required.",
                  "Keep CSV labels human-readable so recipients and auditors understand what each line item represents.",
                  "Set tags and cost centers up front so reporting views stay useful later.",
                ].map((note) => (
                  <div key={note} className="rounded-[1.2rem] border border-[var(--border)] bg-white/84 px-4 py-4 text-sm leading-6 text-[var(--muted)]">
                    {note}
                  </div>
                ))}
              </div>
            </section>
          </MotionFade>
        </div>
      </div>
    </AppShell>
  );
}
