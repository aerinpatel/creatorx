import { EventEmitter } from 'events';
import { OrderBook } from './OrderBook';
import { Order, Trade } from './types';

export class MatchingEngine extends EventEmitter {
  private orderBooks: Map<string, OrderBook> = new Map();

  constructor() {
    super();
  }

  // Retrieve or create an order book for a creator
  private getOrderBook(creatorId: string): OrderBook {
    let orderBook = this.orderBooks.get(creatorId);
    if (!orderBook) {
      orderBook = new OrderBook(creatorId);
      this.orderBooks.set(creatorId, orderBook);
    }
    return orderBook;
  }

  public placeOrder(order: Order): Trade[] {
    const book = this.getOrderBook(order.creatorId);
    const trades = book.addOrder(order);

    if (trades.length > 0) {
      for (const trade of trades) {
        this.emit('trade', trade);
      }
    }
    
    // Always emit depth update for this creator's book
    this.emit('depth', {
      creatorId: order.creatorId,
      snapshot: book.getDepth()
    });

    return trades;
  }

  public cancelOrder(creatorId: string, orderId: string): boolean {
    const orderBook = this.orderBooks.get(creatorId);
    if (!orderBook) return false;
    return orderBook.cancelOrder(orderId);
  }

  public getOrderBookSnapshot(creatorId: string, depth: number = 10) {
    const orderBook = this.orderBooks.get(creatorId);
    if (!orderBook) {
      return { bids: [], asks: [] };
    }
    return orderBook.getDepth(depth);
  }

  // Get a specific order (for debugging/status checks)
  public getOrder(creatorId: string, orderId: string): Order | undefined {
    const orderBook = this.orderBooks.get(creatorId);
    if (!orderBook) return undefined;
    return orderBook.getOrder(orderId);
  }
}

// Singleton instance for in-memory use during the lifetime of the process
// Using global object to prevent hot-reloads in Next.js from destroying the engine
const globalForEngine = global as unknown as { matchingEngine: MatchingEngine };
export const matchingEngine = globalForEngine.matchingEngine || new MatchingEngine();
if (process.env.NODE_ENV !== 'production') globalForEngine.matchingEngine = matchingEngine;
