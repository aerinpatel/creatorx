import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { getChannelByHandle } from '../lib/youtube';
import { computeValuationFromStats } from '../lib/scoreEngine';
import { matchingEngine } from '../lib/engine/MatchingEngine';
import { OrderSide, OrderType, Order as EngineOrder } from '../lib/engine/types';

async function testFullFlow() {
  console.log("==================================================");
  console.log("Testing Complete End-to-End Creator Flow...");
  console.log("==================================================");

  const testEmail = `creator_flow_${Date.now()}@example.com`;
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  // 1. YouTube Data Fetch & Valuation
  const handle = 'test_channel_' + Date.now();
  console.log(`1. Ingesting YouTube channel: ${handle}`);
  const channelInfo = await getChannelByHandle(handle);
  if (!channelInfo) throw new Error("Failed to fetch channel info");
  
  const valuation = computeValuationFromStats(channelInfo);
  console.log(`   Suggested Valuation: $${valuation.suggestedValuation}, Suggested Price: $${valuation.suggestedPrice}`);

  // 2. Creator Signup in PENDING Status
  console.log(`2. Registering creator user: ${testEmail}`);
  const user = await prisma.user.create({
    data: {
      email: testEmail,
      passwordHash,
      role: 'CREATOR',
      walletBalance: 1000,
    }
  });

  const creator = await prisma.creator.create({
    data: {
      userId: user.id,
      channelName: channelInfo.channelName,
      youtubeChannelId: channelInfo.channelId,
      totalShares: BigInt(10000),
      floatShares: BigInt(2000),
      ownerShares: BigInt(8000),
      ipoStatus: 'PENDING',
      ipoPrice: valuation.suggestedPrice,
    }
  });

  await prisma.creatorScore.create({
    data: {
      creatorId: creator.id,
      subscribers: BigInt(channelInfo.subscribers),
      totalViews: BigInt(channelInfo.totalViews),
      totalLikes: BigInt(0),
      totalComments: BigInt(0),
      videoCount: channelInfo.videoCount,
      uploadConsistency: 0.95,
      computedScore: valuation.computedScore,
    }
  });
  console.log(`   Creator created in PENDING status. Creator ID: ${creator.id}`);

  // 3. Creator Customizes & Launches IPO
  console.log(`3. Creator launches IPO with customized Price ($5.00) & Float (3,000 shares)`);
  const chosenPrice = 5.00;
  const chosenShares = 10000;
  const chosenFloatPct = 30; // 3,000 shares
  const floatSharesCount = Math.floor(chosenShares * (chosenFloatPct / 100));
  const ownerSharesCount = chosenShares - floatSharesCount;

  await prisma.creator.update({
    where: { id: creator.id },
    data: {
      totalShares: BigInt(chosenShares),
      floatShares: BigInt(floatSharesCount),
      ownerShares: BigInt(ownerSharesCount),
      ipoPrice: chosenPrice,
      ipoStatus: 'LISTED',
      listedAt: new Date(),
    }
  });

  await prisma.holding.create({
    data: {
      userId: user.id,
      creatorId: creator.id,
      quantity: BigInt(ownerSharesCount), // 7,000 retained after float deduction
      avgBuyPrice: chosenPrice,
      lowestBuyPrice: chosenPrice,
      highestBuyPrice: chosenPrice,
    }
  });

  const floatOrder = await prisma.order.create({
    data: {
      userId: user.id,
      creatorId: creator.id,
      side: 'SELL',
      type: 'LIMIT',
      price: chosenPrice,
      quantity: BigInt(floatSharesCount),
      remainingQuantity: BigInt(floatSharesCount),
      status: 'OPEN',
      isCreatorAction: true,
    }
  });

  // 4. Inject Float Order into Worker Thread Matching Engine
  const engineOrder: EngineOrder = {
    id: floatOrder.id,
    userId: user.id,
    creatorId: creator.id,
    side: OrderSide.SELL,
    type: OrderType.LIMIT,
    price: chosenPrice,
    quantity: floatSharesCount,
    remainingQuantity: floatSharesCount,
    isCreatorAction: true,
    createdAt: Date.now(),
  };

  await matchingEngine.placeOrder(engineOrder);
  console.log(`   Float order (${floatSharesCount} shares @ $${chosenPrice}) placed in Worker Engine!`);

  // 5. Verify Order Book Snapshot in Worker Thread
  const snapshot = await matchingEngine.getOrderBookSnapshot(creator.id);
  console.log(`4. Worker Thread Order Book Depth:`, snapshot);

  if (snapshot.asks.length === 1 && snapshot.asks[0].price === chosenPrice && snapshot.asks[0].quantity === floatSharesCount) {
    console.log("\n FULL FLOW VERIFIED SUCCESSFULLY! Everything is working correctly.");
  } else {
    console.error("Order book depth mismatch:", snapshot);
  }

  process.exit(0);
}

testFullFlow().catch(err => {
  console.error(err);
  process.exit(1);
});
