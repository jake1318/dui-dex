/**
 * @file src/orderbookinterface.tsx
 * Last updated: 2025-01-24 06:35:55
 * Author: jake1318
 */

import { useState, useEffect } from "react";
import {
  useCurrentAccount,
  useSignAndExecuteTransactionBlock,
  ConnectButton,
  useSuiClient,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { type SuiClient } from "@mysten/sui/client";
import { BcsWriter } from "@mysten/bcs";
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
import "./orderbookinterface.css";

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
    poolId: "",
  },
];

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

      const writer = new BcsWriter();
      writer.write64(amountInBaseUnits);
      const amountInBaseUnitsSerialized = writer.toBytes();

      if (orderType === "limit") {
        const [coin] = txb.splitCoins(txb.gas, [
          txb.pure(amountInBaseUnitsSerialized),
        ]);
        const priceInBaseUnits = parseInputAmount(price, TOKENS[1].decimals);

        if (!priceInBaseUnits) {
          throw new Error(ERRORS.INVALID_PRICE);
        }

        const priceWriter = new BcsWriter();
        priceWriter.write64(priceInBaseUnits);
        const priceInBaseUnitsSerialized = priceWriter.toBytes();

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
        transactionBlock: txb as any,
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
    <div className="dex-container">
      <div className="dex-grid">
        {notification && (
          <div className={`notification ${notification.type}`}>
            {notification.message}
          </div>
        )}

        <div className="chart-container dex-card">
          <TradingChart candlesticks={candlesticks} width={800} height={400} />
        </div>

        <div className="trading-form dex-card">
          <div className="order-type-group">
            <button
              className={`order-button ${
                orderType === "limit" ? "active" : ""
              }`}
              onClick={() => setOrderType("limit")}
            >
              Limit
            </button>
            <button
              className={`order-button ${
                orderType === "market" ? "active" : ""
              }`}
              onClick={() => setOrderType("market")}
            >
              Market
            </button>
          </div>

          <div className="trade-type-group">
            <button
              className={`trade-button buy ${
                orderSide === "buy" ? "active" : ""
              }`}
              onClick={() => setOrderSide("buy")}
            >
              Buy
            </button>
            <button
              className={`trade-button sell ${
                orderSide === "sell" ? "active" : ""
              }`}
              onClick={() => setOrderSide("sell")}
            >
              Sell
            </button>
          </div>

          {orderType === "limit" && (
            <div className="form-group">
              <label className="form-label">Price (USDC)</label>
              <input
                type="number"
                className="form-input"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min="0"
                step="0.000001"
                placeholder="Enter price"
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Amount (SUI)</label>
            <input
              type="number"
              className="form-input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="0.000001"
              placeholder="Enter amount"
            />
          </div>

          {!currentAccount ? (
            <ConnectButton className="connect-button" />
          ) : (
            <button
              className={`trade-button ${orderSide} active`}
              onClick={handlePlaceOrder}
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : `Place ${orderSide} order`}
            </button>
          )}
        </div>

        <div className="orderbook-container dex-card">
          <OrderBook
            bids={bids}
            asks={asks}
            onSelect={(price) => setPrice(price.toString())}
          />
        </div>

        <div className="trades-container dex-card">
          <RecentTrades trades={recentTrades} />
        </div>
      </div>

      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}
    </div>
  );
}
