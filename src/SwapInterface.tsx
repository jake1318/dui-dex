/**
 * @file src/SwapInterface.tsx
 * Current Date and Time (UTC - YYYY-MM-DD HH:MM:SS formatted): 2025-01-27 00:00:10
 * Author: jake1318
 */

import React, { useState, useEffect } from "react";
import {
  useCurrentAccount,
  useInitializedSuiClient,
  useSignAndExecuteTransactionBlock,
} from "@mysten/dapp-kit";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { useDeepBook } from "./hooks/useDeepBook";
import DeepBookService from "./config/deepbook";
import { TOKENS, TOKEN_TYPES } from "./config/deepbook";
import { ERRORS, formatBalance, parseInputAmount } from "./utils";
import { Notification } from "./notification";
import "./swapinterface.css";

interface TokenBalance {
  symbol: string;
  balance: string;
  decimals: number;
}

interface SwapState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

export const SwapInterface: React.FC = () => {
  const currentAccount = useCurrentAccount();
  const suiClient = useInitializedSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransactionBlock();
  const { pools, loading: poolsLoading } = useDeepBook();
  const deepBook = DeepBookService.getInstance();

  // State management
  const [fromToken, setFromToken] = useState<string>(TOKEN_TYPES.SUI);
  const [toToken, setToToken] = useState<string>(TOKEN_TYPES.USDC);
  const [fromAmount, setFromAmount] = useState<string>("");
  const [toAmount, setToAmount] = useState<string>("");
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [priceImpact, setPriceImpact] = useState<number | null>(null);
  const [swapState, setSwapState] = useState<SwapState>({
    loading: false,
    error: null,
    success: false,
  });
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "warning" | "info";
  } | null>(null);

  // Fetch balances when account changes
  useEffect(() => {
    const fetchBalances = async () => {
      if (!currentAccount || !suiClient) return;

      try {
        const [suiBalance, usdcBalance] = await Promise.all([
          suiClient.getBalance({
            owner: currentAccount.address,
            coinType: TOKEN_TYPES.SUI,
          }),
          suiClient.getBalance({
            owner: currentAccount.address,
            coinType: TOKEN_TYPES.USDC,
          }),
        ]);

        setBalances([
          {
            symbol: "SUI",
            balance: formatBalance(
              suiBalance.totalBalance,
              TOKENS.SUI.decimals
            ),
            decimals: TOKENS.SUI.decimals,
          },
          {
            symbol: "USDC",
            balance: formatBalance(
              usdcBalance.totalBalance,
              TOKENS.USDC.decimals
            ),
            decimals: TOKENS.USDC.decimals,
          },
        ]);
      } catch (error) {
        console.error("Error fetching balances:", error);
        setNotification({
          message: "Failed to fetch balances",
          type: "error",
        });
      }
    };

    fetchBalances();
    const interval = setInterval(fetchBalances, 10000);
    return () => clearInterval(interval);
  }, [currentAccount, suiClient]);

  // Calculate output amount when input changes
  useEffect(() => {
    const calculateOutput = async () => {
      if (!fromAmount || !suiClient || poolsLoading) return;

      try {
        const parsedAmount = parseInputAmount(
          fromAmount,
          fromToken === TOKEN_TYPES.SUI
            ? TOKENS.SUI.decimals
            : TOKENS.USDC.decimals
        );
        if (!parsedAmount) return;

        const quote = await deepBook.getQuote(
          fromToken,
          toToken,
          parsedAmount,
          true // isSelling
        );

        if (quote) {
          setPriceImpact(quote.priceImpact);
          setToAmount(
            formatBalance(
              quote.quoteAmount,
              toToken === TOKEN_TYPES.SUI
                ? TOKENS.SUI.decimals
                : TOKENS.USDC.decimals
            )
          );
        }
      } catch (error) {
        console.error("Error calculating output:", error);
        setToAmount("");
        setPriceImpact(null);
      }
    };

    calculateOutput();
  }, [fromAmount, fromToken, toToken, suiClient, poolsLoading]);

  const handleSwap = async () => {
    if (!currentAccount || !suiClient) {
      setNotification({
        message: ERRORS.WALLET_NOT_CONNECTED,
        type: "error",
      });
      return;
    }

    if (poolsLoading) {
      setNotification({
        message: "Pools are still loading. Please try again later.",
        type: "error",
      });
      return;
    }

    setSwapState({ loading: true, error: null, success: false });

    try {
      const parsedAmount = parseInputAmount(
        fromAmount,
        fromToken === TOKEN_TYPES.SUI
          ? TOKENS.SUI.decimals
          : TOKENS.USDC.decimals
      );
      if (!parsedAmount) throw new Error(ERRORS.INVALID_AMOUNT);

      // Create transaction
      const txb = new TransactionBlock();
      await deepBook.createSwapTransaction({
        txb,
        baseToken: fromToken,
        quoteToken: toToken,
        amount: parsedAmount,
        slippage: 0.005, // 0.5%
        isSelling: true,
      });

      // Execute transaction
      await signAndExecute(
        {
          transactionBlock: txb,
          options: {
            showEffects: true,
            showObjectChanges: true,
          },
        },
        {
          onSuccess: () => {
            setSwapState({ loading: false, error: null, success: true });
            setNotification({
              message: "Swap executed successfully!",
              type: "success",
            });
            setFromAmount("");
            setToAmount("");
            setPriceImpact(null);
          },
          onError: (error) => {
            console.error("Transaction error:", error);
            setSwapState({
              loading: false,
              error: ERRORS.TRANSACTION_FAILED,
              success: false,
            });
            setNotification({
              message: ERRORS.TRANSACTION_FAILED,
              type: "error",
            });
          },
        }
      );
    } catch (error) {
      console.error("Swap error:", error);
      setSwapState({
        loading: false,
        error: error instanceof Error ? error.message : ERRORS.UNKNOWN_ERROR,
        success: false,
      });
      setNotification({
        message: error instanceof Error ? error.message : ERRORS.UNKNOWN_ERROR,
        type: "error",
      });
    }
  };

  const handleFromAmountChange = (value: string) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setFromAmount(value);
    }
  };

  const handleTokenSwap = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
    setPriceImpact(null);
  };

  return (
    <>
      <div className="swap-container">
        <div className="swap-card">
          <h1 className="swap-title">Swap Tokens</h1>

          {/* From Token Input */}
          <div className="token-input-container">
            <div className="token-input-header">
              <span className="token-label">From</span>
              <span className="token-balance">
                Balance:{" "}
                {balances.find(
                  (b) =>
                    b.symbol ===
                    (fromToken === TOKEN_TYPES.SUI ? "SUI" : "USDC")
                )?.balance || "0.00"}
              </span>
            </div>
            <div className="token-input-content">
              <input
                type="text"
                className="token-input"
                placeholder="0.0"
                value={fromAmount}
                onChange={(e) => handleFromAmountChange(e.target.value)}
                disabled={swapState.loading || poolsLoading}
              />
              <button
                className="select-token-button"
                disabled={swapState.loading || poolsLoading}
              >
                {fromToken === TOKEN_TYPES.SUI ? "SUI" : "USDC"}
              </button>
            </div>
          </div>

          {/* Swap Arrow */}
          <div
            className="swap-arrow"
            onClick={handleTokenSwap}
            style={{ opacity: swapState.loading || poolsLoading ? 0.5 : 1 }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8 3L8 13M8 13L13 8M8 13L3 8"
                stroke="#00a3ff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* To Token Input */}
          <div className="token-input-container">
            <div className="token-input-header">
              <span className="token-label">To</span>
              <span className="token-balance">
                Balance:{" "}
                {balances.find(
                  (b) =>
                    b.symbol === (toToken === TOKEN_TYPES.SUI ? "SUI" : "USDC")
                )?.balance || "0.00"}
              </span>
            </div>
            <div className="token-input-content">
              <input
                type="text"
                className="token-input"
                placeholder="0.0"
                value={toAmount}
                readOnly
              />
              <button
                className="select-token-button"
                disabled={swapState.loading || poolsLoading}
              >
                {toToken === TOKEN_TYPES.SUI ? "SUI" : "USDC"}
              </button>
            </div>
          </div>

          {/* Pool Loading Indicator */}
          {poolsLoading && (
            <div className="pool-loading">
              <span>Loading pool data...</span>
            </div>
          )}

          {/* Price Impact Display */}
          {priceImpact !== null && !poolsLoading && (
            <div className="swap-details">
              <div className="detail-row">
                <span>Price Impact:</span>
                <span
                  className={`impact-${
                    priceImpact > 5
                      ? "high"
                      : priceImpact > 2
                      ? "medium"
                      : "low"
                  }`}
                >
                  {priceImpact.toFixed(2)}%
                </span>
              </div>
            </div>
          )}

          {/* Swap Button */}
          <button
            className="swap-button"
            onClick={handleSwap}
            disabled={
              !currentAccount ||
              !fromAmount ||
              swapState.loading ||
              poolsLoading
            }
          >
            {!currentAccount
              ? "Connect Wallet"
              : poolsLoading
              ? "Loading Pools..."
              : swapState.loading
              ? "Swapping..."
              : !fromAmount
              ? "Enter Amount"
              : "Swap"}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          duration={5000}
          onClose={() => setNotification(null)}
        />
      )}
    </>
  );
};

export default SwapInterface;
