/**
 * @file RecentTrades.tsx
 * Last updated: 2025-01-24 03:00:29
 * Author: jake1318
 */

import { useEffect, useState } from "react";
import { Trade } from "./types";
import { formatPrice, formatAmount, formatTimestamp } from "./formatter";

interface RecentTradesProps {
  trades: Trade[];
  maxHeight?: string;
}

export function RecentTrades({
  trades,
  maxHeight = "400px",
}: RecentTradesProps) {
  const [animatedTrades, setAnimatedTrades] = useState<Trade[]>(trades);

  useEffect(() => {
    setAnimatedTrades(trades);
  }, [trades]);

  return (
    <div className="recent-trades-container">
      <div className="trades-header">
        <div className="column-labels">
          <div className="label">Price (USDC)</div>
          <div className="label text-right">Amount (SUI)</div>
          <div className="label text-right">Total (USDC)</div>
          <div className="label text-right">Time</div>
        </div>
      </div>

      <div className="trades-content" style={{ maxHeight }}>
        {animatedTrades.map((trade) => (
          <div key={trade.id} className={`trade-row ${trade.side}`}>
            <div className="price">{formatPrice(trade.price)}</div>
            <div className="amount">{formatAmount(trade.quantity)}</div>
            <div className="total">
              {formatPrice(trade.price * trade.quantity)}
            </div>
            <div className="timestamp">{formatTimestamp(trade.timestamp)}</div>
          </div>
        ))}

        {animatedTrades.length === 0 && (
          <div className="no-trades">No trades yet</div>
        )}
      </div>
    </div>
  );
}

export function RecentTradesLoading() {
  return (
    <div className="recent-trades-container">
      <div className="trades-header">
        <div className="column-labels">
          <div className="label">Price (USDC)</div>
          <div className="label text-right">Amount (SUI)</div>
          <div className="label text-right">Total (USDC)</div>
          <div className="label text-right">Time</div>
        </div>
      </div>

      <div className="trades-loading">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="loading-row">
            <div className="loading-item" />
            <div className="loading-item" />
            <div className="loading-item" />
            <div className="loading-item" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ... (keep all the existing utility functions)

export function aggregateTrades(
  trades: Trade[],
  interval: number = 1000
): Trade[] {
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

  return Array.from(aggregatedTrades.values()).sort(
    (a, b) => b.timestamp - a.timestamp
  );
}

export interface TradeHistoryFilters {
  startTime?: number;
  endTime?: number;
  minPrice?: number;
  maxPrice?: number;
  minQuantity?: number;
  maxQuantity?: number;
}

export function filterTrades(
  trades: Trade[],
  filters: TradeHistoryFilters
): Trade[] {
  return trades.filter((trade) => {
    if (filters.startTime && trade.timestamp < filters.startTime) return false;
    if (filters.endTime && trade.timestamp > filters.endTime) return false;
    if (filters.minPrice && trade.price < filters.minPrice) return false;
    if (filters.maxPrice && trade.price > filters.maxPrice) return false;
    if (filters.minQuantity && trade.quantity < filters.minQuantity)
      return false;
    if (filters.maxQuantity && trade.quantity > filters.maxQuantity)
      return false;
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
