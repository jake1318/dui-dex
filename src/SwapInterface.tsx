// src/SwapInterface.tsx
// Last updated: 2025-01-23 07:44:15 UTC
// Author: jake1318

import React from "react";
import { TradingChart } from "./tradingchart";
import type { Candlestick } from "./types";

export const SwapInterface: React.FC = () => {
  // Sample data generator for testing
  const generateSampleData = (days: number): Candlestick[] => {
    const data: Candlestick[] = [];
    let currentPrice = 100;
    const startDate = new Date("2025-01-01");
    const millisecondsPerDay = 24 * 60 * 60 * 1000;

    for (let i = 0; i < days; i++) {
      // Create unique timestamp for each day
      const timestamp = startDate.getTime() + i * millisecondsPerDay;

      const volatility = 0.02;
      const rnd = Math.random() - 0.5;
      const changePercent = 2 * volatility * rnd;
      const open = currentPrice;
      const close = open * (1 + changePercent);
      const high = Math.max(open, close) * (1 + Math.random() * volatility);
      const low = Math.min(open, close) * (1 - Math.random() * volatility);
      const volume = Math.floor(Math.random() * 100000) + 10000;

      currentPrice = close;

      data.push({
        time: Math.floor(timestamp / 1000), // Convert to Unix timestamp (seconds)
        open,
        high,
        low,
        close,
        volume,
      });
    }

    // Sort data by timestamp to ensure ascending order
    return data.sort((a, b) => {
      const timeA =
        typeof a.time === "string" ? new Date(a.time).getTime() : a.time;
      const timeB =
        typeof b.time === "string" ? new Date(b.time).getTime() : b.time;
      return timeA - timeB;
    });
  };

  // Generate 100 days of sample data
  const sampleData = generateSampleData(100);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">DEX Trading Interface</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trading Chart */}
          <div className="lg:col-span-2 bg-gray-800 rounded-lg p-4">
            <TradingChart candlesticks={sampleData} width={800} height={600} />
          </div>

          {/* Swap Interface */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">Swap</h2>
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
    </div>
  );
};
