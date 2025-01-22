import { useState, useEffect } from "react";
import {
  useCurrentAccount,
  useSignAndExecuteTransactionBlock,
  useSuiClient,
  ConnectButton,
} from "@mysten/dapp-kit";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import type { SuiClient } from "@mysten/sui.js/client";
import {
  DEEPBOOK,
  getPoolData,
  calculateOutputWithSlippage,
  type PoolData,
  initializeDeepBook,
  TOKEN_TYPES,
  validateSwap,
  checkPoolState,
  validateSlippage,
} from "./deepbook";
import {
  CONSTANTS,
  ERRORS,
  type PriceImpact,
  formatBalance,
  parseInputAmount,
  createNotification,
  type NotificationConfig,
  calculatePriceImpact,
} from "./utils";

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

export function SwapInterface() {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecuteTransactionBlock } =
    useSignAndExecuteTransactionBlock();

  // Token and amount states
  const [fromToken, setFromToken] = useState<Token>(TOKENS[0]);
  const [toToken, setToToken] = useState<Token>(TOKENS[1]);
  const [amount, setAmount] = useState<string>("");
  const [slippage, setSlippage] = useState<number>(0.01);
  const [customSlippage, setCustomSlippage] = useState<string>("");
  const [slippageWarning, setSlippageWarning] = useState<string>("");

  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [notification, setNotification] = useState<NotificationConfig | null>(
    null
  );

  // Pool and price states
  const [poolData, setPoolData] = useState<PoolData | null>(null);
  const [estimatedOutput, setEstimatedOutput] = useState<string>("0.0");
  const [minimumOutput, setMinimumOutput] = useState<string>("0.0");
  const [priceImpact, setPriceImpact] = useState<PriceImpact | null>(null);
  const [userBalance, setUserBalance] = useState<bigint>(BigInt(0));

  const handleSlippageChange = (value: number | string) => {
    let newSlippage: number;

    if (typeof value === "string") {
      const parsed = parseFloat(value);
      if (isNaN(parsed)) return;
      newSlippage = parsed / 100;
      setCustomSlippage(value);
    } else {
      newSlippage = value;
      setCustomSlippage("");
    }

    const validation = validateSlippage(newSlippage * 100);

    if (!validation.isValid) {
      setSlippageWarning(validation.error || "");
      return;
    }

    setSlippageWarning(validation.warning || "");
    setSlippage(newSlippage);

    if (amount) {
      updateEstimatedOutput(amount, poolData);
    }
  };

  useEffect(() => {
    const init = async () => {
      if (!suiClient || isInitialized) return;

      try {
        setIsLoading(true);
        const client = suiClient as unknown as SuiClient;
        await initializeDeepBook(client);

        const poolState = await checkPoolState(client, DEEPBOOK.POOLS.USDC_SUI);
        if (!poolState.isActive) {
          throw new Error(ERRORS.POOL_NOT_FOUND);
        }

        TOKENS[1].poolId = DEEPBOOK.POOLS.USDC_SUI;
        setToToken(TOKENS[1]);
        setIsInitialized(true);

        setNotification(
          createNotification("DEX initialized successfully", "success")
        );
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
    const fetchBalance = async () => {
      if (!currentAccount || !suiClient) return;

      try {
        const client = suiClient as unknown as SuiClient;
        const response = await client.getBalance({
          owner: currentAccount.address,
          coinType: fromToken.address,
        });

        setUserBalance(BigInt(response.totalBalance));
      } catch (error) {
        console.error("Error fetching balance:", error);
        setUserBalance(BigInt(0));
      }
    };

    fetchBalance();
  }, [currentAccount, fromToken, suiClient]);

  useEffect(() => {
    const fetchPoolData = async () => {
      if (!toToken.poolId || !isInitialized || !suiClient) return;

      try {
        const client = suiClient as unknown as SuiClient;
        const data = await getPoolData(client, toToken.poolId);
        if (data) {
          setPoolData(data);
          if (amount) {
            updateEstimatedOutput(amount, data);
          }
        }
      } catch (error) {
        console.error("Error fetching pool data:", error);
        setNotification(createNotification(ERRORS.NETWORK_ERROR, "error"));
      }
    };

    fetchPoolData();
    const interval = setInterval(fetchPoolData, CONSTANTS.REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [toToken.poolId, suiClient, amount, isInitialized]);

  const updateEstimatedOutput = async (
    inputAmount: string,
    currentPoolData = poolData
  ) => {
    if (!currentPoolData || !inputAmount) {
      setEstimatedOutput("0.0");
      setMinimumOutput("0.0");
      setPriceImpact(null);
      return;
    }

    const parsedAmount = parseInputAmount(inputAmount, fromToken.decimals);
    if (!parsedAmount) return;

    const { estimatedOutput: estimated, minimumOutput: minimum } =
      calculateOutputWithSlippage(parsedAmount, currentPoolData, slippage);

    setEstimatedOutput(formatBalance(estimated, toToken.decimals));
    setMinimumOutput(formatBalance(minimum, toToken.decimals));

    const impact = calculatePriceImpact(
      parsedAmount,
      estimated,
      currentPoolData.quoteBalance / currentPoolData.baseBalance
    );
    setPriceImpact(impact);
  };

  const handleSwap = async () => {
    if (!currentAccount || !amount || !poolData || !isInitialized) {
      if (!currentAccount) {
        setNotification(
          createNotification("Please connect your wallet first", "error")
        );
        return;
      }
      if (!amount) {
        setNotification(createNotification("Please enter an amount", "error"));
        return;
      }
      if (!poolData || !isInitialized) {
        setNotification(createNotification("Pool is not initialized", "error"));
        return;
      }
      return;
    }

    setIsLoading(true);
    try {
      const inputAmountBase = parseInputAmount(amount, fromToken.decimals);
      if (!inputAmountBase) throw new Error(ERRORS.INVALID_AMOUNT);

      const validation = await validateSwap(
        suiClient as unknown as SuiClient,
        toToken.poolId!,
        inputAmountBase,
        userBalance,
        slippage
      );

      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      if (validation.priceImpact?.severity === "VERY_HIGH") {
        const proceed = window.confirm(
          "Warning: This trade has a very high price impact. Do you want to proceed?"
        );
        if (!proceed) {
          setIsLoading(false);
          return;
        }
      }

      const txb = new TransactionBlock();

      if (fromToken.symbol === "SUI") {
        const [coin] = txb.splitCoins(txb.gas, [txb.pure(inputAmountBase)]);
        const [deepCoin] = txb.splitCoins(txb.gas, [txb.pure(0)]);

        txb.moveCall({
          target: `${DEEPBOOK.PACKAGE_ID}::pool::swap_exact_base_for_quote`,
          typeArguments: [TOKEN_TYPES.SUI, TOKEN_TYPES.USDC],
          arguments: [
            txb.object(toToken.poolId!),
            coin,
            deepCoin,
            txb.pure(BigInt(minimumOutput)),
            txb.object("0x6"),
          ],
        });
      } else {
        const [deepCoin] = txb.splitCoins(txb.gas, [txb.pure(0)]);

        txb.moveCall({
          target: `${DEEPBOOK.PACKAGE_ID}::pool::swap_exact_quote_for_base`,
          typeArguments: [TOKEN_TYPES.USDC, TOKEN_TYPES.SUI],
          arguments: [
            txb.object(fromToken.poolId!),
            txb.pure(inputAmountBase),
            deepCoin,
            txb.pure(BigInt(minimumOutput)),
            txb.object("0x6"),
          ],
        });
      }

      await signAndExecuteTransactionBlock({
        transactionBlock: txb as any,
      });

      setNotification(
        createNotification("Swap executed successfully", "success")
      );
      setAmount("");
      updateEstimatedOutput("0");
    } catch (error) {
      console.error("Swap failed:", error);
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
    <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-auto mt-8">
      <h2 className="text-xl font-bold mb-4">Swap Tokens</h2>

      {notification && (
        <div
          className={`mb-4 p-3 rounded ${
            notification.type === "error"
              ? "bg-red-500"
              : notification.type === "success"
              ? "bg-green-500"
              : notification.type === "warning"
              ? "bg-yellow-500"
              : "bg-blue-500"
          }`}
        >
          {notification.message}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Slippage Tolerance
        </label>
        <div className="flex gap-2 flex-wrap">
          {[0.001, 0.005, 0.01, 0.02].map((value) => (
            <button
              key={value}
              className={`px-3 py-1 rounded ${
                slippage === value && !customSlippage
                  ? "bg-blue-500"
                  : "bg-gray-700"
              }`}
              onClick={() => handleSlippageChange(value)}
            >
              {(value * 100).toFixed(1)}%
            </button>
          ))}
          <div className="flex items-center">
            <input
              type="number"
              className="bg-gray-700 rounded p-1 w-20 text-right"
              placeholder="Custom"
              value={customSlippage}
              onChange={(e) => handleSlippageChange(e.target.value)}
              min="0"
              step="0.1"
            />
            <span className="ml-1">%</span>
          </div>
        </div>
        {slippageWarning && (
          <div className="text-sm mt-1 text-yellow-500">{slippageWarning}</div>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          From ({formatBalance(userBalance, fromToken.decimals)} available)
        </label>
        <div className="flex gap-2">
          <select
            className="bg-gray-700 rounded p-2 flex-grow"
            value={fromToken.symbol}
            onChange={(e) =>
              setFromToken(TOKENS.find((t) => t.symbol === e.target.value)!)
            }
            disabled={isLoading}
          >
            {TOKENS.map((token) => (
              <option key={token.symbol} value={token.symbol}>
                {token.symbol}
              </option>
            ))}
          </select>
          <input
            type="number"
            className="bg-gray-700 rounded p-2 flex-grow"
            placeholder="0.0"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              updateEstimatedOutput(e.target.value);
            }}
            disabled={isLoading || !currentAccount}
            min="0"
            step="0.000000001"
          />
        </div>
      </div>

      <button
        className="bg-blue-500 p-2 rounded-full w-10 h-10 mx-auto block mb-4"
        onClick={() => {
          const temp = fromToken;
          setFromToken(toToken);
          setToToken(temp);
          setAmount("");
          setEstimatedOutput("0.0");
        }}
        disabled={isLoading || !currentAccount}
      >
        ↓
      </button>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">To (Estimated)</label>
        <div className="flex gap-2">
          <select
            className="bg-gray-700 rounded p-2 flex-grow"
            value={toToken.symbol}
            onChange={(e) =>
              setToToken(TOKENS.find((t) => t.symbol === e.target.value)!)
            }
            disabled={isLoading}
          >
            {TOKENS.map((token) => (
              <option key={token.symbol} value={token.symbol}>
                {token.symbol}
              </option>
            ))}
          </select>
          <input
            type="number"
            className="bg-gray-700 rounded p-2 flex-grow"
            placeholder="0.0"
            disabled
            value={estimatedOutput}
          />
        </div>
      </div>
      {estimatedOutput !== "0.0" && (
        <div className="mt-4 text-sm">
          <div className="flex justify-between mb-2">
            <span>Expected Output:</span>
            <span>
              {estimatedOutput} {toToken.symbol}
            </span>
          </div>
          <div className="flex justify-between mb-2">
            <span>Minimum Output:</span>
            <span>
              {minimumOutput} {toToken.symbol}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Slippage Tolerance:</span>
            <span>{(slippage * 100).toFixed(2)}%</span>
          </div>
          {priceImpact && (
            <div className={`flex justify-between mt-2 ${priceImpact.color}`}>
              <span>Price Impact:</span>
              <span>{priceImpact.percentage.toFixed(2)}%</span>
            </div>
          )}
        </div>
      )}

      <div className="mt-4">
        {!currentAccount ? (
          <ConnectButton className="w-full p-3 rounded-lg font-bold bg-blue-500 hover:bg-blue-600" />
        ) : (
          <button
            className={`w-full p-3 rounded-lg font-bold ${
              !isLoading ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-600"
            }`}
            onClick={handleSwap}
            disabled={isLoading}
          >
            {isLoading ? "Swapping..." : "Swap"}
          </button>
        )}
      </div>
    </div>
  );
}
