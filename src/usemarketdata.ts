// src/hooks/useMarketData.ts

import { useState, useEffect } from "react";
import { MarketData, Candlestick } from "./types";
import { useWebSocket } from "./usewebsocket";
import { CONSTANTS } from "./trading";

export function useMarketData(market: string) {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [candlesticks, setCandlesticks] = useState<Candlestick[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { isConnected, error } = useWebSocket({
    url: `${CONSTANTS.WEBSOCKET_URL}/market/${market}`,
    onMessage: (data) => {
      if (data.type === "marketData") {
        setMarketData(data.payload);
      } else if (data.type === "candlestick") {
        setCandlesticks((prev) => [...prev, data.payload].slice(-100));
      }
    },
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch historical candlestick data
        const response = await fetch(
          `${CONSTANTS.API_URL}/market/${market}/candles?interval=1h&limit=100`
        );
        const data = await response.json();
        setCandlesticks(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch initial market data:", error);
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [market]);

  return {
    marketData,
    candlesticks,
    isLoading,
    isConnected,
    error,
  };
}
