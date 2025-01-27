/**
 * @file src/components/TokenSelectionModal.tsx
 * Current Date and Time (UTC - YYYY-MM-DD HH:MM:SS formatted): 2025-01-26 23:57:13
 * Current User's Login: jake1318
 */

import React, { useState, useEffect } from "react";
import { useCurrentAccount, useInitializedSuiClient } from "@mysten/dapp-kit";
import { TOKENS } from "../config/deepbook";
import { formatBalance } from "../utils";
import "./TokenSelectionModal.css";

interface TokenInfo {
  symbol: string;
  type: string;
  decimals: number;
  balance?: string;
}

interface TokenSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (token: TokenInfo) => void;
  currentToken?: string;
  excludeToken?: string;
}

export const TokenSelectionModal: React.FC<TokenSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentToken,
  excludeToken,
}) => {
  const currentAccount = useCurrentAccount();
  const suiClient = useInitializedSuiClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [tokenList, setTokenList] = useState<TokenInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize token list with balances
  useEffect(() => {
    const fetchBalances = async () => {
      if (!currentAccount || !suiClient) {
        setTokenList(
          Object.entries(TOKENS).map(([symbol, token]) => ({
            symbol,
            type: token.type,
            decimals: token.decimals,
          }))
        );
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const tokens = await Promise.all(
          Object.entries(TOKENS).map(async ([symbol, token]) => {
            try {
              const balance = await suiClient.getBalance({
                owner: currentAccount.address,
                coinType: token.type,
              });

              return {
                symbol,
                type: token.type,
                decimals: token.decimals,
                balance: formatBalance(balance.totalBalance, token.decimals),
              };
            } catch (error) {
              console.warn(`Failed to fetch balance for ${symbol}:`, error);
              return {
                symbol,
                type: token.type,
                decimals: token.decimals,
                balance: "0",
              };
            }
          })
        );

        setTokenList(tokens);
      } catch (error) {
        console.error("Error fetching token balances:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchBalances();
    }
  }, [currentAccount, suiClient, isOpen]);

  // Filter tokens based on search query and excluded token
  const filteredTokens = tokenList.filter(
    (token) =>
      token.type !== excludeToken &&
      (token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.type.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!isOpen) return null;

  return (
    <div className="token-modal-overlay" onClick={onClose}>
      <div className="token-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="token-modal-header">
          <h3>Select Token</h3>
          <button className="token-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="token-modal-search">
          <input
            type="text"
            placeholder="Search by name or paste address"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>

        <div className="token-modal-list">
          {loading ? (
            <div className="token-modal-loading">Loading tokens...</div>
          ) : filteredTokens.length === 0 ? (
            <div className="token-modal-no-results">No tokens found</div>
          ) : (
            filteredTokens.map((token) => (
              <div
                key={token.type}
                className={`token-modal-item ${
                  token.type === currentToken ? "selected" : ""
                }`}
                onClick={() => {
                  onSelect(token);
                  onClose();
                }}
              >
                <div className="token-modal-item-info">
                  <div className="token-modal-item-symbol">{token.symbol}</div>
                  <div className="token-modal-item-name">{token.type}</div>
                </div>
                {token.balance && (
                  <div className="token-modal-item-balance">
                    {token.balance}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Optional: Add CSS if not already present
const styles = `
.token-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.token-modal-content {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 420px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.token-modal-header {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
}

.token-modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  padding: 4px 8px;
}

.token-modal-search {
  padding: 16px;
}

.token-modal-search input {
  width: 100%;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 8px;
  font-size: 16px;
}

.token-modal-list {
  overflow-y: auto;
  padding: 8px;
}

.token-modal-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  cursor: pointer;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.token-modal-item:hover {
  background-color: #f5f5f5;
}

.token-modal-item.selected {
  background-color: #e6f7ff;
}

.token-modal-item-info {
  display: flex;
  flex-direction: column;
}

.token-modal-item-symbol {
  font-weight: 600;
}

.token-modal-item-name {
  font-size: 14px;
  color: #666;
}

.token-modal-item-balance {
  font-weight: 500;
}

.token-modal-loading,
.token-modal-no-results {
  padding: 24px;
  text-align: center;
  color: #666;
}
`;

export default TokenSelectionModal;
