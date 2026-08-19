import { MatchingEngine } from '../lib/engine/MatchingEngine';
import { Order, OrderSide, OrderType } from '../lib/engine/types';
import assert from 'assert';

function createOrder(overrides: Partial<Order>): Order {
  return {
    id: Math.random().toString(),
    userId: 'user1',
    creatorId: 'creator1',
    side: OrderSide.BUY,
    type: OrderType.LIMIT,
    price: 100,
    quantity: 10,
    remainingQuantity: 10,
    isCreatorAction: false,
    createdAt: Date.now(),
    ...overrides
  };
}

async function runTests() {
  console.log("Running Worker Thread Matching Engine Tests...");

  // Test 1: Basic Limit Order Placement
  let engine = new MatchingEngine();
  await engine.placeOrder(createOrder({ id: 'o1', side: OrderSide.BUY, price: 100, quantity: 10, remainingQuantity: 10, userId: 'u1' }));
  
  let snapshot = await engine.getOrderBookSnapshot('creator1');
  assert.strictEqual(snapshot.bids.length, 1);
  assert.strictEqual(snapshot.bids[0].price, 100);
  assert.strictEqual(snapshot.bids[0].quantity, 10);
  assert.strictEqual(snapshot.asks.length, 0);
  console.log("✔ Test 1: Basic Limit Order Placement passed");

  // Test 2: Full Match
  engine = new MatchingEngine();
  await engine.placeOrder(createOrder({ id: 'buy1', side: OrderSide.BUY, price: 100, quantity: 10, remainingQuantity: 10, userId: 'buyer1' }));
  let { trades } = await engine.placeOrder(createOrder({ id: 'sell1', side: OrderSide.SELL, price: 100, quantity: 10, remainingQuantity: 10, userId: 'seller1' }));
  
  assert.strictEqual(trades.length, 1);
  assert.strictEqual(trades[0].quantity, 10);
  assert.strictEqual(trades[0].price, 100);
  
  snapshot = await engine.getOrderBookSnapshot('creator1');
  assert.strictEqual(snapshot.bids.length, 0); // Book should be empty
  assert.strictEqual(snapshot.asks.length, 0);
  console.log("✔ Test 2: Full Match passed");

  // Test 3: Partial Fill & Sweep
  engine = new MatchingEngine();
  // Asks in book: 10 @ $105, 5 @ $110
  await engine.placeOrder(createOrder({ side: OrderSide.SELL, price: 105, quantity: 10, remainingQuantity: 10, userId: 's1' }));
  await engine.placeOrder(createOrder({ side: OrderSide.SELL, price: 110, quantity: 5, remainingQuantity: 5, userId: 's2' }));
  
  // Market Buy for 12 shares
  const sweepRes = await engine.placeOrder(createOrder({ side: OrderSide.BUY, type: OrderType.MARKET, price: null, quantity: 12, remainingQuantity: 12, userId: 'b1' }));
  trades = sweepRes.trades;
  
  assert.strictEqual(trades.length, 2);
  assert.strictEqual(trades[0].price, 105);
  assert.strictEqual(trades[0].quantity, 10);
  assert.strictEqual(trades[1].price, 110);
  assert.strictEqual(trades[1].quantity, 2);

  snapshot = await engine.getOrderBookSnapshot('creator1');
  assert.strictEqual(snapshot.asks.length, 1);
  assert.strictEqual(snapshot.asks[0].price, 110);
  assert.strictEqual(snapshot.asks[0].quantity, 3); // 5 - 2 = 3
  console.log("✔ Test 3: Partial Fill & Sweep passed");

  // Test 4: Self-Trade Prevention
  engine = new MatchingEngine();
  await engine.placeOrder(createOrder({ side: OrderSide.BUY, price: 100, quantity: 10, remainingQuantity: 10, userId: 'sameUser' }));
  const stpRes = await engine.placeOrder(createOrder({ side: OrderSide.SELL, price: 100, quantity: 5, remainingQuantity: 5, userId: 'sameUser' }));
  
  assert.strictEqual(stpRes.trades.length, 0); // No trades should occur
  assert.strictEqual(stpRes.stpCancelledOrders.length, 1); // 1 resting order cancelled via STP
  console.log("✔ Test 4: Self-Trade Prevention passed");

  // Test 5: O(1) Cancellation
  engine = new MatchingEngine();
  await engine.placeOrder(createOrder({ id: 'cancelMe', side: OrderSide.BUY, price: 100, quantity: 10, remainingQuantity: 10, userId: 'u1' }));
  
  const canceled = await engine.cancelOrder('creator1', 'cancelMe');
  assert.strictEqual(canceled, true);
  
  snapshot = await engine.getOrderBookSnapshot('creator1');
  assert.strictEqual(snapshot.bids.length, 0);
  console.log("✔ Test 5: O(1) Cancellation passed");

  // Test 6: Strict Price-Time (FIFO) Priority
  engine = new MatchingEngine();
  await engine.placeOrder(createOrder({ id: 'rest1', side: OrderSide.BUY, price: 100, quantity: 5, remainingQuantity: 5, userId: 'u1' }));
  await engine.placeOrder(createOrder({ id: 'rest2', side: OrderSide.BUY, price: 100, quantity: 5, remainingQuantity: 5, userId: 'u2' }));
  
  const fifoRes = await engine.placeOrder(createOrder({ side: OrderSide.SELL, type: OrderType.MARKET, price: null, quantity: 6, remainingQuantity: 6, userId: 'seller' }));
  trades = fifoRes.trades;
  assert.strictEqual(trades.length, 2);
  assert.strictEqual(trades[0].buyerId, 'u1'); // u1 was first
  assert.strictEqual(trades[0].quantity, 5);
  assert.strictEqual(trades[1].buyerId, 'u2'); // u2 gets the remainder
  assert.strictEqual(trades[1].quantity, 1);
  
  snapshot = await engine.getOrderBookSnapshot('creator1');
  assert.strictEqual(snapshot.bids[0].quantity, 4); // u2 has 4 left
  console.log("✔ Test 6: Strict Price-Time (FIFO) Priority passed");

  // Test 7: Market Order Liquidity Exhaustion
  engine = new MatchingEngine();
  await engine.placeOrder(createOrder({ side: OrderSide.SELL, price: 110, quantity: 5, remainingQuantity: 5, userId: 's1' }));
  
  const hugeMarketOrder = createOrder({ side: OrderSide.BUY, type: OrderType.MARKET, price: null, quantity: 20, remainingQuantity: 20, userId: 'b1' });
  const exhaustionRes = await engine.placeOrder(hugeMarketOrder);
  trades = exhaustionRes.trades;
  
  assert.strictEqual(trades.length, 1);
  assert.strictEqual(trades[0].quantity, 5);
  // Book should be completely drained of asks
  snapshot = await engine.getOrderBookSnapshot('creator1');
  assert.strictEqual(snapshot.asks.length, 0);
  console.log("✔ Test 7: Market Order Liquidity Exhaustion passed");

  console.log("\n All matching engine tests passed (7/7 comprehensive cases)!");
  process.exit(0);
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
