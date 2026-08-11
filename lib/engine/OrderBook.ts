import { Order, OrderSide, OrderType, Trade } from './types';
import { Heap } from './Heap';
import { v4 as uuidv4 } from 'uuid';

/**
 * FIFO Order Queue for a specific Price Level.
 * Guarantees Price-Time priority: orders submitted earlier at the same price
 * are placed at the front of the queue and matched first.
 */
export class OrderQueue {
  private queue: Order[] = [];

  public enqueue(order: Order): void {
    this.queue.push(order);
  }

  public dequeue(): Order | undefined {
    return this.queue.shift();
  }

  public peek(): Order | undefined {
    return this.queue.length > 0 ? this.queue[0] : undefined;
  }

  public size(): number {
    return this.queue.length;
  }

  public get items(): Order[] {
    return this.queue;
  }
}

/**
 * PriceLevel represents a single unique price node in the Order Book Heap.
 * Each PriceLevel contains a FIFO queue of orders placed at this exact price.
 */
export class PriceLevel {
  public price: number;
  public orderQueue: OrderQueue = new OrderQueue();

  constructor(price: number) {
    this.price = price;
  }

  public addOrder(order: Order): void {
    this.orderQueue.enqueue(order);
  }

  public getNextOrder(): Order | undefined {
    return this.orderQueue.peek();
  }

  public popOrder(): Order | undefined {
    return this.orderQueue.dequeue();
  }

  public isEmpty(): boolean {
    return this.orderQueue.size() === 0;
  }
}

/**
 * High-Performance Heap-of-Queues OrderBook.
 * - Bids: Max-Heap of PriceLevels (highest price at root, O(1) peek).
 * - Asks: Min-Heap of PriceLevels (lowest price at root, O(1) peek).
 * - PriceLevel: FIFO Queue of orders at that price level for time priority.
 */
export class OrderBook {
  public creatorId: string;
  private bids: Heap<PriceLevel>; // Max-Heap of PriceLevel queues
  private asks: Heap<PriceLevel>; // Min-Heap of PriceLevel queues
  private bidPriceLevels: Map<number, PriceLevel> = new Map();
  private askPriceLevels: Map<number, PriceLevel> = new Map();
  private orderMap: Map<string, Order> = new Map(); // O(1) lookup & lazy tombstone cancellation

  constructor(creatorId: string) {
    this.creatorId = creatorId;

    // Bids: Max-Heap (highest price first)
    this.bids = new Heap<PriceLevel>((a, b) => b.price - a.price);

    // Asks: Min-Heap (lowest price first)
    this.asks = new Heap<PriceLevel>((a, b) => a.price - b.price);
  }

  public getOrder(orderId: string): Order | undefined {
    return this.orderMap.get(orderId);
  }

  public cancelOrder(orderId: string): boolean {
    const order = this.orderMap.get(orderId);
    if (!order || order.isCancelled) return false;

    // O(1) lazy tombstone cancellation
    order.isCancelled = true;
    order.remainingQuantity = 0;
    return true;
  }

  public addOrder(order: Order): Trade[] {
    this.orderMap.set(order.id, order);

    let trades: Trade[] = [];
    if (order.side === OrderSide.BUY) {
      // Match incoming Buy against Ask Min-Heap
      trades = this.matchOrder(order, this.asks, this.askPriceLevels, (askPrice) => order.type === OrderType.MARKET || askPrice <= order.price!);
      if (order.remainingQuantity > 0 && order.type === OrderType.LIMIT) {
        this.insertOrder(order, this.bids, this.bidPriceLevels);
      }
    } else {
      // Match incoming Sell against Bid Max-Heap
      trades = this.matchOrder(order, this.bids, this.bidPriceLevels, (bidPrice) => order.type === OrderType.MARKET || bidPrice >= order.price!);
      if (order.remainingQuantity > 0 && order.type === OrderType.LIMIT) {
        this.insertOrder(order, this.asks, this.askPriceLevels);
      }
    }

    // Market orders that couldn't be fully filled are auto-cancelled
    if (order.remainingQuantity > 0 && order.type === OrderType.MARKET) {
      order.isCancelled = true;
    }

    return trades;
  }

