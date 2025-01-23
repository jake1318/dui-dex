// src/components/OrderBook.tsx
import { useState } from "react";
import { OrderBookEntry } from "./types";
import { formatPrice, formatAmount } from "./utils";

interface OrderBookProps {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  onSelect: (price: number) => void;
  maxRows?: number;
}

export function OrderBook({
  bids,
  asks,
  onSelect,
  maxRows = 15,
}: OrderBookProps) {
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);

  const handlePriceSelect = (price: number) => {
    setSelectedPrice(price);
    onSelect(price);
  };

  return (
    <div className="w-full">
      <h3 className="text-lg font-bold mb-4">Order Book</h3>

      <div className="grid grid-cols-3 text-sm font-semibold mb-2">
        <div>Price (USDC)</div>
        <div className="text-right">Amount (SUI)</div>
        <div className="text-right">Total</div>
      </div>

      {/* Asks */}
      <div className="mb-2">
        {asks.slice(0, maxRows).map((ask, i) => (
          <div
            key={`ask-${i}`}
            className={`grid grid-cols-3 text-sm cursor-pointer hover:bg-gray-700
              ${selectedPrice === ask.price ? "bg-gray-700" : ""}`}
            onClick={() => handlePriceSelect(ask.price)}
          >
            <div className="text-red-500">{formatPrice(ask.price)}</div>
            <div className="text-right">{formatAmount(ask.quantity)}</div>
            <div className="text-right">{formatAmount(ask.total)}</div>
            <div
              className="absolute right-0 h-full bg-red-500/10"
              style={{ width: `${ask.depth}%` }}
            />
          </div>
        ))}
      </div>

      {/* Spread */}
      {bids.length > 0 && asks.length > 0 && (
        <div className="text-center text-sm text-gray-500 my-2">
          Spread: {formatPrice(asks[0].price - bids[0].price)} (
          {(((asks[0].price - bids[0].price) / bids[0].price) * 100).toFixed(2)}
          %)
        </div>
      )}

      {/* Bids */}
      <div>
        {bids.slice(0, maxRows).map((bid, i) => (
          <div
            key={`bid-${i}`}
            className={`grid grid-cols-3 text-sm cursor-pointer hover:bg-gray-700
              ${selectedPrice === bid.price ? "bg-gray-700" : ""}`}
            onClick={() => handlePriceSelect(bid.price)}
          >
            <div className="text-green-500">{formatPrice(bid.price)}</div>
            <div className="text-right">{formatAmount(bid.quantity)}</div>
            <div className="text-right">{formatAmount(bid.total)}</div>
            <div
              className="absolute right-0 h-full bg-green-500/10"
              style={{ width: `${bid.depth}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
