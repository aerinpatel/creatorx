import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload || payload.role !== 'CREATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { creatorId, totalAmount } = await req.json();

    if (!creatorId || !totalAmount || totalAmount <= 0) {
      return NextResponse.json({ error: 'Invalid dividend parameters' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Verify creator ownership & balance
      const creator = await tx.creator.findUnique({ where: { id: creatorId } });
      if (!creator || creator.userId !== payload.userId) {
        throw new Error('Unauthorized');
      }

      const creatorUser = await tx.user.findUnique({ where: { id: payload.userId } });
      if (!creatorUser || Number(creatorUser.walletBalance) < totalAmount) {
        throw new Error('Insufficient wallet balance to pay dividend');
      }

      // Deduct from creator
      await tx.user.update({
        where: { id: payload.userId },
        data: { walletBalance: { decrement: totalAmount } }
      });

      // 2. Fetch all holders
      const holdings = await tx.holding.findMany({
        where: { creatorId, quantity: { gt: 0 } }
      });

      // Calculate total outstanding shares held in portfolios (this includes creator if they have a holding row)
      const totalOutstanding = holdings.reduce((sum, h) => sum + Number(h.quantity), 0);
      
      if (totalOutstanding === 0) {
        throw new Error('No shareholders to pay');
      }

      const perShareAmount = totalAmount / totalOutstanding;

      // 3. Payout to holders
      for (const holding of holdings) {
        const payout = Number(holding.quantity) * perShareAmount;
        await tx.user.update({
          where: { id: holding.userId },
          data: { walletBalance: { increment: payout } }
        });
      }

      // 4. Record Dividend & Announcement
      await tx.dividend.create({
        data: {
          creatorId,
          totalAmount,
          perShareAmount,
          recordDate: new Date(),
          paidAt: new Date(),
        }
      });

      await tx.announcement.create({
        data: {
          creatorId,
          type: 'DIVIDEND',
          message: `Dividend paid! $${perShareAmount.toFixed(4)} per share distributed to all holders.`,
        }
      });
    });

    return NextResponse.json({ message: 'Dividend distributed successfully' }, { status: 200 });

  } catch (error: any) {
    if (error.message === 'Insufficient wallet balance to pay dividend' || error.message === 'No shareholders to pay') {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Dividend error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
