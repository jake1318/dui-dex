/**
 * @file src/config/deepbook.ts
 * Current Date and Time (UTC - YYYY-MM-DD HH:MM:SS formatted): 2025-01-26 23:47:24
 * Current User's Login: jake1318
 */

import { getFullnodeUrl } from "@mysten/sui.js/client";
import { DeepBookClient } from "@mysten/deepbook-v3";
import { SuiClient } from "@mysten/sui.js/client";
import { TransactionBlock } from "@mysten/sui.js/transactions";

// Network Configuration
export const NETWORK = process.env.NEXT_PUBLIC_NETWORK || "mainnet";

export const SUI_NETWORK_CONFIG = {
  mainnet: {
    url: getFullnodeUrl("mainnet"),
    websocketUrl: "wss://mainnet.sui.io:443",
  },
  testnet: {
    url: getFullnodeUrl("testnet"),
    websocketUrl: "wss://testnet.sui.io:443",
  },
} as const;

// DeepBook V3 Configuration
export const DEEPBOOK = {
  PACKAGE_ID:
    "0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270",
  REGISTRY:
    "0xc43d77f51a52e046f150d05f3f23dba49bb3561ba424dcd6396b6707120c2fcd",
  DEEP_TOKEN:
    "0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP",
} as const;

// Token Configuration
export const TOKENS = {
  SUI: {
    type: "0x2::sui::SUI",
    decimals: 9,
    symbol: "SUI",
  },
  USDC: {
    type: "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN",
    decimals: 6,
    symbol: "USDC",
  },
  USDT: {
    type: "0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN",
    decimals: 6,
    symbol: "USDT",
  },
  DEEP: {
    type: DEEPBOOK.DEEP_TOKEN,
    decimals: 9,
    symbol: "DEEP",
  },
} as const;

// Fee Configuration
export const BASE_FEE_IN_BP = {
  STABLE: 5, // 0.05%
  VOLATILE: 50, // 0.5%
} as const;

// Pool Configuration
export const POOL_PAIRS = [
  {
    baseToken: TOKENS.SUI.type,
    quoteToken: TOKENS.USDC.type,
    isStable: false,
  },
  {
    baseToken: TOKENS.SUI.type,
    quoteToken: TOKENS.USDT.type,
    isStable: false,
  },
  // Add more pairs as needed
] as const;

// Interfaces
export interface TokenInfo {
  type: string;
  decimals: number;
  symbol: string;
}

export interface PoolInfo {
  baseToken: TokenInfo;
  quoteToken: TokenInfo;
  isStable: boolean;
  poolId?: string;
}

export interface SwapQuote {
  baseAmount: bigint;
  quoteAmount: bigint;
  price: number;
  priceImpact: number;
  fee: bigint;
}

// DeepBook Service Class
export class DeepBookService {
  private static instance: DeepBookService;
  private client: DeepBookClient;
  private suiClient: SuiClient;
  private poolCache: Map<string, string> = new Map();

  private constructor() {
    this.suiClient = new SuiClient({ url: SUI_NETWORK_CONFIG[NETWORK].url });
    this.client = new DeepBookClient({
      client: this.suiClient,
      env: NETWORK,
    });
  }

  public static getInstance(): DeepBookService {
    if (!DeepBookService.instance) {
      DeepBookService.instance = new DeepBookService();
    }
    return DeepBookService.instance;
  }

  public getClient(): DeepBookClient {
    return this.client;
  }

  public getSuiClient(): SuiClient {
    return this.suiClient;
  }

  public async getPoolId(
    baseToken: string,
    quoteToken: string
  ): Promise<string | undefined> {
    const key = `${baseToken}:${quoteToken}`;
    if (this.poolCache.has(key)) {
      return this.poolCache.get(key);
    }

    try {
      const poolId = await this.client.getPoolId(baseToken, quoteToken);
      if (poolId) {
        this.poolCache.set(key, poolId);
      }
      return poolId;
    } catch (error) {
      console.error("Failed to get pool ID:", error);
      return undefined;
    }
  }

  public async createSwapTransaction({
    txb,
    baseToken,
    quoteToken,
    amount,
    slippage,
    isSelling,
  }: {
    txb: TransactionBlock;
    baseToken: string;
    quoteToken: string;
    amount: bigint;
    slippage: number;
    isSelling: boolean;
  }) {
    const poolId = await this.getPoolId(baseToken, quoteToken);
    if (!poolId) {
      throw new Error("Pool not found");
    }

    return this.client.createSwapTransaction({
      txb,
      poolId,
      amount,
      baseAssetType: baseToken,
      quoteAssetType: quoteToken,
      slippage,
      isSelling,
    });
  }

  public async getQuote(
    baseToken: string,
    quoteToken: string,
    amount: bigint,
    isSelling: boolean = true
  ): Promise<SwapQuote | null> {
    try {
      const quote = await this.client.getQuote(
        baseToken,
        quoteToken,
        amount,
        isSelling
      );
      if (!quote) return null;

      return {
        baseAmount: quote.baseAmount,
        quoteAmount: quote.quoteAmount,
        price: Number(quote.price),
        priceImpact: Number(quote.priceImpact),
        fee: quote.fee,
      };
    } catch (error) {
      console.error("Failed to get quote:", error);
      return null;
    }
  }
}

// Export singleton instance
export default DeepBookService.getInstance();
