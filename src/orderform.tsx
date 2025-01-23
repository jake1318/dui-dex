// src/components/orderbook/OrderForm.tsx

import { useState } from "react";
import { OrderType, OrderSide } from "./types";

interface OrderFormProps {
  onSubmit: (order: {
    type: OrderType;
    side: OrderSide;
    price: number;
    amount: number;
  }) => void;
  currentPrice: number;
  isLoading: boolean;
}

export function OrderForm({
  onSubmit,
  currentPrice,
  isLoading,
}: OrderFormProps) {
  const [orderType, setOrderType] = useState<OrderType>("limit");
  const [orderSide, setOrderSide] = useState<OrderSide>("buy");
  const [price, setPrice] = useState<string>(currentPrice.toString());
  const [amount, setAmount] = useState<string>("");
  const [total, setTotal] = useState<string>("");

  const handlePriceChange = (value: string) => {
    setPrice(value);
    if (amount) {
      setTotal((parseFloat(value) * parseFloat(amount)).toString());
    }
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    if (price) {
      setTotal((parseFloat(value) * parseFloat(price)).toString());
    }
  };

  const handleTotalChange = (value: string) => {
    setTotal(value);
    if (price && parseFloat(price) > 0) {
      setAmount((parseFloat(value) / parseFloat(price)).toString());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!price || !amount) return;

    onSubmit({
      type: orderType,
      side: orderSide,
      price: parseFloat(price),
      amount: parseFloat(amount),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-800 rounded-lg">
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          className={`flex-1 p-2 rounded ${
            orderType === "limit" ? "bg-blue-500" : "bg-gray-700"
          }`}
          onClick={() => setOrderType("limit")}
        >
          Limit
        </button>
        <button
          type="button"
          className={`flex-1 p-2 rounded ${
            orderType === "market" ? "bg-blue-500" : "bg-gray-700"
          }`}
          onClick={() => setOrderType("market")}
        >
          Market
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          type="button"
          className={`flex-1 p-2 rounded ${
            orderSide === "buy" ? "bg-green-500" : "bg-gray-700"
          }`}
          onClick={() => setOrderSide("buy")}
        >
          Buy
        </button>
        <button
          type="button"
          className={`flex-1 p-2 rounded ${
            orderSide === "sell" ? "bg-red-500" : "bg-gray-700"
          }`}
          onClick={() => setOrderSide("sell")}
        >
          Sell
        </button>
      </div>

      {orderType === "limit" && (
        <div className="mb-4">
          <label className="block text-sm mb-1">Price (USDC)</label>
          <input
            type="number"
            className="w-full bg-gray-700 rounded p-2"
            value={price}
            onChange={(e) => handlePriceChange(e.target.value)}
            step="0.0001"
            min="0"
            required
          />
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm mb-1">Amount (SUI)</label>
        <input
          type="number"
          className="w-full bg-gray-700 rounded p-2"
          value={amount}
          onChange={(e) => handleAmountChange(e.target.value)}
          step="0.0001"
          min="0"
          required
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm mb-1">Total (USDC)</label>
        <input
          // Continuing src/components/orderbook/OrderForm.tsx

          type="number"
          className="w-full bg-gray-700 rounded p-2"
          value={total}
          onChange={(e) => handleTotalChange(e.target.value)}
          step="0.0001"
          min="0"
          required
        />
      </div>

      <button
        type="submit"
        className={`w-full p-3 rounded-lg font-bold ${
          isLoading
            ? "bg-gray-600"
            : orderSide === "buy"
            ? "bg-green-500 hover:bg-green-600"
            : "bg-red-500 hover:bg-red-600"
        }`}
        disabled={isLoading}
      >
        {isLoading
          ? "Processing..."
          : `${orderSide === "buy" ? "Buy" : "Sell"} ${
              orderType === "market" ? "Market" : "Limit"
            }`}
      </button>
    </form>
  );
}
