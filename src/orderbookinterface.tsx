/**
 * OrderbookInterface.tsx
 * Created: 2025-01-23 00:46:06
 * Author: jake1318
 * Description: DEX Orderbook Interface for SUI/USDC trading pair
 */

import { useState, useEffect } from "react";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import type { SuiClient } from "@mysten/sui.js/client";
import { OrderBook } from "./orderbook";
import { OrderForm } from "./orderform";
import { UserOrders } from "./userorders";
import { MarketStats } from "./marketstats";
import { TradeHistory } from "./tradehistory";
import { PriceChart } from "./pricechart";
import { DEEPBOOK } from "./deepbook";
import {
  CONSTANTS,
  ERRORS,
  parseInputAmount,
  createNotification,
  type NotificationConfig,
} from "./utils";
import type {
  Order,
  OrderbookLevel,
  DeepBookOrder,
  Trade,
  ChartData,
} from "./orderbooks";

const processOrderbookData = (
  orders: DeepBookOrder[],
  side: "ask" | "bid"
): OrderbookLevel[] => {
  const groupedOrders = orders.reduce((acc, order) => {
    const price = order.price;
    if (!acc[price]) {
      acc[price] = 0;
    }
    acc[price] += order.quantity;
    return acc;
  }, {} as { [key: number]: number });

  const levels = Object.entries(groupedOrders)
    .map(([price, size]) => ({
      price: parseFloat(price),
      size,
      total: 0,
      cumulative: 0,
    }))
    .sort((a, b) => (side === "ask" ? a.price - b.price : b.price - a.price));

  let cumulative = 0;
  return levels.map((level) => {
    const total = level.price * level.size;
    cumulative += level.size;
    return {
      ...level,
      total,
      cumulative,
    };
  });
};

const calculateMarketStats = (trades: Trade[], lastPrice: number | null) => {
  if (trades.length === 0 || !lastPrice) {
    return {
      high24h: 0,
      low24h: 0,
      volume24h: 0,
      priceChange24h: 0,
    };
  }

  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const trades24h = trades.filter((trade) => trade.timestamp >= oneDayAgo);

  const high24h = Math.max(...trades24h.map((t) => t.price));
  const low24h = Math.min(...trades24h.map((t) => t.price));
  const volume24h = trades24h.reduce(
    (sum, trade) => sum + trade.size * trade.price,
    0
  );
  const firstPrice = trades24h[0]?.price || lastPrice;
  const priceChange24h = ((lastPrice - firstPrice) / firstPrice) * 100;

  return {
    high24h,
    low24h,
    volume24h,
    priceChange24h,
  };
};

