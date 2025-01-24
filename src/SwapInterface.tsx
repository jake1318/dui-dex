// src/SwapInterface.tsx
// Last updated: 2025-01-24
// Author: jake1318

import React from "react";
import "./swapinterface.css";

const Footer: React.FC = () => (
  <footer className="footer">
    <p>&copy; 2025 Sui Mind. All rights reserved.</p>
  </footer>
);

export const SwapInterface: React.FC = () => {
  return (
    <>
      <div className="swap-container">
        <div className="swap-card">
          <h1 className="swap-title">Swap Tokens</h1>

          <div className="token-input-container">
            <div className="token-input-header">
              <span className="token-label">From</span>
              <span className="token-balance">Balance: 0.00</span>
            </div>
            <div className="token-input-content">
              <input type="number" className="token-input" placeholder="0.0" />
              <button className="select-token-button">Select Token</button>
            </div>
          </div>

          <div className="swap-arrow">
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

          <div className="token-input-container">
            <div className="token-input-header">
              <span className="token-label">To</span>
              <span className="token-balance">Balance: 0.00</span>
            </div>
            <div className="token-input-content">
              <input
                type="number"
                className="token-input"
                placeholder="0.0"
                readOnly
              />
              <button className="select-token-button">Select Token</button>
            </div>
          </div>

          <button className="swap-button">Swap</button>
        </div>
      </div>
      <Footer />
    </>
  );
};
