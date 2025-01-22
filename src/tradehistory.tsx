import { format, formatDistance } from "date-fns";
import { useState, useEffect, useMemo } from "react";
import type { Trade } from "./orderbooks";

interface TradeHistoryProps {
  trades: Trade[];
}

type TimeFormat = "time" | "relative";
type SortOrder = "desc" | "asc";

export function TradeHistory({ trades }: TradeHistoryProps) {
  const [timeFormat, setTimeFormat] = useState<TimeFormat>("time");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [filterSide, setFilterSide] = useState<"all" | "buy" | "sell">("all");

  // Format price with appropriate decimals and add + prefix for buys
  const formatPrice = (price: number, side: "buy" | "sell") => {
    const formattedPrice = price.toFixed(2);
    return side === "buy" ? `+$${formattedPrice}` : `-$${formattedPrice}`;
  };

  // Format size with K/M/B suffixes
  const formatSize = (size: number) => {
    if (size >= 1_000_000_000) return `${(size / 1_000_000_000).toFixed(2)}B`;
    if (size >= 1_000_000) return `${(size / 1_000_000).toFixed(2)}M`;
    if (size >= 1_000) return `${(size / 1_000).toFixed(2)}K`;
    return size.toFixed(4);
  };

  // Calculate total volume
  const totalVolume = useMemo(() => {
    return trades.reduce((sum, trade) => sum + trade.price * trade.size, 0);
  }, [trades]);

  // Filter and sort trades
  const processedTrades = useMemo(() => {
    return [...trades]
      .filter((trade) => filterSide === "all" || trade.side === filterSide)
      .sort((a, b) => {
        const comparison =
          sortOrder === "desc"
            ? b.timestamp - a.timestamp
            : a.timestamp - b.timestamp;
        return comparison;
      });
  }, [trades, filterSide, sortOrder]);

  // Auto-update relative times
  useEffect(() => {
    if (timeFormat !== "relative") return;

    const interval = setInterval(() => {
      // Force re-render to update relative times
      setSortOrder((current) => (current === "desc" ? "desc" : "desc"));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [timeFormat]);

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Trade History</h2>
        <div className="text-sm text-gray-400">
          Volume: ${totalVolume.toLocaleString()}
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setFilterSide("all")}
            className={`px-2 py-1 rounded text-sm ${
              filterSide === "all"
                ? "bg-gray-600 text-white"
                : "text-gray-400 hover:bg-gray-700"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterSide("buy")}
            className={`px-2 py-1 rounded text-sm ${
              filterSide === "buy"
                ? "bg-green-600 text-white"
                : "text-gray-400 hover:bg-gray-700"
            }`}
          >
            Buys
          </button>
          <button
            onClick={() => setFilterSide("sell")}
            className={`px-2 py-1 rounded text-sm ${
              filterSide === "sell"
                ? "bg-red-600 text-white"
                : "text-gray-400 hover:bg-gray-700"
            }`}
          >
            Sells
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() =>
              setTimeFormat((current) =>
                current === "time" ? "relative" : "time"
              )
            }
            className="text-sm text-gray-400 hover:text-white"
          >
            {timeFormat === "time" ? "Show Relative Time" : "Show Exact Time"}
          </button>
          <button
            onClick={() =>
              setSortOrder((current) => (current === "desc" ? "asc" : "desc"))
            }
            className="text-sm text-gray-400 hover:text-white"
          >
            {sortOrder === "desc" ? "↓" : "↑"}
          </button>
        </div>
      </div>

      <div className="overflow-y-auto max-h-[400px]">
        <table className="w-full">
          <thead>
            <tr className="text-sm text-gray-400">
              <th className="text-left pb-2">Price</th>
              <th className="text-right pb-2">Size</th>
              <th className="text-right pb-2">Total</th>
              <th className="text-right pb-2">Time</th>
            </tr>
          </thead>
          <tbody>
            {processedTrades.map((trade) => (
              <tr
                key={trade.id}
                className="border-t border-gray-700 hover:bg-gray-700 transition-colors"
              >
                <td
                  className={`py-2 ${
                    trade.side === "buy" ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {formatPrice(trade.price, trade.side)}
                </td>
                <td className="text-right">{formatSize(trade.size)}</td>
                <td className="text-right text-gray-400">
                  ${(trade.price * trade.size).toFixed(2)}
                </td>
                <td className="text-right text-gray-400">
                  {timeFormat === "time"
                    ? format(trade.timestamp, "HH:mm:ss")
                    : formatDistance(trade.timestamp, new Date(), {
                        addSuffix: true,
                      })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
