import { prisma } from '../lib/prisma';
import { matchingEngine } from '../lib/engine/MatchingEngine';
import { processTrades } from '../lib/engine/reconciliation';
import { OrderSide, OrderType, Order as EngineOrder } from '../lib/engine/types';

async function main() {
  console.log('--- Checking pending open orders in DB ---');
  
  const openOrders = await prisma.order.findMany({
    where: { status: { in: ['OPEN', 'PARTIAL'] } },
    orderBy: { createdAt: 'asc' }
  });
  
  console.log(`Found ${openOrders.length} open orders.`);
  
  for (const dbOrder of openOrders) {
    const engineOrder: EngineOrder = {
      id: dbOrder.id,
      userId: dbOrder.userId,
      creatorId: dbOrder.creatorId,
      side: dbOrder.side as OrderSide,
      type: dbOrder.type as OrderType,
      price: dbOrder.price ? Number(dbOrder.price) : null,
      quantity: Number(dbOrder.quantity),
      remainingQuantity: Number(dbOrder.remainingQuantity),
      isCreatorAction: dbOrder.isCreatorAction,
      createdAt: dbOrder.createdAt.getTime(),
    };

    console.log(`Placing into engine: ${dbOrder.side} ${dbOrder.quantity} @ ${dbOrder.price} for creator ${dbOrder.creatorId}`);
    const { trades } = matchingEngine.placeOrder(engineOrder);
    
    if (trades.length > 0) {
      console.log(`MATCHED ${trades.length} trades! Reconciling in DB...`);
      await processTrades(trades, engineOrder.price);
    }
  }

  const aerin = await prisma.user.findFirst({
    where: { email: { contains: 'aerin' } },
    include: {
      holdings: { include: { creator: true } },
      ordersPlaced: { where: { status: { in: ['OPEN', 'PARTIAL'] } } }
    }
  });

  console.log('--- Aerin Status After Reconciliation ---');
  console.log('Wallet Balance:', aerin?.walletBalance.toString());
  console.log('Holdings:', aerin?.holdings.map(h => ({
    channel: h.creator.channelName,
    quantity: h.quantity.toString(),
    avgBuyPrice: h.avgBuyPrice.toString()
  })));
  console.log('Open Orders:', aerin?.ordersPlaced.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
