// src/utils/formatter.ts

import { CONSTANTS } from "./trading";

export function formatNumber(
  value: number,
  decimals: number = CONSTANTS.PRICE_DECIMALS
): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPrice(price: number): string {
  return formatNumber(price, CONSTANTS.PRICE_DECIMALS);
}

export function formatAmount(amount: number): string {
  return formatNumber(amount, CONSTANTS.AMOUNT_DECIMALS);
}

export function formatTotal(total: number): string {
  return formatNumber(total, CONSTANTS.TOTAL_DECIMALS);
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

export function parseNumber(value: string): number {
  return parseFloat(value.replace(/,/g, ""));
}

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function abbreviateNumber(value: number): string {
  const suffixes = ["", "K", "M", "B", "T"];
  const magnitude = Math.floor(Math.log10(Math.abs(value)) / 3);
  const scaled = value / Math.pow(10, magnitude * 3);
  const suffix = suffixes[magnitude];

  return scaled.toFixed(2) + suffix;
}

// src/utils/formatter.ts

export function formatBalance(balance: bigint, decimals: number = 9): string {
  return (Number(balance) / Math.pow(10, decimals)).toFixed(decimals);
}
