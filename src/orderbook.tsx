import type { OrderbookLevel } from './orderbooks';

interface OrderBookProps {
  asks: OrderbookLevel[];
  bids: OrderbookLevel[];
  lastPrice: number | null;
  onPriceClick: (price: number, side: 'buy' | 'sell') => void;
  isConnected: boolean;
}

export function OrderBook({ asks, bids, lastPrice, onPriceClick, isConnected }: OrderBookProps) {
  return (
    <div className="col-span-3 bg-gray-800 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Order Book</h2>
        <div className="text-sm text-gray-400">
          {lastPrice ? `Last Price: $${lastPrice.toFixed(2)}` : '-'}
        </div>
      </div>
      
      <div className="mb-4">
        <div className="grid grid-cols-3 text-sm text-gray-400 mb-2">
          <div>Price</div>
          <div className="text-right">Size</div>
          <div className="text-right">Total</div>
        </div>
        
        {/* Asks */}
        <div className="space-y-1">
          {asks.map((level, i) => (
            <div 
              key={i} 
              className="grid grid-cols-3 text-sm text-red-400 hover:bg-gray-700 cursor-pointer"
              onClick={() => isConnected && onPriceClick(level.price, 'buy')}
            >
              <div>{level.price.toFixed(2)}</div>
              <div className="text-right">{level.size.toFixed(4)}</div>
              <div className="text-right">{level.total.toFixed(4)}</div>
            </div>
          ))}
        </div>

        {/* Spread */}
        <div className="my-2 text-center text-sm text-gray-400">
          Spread: {lastPrice && asks[0] && bids[0] 
            ? `$${(asks[0].price - bids[0].price).toFixed(2)} (${((asks[0].price - bids[0].price) / lastPrice * 100).toFixed(2)}%)`
            : '-'
          }
        </div>

        {/* Bids */}
        <div className="space-y-1">
          {bids.map((level, i) => (
            <div 
              key={i} 
              className="grid grid-cols-3 text-sm text-green-400 hover:bg-gray-700 cursor-pointer"
              onClick={() => isConnected && onPriceClick(level.price, 'sell')}
            >
              <div>{level.price.toFixed(2)}</div>
              <div className="text-right">{level.size.toFixed(4)}</div>
              <div className="text-right">{level.total.toFixed(4)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}