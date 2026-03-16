"use client";

import type { PublicClient, WalletClient } from "viem";

type CoFheModule = typeof import("cofhejs/web");

let cofheModulePromise: Promise<CoFheModule> | undefined;

function getCoFheModule() {
  if (typeof window === "undefined") {
    throw new Error("CoFHE SDK can only be initialized in the browser.");
  }
  if (!cofheModulePromise) {
    cofheModulePromise = import("cofhejs/web");
  }

  return cofheModulePromise;
}

function unwrapResult<T>(result: {
  success: boolean;
  data: T | null;
  error: { message: string } | null;
}) {
  if (!result.success || result.data == null) {
    throw new Error(result.error?.message || "Unknown CoFHE error");
  }

  return result.data;
}

export async function initializeCoFhe(
  publicClient: PublicClient,
  walletClient: WalletClient,
) {
  if (typeof window === "undefined") {
    throw new Error("CoFHE SDK can only be initialized in the browser.");
  }
  const { cofhejs } = await getCoFheModule();
  const result = await cofhejs.initializeWithViem({
    viemClient: publicClient,
    viemWalletClient: walletClient,
    environment:
      (process.env.NEXT_PUBLIC_VEILPAY_COFHE_ENV as
        | "MOCK"
        | "LOCAL"
        | "TESTNET"
        | "MAINNET"
        | undefined) ?? "TESTNET",
    generatePermit: false,
  });

  unwrapResult(result);
  return cofhejs;
}

export async function ensurePermit(
  publicClient: PublicClient,
  walletClient: WalletClient,
  address: string,
) {
  if (typeof window === "undefined") {
    throw new Error("CoFHE SDK can only be initialized in the browser.");
  }
  const { cofhejs } = await getCoFheModule();
  await initializeCoFhe(publicClient, walletClient);

  const currentPermit = cofhejs.getPermit();
  if (currentPermit.success) {
    return currentPermit.data;
  }

  const created = await cofhejs.createPermit({
    name: "VeilPay Access Permit",
    type: "self",
    issuer: address,
  });

  return unwrapResult(created);
}

export async function encryptUint64(
  publicClient: PublicClient,
  walletClient: WalletClient,
  value: bigint,
) {
  const { cofhejs, Encryptable } = await getCoFheModule();
  await initializeCoFhe(publicClient, walletClient);
  const encrypted = await cofhejs.encrypt([Encryptable.uint64(value)] as const);
  return unwrapResult(encrypted)[0];
}

export async function unsealUint64(
  publicClient: PublicClient,
  walletClient: WalletClient,
  address: string,
  handle: bigint,
) {
  const { cofhejs, FheTypes } = await getCoFheModule();
  await ensurePermit(publicClient, walletClient, address);
  const result = await cofhejs.unseal(handle, FheTypes.Uint64);
  return unwrapResult(result) as bigint;
}
