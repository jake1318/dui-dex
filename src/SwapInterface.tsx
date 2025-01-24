// src/SwapInterface.tsx
// Last updated: 2025-01-23 21:15:41 UTC
// Author: jake1318

import React from "react";

export const SwapInterface: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-8">Swap Tokens</h1>

        {/* Swap Interface */}
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="space-y-4">
            {/* From Token */}
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">From</span>
                <span className="text-gray-400">Balance: 0.00</span>
              </div>
              <div className="flex items-center">
                <input
                  type="number"
                  className="bg-transparent text-2xl w-full outline-none"
                  placeholder="0.0"
                />
                <button className="ml-2 bg-gray-600 px-3 py-1 rounded">
                  Select Token
                </button>
              </div>
            </div>

            {/* Swap Button */}
            <button className="bg-blue-500 hover:bg-blue-600 w-full py-3 rounded-lg font-semibold">
              Swap
            </button>

            {/* To Token */}
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">To</span>
                <span className="text-gray-400">Balance: 0.00</span>
              </div>
              <div className="flex items-center">
                <input
                  type="number"
                  className="bg-transparent text-2xl w-full outline-none"
                  placeholder="0.0"
                  readOnly
                />
                <button className="ml-2 bg-gray-600 px-3 py-1 rounded">
                  Select Token
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
