/**
 * @file src/orderbookinterface.tsx
 * Current Date and Time (UTC - YYYY-MM-DD HH:MM:SS formatted): 2025-01-25 18:28:40
 * Current User's Login: jake1318
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
import { OrderForm } from "./orderform";
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

  // Market state
  const [orderSide, setOrderSide] = useState<OrderSide>("buy");

  // Balance states
  const [suiBalance, setSuiBalance] = useState<number>(0);
  const [usdcBalance, setUsdcBalance] = useState<number>(0);

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

  const fetchBalances = async () => {
    if (!currentAccount || !suiClient) return;

    try {
      const compatibleClient = castToCompatibleSuiClient(suiClient);

      // Fetch SUI balance
      const suiBalance = await compatibleClient.getBalance({
        owner: currentAccount.address,
        coinType: TOKEN_TYPES.SUI,
      });
      setSuiBalance(
        Number(suiBalance.totalBalance) / Math.pow(10, TOKENS[0].decimals)
      );

      // Fetch USDC balance
      const usdcBalance = await compatibleClient.getBalance({
        owner: currentAccount.address,
        coinType: TOKEN_TYPES.USDC,
      });
      setUsdcBalance(
        Number(usdcBalance.totalBalance) / Math.pow(10, TOKENS[1].decimals)
      );
    } catch (error) {
      console.error("Error fetching balances:", error);
    }
  };

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

  useEffect(() => {
    fetchBalances();
  }, [currentAccount, suiClient]);

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

  const handlePlaceOrder = async (order: {
    type: OrderType;
    side: OrderSide;
    price: number;
    amount: number;
  }) => {
    if (!currentAccount || !isInitialized) {
      setNotification(
        createNotification("Please connect your wallet", "error")
      );
      return;
    }

    setOrderSide(order.side);

    const validation = validateOrder(
      order.price,
      order.amount,
      BigInt(0),
      order.side
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
      const amountInBaseUnits = parseInputAmount(
        order.amount.toString(),
        TOKENS[0].decimals
      );

      if (!amountInBaseUnits) {
        throw new Error(ERRORS.INVALID_AMOUNT);
      }

      const writer = new BcsWriter();
      writer.write64(amountInBaseUnits);
      const amountInBaseUnitsSerialized = writer.toBytes();

      if (order.type === "limit") {
        const [coin] = txb.splitCoins(txb.gas, [
          txb.pure(amountInBaseUnitsSerialized),
        ]);
        const priceInBaseUnits = parseInputAmount(
          order.price.toString(),
          TOKENS[1].decimals
        );

        if (!priceInBaseUnits) {
          throw new Error(ERRORS.INVALID_PRICE);
        }

        const priceWriter = new BcsWriter();
        priceWriter.write64(priceInBaseUnits);
        const priceInBaseUnitsSerialized = priceWriter.toBytes();

        txb.moveCall({
          target: `${DEEPBOOK.PACKAGE_ID}::clob::place_limit_order`,
          typeArguments: [
            order.side === "buy" ? TOKEN_TYPES.USDC : TOKEN_TYPES.SUI,
            order.side === "buy" ? TOKEN_TYPES.SUI : TOKEN_TYPES.USDC,
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
            order.side === "buy" ? TOKEN_TYPES.USDC : TOKEN_TYPES.SUI,
            order.side === "buy" ? TOKEN_TYPES.SUI : TOKEN_TYPES.USDC,
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

      await fetchOrderBookData(castToCompatibleSuiClient(suiClient));
      await fetchBalances();
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
          <OrderForm
            onSubmit={handlePlaceOrder}
            currentPrice={Number(asks[0]?.price || 0)}
            isLoading={isLoading}
            maxAmount={orderSide === "buy" ? usdcBalance : suiBalance}
            isWalletConnected={!!currentAccount}
          />
          {!currentAccount && (
            <div className="connect-wallet-overlay">
              <ConnectButton className="connect-button" />
              <p className="text-gray-400 mt-2 text-center">
                Connect your wallet to start trading
              </p>
            </div>
          )}
        </div>

        <div className="orderbook-container dex-card">
          <OrderBook
            bids={bids}
            asks={asks}
            onSelect={() => {}} // Removed unused price setter
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
