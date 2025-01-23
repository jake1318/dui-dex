// src/hooks/useOrderBook.ts

import { useState, useEffect } from "react";
import { OrderBookEntry, Trade } from "./types";
import { useWebSocket } from "./usewebsocket";
import { CONSTANTS } from "./trading";

export function useOrderBook(market: string) {
  const [bids, setBids] = useState<OrderBookEntry[]>([]);
  const [asks, setAsks] = useState<OrderBookEntry[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { isConnected, error } = useWebSocket({
    url: `${CONSTANTS.WEBSOCKET_URL}/orderbook/${market}`,
    onMessage: (data) => {
      if (data.type === "orderbook") {
        const { bids: newBids, asks: newAsks } = data.payload;
        updateOrderBook(newBids, newAsks);
      } else if (data.type === "trade") {
        addTrade(data.payload);
      }
    },
  });

  const updateOrderBook = (
    newBids: OrderBookEntry[],
    newAsks: OrderBookEntry[]
  ) => {
    // Calculate cumulative totals and depth
    const processOrders = (orders: OrderBookEntry[], ascending: boolean) => {
      let cumTotal = 0;
      const maxTotal = Math.max(
        ...orders.map((order) => order.price * order.quantity)
      );

      return orders
        .sort((a, b) => (ascending ? a.price - b.price : b.price - a.price))
        .map((order) => {
          cumTotal += order.quantity;
          return {
            ...order,
            total: cumTotal,
            depth: ((order.price * order.quantity) / maxTotal) * 100,
          };
        });
    };

    setBids(processOrders(newBids, false));
    setAsks(processOrders(newAsks, true));
  };

  const addTrade = (trade: Trade) => {
    setTrades((prev) => [trade, ...prev].slice(0, 50));
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await fetch(
          `${CONSTANTS.API_URL}/orderbook/${market}/snapshot`
        );
        const data = await response.json();
        updateOrderBook(data.bids, data.asks);
        setTrades(data.recentTrades);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch initial orderbook data:", error);
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [market]);

  return {
    bids,
    asks,
    trades,
    isLoading,
    isConnected,
    error,
  };
}
