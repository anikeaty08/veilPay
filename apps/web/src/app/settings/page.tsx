"use client";

import { Building2, ShieldCheck, UserCog, WalletCards, Waves } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useSwitchChain } from "wagmi";

import { AppShell } from "@/components/app-shell";
import { MotionFade, MotionItem, MotionStagger } from "@/components/motion";
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
      description="Keep the wallet, permit, network, and workspace identity layer aligned with the same polished treasury experience."
      icon={<UserCog className="size-5 text-[var(--accent-3)]" />}
    >
      <div className="space-y-6">
        <MotionFade delay={0.04}>
          <section className="rounded-[1.9rem] border border-[var(--border)] bg-[linear-gradient(145deg,rgba(255,255,255,0.92),rgba(236,251,248,0.86))] p-6 shadow-[var(--shadow-soft)]">
            <div className="grid gap-5 xl:grid-cols-[1.1fr,0.9fr]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/78 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-3)]">
                  <ShieldCheck className="size-3.5" />
                  Security and workspace controls
                </div>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight">
                  Manage the trust layer behind VeilPay without dropping back into developer-looking settings.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                  Handle permits, network switching, and workspace identity from one cleaner operating surface.
                </p>
              </div>
              <MotionStagger className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                {[
                  { label: "Connected account", value: shortAddress(runtime.address), icon: <WalletCards className="size-4 text-[var(--accent-3)]" /> },
                  { label: "Configured chain", value: runtime.configuredChain.name, icon: <Waves className="size-4 text-[var(--accent-3)]" /> },
                  { label: "Permit state", value: runtime.permitReady ? "Ready" : "Not initialized", icon: <ShieldCheck className="size-4 text-[var(--accent-3)]" /> },
                ].map((item) => (
                  <MotionItem key={item.label}>
                    <div className="rounded-[1.25rem] border border-[var(--border)] bg-white/82 px-4 py-4 shadow-[var(--shadow-card)]">
                      <div className="flex items-center justify-between text-sm text-[var(--muted)]">
                        <span>{item.label}</span>
                        {item.icon}
                      </div>
                      <p className="mt-3 text-lg font-semibold text-[var(--foreground)]">{item.value}</p>
                    </div>
                  </MotionItem>
                ))}
              </MotionStagger>
            </div>
          </section>
        </MotionFade>

        <div className="grid gap-5 xl:grid-cols-[0.95fr,1.05fr]">
          <MotionFade delay={0.1}>
            <section className="rounded-[1.8rem] border border-[var(--border)] bg-white/84 p-6 shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-3">
                <WalletCards className="size-5 text-[var(--accent-3)]" />
                <div>
                  <p className="text-base font-semibold text-[var(--foreground)]">Wallet and permit</p>
                  <p className="text-sm text-[var(--muted)]">
                    Confirm account state and keep the access permit live.
                  </p>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {[
                  { label: "Connected account", value: shortAddress(runtime.address) },
                  { label: "Current chain", value: runtime.chain?.name || "Not connected" },
                  { label: "Configured chain", value: runtime.configuredChain.name },
                ].map((item) => (
                  <div key={item.label} className="rounded-[1.2rem] border border-[var(--border)] bg-[var(--panel-3)] px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--accent-3)]">{item.label}</p>
                    <p className="mt-2 text-sm text-[var(--foreground)]">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  className="rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-2))] px-4 py-2.5 text-sm font-semibold text-[var(--ink)] shadow-[0_14px_30px_rgba(25,182,162,0.2)]"
                  onClick={() => ensurePermit()}
                  type="button"
                >
                  {runtime.permitReady ? "Refresh permit" : "Create permit"}
                </button>
                <button
                  className="rounded-full border border-[var(--border)] bg-white/82 px-4 py-2.5 text-sm text-[var(--foreground)]/80"
                  onClick={() => switchChainAsync({ chainId: runtime.configuredChain.id })}
                  type="button"
                >
                  Switch to {runtime.configuredChain.name}
                </button>
              </div>
            </section>
          </MotionFade>

          <MotionFade delay={0.14}>
            <section className="rounded-[1.8rem] border border-[var(--border)] bg-[linear-gradient(145deg,rgba(233,251,247,0.88),rgba(255,255,255,0.92))] p-6 shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-3">
                <Building2 className="size-5 text-[var(--accent-3)]" />
                <div>
                  <p className="text-base font-semibold text-[var(--foreground)]">Environment status</p>
                  <p className="text-sm text-[var(--muted)]">
                    Quick operational checks for contract and metadata readiness.
                  </p>
                </div>
              </div>
              <div className="mt-5 grid gap-3">
                {[
                  { label: "Contract address", value: runtime.contractAddress || "Missing" },
                  { label: "CoFHE environment", value: process.env.NEXT_PUBLIC_VEILPAY_COFHE_ENV || "TESTNET" },
                  {
                    label: "Metadata backend",
                    value: process.env.NEXT_PUBLIC_VEILPAY_MANAGER_ADDRESS
                      ? "Enabled when Mongo is configured"
                      : "Disabled until env is configured",
                  },
                ].map((item) => (
                  <div key={item.label} className="rounded-[1.2rem] border border-[var(--border)] bg-white/84 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--accent-3)]">{item.label}</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">{item.value}</p>
                  </div>
                ))}
              </div>
            </section>
          </MotionFade>
        </div>

        <MotionFade delay={0.18}>
          <section className="rounded-[1.9rem] border border-[var(--border)] bg-white/84 p-6 shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-3 text-[var(--foreground)]">
              <Building2 className="size-4 text-[var(--accent-3)]" />
              <p className="text-lg font-semibold">Workspace profile</p>
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {[
                { label: "Display name", value: profile.displayName, key: "displayName" },
                { label: "Organization slug", value: profile.organizationSlug, key: "organizationSlug" },
                { label: "Organization name", value: profile.organizationName, key: "organizationName" },
              ].map((item) => (
                <label key={item.key} className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--panel-3)] p-4 text-sm">
                  <span className="font-medium text-[var(--foreground)]">{item.label}</span>
                  <input
                    className="mt-3 w-full rounded-[1rem] border border-[var(--border)] bg-white/82 px-4 py-3 outline-none"
                    onChange={(event) =>
                      setProfile((current) => ({ ...current, [item.key]: event.target.value }))
                    }
                    value={item.value}
                  />
                </label>
              ))}
              <label className="rounded-[1.25rem] border border-[var(--border)] bg-[var(--panel-3)] p-4 text-sm">
                <span className="font-medium text-[var(--foreground)]">Role</span>
                <select
                  className="mt-3 w-full rounded-[1rem] border border-[var(--border)] bg-white/82 px-4 py-3 outline-none"
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
            <div className="mt-5">
              <button
                className="rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-2))] px-4 py-2.5 text-sm font-semibold text-[var(--ink)] shadow-[0_14px_30px_rgba(25,182,162,0.2)]"
                onClick={() => saveWorkspaceProfile()}
                type="button"
              >
                Save workspace profile
              </button>
            </div>
          </section>
        </MotionFade>
      </div>
    </AppShell>
  );
}
