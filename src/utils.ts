/**
 * @file utils.ts
 * Created: 2025-01-22 05:16:58 UTC
 * Author: jake1318
 */

export interface PriceImpact {
  percentage: number;
  severity: "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
  color: string;
}

export const SLIPPAGE = {
  MIN: 0.001, // 0.1%
  MAX: 0.5, // 50%
  WARN_HIGH: 0.05, // 5%
  WARN_LOW: 0.001, // 0.1%
  DEFAULT: 0.01, // 1%
} as const;

export const CONSTANTS = {
  MIN_LIQUIDITY_USDC: BigInt(1000000), // 1 USDC
  MAX_SLIPPAGE: 50, // 50%
  PRICE_IMPACT_THRESHOLDS: {
    LOW: 1, // 1%
    MEDIUM: 3, // 3%
    HIGH: 5, // 5%
  },
  REFRESH_INTERVAL: 10000, // 10 seconds
} as const;

export const ERRORS = {
  INSUFFICIENT_BALANCE: "Insufficient balance for swap",
  HIGH_PRICE_IMPACT: "Warning: High price impact on this trade",
  LOW_LIQUIDITY: "Insufficient liquidity in pool",
  SLIPPAGE_TOO_HIGH: "Transaction may fail due to high slippage",
  POOL_NOT_FOUND: "Trading pool not found or not initialized",
  INVALID_AMOUNT: "Please enter a valid amount",
  MINIMUM_AMOUNT: "Amount below minimum tradeable value",
  NETWORK_ERROR: "Network error, please try again",
  TRANSACTION_FAILED: "Transaction failed, please try again",
} as const;

export const calculatePriceImpact = (
  inputAmount: bigint,
  outputAmount: bigint,
  poolPrice: bigint
): PriceImpact => {
  const expectedOutput = (inputAmount * poolPrice) / BigInt(1e9);
  const impact =
    Number(((expectedOutput - outputAmount) * BigInt(10000)) / expectedOutput) /
    100;

  if (impact <= CONSTANTS.PRICE_IMPACT_THRESHOLDS.LOW) {
    return {
      percentage: impact,
      severity: "LOW",
      color: "text-green-500",
    };
  } else if (impact <= CONSTANTS.PRICE_IMPACT_THRESHOLDS.MEDIUM) {
    return {
      percentage: impact,
      severity: "MEDIUM",
      color: "text-yellow-500",
    };
  } else if (impact <= CONSTANTS.PRICE_IMPACT_THRESHOLDS.HIGH) {
    return {
      percentage: impact,
      severity: "HIGH",
      color: "text-orange-500",
    };
  } else {
    return {
      percentage: impact,
      severity: "VERY_HIGH",
      color: "text-red-500",
    };
  }
};

export const formatBalance = (balance: bigint, decimals: number): string => {
  const balanceString = balance.toString();
  const paddedBalance = balanceString.padStart(decimals + 1, "0");
  const integerPart = paddedBalance.slice(0, -decimals) || "0";
  const fractionalPart = paddedBalance.slice(-decimals);
  return `${integerPart}.${fractionalPart}`;
};

export const parseInputAmount = (
  amount: string,
  decimals: number
): bigint | null => {
  try {
    if (!amount || isNaN(Number(amount))) return null;

    const [integer, fraction = ""] = amount.split(".");
    const paddedFraction = fraction.padEnd(decimals, "0").slice(0, decimals);
    const fullAmount = `${integer}${paddedFraction}`;

    return BigInt(fullAmount);
  } catch {
    return null;
  }
};

export const getErrorMessage = (error: any): string => {
  if (typeof error === "string") return error;
  if (error?.message) return error.message;
  return ERRORS.TRANSACTION_FAILED;
};

export const formatPriceImpactMessage = (priceImpact: PriceImpact): string => {
  return `Price Impact: ${priceImpact.percentage.toFixed(2)}% (${
    priceImpact.severity
  })`;
};

export interface NotificationConfig {
  message: string;
  type: "success" | "error" | "warning" | "info";
  duration?: number;
}

export const createNotification = (
  message: string,
  type: "success" | "error" | "warning" | "info" = "info",
  duration: number = 5000
): NotificationConfig => {
  return {
    message,
    type,
    duration,
  };
};
