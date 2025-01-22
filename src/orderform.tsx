import { ConnectButton } from "@mysten/dapp-kit";

interface OrderFormProps {
  isConnected: boolean;
  orderType: "limit" | "market";
  side: "buy" | "sell";
  price: string;
  amount: string;
  isLoading: boolean;
  onOrderTypeChange: (type: "limit" | "market") => void;
  onSideChange: (side: "buy" | "sell") => void;
  onPriceChange: (price: string) => void;
  onAmountChange: (amount: string) => void;
  onSubmit: () => void;
}

export function OrderForm({
  isConnected,
  orderType,
  side,
  price,
  amount,
  isLoading,
  onOrderTypeChange,
  onSideChange,
  onPriceChange,
  onAmountChange,
  onSubmit,
}: OrderFormProps) {
  if (!isConnected) {
    return (
      <ConnectButton className="w-full p-3 rounded-lg font-bold bg-blue-500 hover:bg-blue-600" />
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex space-x-2 mb-4">
          <button
            className={`flex-1 p-2 rounded ${
              orderType === "limit" ? "bg-blue-500" : "bg-gray-700"
            }`}
            onClick={() => onOrderTypeChange("limit")}
          >
            Limit
          </button>
          <button
            className={`flex-1 p-2 rounded ${
              orderType === "market" ? "bg-blue-500" : "bg-gray-700"
            }`}
            onClick={() => onOrderTypeChange("market")}
          >
            Market
          </button>
        </div>
        <div className="flex space-x-2 mb-4">
          <button
            className={`flex-1 p-2 rounded ${
              side === "buy" ? "bg-green-500" : "bg-gray-700"
            }`}
            onClick={() => onSideChange("buy")}
          >
            Buy
          </button>
          <button
            className={`flex-1 p-2 rounded ${
              side === "sell" ? "bg-red-500" : "bg-gray-700"
            }`}
            onClick={() => onSideChange("sell")}
          >
            Sell
          </button>
        </div>
      </div>

      {orderType === "limit" && (
        <div>
          <label className="block text-sm font-medium mb-2">Price (USDC)</label>
          <input
            type="number"
            className="w-full p-2 bg-gray-700 rounded"
            value={price}
            onChange={(e) => onPriceChange(e.target.value)}
            min="0"
            step="0.01"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">Amount (SUI)</label>
        <input
          type="number"
          className="w-full p-2 bg-gray-700 rounded"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          min="0"
          step="0.000000001"
        />
      </div>

      <button
        className={`w-full p-3 rounded-lg font-bold ${
          !isLoading
            ? side === "buy"
              ? "bg-green-500 hover:bg-green-600"
              : "bg-red-500 hover:bg-red-600"
            : "bg-gray-600"
        }`}
        onClick={onSubmit}
        disabled={isLoading}
      >
        {isLoading
          ? "Processing..."
          : `${side === "buy" ? "Buy" : "Sell"} ${
              orderType === "limit" ? "Limit" : "Market"
            }`}
      </button>
    </div>
  );
}
