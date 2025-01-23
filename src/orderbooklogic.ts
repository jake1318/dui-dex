// src/utils/orderbookLogic.ts
import { OrderBookEntry } from "./types";

export const processOrders = (
  orders: OrderBookEntry[],
  ascending: boolean
): OrderBookEntry[] => {
  if (!orders.length) return [];

  let cumTotal = 0;
  const maxTotal = Math.max(
    ...orders.map((order) => order.price * order.quantity)
  );

  return orders
    .sort((a, b) => (ascending ? a.price - b.price : b.price - a.price))
    .map((order) => {
      cumTotal += order.quantity;
      return {
        ...order,
        total: cumTotal,
        depth: ((order.price * order.quantity) / maxTotal) * 100,
      };
    });
};

export const aggregateOrders = (
  orders: OrderBookEntry[],
  levels: number = 10
): OrderBookEntry[] => {
  const aggregated = new Map<number, OrderBookEntry>();

  orders.forEach((order) => {
    const price = Math.round(order.price * 1e6) / 1e6; // Round to 6 decimal places
    if (aggregated.has(price)) {
      const existing = aggregated.get(price)!;
      aggregated.set(price, {
        ...existing,
        quantity: existing.quantity + order.quantity,
      });
    } else {
      aggregated.set(price, { ...order });
    }
  });

  return Array.from(aggregated.values())
    .sort((a, b) => b.price - a.price)
    .slice(0, levels);
};
