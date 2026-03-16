"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { WagmiProvider, createConfig, http } from "wagmi";
import { walletConnect } from "wagmi/connectors";
import { metaMask, injected } from "wagmi/connectors";
import { arbitrumSepolia, hardhat, sepolia } from "wagmi/chains";

const queryClient = new QueryClient();
const chains = [arbitrumSepolia, sepolia, hardhat] as const;

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

const connectors = projectId
  ? [
      walletConnect({
        projectId,
        showQrModal: true,
        metadata: {
          name: "VeilPay",
          description: "Confidential payouts, payroll, and treasury operations on EVM using FHE.",
          url: "https://veilpay.app",
          icons: ["https://veilpay.app/icon.png"],
        },
      }),
      metaMask(),
      injected(),
    ]
  : [metaMask(), injected()];

const wagmiConfig = createConfig({
  chains,
  connectors,
  ssr: false,
  transports: {
    [arbitrumSepolia.id]: http(),
    [sepolia.id]: http(),
    [hardhat.id]: http(),
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster richColors position="top-right" />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
