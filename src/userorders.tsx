import type { Order } from "./orderbooks";

interface UserOrdersProps {
  orders: Order[];
  onCancelOrder: (orderId: string) => void;
  isLoading: boolean;
}

export function UserOrders({
  orders,
  onCancelOrder,
  isLoading,
}: UserOrdersProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">My Open Orders</h3>
      {orders.length === 0 ? (
        <div className="text-center text-gray-400 py-4">No open orders</div>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-gray-700 p-3 rounded-lg flex justify-between items-center"
            >
              <div>
                <div
                  className={
                    order.side === "buy" ? "text-green-400" : "text-red-400"
                  }
                >
                  {order.side === "buy" ? "Buy" : "Sell"}{" "}
                  {order.size.toFixed(4)} SUI
                </div>
                <div className="text-sm text-gray-400">
                  @ {order.price.toFixed(2)} USDC
                </div>
              </div>
              <button
                className="px-3 py-1 bg-red-500 hover:bg-red-600 rounded"
                onClick={() => onCancelOrder(order.id)}
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
