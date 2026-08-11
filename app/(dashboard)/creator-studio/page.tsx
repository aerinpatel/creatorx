import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { redirect } from 'next/navigation';
import CreatorStudioClient from './CreatorStudioClient';

export default async function CreatorStudioPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  
  if (!token) {
    redirect('/login');
  }

  const payload = verifyToken(token);
  if (!payload || payload.role !== 'CREATOR') {
    redirect('/'); // Only creators allowed
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: {
      creatorProfile: true
    }
  });

  if (!user) {
    redirect('/login');
  }

  // Pass serializable data
  const creatorProfile = user.creatorProfile ? {
    id: user.creatorProfile.id,
    channelName: user.creatorProfile.channelName,
    ipoStatus: user.creatorProfile.ipoStatus,
    ipoPrice: user.creatorProfile.ipoPrice?.toNumber() || 0,
    totalShares: user.creatorProfile.totalShares.toString(),
    floatShares: user.creatorProfile.floatShares.toString(),
  } : null;

  return <CreatorStudioClient creatorProfile={creatorProfile} />;
}
