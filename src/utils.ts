// src/utils.ts
// Last updated: 2024-01-23 03:50:22 UTC
// Author: jake1318

import { TransactionBlock } from "@mysten/sui.js/transactions";
import { SuiClient } from "@mysten/sui.js/client";

export interface PriceImpact {
  percentage: number;
  severity: "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
  color: string;
}

// Transaction Utilities
export const prepareTransactionBlock = (
  txb: TransactionBlock
): TransactionBlock => {
  return txb as TransactionBlock;
};

export const castToSuiClient = (client: unknown): SuiClient => {
  return client as unknown as SuiClient;
};

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
  PRICE_DECIMALS: 6,
  AMOUNT_DECIMALS: 9,
  DISPLAY_DECIMALS: 6,
  ORDER_BOOK_LEVELS: 15,
  RECENT_TRADES_COUNT: 50,
  GAS_BUDGET: 50000000, // 0.05 SUI
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
  ORDER_TOO_SMALL: "Order size is too small",
  ORDER_TOO_LARGE: "Order size is too large",
  INVALID_PRICE: "Please enter a valid price",
  WALLET_NOT_CONNECTED: "Please connect your wallet",
  INVALID_TRANSACTION: "Invalid transaction configuration",
} as const;

// ... [Previous price impact calculation code remains the same]

// Enhanced formatting functions with type safety
export const formatBalance = (balance: bigint, decimals: number): string => {
  if (balance < 0) return "0.00";
  const balanceString = balance.toString();
  const paddedBalance = balanceString.padStart(decimals + 1, "0");
  const integerPart = paddedBalance.slice(0, -decimals) || "0";
  const fractionalPart = paddedBalance.slice(-decimals);
  return `${integerPart}.${fractionalPart}`;
};

export const formatPrice = (price: number): string => {
  if (isNaN(price) || price < 0) return "0.00";
  return price.toFixed(CONSTANTS.PRICE_DECIMALS);
};

export const formatAmount = (amount: number): string => {
  if (isNaN(amount) || amount < 0) return "0.00";
  return amount.toFixed(CONSTANTS.AMOUNT_DECIMALS);
};

export const formatTimestamp = (timestamp: number): string => {
  if (isNaN(timestamp) || timestamp < 0) return "-";
  return new Date(timestamp).toLocaleTimeString();
};

// Enhanced parsing functions with better error handling
export const parseInputAmount = (
  amount: string,
  decimals: number
): bigint | null => {
  try {
    if (!amount || isNaN(Number(amount)) || Number(amount) < 0) return null;

    const [integer, fraction = ""] = amount.split(".");
    const paddedFraction = fraction.padEnd(decimals, "0").slice(0, decimals);
    const fullAmount = `${integer}${paddedFraction}`;

    return BigInt(fullAmount);
  } catch {
    return null;
  }
};

// Enhanced error handling with type checking
export const getErrorMessage = (error: unknown): string => {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return ERRORS.TRANSACTION_FAILED;
};

// Enhanced notification types and handling
export interface NotificationConfig {
  message: string;
  type: "success" | "error" | "warning" | "info";
  duration?: number;
  id?: string; // Added for unique identification
}

export const createNotification = (
  message: string,
  type: NotificationConfig["type"] = "info",
  duration: number = 5000
): NotificationConfig => {
  return {
    message,
    type,
    duration,
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };
};

// Enhanced order validation with proper type checking
export const validateOrder = (
  price: number,
  amount: number,
  balance: bigint,
  side: "buy" | "sell"
): { isValid: boolean; error?: string } => {
  if (isNaN(amount) || amount <= 0) {
    return { isValid: false, error: ERRORS.INVALID_AMOUNT };
  }

  if (isNaN(price) || price <= 0) {
    return { isValid: false, error: ERRORS.INVALID_PRICE };
  }

  try {
    const orderValue = BigInt(Math.floor(price * amount * 1e9));

    if (side === "buy" && orderValue > balance) {
      return { isValid: false, error: ERRORS.INSUFFICIENT_BALANCE };
    }

    if (side === "sell" && BigInt(Math.floor(amount * 1e9)) > balance) {
      return { isValid: false, error: ERRORS.INSUFFICIENT_BALANCE };
    }

    return { isValid: true };
  } catch {
    return { isValid: false, error: ERRORS.INVALID_AMOUNT };
  }
};

// Enhanced number formatting with type safety
export const abbreviateNumber = (value: number): string => {
  if (isNaN(value)) return "0";
  const suffixes = ["", "K", "M", "B", "T"];
  const magnitude = Math.floor(Math.log10(Math.abs(value)) / 3);
  const scaled = value / Math.pow(10, magnitude * 3);
  const suffix = suffixes[Math.min(magnitude, suffixes.length - 1)];

  return scaled.toFixed(2) + suffix;
};

// New utility functions for transaction handling
export const validateTransactionInput = (
  amount: string,
  price?: string
): { isValid: boolean; error?: string } => {
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    return { isValid: false, error: ERRORS.INVALID_AMOUNT };
  }

  if (
    price !== undefined &&
    (!price || isNaN(Number(price)) || Number(price) <= 0)
  ) {
    return { isValid: false, error: ERRORS.INVALID_PRICE };
  }

  return { isValid: true };
};
// src/utils.ts
// Last updated: 2024-01-23 04:00:48 UTC
// Author: jake1318

// ... [previous imports]

export const calculateGasBudget = (
  _baseAmount: bigint, // Use underscore to indicate unused parameter
  isMarketOrder: boolean
): number => {
  // Convert GAS_BUDGET to number and add 20% buffer for market orders
  const baseGas = Number(CONSTANTS.GAS_BUDGET);
  const gasBuffer = isMarketOrder ? 1.2 : 1.0;
  return Math.floor(baseGas * gasBuffer);
};

export const calculatePriceImpact = (
  inputAmount: bigint,
  outputAmount: bigint,
  poolPrice: number
): PriceImpact => {
  const expectedOutput = Number(inputAmount) * poolPrice;
  const actualOutput = Number(outputAmount);
  const impact =
    Math.abs((expectedOutput - actualOutput) / expectedOutput) * 100;

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
