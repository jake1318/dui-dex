/**
 * @file deepbook.ts
 * Last updated: 2025-01-23 04:10:46 UTC
 * Author: jake1318
 */

import { type SuiClient } from "@mysten/sui.js/client";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { ERRORS, type PriceImpact, CONSTANTS, SLIPPAGE } from "./utils";
import {
  type OrderBookEntry as BaseOrderBookEntry,
  type PoolData as BasePoolData,
} from "./types";

export const TOKEN_TYPES = {
  SUI: "0x2::sui::SUI",
  USDC: "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN",
  DEEP: "0x4e0629fa51a62b0c1d7c7b9fc89237ec5b6f630d7798ad3f06d820afb93a995a::coin::COIN",
} as const;

export const DEEPBOOK = {
  PACKAGE_ID:
    "0x000000000000000000000000000000000000000000000000000000000000dee9",
  REGISTRY:
    "0xc43d77f51a52e046f150d05f3f23dba49bb3561ba424dcd6396b6707120c2fcd",
  POOLS: {
    USDC_SUI: "", // Will be populated by getDeepBookPoolIds
  },
} as const;

// Extend the base OrderBookEntry type with DeepBook specific fields
export interface OrderBookEntry extends BaseOrderBookEntry {
  size: number;
}

// Use the base PoolData type
export type PoolData = BasePoolData;

export interface PoolState {
  isActive: boolean;
  hasLiquidity: boolean;
  minLiquidity: bigint;
}

export interface SlippageValidation {
  isValid: boolean;
  warning?: string;
  error?: string;
}

export function validateSlippage(slippagePercent: number): SlippageValidation {
  const slippage = slippagePercent / 100;

  if (isNaN(slippage) || slippage <= 0) {
    return {
      isValid: false,
      error: "Slippage must be greater than 0",
    };
  }

  if (slippage >= SLIPPAGE.MAX) {
    return {
      isValid: false,
      error: `Slippage cannot exceed ${SLIPPAGE.MAX * 100}%`,
    };
  }

  if (slippage <= SLIPPAGE.WARN_LOW) {
    return {
      isValid: true,
      warning: "Low slippage may cause failed transactions",
    };
  }

  if (slippage >= SLIPPAGE.WARN_HIGH) {
    return {
      isValid: true,
      warning: "High slippage may result in significant losses",
    };
  }

  return { isValid: true };
}

export async function checkPoolState(
  client: SuiClient,
  poolId: string
): Promise<PoolState> {
  const poolData = await getPoolData(client, poolId);

  if (!poolData) {
    return {
      isActive: false,
      hasLiquidity: false,
      minLiquidity: BigInt(0),
    };
  }

  const minLiquidity = CONSTANTS.MIN_LIQUIDITY_USDC;
  const hasLiquidity =
    poolData.baseBalance > BigInt(0) && poolData.quoteBalance > minLiquidity;

  return {
    isActive: true,
    hasLiquidity,
    minLiquidity,
  };
}

export async function validateSwap(
  client: SuiClient,
  poolId: string,
  inputAmount: bigint,
  userBalance: bigint,
  slippageTolerance: number
): Promise<{
  isValid: boolean;
  error?: string;
  priceImpact?: PriceImpact;
}> {
  if (userBalance < inputAmount) {
    return { isValid: false, error: ERRORS.INSUFFICIENT_BALANCE };
  }

  const slippageValidation = validateSlippage(slippageTolerance * 100);
  if (!slippageValidation.isValid) {
    return { isValid: false, error: slippageValidation.error };
  }

  const poolState = await checkPoolState(client, poolId);
  if (!poolState.isActive) {
    return { isValid: false, error: ERRORS.POOL_NOT_FOUND };
  }
  if (!poolState.hasLiquidity) {
    return { isValid: false, error: ERRORS.LOW_LIQUIDITY };
  }

  const poolData = await getPoolData(client, poolId);
  if (!poolData) {
    return { isValid: false, error: ERRORS.POOL_NOT_FOUND };
  }

  const { estimatedOutput } = calculateOutputWithSlippage(
    inputAmount,
    poolData,
    slippageTolerance
  );

  const impact = calculateLocalPriceImpact(
    inputAmount,
    estimatedOutput,
    poolData.quoteBalance,
    poolData.baseBalance
  );

  if (impact.severity === "VERY_HIGH") {
    return {
      isValid: false,
      error: ERRORS.HIGH_PRICE_IMPACT,
      priceImpact: impact,
    };
  }

  return { isValid: true, priceImpact: impact };
}

