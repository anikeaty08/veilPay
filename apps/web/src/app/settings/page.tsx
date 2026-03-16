"use client";

import { toast } from "sonner";
import { useSwitchChain } from "wagmi";

import { AppShell } from "@/components/app-shell";
import { shortAddress } from "@/lib/utils";
import { useVeilPayRuntime } from "@/lib/use-veilpay";

export default function SettingsPage() {
  const runtime = useVeilPayRuntime();
  const { switchChainAsync } = useSwitchChain();

  async function ensurePermit() {
    try {
      await runtime.ensureLivePermit();
      toast.success("Access permit is ready");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to initialize permit");
    }
  }

  return (
    <AppShell
      title="Wallet and network settings"
      description="Initialize permits, confirm the configured chain, and verify the contract address used by the live MVP."
      icon={<span className="text-[var(--accent-3)]">▣</span>}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel)] p-5 text-sm text-[var(--foreground)]/75">
          <p className="font-semibold text-[var(--foreground)]">Wallet</p>
          <p className="mt-3">Connected account: {shortAddress(runtime.address)}</p>
          <p className="mt-2">Current chain: {runtime.chain?.name || "Not connected"}</p>
          <p className="mt-2">Configured chain: {runtime.configuredChain.name}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--ink)]"
              onClick={() => ensurePermit()}
              type="button"
            >
              {runtime.permitReady ? "Refresh permit" : "Create permit"}
            </button>
            <button
              className="rounded-full border border-[var(--border)] bg-[var(--panel-2)] px-4 py-2 text-sm text-[var(--foreground)]/80"
              onClick={() => switchChainAsync({ chainId: runtime.configuredChain.id })}
              type="button"
            >
              Switch to {runtime.configuredChain.name}
            </button>
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel-2)] p-5 text-sm text-[var(--foreground)]/75">
          <p className="font-semibold text-[var(--foreground)]">Environment</p>
          <p className="mt-3">Contract address: {runtime.contractAddress || "Missing"}</p>
          <p className="mt-2">
            CoFHE environment: {process.env.NEXT_PUBLIC_VEILPAY_COFHE_ENV || "TESTNET"}
          </p>
          <p className="mt-2">
            Live metadata backend: {process.env.NEXT_PUBLIC_VEILPAY_MANAGER_ADDRESS ? "Enabled when Mongo is configured" : "Disabled until env is configured"}
          </p>
        </section>
      </div>
    </AppShell>
  );
}
