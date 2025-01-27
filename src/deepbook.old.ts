/**
 * @file deepbook.ts
 * Current Date and Time (UTC - YYYY-MM-DD HH:MM:SS formatted): 2025-01-26 23:40:09
 * Current User's Login: jake1318
 */

import { type SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { ERRORS, type PriceImpact, CONSTANTS, SLIPPAGE } from "./utils";
import {
  type OrderBookEntry as BaseOrderBookEntry,
  type PoolData as BasePoolData,
} from "./types";

export const TOKEN_TYPES = {
  SUI: "0x2::sui::SUI",
  USDC: "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN",
  USDT: "0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN",
  wETH: "0xaf8cd5edc19c4512f4259f0bee101c40768981429d8d886bd645fcd4574cd28d::coin::COIN",
  CETUS:
    "0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS",
  WBTC: "0x027792d9fed7f9844eb4839566001bb6f6cb4804f66d4a1eab95843c9a8aa98c::coin::COIN",
} as const;

export const DEEPBOOK = {
  PACKAGE_ID:
    "0x000000000000000000000000000000000000000000000000000000000000dee9",
  REGISTRY:
    "0xc43d77f51a52e046f150d05f3f23dba49bb3561ba424dcd6396b6707120c2fcd",
  POOLS: new Map<string, string>(),
  DECIMALS: {
    SUI: 9,
    USDC: 6,
    USDT: 6,
    wETH: 8,
    CETUS: 9,
    WBTC: 8,
  },
  RETRIES: {
    MAX_ATTEMPTS: 3,
    DELAY_MS: 1000,
  },
  initializing: false,
  initialized: false,
} as const;

// Interfaces
export interface OrderBookEntry extends BaseOrderBookEntry {
  size: number;
}

export interface PoolData extends BasePoolData {
  calculateOutputAmount: (
    inputAmount: bigint,
    fromToken: string,
    toToken: string
  ) => Promise<bigint>;
}

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

export interface PoolPair {
  baseToken: string;
  quoteToken: string;
  poolId: string;
  symbol: string;
  baseDecimals: number;
  quoteDecimals: number;
  lastUpdated?: number;
  liquidity?: {
    base: bigint;
    quote: bigint;
  };
}

interface PoolDiscoveryResult {
  poolId: string;
  isValid: boolean;
  error?: string;
}

export interface DeepBookState {
  availablePairs: PoolPair[];
  initialized: boolean;
  lastUpdated: number;
}

// Helper Functions
function calculateMinimumOutput(amount: bigint, slippage: number): bigint {
  return amount - (amount * BigInt(Math.floor(slippage * 100))) / BigInt(10000);
}

async function findPoolWithRetry(
  client: SuiClient,
  baseToken: string,
  quoteToken: string,
  attempt: number = 1
): Promise<PoolDiscoveryResult> {
  try {
    const txb = new TransactionBlock();

    txb.moveCall({
      target: `${DEEPBOOK.PACKAGE_ID}::pool::get_pool_id_by_asset`,
      typeArguments: [baseToken, quoteToken],
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
        return { poolId, isValid: true };
      } else {
        throw new Error("Pool ID found but pool data is invalid");
      }
    }

    throw new Error("Failed to get pool ID from registry");
  } catch (error) {
    if (attempt < DEEPBOOK.RETRIES.MAX_ATTEMPTS) {
      await new Promise((resolve) =>
        setTimeout(resolve, DEEPBOOK.RETRIES.DELAY_MS * attempt)
      );
      return findPoolWithRetry(client, baseToken, quoteToken, attempt + 1);
    }

    return {
      poolId: "",
      isValid: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
async function discoverAllPools(client: SuiClient): Promise<PoolPair[]> {
  const tokens = Object.entries(TOKEN_TYPES);
  const pairs: PoolPair[] = [];

  for (let i = 0; i < tokens.length; i++) {
    for (let j = i + 1; j < tokens.length; j++) {
      const [baseSymbol, baseToken] = tokens[i];
      const [quoteSymbol, quoteToken] = tokens[j];

      try {
        const poolResult = await findPoolWithRetry(
          client,
          baseToken,
          quoteToken
        );
        if (poolResult.isValid && poolResult.poolId) {
          const poolData = await getPoolData(client, poolResult.poolId);
          pairs.push({
            baseToken,
            quoteToken,
            poolId: poolResult.poolId,
            symbol: `${baseSymbol}/${quoteSymbol}`,
            baseDecimals:
              DEEPBOOK.DECIMALS[baseSymbol as keyof typeof DEEPBOOK.DECIMALS],
            quoteDecimals:
              DEEPBOOK.DECIMALS[quoteSymbol as keyof typeof DEEPBOOK.DECIMALS],
            lastUpdated: Date.now(),
            liquidity: poolData
              ? {
                  base: poolData.baseBalance,
                  quote: poolData.quoteBalance,
                }
              : undefined,
          });
        }

        // Check reverse pair
        const reversePoolResult = await findPoolWithRetry(
          client,
          quoteToken,
          baseToken
        );
        if (reversePoolResult.isValid && reversePoolResult.poolId) {
          const poolData = await getPoolData(client, reversePoolResult.poolId);
          pairs.push({
            baseToken: quoteToken,
            quoteToken: baseToken,
            poolId: reversePoolResult.poolId,
            symbol: `${quoteSymbol}/${baseSymbol}`,
            baseDecimals:
              DEEPBOOK.DECIMALS[quoteSymbol as keyof typeof DEEPBOOK.DECIMALS],
            quoteDecimals:
              DEEPBOOK.DECIMALS[baseSymbol as keyof typeof DEEPBOOK.DECIMALS],
            lastUpdated: Date.now(),
            liquidity: poolData
              ? {
                  base: poolData.baseBalance,
                  quote: poolData.quoteBalance,
                }
              : undefined,
          });
        }
      } catch (error) {
        console.warn(
          `Failed to discover pool for ${baseSymbol}/${quoteSymbol}:`,
          error
        );
      }
    }
  }

  return pairs;
}

// Main Functions
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
    const poolData: PoolData = {
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
      calculateOutputAmount: async (
        inputAmount: bigint,
        fromToken: string,
        toToken: string
      ): Promise<bigint> => {
        const price =
          fromToken === content.base_asset
            ? Number(poolData.quoteBalance) / Number(poolData.baseBalance)
            : Number(poolData.baseBalance) / Number(poolData.quoteBalance);

        return BigInt(Math.floor(Number(inputAmount) * price));
      },
    };

    return poolData;
  } catch (error) {
    console.error("Error fetching pool data:", error);
    return null;
  }
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

export function calculatePriceImpact(
  inputAmount: bigint,
  outputAmount: bigint,
  poolData: PoolData
): PriceImpact {
  const expectedPrice =
    Number(poolData.quoteBalance) / Number(poolData.baseBalance);
  const expectedOutput = Number(inputAmount) * expectedPrice;
  const actualOutput = Number(outputAmount);
  const impact =
    Math.abs((expectedOutput - actualOutput) / expectedOutput) * 100;

  if (impact <= CONSTANTS.PRICE_IMPACT_THRESHOLDS.LOW) {
    return {
      percentage: impact,
      severity: "LOW",
      color: "#4CAF50",
    };
  } else if (impact <= CONSTANTS.PRICE_IMPACT_THRESHOLDS.MEDIUM) {
    return {
      percentage: impact,
      severity: "MEDIUM",
      color: "#FFC107",
    };
  } else if (impact <= CONSTANTS.PRICE_IMPACT_THRESHOLDS.HIGH) {
    return {
      percentage: impact,
      severity: "HIGH",
      color: "#FF9800",
    };
  } else {
    return {
      percentage: impact,
      severity: "VERY_HIGH",
      color: "#F44336",
    };
  }
}

export function createSwapTransaction(
  txb: TransactionBlock,
  fromToken: string,
  toToken: string,
  amount: bigint,
  slippage: number
): TransactionBlock {
  const poolId = getPoolIdForPair(fromToken, toToken);
  if (!poolId) throw new Error("Pool not found for token pair");

  const minimumOutput = calculateMinimumOutput(amount, slippage);

  if (fromToken === TOKEN_TYPES.SUI) {
    const [coin] = txb.splitCoins(txb.gas, [txb.pure(amount)]);
    txb.moveCall({
      target: `${DEEPBOOK.PACKAGE_ID}::pool::swap_sui_to_token`,
      arguments: [
        txb.object(poolId),
        coin,
        txb.pure(amount),
        txb.pure(minimumOutput),
      ],
    });
  } else {
    txb.moveCall({
      target: `${DEEPBOOK.PACKAGE_ID}::pool::swap_token_to_sui`,
      arguments: [
        txb.object(poolId),
        txb.pure(amount),
        txb.pure(minimumOutput),
      ],
    });
  }

  return txb;
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

export async function initializeDeepBook(
  client: SuiClient,
  maxRetries: number = 3
): Promise<boolean> {
  if (DEEPBOOK.POOLS.initializing) {
    throw new Error("Pool discovery already in progress");
  }

  try {
    DEEPBOOK.POOLS.initializing = true;

    const pairs = await discoverAllPools(client);

    DEEPBOOK.POOLS.clear();
    for (const pair of pairs) {
      DEEPBOOK.POOLS.set(pair.symbol, pair.poolId);
    }

    localStorage.setItem("deepbook_pairs", JSON.stringify(pairs));
    localStorage.setItem("deepbook_last_updated", Date.now().toString());

    DEEPBOOK.POOLS.initialized = true;
    console.log(`Initialized ${pairs.length} DeepBook pools`);

    return true;
  } catch (error) {
    console.error("Failed to initialize DeepBook pools:", error);
    return false;
  } finally {
    DEEPBOOK.POOLS.initializing = false;
  }
}

export function getAvailablePairs(): PoolPair[] {
  const pairsData = localStorage.getItem("deepbook_pairs");
  if (!pairsData) return [];

  try {
    return JSON.parse(pairsData);
  } catch (error) {
    console.error("Error parsing available pairs:", error);
    return [];
  }
}

export function getPoolIdForPair(
  baseToken: string,
  quoteToken: string
): string | null {
  const pairs = getAvailablePairs();
  const pair = pairs.find(
    (p) =>
      (p.baseToken === baseToken && p.quoteToken === quoteToken) ||
      (p.baseToken === quoteToken && p.quoteToken === baseToken)
  );
  return pair?.poolId || null;
}

export function isDeepBookInitialized(): boolean {
  return DEEPBOOK.POOLS.initialized && DEEPBOOK.POOLS.size > 0;
}