function calculateLocalPriceImpact(
  inputAmount: bigint,
  outputAmount: bigint,
  quoteBalance: bigint,
  baseBalance: bigint
): PriceImpact {
  const expectedPrice = Number(quoteBalance) / Number(baseBalance);
  const expectedOutput = Number(inputAmount) * expectedPrice;
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
}

export async function getDeepBookPoolIds(client: SuiClient): Promise<void> {
  try {
    const txb = new TransactionBlock();

    txb.moveCall({
      target: `${DEEPBOOK.PACKAGE_ID}::pool::get_pool_id_by_asset`,
      typeArguments: [TOKEN_TYPES.SUI, TOKEN_TYPES.USDC],
      arguments: [txb.object(DEEPBOOK.REGISTRY)],
    });

    const result = await client.devInspectTransactionBlock({
      transactionBlock: txb,
      sender:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
    });

    if (
      result.effects?.status.status === "success" &&
      result.results?.[0]?.returnValues?.[0]
    ) {
      const poolIdData = result.results[0].returnValues[0];
      const poolId = (
        Array.isArray(poolIdData) ? poolIdData[0] : poolIdData
      ).toString();

      const poolData = await getPoolData(client, poolId);

      if (poolData) {
        (DEEPBOOK.POOLS as any).USDC_SUI = poolId;
      } else {
        throw new Error("Pool ID found but pool does not exist");
      }
    } else {
      throw new Error("Failed to get pool ID from registry");
    }
  } catch (error) {
    console.error("Error getting DeepBook pool IDs:", error);
    throw error;
  }
}

export async function getPoolData(
  client: SuiClient,
  poolId: string
): Promise<PoolData | null> {
  try {
    const response = await client.getObject({
      id: poolId,
      options: { showContent: true },
    });

    if (!response.data?.content || !("content" in response.data)) {
      return null;
    }

    const content = response.data.content as any;
    return {
      baseToken: content.base_asset,
      quoteToken: content.quote_asset,
      tickSize: BigInt(content.tick_size),
      lotSize: BigInt(content.lot_size),
      baseBalance: BigInt(content.base_custodian.total_supply),
      quoteBalance: BigInt(content.quote_custodian.total_supply),
      baseReserve: BigInt(content.base_custodian.total_supply),
      quoteReserve: BigInt(content.quote_custodian.total_supply),
      bids:
        content.bids?.map((bid: any) => ({
          price: Number(bid.price),
          size: Number(bid.size),
          quantity: Number(bid.size),
          total: Number(bid.price) * Number(bid.size),
          depth: 0,
        })) || [],
      asks:
        content.asks?.map((ask: any) => ({
          price: Number(ask.price),
          size: Number(ask.size),
          quantity: Number(ask.size),
          total: Number(ask.price) * Number(ask.size),
          depth: 0,
        })) || [],
    };
  } catch (error) {
    console.error("Error fetching pool data:", error);
    return null;
  }
}

export function calculateOutputWithSlippage(
  inputAmount: bigint,
  poolData: PoolData,
  slippageTolerance: number
): {
  estimatedOutput: bigint;
  minimumOutput: bigint;
} {
  const price = Number(poolData.quoteBalance) / Number(poolData.baseBalance);
  const estimatedOutput = BigInt(Math.floor(Number(inputAmount) * price));
  const minimumOutput =
    estimatedOutput -
    (estimatedOutput * BigInt(Math.floor(slippageTolerance * 100))) /
      BigInt(100);

  return {
    estimatedOutput,
    minimumOutput,
  };
}

export async function initializeDeepBook(client: SuiClient): Promise<void> {
  try {
    await getDeepBookPoolIds(client);

    const poolData = await getPoolData(client, DEEPBOOK.POOLS.USDC_SUI);
    if (!poolData) {
      throw new Error("Failed to fetch pool data after initialization");
    }
  } catch (error) {
    console.error("Failed to initialize DeepBook:", error);
    throw error;
  }
}
