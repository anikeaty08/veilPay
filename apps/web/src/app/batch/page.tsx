"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { Address } from "viem";

import { AppShell } from "@/components/app-shell";
import { useVeilPayRuntime } from "@/lib/use-veilpay";

const starterRows = `recipient,organizationName,label,category,amount,dueDate,reference
0x000000000000000000000000000000000000dead,North Star DAO,April payroll - Ops,Payroll,5200.00,2026-04-30,PAY-001
0x000000000000000000000000000000000000beef,North Star DAO,April payroll - Growth,Payroll,4700.00,2026-04-30,PAY-002`;

export default function BatchPage() {
  const runtime = useVeilPayRuntime();
  const [csv, setCsv] = useState(starterRows);
  const [batchLabel, setBatchLabel] = useState("April payroll run");
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
          organizationName: organizationName.trim(),
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
      });

      toast.success(`Batch #${result.batchId} created`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create batch");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell
      title="Batch payroll or grant run"
      description="Paste a CSV to create a confidential payroll or grant batch while keeping each allocation encrypted."
    >
      <label className="block text-sm text-white/75">
        <span className="font-medium text-white">Batch label</span>
        <input
          className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
          onChange={(event) => setBatchLabel(event.target.value)}
          value={batchLabel}
        />
      </label>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <label className="block text-sm text-white/75">
          <span className="font-medium text-white">Token decimals</span>
          <input
            className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
            onChange={(event) => setTokenDecimals(event.target.value)}
            value={tokenDecimals}
          />
        </label>
        <label className="block text-sm text-white/75">
          <span className="font-medium text-white">Currency symbol</span>
          <input
            className="mt-3 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none"
            onChange={(event) => setCurrencySymbol(event.target.value)}
            value={currencySymbol}
          />
        </label>
      </div>
      <label className="mt-4 block text-sm text-white/75">
        <span className="font-medium text-white">
          CSV format: recipient,organizationName,label,category,amount,dueDate,reference
        </span>
        <textarea
          className="mt-3 min-h-72 w-full rounded-[1.5rem] border border-white/10 bg-black/20 px-4 py-4 font-mono text-sm outline-none"
          onChange={(event) => setCsv(event.target.value)}
          value={csv}
        />
      </label>
      <div className="mt-6">
        <button
          className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--ink)]"
          onClick={() => submit()}
          type="button"
        >
          {submitting ? "Encrypting batch..." : "Create confidential batch"}
        </button>
      </div>
    </AppShell>
  );
}
