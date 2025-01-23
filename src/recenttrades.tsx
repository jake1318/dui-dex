// src/components/RecentTrades.tsx

import { useEffect, useState } from 'react';
import { Trade } from './types';  // Updated import path
import { formatPrice, formatAmount, formatTimestamp } from './formatter';  // Updated import path

interface RecentTradesProps {
  trades: Trade[];
  maxHeight?: string;
}

export function RecentTrades({ trades, maxHeight = '400px' }: RecentTradesProps) {
  const [animatedTrades, setAnimatedTrades] = useState<Trade[]>(trades);

  useEffect(() => {
    setAnimatedTrades(trades);
  }, [trades]);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Recent Trades</h3>
      </div>

      <div className="grid grid-cols-4 text-sm font-semibold mb-2 px-2">
        <div>Price (USDC)</div>
        <div className="text-right">Amount (SUI)</div>
        <div className="text-right">Total (USDC)</div>
        <div className="text-right">Time</div>
      </div>

      <div className="overflow-y-auto" style={{ maxHeight }}>
        {animatedTrades.map((trade) => (
          <div
            key={trade.id}
            className={`grid grid-cols-4 text-sm border-b border-gray-700 py-2 px-2 
              ${trade.side === 'buy' ? 'text-green-500' : 'text-red-500'}
              transition-all duration-300 ease-in-out transform hover:bg-gray-700`}
          >
            <div className="font-medium">
              {formatPrice(trade.price)}
            </div>
            <div className="text-right">
              {formatAmount(trade.quantity)}
            </div>
            <div className="text-right">
              {formatPrice(trade.price * trade.quantity)}
            </div>
            <div className="text-right text-gray-400">
              {formatTimestamp(trade.timestamp)}
            </div>
          </div>
        ))}

        {animatedTrades.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            No trades yet
          </div>
        )}
      </div>
    </div>
  );
}

export function RecentTradesLoading() {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Recent Trades</h3>
      </div>

      <div className="grid grid-cols-4 text-sm font-semibold mb-2 px-2">
        <div>Price (USDC)</div>
        <div className="text-right">Amount (SUI)</div>
        <div className="text-right">Total (USDC)</div>
        <div className="text-right">Time</div>
      </div>

      <div className="animate-pulse">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-4 text-sm border-b border-gray-700 py-2 px-2"
          >
            <div className="h-4 bg-gray-700 rounded w-20"></div>
            <div className="h-4 bg-gray-700 rounded w-16 ml-auto"></div>
            <div className="h-4 bg-gray-700 rounded w-24 ml-auto"></div>
            <div className="h-4 bg-gray-700 rounded w-16 ml-auto"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function aggregateTrades(trades: Trade[], interval: number = 1000): Trade[] {
  const aggregatedTrades = new Map<string, Trade>();

  trades.forEach((trade) => {
    const roundedTimestamp = Math.floor(trade.timestamp / interval) * interval;
    const key = `${trade.price}-${roundedTimestamp}`;

    if (aggregatedTrades.has(key)) {
      const existing = aggregatedTrades.get(key)!;
      aggregatedTrades.set(key, {
        ...existing,
        quantity: existing.quantity + trade.quantity,
      });
    } else {
      aggregatedTrades.set(key, {
        ...trade,
        timestamp: roundedTimestamp,
      });
    }
  });

  return Array.from(aggregatedTrades.values())
    .sort((a, b) => b.timestamp - a.timestamp);
}

export interface TradeHistoryFilters {
  startTime?: number;
  endTime?: number;
  minPrice?: number;
  maxPrice?: number;
  minQuantity?: number;
  maxQuantity?: number;
}

export function filterTrades(trades: Trade[], filters: TradeHistoryFilters): Trade[] {
  return trades.filter((trade) => {
    if (filters.startTime && trade.timestamp < filters.startTime) return false;
    if (filters.endTime && trade.timestamp > filters.endTime) return false;
    if (filters.minPrice && trade.price < filters.minPrice) return false;
    if (filters.maxPrice && trade.price > filters.maxPrice) return false;
    if (filters.minQuantity && trade.quantity < filters.minQuantity) return false;
    if (filters.maxQuantity && trade.quantity > filters.maxQuantity) return false;
    return true;
  });
}

export function calculateTradeStatistics(trades: Trade[]) {
  if (trades.length === 0) {
    return {
      volume24h: 0,
      trades24h: 0,
      highPrice24h: 0,
      lowPrice24h: 0,
      averagePrice24h: 0,
    };
  }

  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const last24hTrades = trades.filter((t) => t.timestamp >= oneDayAgo);

  const volume24h = last24hTrades.reduce(
    (sum, trade) => sum + trade.price * trade.quantity,
    0
  );

  const prices = last24hTrades.map((t) => t.price);

  return {
    volume24h,
    trades24h: last24hTrades.length,
    highPrice24h: prices.length ? Math.max(...prices) : 0,
    lowPrice24h: prices.length ? Math.min(...prices) : 0,
    averagePrice24h: last24hTrades.length
      ? volume24h / last24hTrades.reduce((sum, t) => sum + t.quantity, 0)
      : 0,
  };
}