import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { matchingEngine } from '@/lib/engine/MatchingEngine';
import { OrderSide, OrderType, Order as EngineOrder } from '@/lib/engine/types';

export async function POST(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);

    if (!payload || payload.role !== 'CREATOR') {
      return NextResponse.json({ error: 'Unauthorized. Only creators can IPO.' }, { status: 403 });
    }

    const { channelName, youtubeChannelId, valuation, totalShares, floatPercent } = await req.json();

    if (!channelName || !youtubeChannelId || !valuation || !totalShares || !floatPercent) {
      return NextResponse.json({ error: 'Missing required IPO fields' }, { status: 400 });
    }

    if (floatPercent <= 0 || floatPercent > 100) {
      return NextResponse.json({ error: 'Float percent must be between 1 and 100' }, { status: 400 });
    }

    // Mathematical breakdown of the IPO
    const ipoPrice = Number(valuation) / Number(totalShares);
    const floatSharesCount = Math.floor(Number(totalShares) * (Number(floatPercent) / 100));
    const ownerSharesCount = Number(totalShares) - floatSharesCount;

    // Create the Creator profile and initial Holding atomically
    const creator = await prisma.$transaction(async (tx) => {
      const newCreator = await tx.creator.create({
        data: {
          userId: payload.userId,
          channelName,
          youtubeChannelId,
          totalShares: BigInt(totalShares),
          floatShares: BigInt(floatSharesCount),
          ownerShares: BigInt(ownerSharesCount),
          ipoPrice: ipoPrice,
          ipoStatus: 'LISTED', 
          listedAt: new Date(),
        }
      });

      // Grant the creator 100% of the shares initially so they can sell the float into the market
      await tx.holding.create({
        data: {
          userId: payload.userId,
          creatorId: newCreator.id,
          quantity: BigInt(totalShares),
          avgBuyPrice: ipoPrice,
          lowestBuyPrice: ipoPrice,
          highestBuyPrice: ipoPrice,
        }
      });

      // Issue 2 Fix: Auto-Float the public shares by placing a massive SELL order from the Creator
      const floatOrder = await tx.order.create({
        data: {
          userId: payload.userId,
          creatorId: newCreator.id,
          side: 'SELL',
          type: 'LIMIT',
          price: ipoPrice,
          quantity: BigInt(floatSharesCount),
          remainingQuantity: BigInt(floatSharesCount),
          status: 'OPEN',
          isCreatorAction: true,
        }
      });

      // Deduct the float shares from the holding for escrow immediately
      await tx.holding.update({
        where: { userId_creatorId: { userId: payload.userId, creatorId: newCreator.id } },
        data: { quantity: { decrement: floatSharesCount } }
      });

      return { newCreator, floatOrder };
    });
    
    // Push the auto-float order into the In-Memory matching engine
    const engineOrder: EngineOrder = {
      id: creator.floatOrder.id,
      userId: payload.userId,
      creatorId: creator.newCreator.id,
      side: 'SELL' as OrderSide,
      type: 'LIMIT' as OrderType,
      price: Number(creator.newCreator.ipoPrice),
      quantity: floatSharesCount,
      remainingQuantity: floatSharesCount,
      isCreatorAction: true,
      createdAt: creator.floatOrder.createdAt.getTime(),
    };
    matchingEngine.placeOrder(engineOrder);

    // or just return a safe response
    return NextResponse.json({ 
      message: 'IPO successful. Shares are actively floating in the market!', 
      creator: {
        id: creator.newCreator.id,
        channelName: creator.newCreator.channelName,
        ipoPrice: creator.newCreator.ipoPrice,
        totalShares: creator.newCreator.totalShares.toString(),
        floatShares: creator.newCreator.floatShares.toString(),
        ownerShares: creator.newCreator.ownerShares.toString(),
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('IPO error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'You have already listed a channel or the channel ID is taken' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
