// src/OrderBookInterface.tsx
// Last updated: 2025-01-23 07:27:03 UTC
// Author: jake1318

import { useState, useEffect } from "react";
import {
  useCurrentAccount,
  useSignAndExecuteTransactionBlock,
  ConnectButton,
  useSuiClient,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions"; // Correct import for Transaction
import { type SuiClient } from "@mysten/sui/client";
import { bcs } from "@mysten/bcs"; // Correct import for BCS
import {
  DEEPBOOK,
  getPoolData,
  initializeDeepBook,
  TOKEN_TYPES,
  checkPoolState,
} from "./deepbook";
import {
  ERRORS,
  createNotification,
  validateOrder,
  parseInputAmount,
  type NotificationConfig,
} from "./utils";
import {
  type OrderBookEntry,
  type Trade,
  type Candlestick,
  type OrderType,
  type OrderSide,
} from "./types";
import { TradingChart } from "./tradingchart";
import { OrderBook } from "./orderbook";
import { RecentTrades } from "./recenttrades";

interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  poolId?: string;
}

const TOKENS: Token[] = [
  {
    symbol: "SUI",
    name: "Sui",
    address: TOKEN_TYPES.SUI,
    decimals: 9,
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    address: TOKEN_TYPES.USDC,
    decimals: 6,
    poolId: "", // Will be set after initialization
  },
];

/**
 * Type-safe utility function for converting SuiClient instances between versions
 */
const castToCompatibleSuiClient = (client: unknown): SuiClient => {
  return client as SuiClient;
};

