/**
 * @file OrderBook.tsx
 * Last updated: 2025-01-24 03:00:29
 * Author: jake1318
 */

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
    <div className="orderbook-container">
      <div className="orderbook-header">
        <div className="column-labels">
          <div className="label">Price (USDC)</div>
          <div className="label text-right">Amount (SUI)</div>
          <div className="label text-right">Total</div>
        </div>
      </div>

      <div className="orderbook-content">
        {/* Asks */}
        <div className="asks-container">
          {asks.slice(0, maxRows).map((ask, i) => (
            <div
              key={`ask-${i}`}
              className={`order-row ask ${
                selectedPrice === ask.price ? "selected" : ""
              }`}
              onClick={() => handlePriceSelect(ask.price)}
            >
              <div className="price">{formatPrice(ask.price)}</div>
              <div className="amount">{formatAmount(ask.quantity)}</div>
              <div className="total">{formatAmount(ask.total)}</div>
              <div
                className="depth-indicator ask"
                style={{ width: `${ask.depth}%` }}
              />
            </div>
          ))}
        </div>

        {/* Spread */}
        {bids.length > 0 && asks.length > 0 && (
          <div className="spread-indicator">
            <span className="spread-label">Spread:</span>
            <span className="spread-value">
              {formatPrice(asks[0].price - bids[0].price)}
            </span>
            <span className="spread-percentage">
              (
              {(
                ((asks[0].price - bids[0].price) / bids[0].price) *
                100
              ).toFixed(2)}
              %)
            </span>
          </div>
        )}

        {/* Bids */}
        <div className="bids-container">
          {bids.slice(0, maxRows).map((bid, i) => (
            <div
              key={`bid-${i}`}
              className={`order-row bid ${
                selectedPrice === bid.price ? "selected" : ""
              }`}
              onClick={() => handlePriceSelect(bid.price)}
            >
              <div className="price">{formatPrice(bid.price)}</div>
              <div className="amount">{formatAmount(bid.quantity)}</div>
              <div className="total">{formatAmount(bid.total)}</div>
              <div
                className="depth-indicator bid"
                style={{ width: `${bid.depth}%` }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
