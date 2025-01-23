// src/constants/trading.ts

export const CONSTANTS = {
  // API and WebSocket endpoints
  API_URL: "https://api.sui-dex.com", // Replace with your actual API endpoint
  WEBSOCKET_URL: "wss://ws.sui-dex.com", // Replace with your actual WebSocket endpoint

  // Intervals
  REFRESH_INTERVAL: 1000, // 1 second
  WEBSOCKET_RECONNECT_DELAY: 3000, // 3 seconds
  CANDLESTICK_INTERVAL: "1m", // 1 minute candles

  // Order book display
  ORDER_BOOK_LEVELS: 15, // Number of orders to show on each side
  RECENT_TRADES_COUNT: 50, // Number of recent trades to display

  // Price formatting
  PRICE_DECIMALS: 6,
  AMOUNT_DECIMALS: 4,
  TOTAL_DECIMALS: 2,

  // Order limits
  MIN_ORDER_SIZE: 0.0001,
  MAX_ORDER_SIZE: 1000000,

  // Timeouts
  ORDER_TIMEOUT: 30000, // 30 seconds

  // Market pairs
  TRADING_PAIRS: [
    {
      symbol: "SUI/USDC",
      baseAsset: "SUI",
      quoteAsset: "USDC",
      minOrderSize: 0.1,
      maxOrderSize: 1000000,
      priceDecimals: 6,
      quantityDecimals: 4,
    },
  ],
};

export const ERRORS = {
  INSUFFICIENT_BALANCE: "Insufficient balance",
  INVALID_PRICE: "Invalid price",
  INVALID_AMOUNT: "Invalid amount",
  ORDER_TOO_SMALL: "Order size too small",
  ORDER_TOO_LARGE: "Order size too large",
  PRICE_OUT_OF_RANGE: "Price out of range",
  CONNECTION_ERROR: "Connection error",
  TIMEOUT: "Request timed out",
  UNAUTHORIZED: "Unauthorized",
};
