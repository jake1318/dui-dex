export interface OrderbookLevel {
  price: number;
  size: number;
  total: number;
  cumulative: number;
}

export interface DeepBookOrder {
  price: number;
  quantity: number;
  owner: string;
}

export interface Order {
  id: string;
  owner: string;
  price: number;
  size: number;
  side: "buy" | "sell";
  status: "open" | "cancelled" | "filled";
  timestamp: number;
}

export interface Trade {
  id: string;
  price: number;
  size: number;
  side: "buy" | "sell";
  timestamp: number;
}

export interface ChartData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}
