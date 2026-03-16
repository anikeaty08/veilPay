import type { Abi, Address, PublicClient } from "viem";
import { keccak256, parseEventLogs, stringToHex, zeroAddress } from "viem";

import type { PayoutMetadata } from "@/lib/metadata";

import VeilPayManagerArtifact from "./VeilPayManager.json";

export const veilPayManagerAbi = VeilPayManagerArtifact.abi as Abi;
export const veilPayManagerAddress = (process.env
  .NEXT_PUBLIC_VEILPAY_MANAGER_ADDRESS || "") as Address;
export const defaultSettlementToken = (process.env
  .NEXT_PUBLIC_VEILPAY_SETTLEMENT_TOKEN || zeroAddress) as Address;

export const entryKindLabels = [
  "Payout",
  "Payroll",
  "Grant",
  "Reimbursement",
  "Invoice",
] as const;

export const statusLabels = ["Pending", "Claimed", "Cancelled"] as const;

export type PayoutSummary = {
  id: number;
  batchId: number;
  creator: Address;
  recipient: Address;
  settlementToken: Address;
  metadataHash: `0x${string}`;
  kind: number;
  status: number;
  dueDate: number;
  createdAt: number;
  amountHandle: bigint;
};

export type PayoutRecord = {
  summary: PayoutSummary;
  metadata: PayoutMetadata | null;
};

type SummaryShape = {
  [key: string]: unknown;
  [index: number]: unknown;
};

type ParsedLogs = Parameters<typeof parseEventLogs>[0]["logs"];

function normalizePayoutSummary(raw: SummaryShape, amountHandle: bigint): PayoutSummary {
  return {
    id: Number(raw.id ?? raw[0]),
    batchId: Number(raw.batchId ?? raw[1]),
    creator: (raw.creator ?? raw[2]) as Address,
    recipient: (raw.recipient ?? raw[3]) as Address,
    settlementToken: (raw.settlementToken ?? raw[4]) as Address,
    metadataHash: (raw.metadataHash ?? raw[5]) as `0x${string}`,
    kind: Number(raw.kind ?? raw[6]),
    status: Number(raw.status ?? raw[7]),
    dueDate: Number(raw.dueDate ?? raw[8]),
    createdAt: Number(raw.createdAt ?? raw[9]),
    amountHandle,
  };
}

async function fetchMetadata(ids: number[]) {
  if (!ids.length) return new Map<number, PayoutMetadata>();

  const params = new URLSearchParams({ ids: ids.join(",") });
  const response = await fetch(`/api/metadata/payouts?${params.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    return new Map<number, PayoutMetadata>();
  }

  const payload = (await response.json()) as { items: PayoutMetadata[] };
  return new Map(
    payload.items
      .filter((item) => item.payoutId != null)
      .map((item) => [item.payoutId as number, item]),
  );
}

export async function fetchRolePayouts(
  publicClient: PublicClient,
  address: Address,
  role: "creator" | "recipient" | "viewer",
) {
  if (!veilPayManagerAddress) return [];

  const functionName =
    role === "creator"
      ? "getCreatorPayoutIds"
      : role === "recipient"
        ? "getRecipientPayoutIds"
        : "getViewerPayoutIds";

  const ids = (await publicClient.readContract({
    address: veilPayManagerAddress,
    abi: veilPayManagerAbi,
    functionName,
    args: [address],
  })) as bigint[];

  if (!ids.length) return [];

  const [summaries, handles, metadataMap] = await Promise.all([
    publicClient.multicall({
      allowFailure: false,
      contracts: ids.map((id) => ({
        address: veilPayManagerAddress,
        abi: veilPayManagerAbi,
        functionName: "getPayoutSummary",
        args: [id],
      })),
    }),
    publicClient.multicall({
      allowFailure: false,
      contracts: ids.map((id) => ({
        address: veilPayManagerAddress,
        abi: veilPayManagerAbi,
        functionName: "getPayoutAmountHandle",
        args: [id],
      })),
    }),
    fetchMetadata(ids.map((id) => Number(id))),
  ]);

  return summaries.map((summary, index) => {
    const normalized = normalizePayoutSummary(summary, handles[index] as bigint);
    return {
      summary: normalized,
      metadata: metadataMap.get(normalized.id) ?? null,
    } satisfies PayoutRecord;
  });
}

export async function fetchPayoutById(
  publicClient: PublicClient,
  payoutId: number,
) {
  if (!veilPayManagerAddress) return null;

  const [summary, amountHandle] = await Promise.all([
    publicClient.readContract({
      address: veilPayManagerAddress,
      abi: veilPayManagerAbi,
      functionName: "getPayoutSummary",
      args: [BigInt(payoutId)],
    }),
    publicClient.readContract({
      address: veilPayManagerAddress,
      abi: veilPayManagerAbi,
      functionName: "getPayoutAmountHandle",
      args: [BigInt(payoutId)],
    }),
  ]);

  const metadataMap = await fetchMetadata([payoutId]);
  const normalized = normalizePayoutSummary(summary, amountHandle as bigint);

  return {
    summary: normalized,
    metadata: metadataMap.get(payoutId) ?? null,
  } satisfies PayoutRecord;
}

export function buildMetadataHash(payload: {
  organizationName: string;
  label: string;
  category: string;
  dueDate: number;
  settlementToken: string;
  tokenDecimals: number;
  currencySymbol: string;
  reference?: string;
  attachmentUrl?: string;
}) {
  return keccak256(stringToHex(JSON.stringify(payload)));
}

export function extractPayoutCreatedLogs(logs: ParsedLogs) {
  return parseEventLogs({
    abi: veilPayManagerAbi,
    logs,
    eventName: "PayoutCreated",
  });
}

export function extractBatchCreatedLogs(logs: ParsedLogs) {
  return parseEventLogs({
    abi: veilPayManagerAbi,
    logs,
    eventName: "BatchCreated",
  });
}
