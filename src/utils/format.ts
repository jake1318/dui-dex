/**
 * @file src/utils/format.ts
 * Current Date and Time (UTC - YYYY-MM-DD HH:MM:SS formatted): 2025-01-26 23:45:29
 * Author: jake1318
 */

export function formatCurrency(amount: bigint, decimals: number): string {
  return (Number(amount) / Math.pow(10, decimals)).toFixed(decimals);
}

export function parseInputAmount(amount: string, decimals: number): bigint {
  return BigInt(Math.floor(parseFloat(amount) * Math.pow(10, decimals)));
}

export function formatPriceImpact(impact: number): string {
  return `${(impact * 100).toFixed(2)}%`;
}