  private insertOrder(order: Order, heap: Heap<PriceLevel>, priceLevels: Map<number, PriceLevel>) {
    if (order.price === null) return;
    
    let level = priceLevels.get(order.price);
    if (!level) {
      level = new PriceLevel(order.price);
      priceLevels.set(order.price, level);
      heap.push(level);
    }
    // Enqueue order to the tail of the price level queue (FIFO)
    level.addOrder(order);
  }

  private matchOrder(
    incomingOrder: Order, 
    oppositeHeap: Heap<PriceLevel>, 
    oppositePriceLevels: Map<number, PriceLevel>, 
    priceCondition: (price: number) => boolean
  ): Trade[] {
    const trades: Trade[] = [];

    while (incomingOrder.remainingQuantity > 0 && oppositeHeap.size() > 0) {
      const bestLevel = oppositeHeap.peek()!;

      if (!priceCondition(bestLevel.price)) {
        break; // No matching price available in the book
      }

      // Iterate through the FIFO queue of resting orders at this best price
      while (!bestLevel.isEmpty() && incomingOrder.remainingQuantity > 0) {
        const restingOrder = bestLevel.getNextOrder()!;

        // 1. Skip and prune lazy cancelled tombstones
        if (restingOrder.isCancelled) {
          bestLevel.popOrder();
          continue;
        }

        // 2. Self-Trade Prevention: prevent account from matching its own resting order
        if (incomingOrder.userId === restingOrder.userId) {
          restingOrder.isCancelled = true;
          bestLevel.popOrder();
          continue;
        }

        // 3. Calculate trade quantity
        const tradeQuantity = Math.min(incomingOrder.remainingQuantity, restingOrder.remainingQuantity);
        
        incomingOrder.remainingQuantity -= tradeQuantity;
        restingOrder.remainingQuantity -= tradeQuantity;

        const trade: Trade = {
          id: uuidv4(),
          creatorId: this.creatorId,
          buyOrderId: incomingOrder.side === OrderSide.BUY ? incomingOrder.id : restingOrder.id,
          sellOrderId: incomingOrder.side === OrderSide.SELL ? incomingOrder.id : restingOrder.id,
          buyerId: incomingOrder.side === OrderSide.BUY ? incomingOrder.userId : restingOrder.userId,
          sellerId: incomingOrder.side === OrderSide.SELL ? incomingOrder.userId : restingOrder.userId,
          price: bestLevel.price, // Maker execution price
          quantity: tradeQuantity,
          executedAt: Date.now(),
        };
        trades.push(trade);

        // 4. If resting order is fully filled, pop it from the FIFO queue
        if (restingOrder.remainingQuantity === 0) {
          bestLevel.popOrder();
        }
      }

      // If all orders at this price level are consumed/cancelled, remove the level from heap
      if (bestLevel.isEmpty()) {
        oppositeHeap.pop();
        oppositePriceLevels.delete(bestLevel.price);
      }
    }

    return trades;
  }

  // Get Top Levels Depth for UI & Charts
  public getDepth(levels: number = 10) {
    return {
      bids: this.getTopLevels(this.bids, this.bidPriceLevels, levels),
      asks: this.getTopLevels(this.asks, this.askPriceLevels, levels),
    };
  }

  private getTopLevels(heap: Heap<PriceLevel>, priceLevels: Map<number, PriceLevel>, limit: number) {
    return Array.from(priceLevels.values())
      .map(l => ({
        price: l.price,
        quantity: l.orderQueue.items.reduce((sum, o) => sum + (o.isCancelled ? 0 : o.remainingQuantity), 0)
      }))
      .filter(l => l.quantity > 0)
      .sort((a, b) => heap === this.bids ? b.price - a.price : a.price - b.price)
      .slice(0, limit);
  }
}
