import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { getChannelByHandle } from '../lib/youtube';
import { computeValuationFromStats } from '../lib/scoreEngine';

async function benchmarkCreatorSignup(handle: string) {
  const start = Date.now();
  console.log(`\n========================================`);
  console.log(`Benchmarking Creator Signup for "${handle}"...`);
  console.log(`========================================`);

  const t0 = Date.now();
  const channelInfo = await getChannelByHandle(handle);
  const tFetch = Date.now() - t0;
  console.log(`1. YouTube API Data Fetch took: ${tFetch}ms (Found: ${channelInfo?.channelName || 'N/A'})`);

  if (!channelInfo) throw new Error("Channel fetch failed");

  const t1 = Date.now();
  const valuation = computeValuationFromStats(channelInfo);
  const tVal = Date.now() - t1;
  console.log(`2. Valuation Math took: ${tVal}ms (Suggested Price: $${valuation.suggestedPrice})`);

  const testEmail = `fast_creator_${Date.now()}@test.com`;
  const t2 = Date.now();
  const passwordHash = await bcrypt.hash('password123', 10);
  const tHash = Date.now() - t2;
  console.log(`3. Password Hash took: ${tHash}ms`);

  const t3 = Date.now();
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: testEmail,
        passwordHash,
        role: 'CREATOR',
      }
    });

    const creator = await tx.creator.create({
      data: {
        userId: newUser.id,
        channelName: channelInfo.channelName,
        youtubeChannelId: `${channelInfo.channelId}_speed_${Date.now()}`,
        totalShares: BigInt(valuation.defaultShares),
        floatShares: BigInt(2000),
        ownerShares: BigInt(8000),
        ipoStatus: 'PENDING',
        ipoPrice: valuation.suggestedPrice,
      }
    });

    await tx.creatorScore.create({
      data: {
        creatorId: creator.id,
        subscribers: BigInt(valuation.subscribers),
        totalViews: BigInt(valuation.totalViews),
        totalLikes: BigInt(0),
        totalComments: BigInt(0),
        videoCount: valuation.videoCount,
        uploadConsistency: 0.95,
        computedScore: valuation.computedScore,
      }
    });

    return newUser;
  });
  const tDb = Date.now() - t3;
  console.log(`4. Database Transaction took: ${tDb}ms`);

  const totalTime = Date.now() - start;
  console.log(`----------------------------------------`);
  console.log(` TOTAL SIGNUP TIME: ${totalTime}ms (${(totalTime / 1000).toFixed(2)} seconds)`);
  console.log(`----------------------------------------`);
}

async function run() {
  await benchmarkCreatorSignup('@MrBeast');
  await benchmarkCreatorSignup('veritasium');
  await benchmarkCreatorSignup('test_mock_channel');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
