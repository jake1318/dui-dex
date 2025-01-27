/**
 * @file src/hooks/useDeepBook.ts
 * Current Date and Time (UTC - YYYY-MM-DD HH:MM:SS formatted): 2025-01-26 23:45:29
 * Author: jake1318
 */

import { useEffect, useState } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import DeepBookService from "../config/deepbook";
import { TOKENS } from "../config/deepbook";
import type { PoolState } from "@mysten/deepbook-v3";

export interface UseDeepBookReturn {
  pools: Map<string, PoolState>;
  loading: boolean;
  error: Error | null;
  refreshPools: () => Promise<void>;
  getPoolState: (
    baseToken: string,
    quoteToken: string
  ) => PoolState | undefined;
}

export function useDeepBook(): UseDeepBookReturn {
  const [pools, setPools] = useState<Map<string, PoolState>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const account = useCurrentAccount();
  const client = DeepBookService.getClient();

  const loadPools = async () => {
    try {
      setLoading(true);
      const poolStates = new Map<string, PoolState>();

      // Load all supported token pairs
      const supportedPairs = [
        { base: TOKENS.SUI.type, quote: TOKENS.USDC.type },
        { base: TOKENS.SUI.type, quote: TOKENS.USDT.type },
        // Add more pairs as needed
      ];

      for (const pair of supportedPairs) {
        try {
          const pool = await client.getPoolState(pair.base, pair.quote);
          if (pool) {
            poolStates.set(`${pair.base}:${pair.quote}`, pool);
          }
        } catch (err) {
          console.warn(
            `Failed to load pool for ${pair.base}/${pair.quote}:`,
            err
          );
        }
      }

      setPools(poolStates);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load pools"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPools();
    // Refresh pools every 30 seconds
    const interval = setInterval(loadPools, 30000);
    return () => clearInterval(interval);
  }, [account?.address]);

  const getPoolState = (
    baseToken: string,
    quoteToken: string
  ): PoolState | undefined => {
    return pools.get(`${baseToken}:${quoteToken}`);
  };

  return {
    pools,
    loading,
    error,
    refreshPools: loadPools,
    getPoolState,
  };
}
