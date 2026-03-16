"use client";

import { Loader2, LogOut, QrCode, Wallet } from "lucide-react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useEffect, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";

function shortAddress(value?: string) {
  if (!value) return "Connect Wallet";
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const {
    connectAsync,
    connectors,
    isPending,
    error,
  } = useConnect();
  const { disconnect } = useDisconnect();
  const [activeConnector, setActiveConnector] = useState<"walletConnect" | "extension" | null>(null);
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  useEffect(() => {
    if (error) {
      toast.error(error.message || "Unable to connect wallet");
    }
  }, [error]);

  if (!mounted) {
    return (
      <button
        className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--ink)]"
        type="button"
      >
        <Wallet className="size-4" />
        Connect Wallet
      </button>
    );
  }

  const wcConnector = connectors.find((connector) => connector.id === "walletConnect");
  const metaMaskConnector = connectors.find((connector) => connector.id === "metaMask");
  const injectedConnector = connectors.find((connector) => connector.id === "injected");

  async function connectWalletConnect() {
    const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";
    if (!projectId || !wcConnector) {
      toast.error("WalletConnect project id is missing in apps/web/.env.local");
      return;
    }

    try {
      setActiveConnector("walletConnect");
      await connectAsync({ connector: wcConnector });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to open WalletConnect");
    } finally {
      setActiveConnector(null);
    }
  }

  async function connectExtension() {
    const connector = metaMaskConnector || injectedConnector;
    if (!connector) {
      toast.error("No browser wallet detected.");
      return;
    }

    try {
      setActiveConnector("extension");
      await connectAsync({ connector });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to connect wallet");
    } finally {
      setActiveConnector(null);
    }
  }

  const extensionBusy = isPending && activeConnector === "extension";
  const walletConnectBusy = isPending && activeConnector === "walletConnect";

  if (isConnected) {
    return (
      <button
        className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/85 px-4 py-2 text-sm font-medium text-[var(--foreground)] shadow-[0_12px_30px_rgba(16,24,32,0.08)] transition hover:border-[var(--accent)]/40 hover:shadow-[0_16px_32px_rgba(24,183,161,0.12)]"
        onClick={() => disconnect()}
        type="button"
      >
        <Wallet className="size-4" />
        {shortAddress(address)}
        <LogOut className="size-4 text-[var(--foreground)]/55" />
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-2))] px-4 py-2 text-sm font-semibold text-[var(--ink)] shadow-[0_12px_30px_rgba(24,183,161,0.22)] transition hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isPending}
        onClick={async () => {
          // Prefer browser extensions (MetaMask/Rainbow/etc). Fall back to WalletConnect QR.
          const hasInjected =
            typeof window !== "undefined" &&
            typeof (window as unknown as { ethereum?: unknown }).ethereum !== "undefined";
          if (hasInjected && (metaMaskConnector || injectedConnector)) {
            await connectExtension();
          } else {
            await connectWalletConnect();
          }
        }}
        type="button"
      >
        {extensionBusy ? <Loader2 className="size-4 animate-spin" /> : <Wallet className="size-4" />}
        {extensionBusy ? "Opening wallet..." : "Connect Wallet"}
      </button>
      <button
        className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white/85 px-4 py-2 text-sm font-medium text-[var(--foreground)] shadow-[0_12px_30px_rgba(16,24,32,0.06)] transition hover:-translate-y-0.5 hover:border-[var(--accent)]/40 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isPending}
        onClick={() => connectWalletConnect()}
        type="button"
      >
        {walletConnectBusy ? <Loader2 className="size-4 animate-spin" /> : <QrCode className="size-4" />}
        {walletConnectBusy ? "Opening QR..." : "WalletConnect"}
      </button>
    </div>
  );
}
