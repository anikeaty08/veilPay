"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { type Address } from "viem";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";

import { configuredChain } from "@/lib/chains";
import { encryptUint64, ensurePermit, unsealUint64 } from "@/lib/cofhe";
import {
  buildMetadataHash,
  defaultSettlementToken,
  extractBatchCreatedLogs,
  extractPayoutCreatedLogs,
  fetchPayoutById,
  fetchRolePayouts,
  type PayoutRecord,
  veilPayManagerAbi,
  veilPayManagerAddress,
} from "@/lib/contracts/veilpay";
import type { PayoutMetadata } from "@/lib/metadata";
import { parseDecimalToUnits, toUnixTimestamp } from "@/lib/utils";

export function useVeilPayRuntime() {
  const { address, chain, isConnected } = useAccount();
  const publicClient = usePublicClient({ chainId: configuredChain.id });
  const { data: walletClient } = useWalletClient({ chainId: configuredChain.id });
  const [permitReady, setPermitReady] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function checkPermit() {
      if (typeof window === "undefined") return;
      if (!publicClient || !walletClient || !address) return;

      try {
        await ensurePermit(publicClient, walletClient, address);
        if (active) {
          setPermitReady(true);
          setSdkError(null);
        }
      } catch (error) {
        if (active) {
          setPermitReady(false);
          setSdkError(
            error instanceof Error ? error.message : "Failed to initialize CoFHE",
          );
        }
      }
    }

    void checkPermit();

    return () => {
      active = false;
    };
  }, [address, publicClient, walletClient]);

  async function storeMetadata(items: PayoutMetadata[]) {
    const response = await fetch("/api/metadata/payouts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ items }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      throw new Error(payload?.error || "Failed to persist metadata");
    }
  }

  async function createSinglePayout(input: {
    recipient: Address;
    organizationName: string;
    label: string;
    category: string;
    amount: string;
    dueDate: string;
    kind: number;
    tokenDecimals: number;
    currencySymbol: string;
    settlementToken?: Address;
    reference?: string;
    attachmentUrl?: string;
  }) {
    if (!publicClient || !walletClient || !address || !veilPayManagerAddress) {
      throw new Error("Wallet or contract is not ready");
    }

    const amountAtomic = parseDecimalToUnits(input.amount, input.tokenDecimals);
    const dueDate = toUnixTimestamp(input.dueDate);
    const settlementToken = input.settlementToken || defaultSettlementToken;
    const metadataHash = buildMetadataHash({
      organizationName: input.organizationName,
      label: input.label,
      category: input.category,
      dueDate,
      settlementToken,
      tokenDecimals: input.tokenDecimals,
      currencySymbol: input.currencySymbol,
      reference: input.reference,
      attachmentUrl: input.attachmentUrl,
    });

    const encryptedAmount = await encryptUint64(
      publicClient,
      walletClient,
      amountAtomic,
    );

    const hash = await walletClient.writeContract({
      chain: configuredChain,
      account: walletClient.account,
      address: veilPayManagerAddress,
      abi: veilPayManagerAbi,
      functionName: "createConfidentialPayout",
      args: [
        input.recipient,
        encryptedAmount,
        metadataHash,
        settlementToken,
        BigInt(dueDate),
        input.kind,
      ],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const payoutLog = extractPayoutCreatedLogs(receipt.logs).at(-1);
    const payoutId = Number(payoutLog?.args.payoutId ?? 0n);

    try {
      await storeMetadata([
        {
          payoutId,
          metadataHash,
          creator: address,
          recipient: input.recipient,
          organizationName: input.organizationName,
          label: input.label,
          category: input.category,
          dueDate,
          settlementToken,
          kind: input.kind,
          tokenDecimals: input.tokenDecimals,
          currencySymbol: input.currencySymbol,
          reference: input.reference,
          attachmentUrl: input.attachmentUrl,
        },
      ]);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Contract write succeeded but metadata persistence failed",
      );
    }

    return { hash, payoutId };
  }

  async function createBatchPayouts(input: {
    rows: Array<{
      recipient: Address;
      organizationName: string;
      label: string;
      category: string;
      amount: string;
      dueDate: string;
      reference?: string;
      attachmentUrl?: string;
    }>;
    kind: number;
    tokenDecimals: number;
    currencySymbol: string;
    settlementToken?: Address;
    batchLabel: string;
  }) {
    if (!publicClient || !walletClient || !address || !veilPayManagerAddress) {
      throw new Error("Wallet or contract is not ready");
    }

    const settlementToken = input.settlementToken || defaultSettlementToken;
    const encryptedAmounts = await Promise.all(
      input.rows.map((row) =>
        encryptUint64(
          publicClient,
          walletClient,
          parseDecimalToUnits(row.amount, input.tokenDecimals),
        ),
      ),
    );

    const metadataItems = input.rows.map((row) => {
      const dueDate = toUnixTimestamp(row.dueDate);
      const metadataHash = buildMetadataHash({
        organizationName: row.organizationName,
        label: row.label,
        category: row.category,
        dueDate,
        settlementToken,
        tokenDecimals: input.tokenDecimals,
        currencySymbol: input.currencySymbol,
        reference: row.reference,
        attachmentUrl: row.attachmentUrl,
      });

      return {
        ...row,
        dueDate,
        metadataHash,
      };
    });

    const hash = await walletClient.writeContract({
      chain: configuredChain,
      account: walletClient.account,
      address: veilPayManagerAddress,
      abi: veilPayManagerAbi,
      functionName: "createBatchPayouts",
      args: [
        metadataItems.map((item) => item.recipient),
        encryptedAmounts,
        metadataItems.map((item) => item.metadataHash),
        settlementToken,
        BigInt(metadataItems[0]?.dueDate ?? 0),
        input.kind,
        buildMetadataHash({
          organizationName: input.batchLabel,
          label: input.batchLabel,
          category: "Batch",
          dueDate: metadataItems[0]?.dueDate ?? 0,
          settlementToken,
          tokenDecimals: input.tokenDecimals,
          currencySymbol: input.currencySymbol,
        }),
      ],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const payoutLogs = extractPayoutCreatedLogs(receipt.logs);
    const batchLog = extractBatchCreatedLogs(receipt.logs).at(-1);
    const batchId = Number(batchLog?.args.batchId ?? 0n);

    try {
      await storeMetadata(
        metadataItems.map((item, index) => ({
          payoutId: Number(payoutLogs[index]?.args.payoutId ?? 0n),
          batchId,
          metadataHash: item.metadataHash,
          creator: address,
          recipient: item.recipient,
          organizationName: item.organizationName,
          label: item.label,
          category: item.category,
          dueDate: item.dueDate,
          settlementToken,
          kind: input.kind,
          tokenDecimals: input.tokenDecimals,
          currencySymbol: input.currencySymbol,
          reference: item.reference,
          attachmentUrl: item.attachmentUrl,
        })),
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Contract write succeeded but metadata persistence failed",
      );
    }

    return { hash, batchId };
  }

  async function revealAmount(handle: bigint) {
    if (!publicClient || !walletClient || !address) {
      throw new Error("Wallet or contract is not ready");
    }

    return unsealUint64(publicClient, walletClient, address, handle);
  }

  async function claimPayout(payoutId: number) {
    if (!publicClient || !walletClient || !veilPayManagerAddress) {
      throw new Error("Wallet or contract is not ready");
    }

    const hash = await walletClient.writeContract({
      chain: configuredChain,
      account: walletClient.account,
      address: veilPayManagerAddress,
      abi: veilPayManagerAbi,
      functionName: "claimPayout",
      args: [BigInt(payoutId)],
    });

    return publicClient.waitForTransactionReceipt({ hash });
  }

  async function grantAccess(payoutId: number, viewer: Address) {
    if (!publicClient || !walletClient || !veilPayManagerAddress) {
      throw new Error("Wallet or contract is not ready");
    }

    const hash = await walletClient.writeContract({
      chain: configuredChain,
      account: walletClient.account,
      address: veilPayManagerAddress,
      abi: veilPayManagerAbi,
      functionName: "grantPayoutAccess",
      args: [BigInt(payoutId), viewer],
    });

    return publicClient.waitForTransactionReceipt({ hash });
  }

  return {
    address,
    chain,
    configuredChain,
    contractAddress: veilPayManagerAddress,
    contractReady: Boolean(veilPayManagerAddress && publicClient),
    publicClient,
    walletClient,
    isConnected,
    isOnConfiguredChain: chain?.id === configuredChain.id,
    permitReady,
    sdkError,
    ensureLivePermit: async () => {
      if (!publicClient || !walletClient || !address) {
        throw new Error("Wallet or contract is not ready");
      }

      const permit = await ensurePermit(publicClient, walletClient, address);
      setPermitReady(true);
      return permit;
    },
    createSinglePayout,
    createBatchPayouts,
    revealAmount,
    claimPayout,
    grantAccess,
  };
}

export function useRolePayoutFeed(role: "creator" | "recipient" | "viewer") {
  const { address, publicClient, contractReady } = useVeilPayRuntime();
  const [items, setItems] = useState<PayoutRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!contractReady || !publicClient || !address) {
      setItems([]);
      return;
    }

    setLoading(true);
    try {
      const nextItems = await fetchRolePayouts(publicClient, address, role);
      setItems(nextItems);
    } finally {
      setLoading(false);
    }
  }, [address, contractReady, publicClient, role]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { items, loading, refresh };
}

export function usePayoutDetail(payoutId: number) {
  const { publicClient, contractReady } = useVeilPayRuntime();
  const [item, setItem] = useState<PayoutRecord | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!contractReady || !publicClient) {
      setItem(null);
      return;
    }

    setLoading(true);
    try {
      const nextItem = await fetchPayoutById(publicClient, payoutId);
      setItem(nextItem);
    } finally {
      setLoading(false);
    }
  }, [contractReady, payoutId, publicClient]);

  useEffect(() => {
    if (!Number.isFinite(payoutId) || payoutId <= 0) return;
    void refresh();
  }, [payoutId, refresh]);

  return { item, loading, refresh };
}