export function OrderbookInterface() {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  // Market states
  const [asks, setAsks] = useState<OrderbookLevel[]>([]);
  const [bids, setBids] = useState<OrderbookLevel[]>([]);
  const [lastPrice, setLastPrice] = useState<number | null>(null);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [marketStats, setMarketStats] = useState({
    high24h: 0,
    low24h: 0,
    volume24h: 0,
    priceChange24h: 0,
  });

  // Order input states
  const [orderType, setOrderType] = useState<"limit" | "market">("limit");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [price, setPrice] = useState<string>("");
  const [amount, setAmount] = useState<string>("");

  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<NotificationConfig | null>(
    null
  );

  useEffect(() => {
    const fetchOrderbook = async () => {
      if (!suiClient) return;

      try {
        const client = suiClient as unknown as SuiClient;
        const orderbookData = await client.getDynamicFields({
          parentId: DEEPBOOK.POOLS.USDC_SUI,
        });

        const askOrders = orderbookData.data
          .filter((field) => {
            const dynamicField = field as any;
            return dynamicField.name.type.includes("ask");
          })
          .map((field) => ({
            price: parseInt((field as any).name.value as string) / 1e9,
            quantity: parseInt((field as any).objectType as string) / 1e9,
            owner: field.objectId,
          }));

        const bidOrders = orderbookData.data
          .filter((field) => {
            const dynamicField = field as any;
            return dynamicField.name.type.includes("bid");
          })
          .map((field) => ({
            price: parseInt((field as any).name.value as string) / 1e9,
            quantity: parseInt((field as any).objectType as string) / 1e9,
            owner: field.objectId,
          }));

        setAsks(processOrderbookData(askOrders, "ask"));
        setBids(processOrderbookData(bidOrders, "bid"));

        if (askOrders.length > 0 && bidOrders.length > 0) {
          const currentPrice = (askOrders[0].price + bidOrders[0].price) / 2;
          setLastPrice(currentPrice);

          if (currentPrice !== lastPrice) {
            const newTrade: Trade = {
              id: Date.now().toString(),
              price: currentPrice,
              size: askOrders[0].quantity,
              side: currentPrice > (lastPrice || currentPrice) ? "buy" : "sell",
              timestamp: Date.now(),
            };
            setTrades((prevTrades) => [newTrade, ...prevTrades].slice(0, 100));
          }
        }

        if (currentAccount) {
          const userOrdersData = orderbookData.data
            .filter((field) => {
              const dynamicField = field as any;
              return (
                dynamicField.objectId &&
                (dynamicField.name.type.includes("ask") ||
                  dynamicField.name.type.includes("bid"))
              );
            })
            .map(
              (field): Order => ({
                id: field.objectId,
                owner: currentAccount.address,
                price: parseInt((field as any).name.value as string) / 1e9,
                size: parseInt((field as any).objectType as string) / 1e9,
                side: (field as any).name.type.includes("ask") ? "sell" : "buy",
                status: "open",
                timestamp: Date.now(),
              })
            );

          setUserOrders(userOrdersData);
        }

        setMarketStats(calculateMarketStats(trades, lastPrice));

        const newCandle: ChartData = {
          time: new Date().toISOString().split("T")[0],
          open: trades[0]?.price || lastPrice || 0,
          high: marketStats.high24h,
          low: marketStats.low24h,
          close: lastPrice || 0,
          volume: marketStats.volume24h,
        };
        setChartData((prevData) => [...prevData, newCandle]);
      } catch (error) {
        console.error("Error fetching orderbook:", error);
        setNotification(createNotification(ERRORS.NETWORK_ERROR, "error"));
      }
    };

    fetchOrderbook();
    const interval = setInterval(fetchOrderbook, CONSTANTS.REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [suiClient, currentAccount, lastPrice]);

  const handlePlaceOrder = async () => {
    if (!currentAccount || !price || !amount) {
      setNotification(createNotification("Please fill in all fields", "error"));
      return;
    }

    setIsLoading(true);
    try {
      const txb = new TransactionBlock();
      const inputAmount = parseInputAmount(amount, 9); // 9 decimals for SUI

      if (orderType === "limit") {
        const priceAmount = parseInputAmount(price, 6); // 6 decimals for USDC

        if (side === "buy") {
          txb.moveCall({
            target: `${DEEPBOOK.PACKAGE_ID}::pool::place_limit_buy_order`,
            arguments: [
              txb.object(DEEPBOOK.POOLS.USDC_SUI),
              txb.pure(priceAmount),
              txb.pure(inputAmount),
              txb.pure(0), // expiration timestamp, 0 for no expiration
              txb.pure(false), // post only
              txb.pure(false), // immediate or cancel
            ],
          });
        } else {
          txb.moveCall({
            target: `${DEEPBOOK.PACKAGE_ID}::pool::place_limit_sell_order`,
            arguments: [
              txb.object(DEEPBOOK.POOLS.USDC_SUI),
              txb.pure(priceAmount),
              txb.pure(inputAmount),
              txb.pure(0),
              txb.pure(false),
              txb.pure(false),
            ],
          });
        }
      } else {
        if (side === "buy") {
          txb.moveCall({
            target: `${DEEPBOOK.PACKAGE_ID}::pool::place_market_buy_order`,
            arguments: [
              txb.object(DEEPBOOK.POOLS.USDC_SUI),
              txb.pure(inputAmount),
            ],
          });
        } else {
          txb.moveCall({
            target: `${DEEPBOOK.PACKAGE_ID}::pool::place_market_sell_order`,
            arguments: [
              txb.object(DEEPBOOK.POOLS.USDC_SUI),
              txb.pure(inputAmount),
            ],
          });
        }
      }

      await signAndExecuteTransaction({
        transaction: txb,
      });

      setNotification(
        createNotification("Order placed successfully", "success")
      );
      setAmount("");
      setPrice("");
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

  const handleCancelOrder = async (orderId: string) => {
    if (!currentAccount) return;

    setIsLoading(true);
    try {
      const txb = new TransactionBlock();

      txb.moveCall({
        target: `${DEEPBOOK.PACKAGE_ID}::pool::cancel_order`,
        arguments: [txb.object(DEEPBOOK.POOLS.USDC_SUI), txb.object(orderId)],
      });

      await signAndExecuteTransaction({
        transaction: txb,
      });

      setNotification(
        createNotification("Order cancelled successfully", "success")
      );
      setUserOrders(userOrders.filter((order) => order.id !== orderId));
    } catch (error) {
      console.error("Order cancellation failed:", error);
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
    <div className="max-w-6xl mx-auto p-4">
      <MarketStats lastPrice={lastPrice} {...marketStats} />

      <div className="grid grid-cols-12 gap-4 mt-4">
        <OrderBook
          asks={asks}
          bids={bids}
          lastPrice={lastPrice}
          onPriceClick={(newPrice: number, newSide: "buy" | "sell") => {
            setPrice(newPrice.toString());
            setSide(newSide);
          }}
          isConnected={!!currentAccount}
        />

        <div className="col-span-6 bg-gray-800 rounded-lg p-4">
          <PriceChart data={chartData} />
        </div>

        <div className="col-span-3">
          <OrderForm
            isConnected={!!currentAccount}
            orderType={orderType}
            side={side}
            price={price}
            amount={amount}
            isLoading={isLoading}
            onOrderTypeChange={setOrderType}
            onSideChange={setSide}
            onPriceChange={setPrice}
            onAmountChange={setAmount}
            onSubmit={handlePlaceOrder}
          />

          <div className="mt-4">
            <TradeHistory trades={trades} />
          </div>
        </div>

        {userOrders.length > 0 && (
          <div className="col-span-12 bg-gray-800 rounded-lg p-4">
            <UserOrders
              orders={userOrders}
              onCancelOrder={handleCancelOrder}
              isLoading={isLoading}
            />
          </div>
        )}
      </div>

      {notification && (
        <div
          className={`fixed bottom-4 right-4 p-4 rounded-lg ${
            notification.type === "error"
              ? "bg-red-500"
              : notification.type === "success"
              ? "bg-green-500"
              : "bg-blue-500"
          }`}
        >
          {notification.message}
        </div>
      )}
    </div>
  );
}
