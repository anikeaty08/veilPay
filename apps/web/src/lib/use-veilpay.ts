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
import type { PayoutActivity, PayoutMetadata } from "@/lib/metadata";
import { parseDecimalToUnits, toUnixTimestamp } from "@/lib/utils";
import { useWorkspaceProfile } from "@/lib/workspace";

export function useVeilPayRuntime() {
  const { address, chain, isConnected } = useAccount();
  const workspace = useWorkspaceProfile();
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

  async function updateWorkflow(input: {
    payoutId: number;
    action: "approved" | "marked_ready" | "revealed" | "claimed" | "shared_disclosure" | "refreshed";
    workflowStatus?: "drafted" | "needs_review" | "ready" | "shared" | "completed" | "cancelled";
    note?: string;
    target?: Address;
    incrementApprovalCount?: boolean;
    addDisclosureViewer?: Address;
  }) {
    if (!address) {
      throw new Error("Wallet or contract is not ready");
    }

    const response = await fetch("/api/metadata/payouts", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        payoutId: input.payoutId,
        actor: address,
        action: input.action,
        workflowStatus: input.workflowStatus,
        note: input.note,
        target: input.target,
        incrementApprovalCount: input.incrementApprovalCount,
        addDisclosureViewer: input.addDisclosureViewer,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(payload?.error || "Failed to update workflow");
    }
  }

  async function createSinglePayout(input: {
    recipient: Address;
    organizationSlug: string;
    organizationName: string;
    teamName: string;
    costCenter: string;
    label: string;
    category: string;
    amount: string;
    dueDate: string;
    kind: number;
    tokenDecimals: number;
    currencySymbol: string;
    settlementToken?: Address;
    requiredApprovals: number;
    assignedReviewer?: Address;
    tags: string[];
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
    const payoutId = Number(payoutLog?.args?.payoutId ?? BigInt(0));

    try {
      await storeMetadata([
        {
          payoutId,
          metadataHash,
          creator: address,
          recipient: input.recipient,
          organizationSlug: input.organizationSlug,
          organizationName: input.organizationName,
          teamName: input.teamName,
          costCenter: input.costCenter,
          label: input.label,
          category: input.category,
          dueDate,
          settlementToken,
          kind: input.kind,
          tokenDecimals: input.tokenDecimals,
          currencySymbol: input.currencySymbol,
          requiredApprovals: input.requiredApprovals,
          approvalCount: 0,
          workflowStatus: input.requiredApprovals > 1 ? "needs_review" : "ready",
          assignedReviewer: input.assignedReviewer,
          disclosureSharedWith: [],
          tags: input.tags,
          latestAction: "created",
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
      organizationSlug: string;
      organizationName: string;
      teamName: string;
      costCenter: string;
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
    requiredApprovals: number;
    assignedReviewer?: Address;
    tags: string[];
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
    const batchId = Number(batchLog?.args?.batchId ?? BigInt(0));

    try {
      await storeMetadata(
        metadataItems.map((item, index) => ({
          payoutId: Number(payoutLogs[index]?.args?.payoutId ?? BigInt(0)),
          batchId,
        metadataHash: item.metadataHash,
        creator: address,
        recipient: item.recipient,
        organizationSlug: item.organizationSlug,
        organizationName: item.organizationName,
        teamName: item.teamName,
        costCenter: item.costCenter,
        label: item.label,
        category: item.category,
        dueDate: item.dueDate,
        settlementToken,
        kind: input.kind,
        tokenDecimals: input.tokenDecimals,
        currencySymbol: input.currencySymbol,
        requiredApprovals: input.requiredApprovals,
        approvalCount: 0,
        workflowStatus: input.requiredApprovals > 1 ? "needs_review" : "ready",
        assignedReviewer: input.assignedReviewer,
        disclosureSharedWith: [],
        tags: input.tags,
        latestAction: "created",
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

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    await updateWorkflow({
      payoutId,
      action: "claimed",
      workflowStatus: "completed",
    }).catch(() => undefined);
    return receipt;
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

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    await updateWorkflow({
      payoutId,
      action: "shared_disclosure",
      workflowStatus: "shared",
      target: viewer,
      addDisclosureViewer: viewer,
    }).catch(() => undefined);
    return receipt;
  }

  return {
    address,
    chain,
    workspace,
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
    updateWorkflow,
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

export function useActivityFeed(organizationSlug?: string, payoutId?: number) {
  const [items, setItems] = useState<PayoutActivity[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (organizationSlug) params.set("organizationSlug", organizationSlug);
      if (payoutId) params.set("payoutId", String(payoutId));
      params.set("limit", payoutId ? "12" : "20");

      const response = await fetch(`/api/metadata/activity?${params.toString()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        setItems([]);
        return;
      }

      const payload = (await response.json()) as { items: PayoutActivity[] };
      setItems(payload.items);
    } finally {
      setLoading(false);
    }
  }, [organizationSlug, payoutId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { items, loading, refresh };
}

export function useLiveRefresh(refresh: () => Promise<void> | void, intervalMs = 15000) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    }, intervalMs);

    return () => {
      window.clearInterval(interval);
    };
  }, [intervalMs, refresh]);
}
