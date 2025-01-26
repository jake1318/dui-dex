// src/types.ts
// Last updated: 2025-01-23 07:42:13 UTC
// Author: jake1318

export interface OrderBookEntry {
  price: number;
  size: number;
  quantity: number;
  total: number;
  depth?: number;
}

export interface Trade {
  id: string;
  price: number;
  quantity: number;
  side: "buy" | "sell";
  timestamp: number;
}

// Updated Candlestick interface to handle both string and number time formats
export interface Candlestick {
  time: string | number; // Support both ISO string and timestamp number
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface NotificationConfig {
  message: string;
  type: "success" | "error" | "warning" | "info";
  duration?: number;
}

export interface MarketData {
  lastPrice: number;
  priceChange24h: number;
  highPrice24h: number;
  lowPrice24h: number;
  volume24h: number;
}

export type OrderType = "limit" | "market";
export type OrderSide = "buy" | "sell";

export interface PoolData {
  baseToken: string;
  quoteToken: string;
  tickSize: bigint;
  lotSize: bigint;
  baseBalance: bigint;
  quoteBalance: bigint;
  baseReserve: bigint;
  quoteReserve: bigint;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
}

export interface PriceImpact {
  percentage: number;
  severity: "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
  color: string;
}

export interface PoolState {
  isActive: boolean;
  hasLiquidity: boolean;
  minLiquidity: bigint;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
}

// Add utility type for time formats
export type TimeFormat = string | number;

// Add constants for price impact severity thresholds
export const PRICE_IMPACT_THRESHOLDS = {
  LOW: 0.5,
  MEDIUM: 1.0,
  HIGH: 2.0,
  VERY_HIGH: 5.0,
} as const;

// Add constants for order book depth levels
export const ORDER_BOOK_DEPTH_LEVELS = {
  SHALLOW: 10,
  MEDIUM: 20,
  DEEP: 50,
} as const;

// Add type for supported token pairs
export interface TokenPair {
  base: string;
  quote: string;
  pairId: string;
  minOrderSize: number;
  maxOrderSize: number;
  tickSize: number;
}

// Add type for order status
export type OrderStatus =
  | "pending"
  | "open"
  | "filled"
  | "partially_filled"
  | "cancelled"
  | "expired";

// Add interface for detailed order information
export interface OrderDetails extends OrderBookEntry {
  orderId: string;
  status: OrderStatus;
  filled: number;
  remaining: number;
  avgFillPrice?: number;
  createdAt: number;
  updatedAt: number;
}
// Add to src/types.ts

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SearchApiResponse
  extends ApiResponse<{
    aiResponse: string;
    youtubeResults: YouTubeResult[];
    webResults: WebResult[];
  }> {}

export interface YouTubeResult {
  title: string;
  description: string;
  thumbnail: string;
  videoId: string;
  url: string;
}

export interface WebResult {
  title: string;
  description: string;
  url: string;
}
// src/types.ts

// ... (keep your existing types)

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SearchResponse {
  aiResponse: string;
  youtubeResults: YouTubeResult[];
  webResults: WebResult[];
}

export interface SearchApiResponse extends ApiResponse<SearchResponse> {}

export interface YouTubeResult {
  title: string;
  description: string;
  thumbnail: string;
  videoId: string;
  url: string;
}

export interface WebResult {
  title: string;
  description: string;
  url: string;
}
