import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';
import { getChannelByHandle } from '@/lib/youtube';

export async function POST(req: NextRequest) {
  try {
    const { email, password, role, channelHandle, name, channelName } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    const isCreator = role === 'CREATOR';
    let channelInfo = null;

    if (isCreator) {
      if (!channelHandle || !channelHandle.trim()) {
        return NextResponse.json({ error: 'YouTube channel handle is required for Creator accounts (e.g. @MrBeast)' }, { status: 400 });
      }

      // Fetch YouTube channel details and verify via YouTube API
      channelInfo = await getChannelByHandle(channelHandle);
      if (!channelInfo) {
        return NextResponse.json({ 
          error: `Could not find YouTube channel for handle "${channelHandle}". Please check the handle and try again.` 
        }, { status: 400 });
      }

      // Check if YouTube channel ID is already linked to an existing creator
      const existingCreatorWithChannel = await prisma.creator.findUnique({
        where: { youtubeChannelId: channelInfo.channelId },
      });

      if (existingCreatorWithChannel) {
        return NextResponse.json({ 
          error: `The YouTube channel "${channelInfo.channelName}" (${channelInfo.channelId}) is already linked to another account.` 
        }, { status: 409 });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user and creator profile atomically
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: isCreator ? 'CREATOR' : 'INVESTOR',
        },
      });

      let creatorProfile = null;
      if (isCreator && channelInfo) {
        creatorProfile = await tx.creator.create({
          data: {
            userId: newUser.id,
            channelName: name || channelName || channelInfo.channelName,
            youtubeChannelId: channelInfo.channelId,
            totalShares: BigInt(0),
            floatShares: BigInt(0),
            ownerShares: BigInt(0),
            ipoStatus: 'PENDING',
          },
        });
      }

      return {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        walletBalance: newUser.walletBalance,
        creatorProfile: creatorProfile ? {
          id: creatorProfile.id,
          channelName: creatorProfile.channelName,
          youtubeChannelId: creatorProfile.youtubeChannelId,
          ipoStatus: creatorProfile.ipoStatus,
        } : undefined,
      };
    });

    const token = signToken({ userId: user.id, role: user.role });

    const response = NextResponse.json(
      { message: 'Signup successful', user },
      { status: 201 }
    );

    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

