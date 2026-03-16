import { formatUnits } from "viem";

export function shortAddress(value?: string | null) {
  if (!value) return "Not connected";
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

export function formatTimestamp(value?: number | bigint | null) {
  if (value == null) return "No due date";
  const timestamp = Number(value);
  if (!timestamp) return "No due date";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestamp * 1000));
}

export function formatTokenAmount(
  value: bigint,
  decimals = 6,
  symbol = "USDC",
) {
  const numeric = Number(formatUnits(value, decimals));
  const formatted = new Intl.NumberFormat("en", {
    maximumFractionDigits: 2,
    minimumFractionDigits: numeric >= 1000 ? 0 : 2,
  }).format(numeric);

  return `${formatted} ${symbol}`;
}

export function parseDecimalToUnits(input: string, decimals = 6) {
  const [whole, fraction = ""] = input.trim().split(".");
  const sanitizedWhole = whole === "" ? "0" : whole;
  const sanitizedFraction = fraction.replace(/\D/g, "").slice(0, decimals);
  const paddedFraction = sanitizedFraction.padEnd(decimals, "0");

  return BigInt(`${sanitizedWhole}${paddedFraction}`);
}

export function toUnixTimestamp(value: string) {
  return Math.floor(new Date(value).getTime() / 1000);
}
