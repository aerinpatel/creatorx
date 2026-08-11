import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        creatorProfile: true, // Fetch creator profile if it exists
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Exclude passwordHash
    const { passwordHash, ...safeUser } = user;

    // Convert BigInts to strings for JSON serialization
    if (safeUser.creatorProfile) {
      safeUser.creatorProfile.totalShares = safeUser.creatorProfile.totalShares.toString() as any;
      safeUser.creatorProfile.floatShares = safeUser.creatorProfile.floatShares.toString() as any;
      safeUser.creatorProfile.ownerShares = safeUser.creatorProfile.ownerShares.toString() as any;
    }

    return NextResponse.json(safeUser);
  } catch (error: any) {
    console.error('Auth check error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
