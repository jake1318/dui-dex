/**
 * @file src/components/orderbook/OrderForm.tsx
 * Current Date and Time (UTC): 2025-01-25 18:31:10
 * Author: jake1318
 */

import { useState } from "react";
import { OrderType, OrderSide } from "./types";
import "./orderform.css";

interface OrderFormProps {
  onSubmit: (order: {
    type: OrderType;
    side: OrderSide;
    price: number;
    amount: number;
  }) => void;
  currentPrice: number;
  isLoading: boolean;
  maxAmount?: number;
  isWalletConnected: boolean;
}

export function OrderForm({
  onSubmit,
  currentPrice,
  isLoading,
  maxAmount = 0,
  isWalletConnected,
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

  const handlePercentageClick = (percentage: number) => {
    if (maxAmount && price) {
      const newAmount = (maxAmount * percentage).toFixed(4);
      handleAmountChange(newAmount);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!price || !amount || !isWalletConnected) return;

    onSubmit({
      type: orderType,
      side: orderSide,
      price: parseFloat(price),
      amount: parseFloat(amount),
    });

    // Reset form fields after submission
    setAmount("");
    setTotal("");
  };

  const getButtonLabel = () => {
    if (isLoading) return "Processing...";
    if (!isWalletConnected) return "Connect Wallet to Trade";

    const action = orderSide === "buy" ? "Buy" : "Sell";
    const type = orderType === "market" ? "Market" : "Limit";
    return `Place ${action} ${type} Order`;
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`p-4 bg-gray-800 rounded-lg ${
        !isWalletConnected ? "form-disabled" : ""
      }`}
    >
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          className={`flex-1 p-2 rounded font-semibold transition-all duration-200 ${
            orderType === "limit"
              ? "bg-blue-500 shadow-lg"
              : "bg-gray-700 hover:bg-gray-600"
          }`}
          onClick={() => setOrderType("limit")}
          disabled={!isWalletConnected}
        >
          Limit
        </button>
        <button
          type="button"
          className={`flex-1 p-2 rounded font-semibold transition-all duration-200 ${
            orderType === "market"
              ? "bg-blue-500 shadow-lg"
              : "bg-gray-700 hover:bg-gray-600"
          }`}
          onClick={() => setOrderType("market")}
          disabled={!isWalletConnected}
        >
          Market
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          type="button"
          className={`flex-1 p-2 rounded font-semibold transition-all duration-200 ${
            orderSide === "buy"
              ? "bg-green-500 shadow-lg"
              : "bg-gray-700 hover:bg-gray-600"
          }`}
          onClick={() => setOrderSide("buy")}
          disabled={!isWalletConnected}
        >
          Buy
        </button>
        <button
          type="button"
          className={`flex-1 p-2 rounded font-semibold transition-all duration-200 ${
            orderSide === "sell"
              ? "bg-red-500 shadow-lg"
              : "bg-gray-700 hover:bg-gray-600"
          }`}
          onClick={() => setOrderSide("sell")}
          disabled={!isWalletConnected}
        >
          Sell
        </button>
      </div>

      {orderType === "limit" && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-300">
            Price (USDC)
          </label>
          <div className="relative">
            <input
              type="number"
              className="w-full bg-gray-700 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={price}
              onChange={(e) => handlePriceChange(e.target.value)}
              step="0.0001"
              min="0"
              required
              disabled={!isWalletConnected}
            />
          </div>
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1 text-gray-300">
          Amount (SUI)
        </label>
        <div className="relative">
          <input
            type="number"
            className="w-full bg-gray-700 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            step="0.0001"
            min="0"
            required
            disabled={!isWalletConnected}
          />
        </div>
        {/* Quick Select Percentage Buttons */}
        <div className="grid grid-cols-4 gap-2 mt-2">
          {[0.25, 0.5, 0.75, 1].map((percentage) => (
            <button
              key={percentage}
              type="button"
              onClick={() => handlePercentageClick(percentage)}
              className={`
                py-1 px-2 text-xs font-semibold rounded
                ${
                  maxAmount > 0 && isWalletConnected
                    ? "bg-gray-700 hover:bg-gray-600 active:bg-gray-500"
                    : "bg-gray-700 opacity-50 cursor-not-allowed"
                }
                transition-all duration-200
                ${
                  amount === (maxAmount * percentage).toFixed(4)
                    ? "ring-2 ring-blue-500"
                    : ""
                }
              `}
              disabled={maxAmount <= 0 || !isWalletConnected}
              title={
                maxAmount > 0
                  ? `${(maxAmount * percentage).toFixed(4)} SUI`
                  : "No balance available"
              }
            >
              {percentage * 100}%
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-1 text-gray-300">
          Total (USDC)
        </label>
        <div className="relative">
          <input
            type="number"
            className="w-full bg-gray-700 rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={total}
            onChange={(e) => handleTotalChange(e.target.value)}
            step="0.0001"
            min="0"
            required
            disabled={!isWalletConnected}
          />
        </div>
      </div>

      <button
        type="submit"
        className={`w-full p-3 rounded-lg font-bold text-white transition-all duration-200 
          ${
            isLoading || !isWalletConnected
              ? "bg-gray-600 cursor-not-allowed"
              : orderSide === "buy"
              ? "bg-green-500 hover:bg-green-600 active:bg-green-700"
              : "bg-red-500 hover:bg-red-600 active:bg-red-700"
          } 
          shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0`}
        disabled={isLoading || !isWalletConnected}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Processing
          </div>
        ) : (
          getButtonLabel()
        )}
      </button>
    </form>
  );
}
