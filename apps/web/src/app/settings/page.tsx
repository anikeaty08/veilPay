"use client";

import { Building2, UserCog } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useSwitchChain } from "wagmi";

import { AppShell } from "@/components/app-shell";
import { shortAddress } from "@/lib/utils";
import { useVeilPayRuntime } from "@/lib/use-veilpay";
import { workspaceRoles, type WorkspaceRole } from "@/lib/workspace";

export default function SettingsPage() {
  const runtime = useVeilPayRuntime();
  const { switchChainAsync } = useSwitchChain();
  const [profile, setProfile] = useState(runtime.workspace.profile);

  async function ensurePermit() {
    try {
      await runtime.ensureLivePermit();
      toast.success("Access permit is ready");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to initialize permit");
    }
  }

  function saveWorkspaceProfile() {
    runtime.workspace.updateProfile(profile);
    toast.success("Workspace profile updated");
  }

  return (
    <AppShell
      title="Wallet and network settings"
      description="Initialize permits, confirm the configured chain, and manage the workspace role used for treasury workflows."
      icon={<UserCog className="size-5 text-[var(--accent-3)]" />}
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

      <div className="mt-6 rounded-[1.5rem] border border-[var(--border)] bg-white/82 p-5 shadow-[0_18px_42px_rgba(16,24,32,0.08)]">
        <div className="flex items-center gap-2 text-[var(--foreground)]">
          <Building2 className="size-4 text-[var(--accent-3)]" />
          <p className="font-semibold">Workspace profile</p>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <label className="text-sm text-[var(--foreground)]/75">
            <span className="font-medium text-[var(--foreground)]">Display name</span>
            <input
              className="mt-3 w-full rounded-2xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3 outline-none"
              onChange={(event) => setProfile((current) => ({ ...current, displayName: event.target.value }))}
              value={profile.displayName}
            />
          </label>
          <label className="text-sm text-[var(--foreground)]/75">
            <span className="font-medium text-[var(--foreground)]">Organization slug</span>
            <input
              className="mt-3 w-full rounded-2xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3 outline-none"
              onChange={(event) => setProfile((current) => ({ ...current, organizationSlug: event.target.value }))}
              value={profile.organizationSlug}
            />
          </label>
          <label className="text-sm text-[var(--foreground)]/75">
            <span className="font-medium text-[var(--foreground)]">Organization name</span>
            <input
              className="mt-3 w-full rounded-2xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3 outline-none"
              onChange={(event) => setProfile((current) => ({ ...current, organizationName: event.target.value }))}
              value={profile.organizationName}
            />
          </label>
          <label className="text-sm text-[var(--foreground)]/75">
            <span className="font-medium text-[var(--foreground)]">Role</span>
            <select
              className="mt-3 w-full rounded-2xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3 outline-none"
              onChange={(event) =>
                setProfile((current) => ({ ...current, role: event.target.value as WorkspaceRole }))
              }
              value={profile.role}
            >
              {workspaceRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4">
          <button
            className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--ink)]"
            onClick={() => saveWorkspaceProfile()}
            type="button"
          >
            Save workspace profile
          </button>
        </div>
      </div>
    </AppShell>
  );
}
