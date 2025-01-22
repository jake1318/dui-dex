import { useMemo } from "react";

interface MarketStatsProps {
  lastPrice: number | null;
  high24h: number;
  low24h: number;
  volume24h: number;
  priceChange24h: number;
}

export function MarketStats({
  lastPrice,
  high24h,
  low24h,
  volume24h,
  priceChange24h,
}: MarketStatsProps) {
  const priceChangeColor = useMemo(() => {
    if (priceChange24h > 0) return "text-green-500";
    if (priceChange24h < 0) return "text-red-500";
    return "text-gray-400";
  }, [priceChange24h]);

  return (
    <div className="grid grid-cols-5 gap-4 bg-gray-800 rounded-lg p-4">
      <div>
        <div className="text-sm text-gray-400">Last Price</div>
        <div className="text-lg font-bold">
          ${lastPrice?.toFixed(2) || "-"}
        </div>
      </div>
      <div>
        <div className="text-sm text-gray-400">24h Change</div>
        <div className={`text-lg font-bold ${priceChangeColor}`}>
          {priceChange24h > 0 ? "+" : ""}
          {priceChange24h.toFixed(2)}%
        </div>
      </div>
      <div>
        <div className="text-sm text-gray-400">24h High</div>
        <div className="text-lg font-bold">
          ${high24h.toFixed(2)}
        </div>
      </div>
      <div>
        <div className="text-sm text-gray-400">24h Low</div>
        <div className="text-lg font-bold">
          ${low24h.toFixed(2)}
        </div>
      </div>
      <div>
        <div className="text-sm text-gray-400">24h Volume</div>
        <div className="text-lg font-bold">
          ${volume24h.toFixed(2)}
        </div>
      </div>
    </div>
  );
}