export function OrderBookInterface() {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecuteTransactionBlock } =
    useSignAndExecuteTransactionBlock();

  // Market states
  const [orderType, setOrderType] = useState<OrderType>("limit");
  const [orderSide, setOrderSide] = useState<OrderSide>("buy");
  const [price, setPrice] = useState<string>("");
  const [amount, setAmount] = useState<string>("");

  // Order book states
  const [bids, setBids] = useState<OrderBookEntry[]>([]);
  const [asks, setAsks] = useState<OrderBookEntry[]>([]);
  const [recentTrades] = useState<Trade[]>([]);
  const [candlesticks] = useState<Candlestick[]>([]);

  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [notification, setNotification] = useState<NotificationConfig | null>(
    null
  );

  useEffect(() => {
    const init = async () => {
      if (!suiClient || isInitialized) return;

      try {
        setIsLoading(true);
        const compatibleClient = castToCompatibleSuiClient(suiClient);
        await initializeDeepBook(compatibleClient);

        const poolState = await checkPoolState(
          compatibleClient,
          DEEPBOOK.POOLS.USDC_SUI
        );
        if (!poolState.isActive) {
          throw new Error(ERRORS.POOL_NOT_FOUND);
        }

        TOKENS[1].poolId = DEEPBOOK.POOLS.USDC_SUI;
        setIsInitialized(true);
        setNotification(
          createNotification("Order book initialized successfully", "success")
        );

        await fetchOrderBookData(compatibleClient);
        await fetchMarketHistory(compatibleClient);
      } catch (error) {
        setNotification(createNotification(ERRORS.NETWORK_ERROR, "error"));
        console.error("Failed to initialize DeepBook:", error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [suiClient, isInitialized]);

  useEffect(() => {
    if (!isInitialized || !suiClient) return;

    const intervalId = setInterval(async () => {
      await fetchOrderBookData(castToCompatibleSuiClient(suiClient));
    }, 5000);

    return () => clearInterval(intervalId);
  }, [suiClient, isInitialized]);

  const fetchOrderBookData = async (client: SuiClient) => {
    try {
      const poolData = await getPoolData(client, TOKENS[1].poolId!);
      if (!poolData) return;

      const processedBids = processOrders(poolData.bids, false);
      const processedAsks = processOrders(poolData.asks, true);

      setBids(processedBids);
      setAsks(processedAsks);
    } catch (error) {
      console.error("Error fetching order book data:", error);
    }
  };

  const fetchMarketHistory = async (client: SuiClient) => {
    try {
      await client.getObject({
        id: DEEPBOOK.POOLS.USDC_SUI,
        options: { showContent: true },
      });
      // TODO: Implement candlestick data processing when API is available
    } catch (error) {
      console.error("Error fetching market history:", error);
    }
  };

  const processOrders = (
    orders: OrderBookEntry[],
    ascending: boolean
  ): OrderBookEntry[] => {
    if (!orders.length) return [];

    let cumTotal = 0;
    const maxTotal = Math.max(
      ...orders.map((order) => Number(order.price) * Number(order.quantity))
    );

    return orders
      .sort((a, b) =>
        ascending
          ? Number(a.price) - Number(b.price)
          : Number(b.price) - Number(a.price)
      )
      .map((order) => {
        cumTotal += Number(order.quantity);
        return {
          ...order,
          total: cumTotal,
          depth:
            ((Number(order.price) * Number(order.quantity)) / maxTotal) * 100,
        };
      });
  };

  const handlePlaceOrder = async () => {
    if (!currentAccount || !isInitialized) {
      setNotification(
        createNotification("Please connect your wallet", "error")
      );
      return;
    }

    const priceValue = orderType === "limit" ? parseFloat(price) : 0;
    const amountValue = parseFloat(amount);

    const validation = validateOrder(
      priceValue,
      amountValue,
      BigInt(0),
      orderSide
    );
    if (!validation.isValid) {
      setNotification(
        createNotification(validation.error || ERRORS.INVALID_AMOUNT, "error")
      );
      return;
    }

    setIsLoading(true);
    try {
      const txb = new Transaction();
      const amountInBaseUnits = parseInputAmount(amount, TOKENS[0].decimals);

      if (!amountInBaseUnits) {
        throw new Error(ERRORS.INVALID_AMOUNT);
      }

      const amountInBaseUnitsSerialized = bcs.ser("u64", amountInBaseUnits);

      if (orderType === "limit") {
        const [coin] = txb.splitCoins(txb.gas, [
          txb.pure(amountInBaseUnitsSerialized),
        ]);
        const priceInBaseUnits = parseInputAmount(price, TOKENS[1].decimals);

        if (!priceInBaseUnits) {
          throw new Error(ERRORS.INVALID_PRICE);
        }

        const priceInBaseUnitsSerialized = bcs.ser("u64", priceInBaseUnits);

        txb.moveCall({
          target: `${DEEPBOOK.PACKAGE_ID}::clob::place_limit_order`,
          typeArguments: [
            orderSide === "buy" ? TOKEN_TYPES.USDC : TOKEN_TYPES.SUI,
            orderSide === "buy" ? TOKEN_TYPES.SUI : TOKEN_TYPES.USDC,
          ],
          arguments: [
            txb.object(TOKENS[1].poolId!),
            coin,
            txb.pure(priceInBaseUnitsSerialized),
            txb.pure(amountInBaseUnitsSerialized),
            txb.object("0x6"),
          ],
        });
      } else {
        const [coin] = txb.splitCoins(txb.gas, [
          txb.pure(amountInBaseUnitsSerialized),
        ]);

        txb.moveCall({
          target: `${DEEPBOOK.PACKAGE_ID}::clob::place_market_order`,
          typeArguments: [
            orderSide === "buy" ? TOKEN_TYPES.USDC : TOKEN_TYPES.SUI,
            orderSide === "buy" ? TOKEN_TYPES.SUI : TOKEN_TYPES.USDC,
          ],
          arguments: [
            txb.object(TOKENS[1].poolId!),
            coin,
            txb.pure(amountInBaseUnitsSerialized),
            txb.object("0x6"),
          ],
        });
      }

      await signAndExecuteTransactionBlock({
        transactionBlock: txb as any, // Type assertion to handle version mismatch
        options: {
          showEffects: true,
          showObjectChanges: true,
        },
      });

      setNotification(
        createNotification("Order placed successfully", "success")
      );
      setAmount("");
      if (orderType === "limit") {
        setPrice("");
      }

      await fetchOrderBookData(castToCompatibleSuiClient(suiClient));
    } catch (error) {
      console.error("Order placement failed:", error);
      setNotification(
        createNotification(
          error instanceof Error ? error.message : ERRORS.TRANSACTION_FAILED,
          "error"
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-12 gap-4 p-4">
      {notification && (
        <div className="col-span-12">
          <div
            className={`p-4 rounded-lg ${
              notification.type === "success"
                ? "bg-green-500"
                : notification.type === "error"
                ? "bg-red-500"
                : "bg-blue-500"
            }`}
          >
            {notification.message}
          </div>
        </div>
      )}

      <div className="col-span-8 bg-gray-800 rounded-lg p-4">
        <TradingChart candlesticks={candlesticks} width={800} height={400} />
      </div>

      <div className="col-span-4 bg-gray-800 rounded-lg p-4">
        <div className="flex gap-2 mb-4">
          <button
            className={`flex-1 p-2 rounded ${
              orderType === "limit" ? "bg-blue-500" : "bg-gray-700"
            }`}
            onClick={() => setOrderType("limit")}
          >
            Limit
          </button>
          <button
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
            className={`flex-1 p-2 rounded ${
              orderSide === "buy" ? "bg-green-500" : "bg-gray-700"
            }`}
            onClick={() => setOrderSide("buy")}
          >
            Buy
          </button>
          <button
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
              onChange={(e) => setPrice(e.target.value)}
              min="0"
              step="0.000001"
              placeholder="Enter price"
            />
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm mb-1">Amount (SUI)</label>
          <input
            type="number"
            className="w-full bg-gray-700 rounded p-2"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            step="0.000001"
            placeholder="Enter amount"
          />
        </div>

        {!currentAccount ? (
          <ConnectButton className="w-full p-3 rounded-lg font-bold bg-blue-500 hover:bg-blue-600" />
        ) : (
          <button
            className={`w-full p-3 rounded-lg font-bold ${
              orderSide === "buy"
                ? "bg-green-500 hover:bg-green-600"
                : "bg-red-500 hover:bg-red-600"
            }`}
            onClick={handlePlaceOrder}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : `Place ${orderSide} order`}
          </button>
        )}
      </div>

      <div className="col-span-6 bg-gray-800 rounded-lg p-4">
        <OrderBook
          bids={bids}
          asks={asks}
          onSelect={(price) => setPrice(price.toString())}
        />
      </div>

      <div className="col-span-6 bg-gray-800 rounded-lg p-4">
        <RecentTrades trades={recentTrades} />
      </div>
    </div>
  );
}
