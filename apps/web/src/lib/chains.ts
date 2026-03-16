import { arbitrumSepolia, hardhat, sepolia } from "viem/chains";

const chainKey = process.env.NEXT_PUBLIC_VEILPAY_CHAIN ?? "arb-sepolia";

export const configuredChain =
  chainKey === "sepolia"
    ? sepolia
    : chainKey === "hardhat"
      ? hardhat
      : arbitrumSepolia;
