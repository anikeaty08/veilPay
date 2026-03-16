"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { Address } from "viem";
import {
  CalendarClock,
  CheckCircle2,
  FilePlus2,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { MotionFade, MotionItem, MotionStagger } from "@/components/motion";
import { useVeilPayRuntime } from "@/lib/use-veilpay";

type Step = 1 | 2 | 3;

const initialForm = {
  recipient: "",
  organizationSlug: "north-star-dao",
  organizationName: "",
  teamName: "Operations",
  costCenter: "Treasury",
  label: "",
  category: "Contractor",
  amount: "",
  dueDate: "",
  kind: "0",
  tokenDecimals: "6",
  currencySymbol: "USDC",
  requiredApprovals: "2",
  assignedReviewer: "",
  tags: "payroll,confidential",
  reference: "",
  attachmentUrl: "",
};

export default function CreatePage() {
  const runtime = useVeilPayRuntime();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState(initialForm);

  const steps = useMemo(
    () => [
      {
        id: 1,
        title: "Payout basics",
        body: "Define the recipient, organization context, amount, and due schedule.",
      },
      {
        id: 2,
        title: "Workflow controls",
        body: "Set approval requirements, tags, references, and entry type.",
      },
      {
        id: 3,
        title: "Review and submit",
        body: "Confirm the confidential record before encrypting and writing onchain.",
      },
    ],
    [],
  );

  function updateField(key: keyof typeof initialForm, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit() {
    try {
      setSubmitting(true);
      const result = await runtime.createSinglePayout({
        recipient: form.recipient as Address,
        organizationSlug: form.organizationSlug,
        organizationName: form.organizationName,
        teamName: form.teamName,
        costCenter: form.costCenter,
        label: form.label,
        category: form.category,
        amount: form.amount,
        dueDate: form.dueDate,
        kind: Number(form.kind),
        tokenDecimals: Number(form.tokenDecimals),
        currencySymbol: form.currencySymbol,
        requiredApprovals: Number(form.requiredApprovals),
        assignedReviewer: (form.assignedReviewer || undefined) as Address | undefined,
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
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
      description="Build a single payout, grant, reimbursement, or invoice with cleaner workflow controls and a better finance-ops experience."
      icon={<FilePlus2 className="size-5" />}
    >
      <div className="grid gap-5 xl:grid-cols-[1.15fr,0.85fr]">
        <div className="space-y-5">
          <MotionFade delay={0.04}>
            <section className="rounded-[1.9rem] border border-[var(--border)] bg-[linear-gradient(145deg,rgba(255,255,255,0.92),rgba(235,251,248,0.86))] p-6 shadow-[var(--shadow-soft)]">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/78 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-3)]">
                    <WandSparkles className="size-3.5" />
                    Guided payout builder
                  </div>
                  <h2 className="mt-4 text-3xl font-semibold tracking-tight">
                    Create a polished confidential treasury record without turning the form into a wall of fields.
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                    Move step by step, review the workflow context, and set a styled due date and time that
                    feels like part of the product instead of the browser default.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/72 px-4 py-2 text-sm font-medium text-[var(--foreground)] shadow-[var(--shadow-card)]">
                  <Sparkles className="size-4 text-[var(--accent-3)]" />
                  Step {step} of 3
                </div>
              </div>
            </section>
          </MotionFade>

          <MotionStagger className="grid gap-3 md:grid-cols-3">
            {steps.map((item) => (
              <MotionItem key={item.id}>
                <button
                  className={
                    item.id === step
                      ? "w-full rounded-[1.4rem] border border-[var(--border)] bg-[linear-gradient(145deg,rgba(25,182,162,0.14),rgba(255,255,255,0.92))] p-4 text-left shadow-[var(--shadow-card)]"
                      : "w-full rounded-[1.4rem] border border-[var(--border)] bg-white/82 p-4 text-left shadow-[var(--shadow-card)]"
                  }
                  onClick={() => setStep(item.id as Step)}
                  type="button"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-3)]">
                    Stage {item.id}
                  </p>
                  <p className="mt-2 text-base font-semibold text-[var(--foreground)]">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.body}</p>
                </button>
              </MotionItem>
            ))}
          </MotionStagger>

          <MotionFade delay={0.08}>
            <section className="rounded-[1.9rem] border border-[var(--border)] bg-white/84 p-6 shadow-[var(--shadow-soft)]">
              {step === 1 ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {[
                    ["Recipient wallet", "recipient", "0x..."],
                    ["Organization slug", "organizationSlug", "north-star-dao"],
                    ["Organization", "organizationName", "North Star DAO"],
                    ["Team", "teamName", "Operations"],
                    ["Cost center", "costCenter", "Treasury"],
                    ["Label", "label", "April contractor payout"],
                    ["Category", "category", "Contractor"],
                    ["Amount", "amount", "4200.00"],
                  ].map(([label, key, placeholder]) => (
                    <label key={key} className="block rounded-[1.35rem] border border-[var(--border)] bg-[var(--panel-3)] p-4">
                      <span className="text-sm font-medium text-[var(--foreground)]">{label}</span>
                      <input
                        className="mt-3 w-full rounded-[1rem] border border-[var(--border)] bg-white/82 px-4 py-3 text-sm outline-none placeholder:text-[var(--foreground)]/35"
                        onChange={(event) => updateField(key as keyof typeof initialForm, event.target.value)}
                        placeholder={placeholder}
                        type="text"
                        value={form[key as keyof typeof form]}
                      />
                    </label>
                  ))}
                  <div className="rounded-[1.35rem] border border-[var(--border)] bg-[linear-gradient(145deg,rgba(233,251,247,0.85),rgba(255,255,255,0.92))] p-4 lg:col-span-2">
                    <div className="flex items-center gap-3">
                      <CalendarClock className="size-5 text-[var(--accent-3)]" />
                      <div>
                        <p className="text-sm font-semibold text-[var(--foreground)]">Due date and time</p>
                        <p className="text-sm text-[var(--muted)]">
                          Pick a proper due schedule for claims and approvals.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-[1.2fr,0.8fr]">
                      <label className="block rounded-[1.1rem] border border-[var(--border)] bg-white/82 p-4">
                        <span className="text-sm font-medium text-[var(--foreground)]">Due at</span>
                        <input
                          className="mt-3 w-full rounded-[1rem] border border-[var(--border)] bg-[var(--panel-2)] px-4 py-3 text-sm outline-none"
                          onChange={(event) => updateField("dueDate", event.target.value)}
                          type="datetime-local"
                          value={form.dueDate}
                        />
                      </label>
                      <div className="rounded-[1.1rem] border border-[var(--border)] bg-white/82 p-4">
                        <p className="text-sm font-medium text-[var(--foreground)]">Payout timing</p>
                        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                          Use a specific time for invoices, reimbursements, or grant deadlines instead of a bare date.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  {[
                    ["Token decimals", "tokenDecimals", "6"],
                    ["Currency symbol", "currencySymbol", "USDC"],
                    ["Required approvals", "requiredApprovals", "2"],
                    ["Assigned reviewer", "assignedReviewer", "0x..."],
                    ["Tags", "tags", "payroll,confidential"],
                    ["Reference", "reference", "INV-042"],
                    ["Attachment URL", "attachmentUrl", "https://"],
                  ].map(([label, key, placeholder]) => (
                    <label key={key} className="block rounded-[1.35rem] border border-[var(--border)] bg-[var(--panel-3)] p-4">
                      <span className="text-sm font-medium text-[var(--foreground)]">{label}</span>
                      <input
                        className="mt-3 w-full rounded-[1rem] border border-[var(--border)] bg-white/82 px-4 py-3 text-sm outline-none placeholder:text-[var(--foreground)]/35"
                        onChange={(event) => updateField(key as keyof typeof initialForm, event.target.value)}
                        placeholder={placeholder}
                        type="text"
                        value={form[key as keyof typeof form]}
                      />
                    </label>
                  ))}
                  <label className="block rounded-[1.35rem] border border-[var(--border)] bg-[var(--panel-3)] p-4">
                    <span className="text-sm font-medium text-[var(--foreground)]">Entry type</span>
                    <select
                      className="mt-3 w-full rounded-[1rem] border border-[var(--border)] bg-white/82 px-4 py-3 text-sm outline-none"
                      onChange={(event) => updateField("kind", event.target.value)}
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
                <MotionStagger className="grid gap-4 lg:grid-cols-2">
                  {Object.entries(form).map(([key, value]) => (
                    <MotionItem key={key}>
                      <div className="rounded-[1.25rem] border border-[var(--border)] bg-[linear-gradient(145deg,rgba(255,255,255,0.9),rgba(238,251,248,0.75))] px-4 py-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-3)]">{key}</p>
                        <p className="mt-2 text-sm text-[var(--foreground)]">{value || "Not set"}</p>
                      </div>
                    </MotionItem>
                  ))}
                </MotionStagger>
              ) : null}

              <div className="mt-6 flex flex-wrap gap-3">
                {step > 1 ? (
                  <button
                    className="rounded-full border border-[var(--border)] bg-white/82 px-5 py-3 text-sm text-[var(--foreground)]"
                    onClick={() => setStep((step - 1) as Step)}
                    type="button"
                  >
                    Back
                  </button>
                ) : null}
                {step < 3 ? (
                  <button
                    className="rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-2))] px-5 py-3 text-sm font-semibold text-[var(--ink)] shadow-[0_14px_30px_rgba(25,182,162,0.2)]"
                    onClick={() => setStep((step + 1) as Step)}
                    type="button"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    className="rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-2))] px-5 py-3 text-sm font-semibold text-[var(--ink)] shadow-[0_14px_30px_rgba(25,182,162,0.2)]"
                    onClick={() => submit()}
                    type="button"
                  >
                    {submitting ? "Encrypting and submitting..." : "Create confidential record"}
                  </button>
                )}
              </div>
            </section>
          </MotionFade>
        </div>

        <div className="space-y-5">
          <MotionFade delay={0.12}>
            <aside className="rounded-[1.8rem] border border-[var(--border)] bg-[linear-gradient(145deg,rgba(233,251,247,0.86),rgba(255,255,255,0.92))] p-6 shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-2 text-[var(--foreground)]">
                <ShieldCheck className="size-4 text-[var(--accent-3)]" />
                <p className="text-base font-semibold">Confidential payout checklist</p>
              </div>
              <ul className="mt-5 space-y-3">
                {[
                  "Amount is encrypted before submission.",
                  "Metadata stays offchain in the operational layer.",
                  "Permit-based reveal is required for sensitive values.",
                  "Workflow approvals can be enforced before release.",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex gap-3 rounded-[1.2rem] border border-[var(--border)] bg-white/78 px-4 py-4"
                  >
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[var(--accent-3)]" />
                    <span className="text-sm leading-6 text-[var(--muted)]">{item}</span>
                  </li>
                ))}
              </ul>
            </aside>
          </MotionFade>

          <MotionFade delay={0.18}>
            <section className="rounded-[1.8rem] border border-[var(--border)] bg-white/84 p-6 shadow-[var(--shadow-card)]">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--accent-3)]">Builder notes</p>
              <div className="mt-4 space-y-3">
                {[
                  "Use labels recipients can immediately recognize in their inbox.",
                  "Pick a due time when the payout has a hard operational cutoff.",
                  "Set reviewer and approval count now so disclosure and workflow remain clean later.",
                ].map((item) => (
                  <div key={item} className="rounded-[1.15rem] border border-[var(--border)] bg-[var(--panel-3)] px-4 py-4 text-sm leading-6 text-[var(--muted)]">
                    {item}
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
