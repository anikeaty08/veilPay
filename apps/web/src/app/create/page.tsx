"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import type { Address } from "viem";
import { CheckCircle2, FilePlus2, ShieldCheck, Sparkles } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { useVeilPayRuntime } from "@/lib/use-veilpay";

export default function CreatePage() {
  const runtime = useVeilPayRuntime();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState({
    recipient: "",
    organizationName: "",
    label: "",
    category: "Contractor",
    amount: "",
    dueDate: "",
    kind: "0",
    tokenDecimals: "6",
    currencySymbol: "USDC",
    reference: "",
    attachmentUrl: "",
  });

  async function submit() {
    try {
      setSubmitting(true);
      const result = await runtime.createSinglePayout({
        recipient: form.recipient as Address,
        organizationName: form.organizationName,
        label: form.label,
        category: form.category,
        amount: form.amount,
        dueDate: form.dueDate,
        kind: Number(form.kind),
        tokenDecimals: Number(form.tokenDecimals),
        currencySymbol: form.currencySymbol,
        reference: form.reference || undefined,
        attachmentUrl: form.attachmentUrl || undefined,
      });
      toast.success(`Payout #${result.payoutId} created`);
      router.push(`/payouts/${result.payoutId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create payout");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell
      title="Create confidential payout"
      description="Create a single payout, grant, reimbursement, or invoice while keeping the amount encrypted onchain."
      icon={<FilePlus2 className="size-5" />}
    >
      <div className="grid gap-4 lg:grid-cols-[1fr,280px]">
        <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel)] p-5">
          <div className="flex items-center gap-3 text-sm font-semibold text-[var(--foreground)]">
            <Sparkles className="size-4 text-[var(--accent-2)]" />
            Step {step} of 3
          </div>

          {step === 1 ? (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {[
                ["Recipient wallet", "recipient", "0x..."],
                ["Organization", "organizationName", "North Star DAO"],
                ["Label", "label", "April contractor payout"],
                ["Category", "category", "Contractor"],
                ["Amount", "amount", "4200.00"],
                ["Due date", "dueDate", ""],
              ].map(([label, key, placeholder]) => (
                <label key={key} className="block text-sm text-[var(--foreground)]/80">
                  <span className="font-medium text-[var(--foreground)]">{label}</span>
                  <input
                    className="mt-3 w-full rounded-2xl border border-[var(--border)] bg-[var(--panel-2)] px-4 py-3 outline-none placeholder:text-[var(--foreground)]/35"
                    onChange={(event) =>
                      setForm((current) => ({ ...current, [key]: event.target.value }))
                    }
                    placeholder={placeholder}
                    type={key === "dueDate" ? "date" : "text"}
                    value={form[key as keyof typeof form]}
                  />
                </label>
              ))}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {[
                ["Token decimals", "tokenDecimals", "6"],
                ["Currency symbol", "currencySymbol", "USDC"],
                ["Reference", "reference", "INV-042"],
                ["Attachment URL", "attachmentUrl", "https://"],
              ].map(([label, key, placeholder]) => (
                <label key={key} className="block text-sm text-[var(--foreground)]/80">
                  <span className="font-medium text-[var(--foreground)]">{label}</span>
                  <input
                    className="mt-3 w-full rounded-2xl border border-[var(--border)] bg-[var(--panel-2)] px-4 py-3 outline-none placeholder:text-[var(--foreground)]/35"
                    onChange={(event) =>
                      setForm((current) => ({ ...current, [key]: event.target.value }))
                    }
                    placeholder={placeholder}
                    type="text"
                    value={form[key as keyof typeof form]}
                  />
                </label>
              ))}
              <label className="block text-sm text-[var(--foreground)]/80">
                <span className="font-medium text-[var(--foreground)]">Entry type</span>
                <select
                  className="mt-3 w-full rounded-2xl border border-[var(--border)] bg-[var(--panel-2)] px-4 py-3 outline-none"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, kind: event.target.value }))
                  }
                  value={form.kind}
                >
                  <option value="0">Payout</option>
                  <option value="2">Grant</option>
                  <option value="3">Reimbursement</option>
                  <option value="4">Invoice</option>
                </select>
              </label>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="mt-5 grid gap-4 lg:grid-cols-2 text-sm text-[var(--foreground)]/80">
              {Object.entries(form).map(([key, value]) => (
                <div key={key} className="rounded-2xl border border-[var(--border)] bg-[var(--panel-2)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-2)]">{key}</p>
                  <p className="mt-2 text-[var(--foreground)]">{value || "Not set"}</p>
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            {step > 1 ? (
              <button
                className="rounded-full border border-[var(--border)] bg-[var(--panel-2)] px-5 py-3 text-sm text-[var(--foreground)]"
                onClick={() => setStep((step - 1) as 1 | 2 | 3)}
                type="button"
              >
                Back
              </button>
            ) : null}
            {step < 3 ? (
              <button
                className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--ink)]"
                onClick={() => setStep((step + 1) as 1 | 2 | 3)}
                type="button"
              >
                Continue
              </button>
            ) : (
              <button
                className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--ink)]"
                onClick={() => submit()}
                type="button"
              >
                {submitting ? "Encrypting and submitting..." : "Create confidential record"}
              </button>
            )}
          </div>
        </div>

        <aside className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel-2)] p-5 text-sm text-[var(--foreground)]/70">
          <div className="flex items-center gap-2 text-[var(--foreground)]">
            <ShieldCheck className="size-4 text-[var(--accent-2)]" />
            Confidential payout checklist
          </div>
          <ul className="mt-4 space-y-3">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-[var(--accent-3)]" />
              Amount encrypted before submission
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-[var(--accent-3)]" />
              Metadata stored offchain only
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-[var(--accent-3)]" />
              Permit required for reveal
            </li>
          </ul>
        </aside>
      </div>
    </AppShell>
  );
}
