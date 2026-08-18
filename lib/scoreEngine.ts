import { prisma } from './prisma';
import { getChannelStats, YouTubeStats } from './youtube';

const OUTLIER_THRESHOLD = 2.0; // Max 2x jump allowed in a single period
const MAX_SMOOTHED_JUMP = 1.5; // Cap jump at 1.5x

export async function calculateCreatorScore(creatorId: string, channelId: string) {
  const stats = await getChannelStats(channelId);
  
  if (!stats) {
    console.error(`Failed to get stats for channel ${channelId}`);
    return null;
  }

  // Get previous scores for trailing average
  const previousScores = await prisma.creatorScore.findMany({
    where: { creatorId },
    orderBy: { recordedAt: 'desc' },
    take: 5,
  });

  let smoothedStats = { ...stats };

  if (previousScores.length > 0) {
    const avgSubs = previousScores.reduce((sum, s) => sum + Number(s.subscribers), 0) / previousScores.length;
    const avgViews = previousScores.reduce((sum, s) => sum + Number(s.totalViews), 0) / previousScores.length;

    // Outlier rejection
    if (avgSubs > 0 && stats.subscribers > avgSubs * OUTLIER_THRESHOLD) {
      smoothedStats.subscribers = Math.floor(avgSubs * MAX_SMOOTHED_JUMP);
    }
    
    if (avgViews > 0 && stats.totalViews > avgViews * OUTLIER_THRESHOLD) {
      smoothedStats.totalViews = Math.floor(avgViews * MAX_SMOOTHED_JUMP);
    }
  }

  // Calculate upload consistency (mock logic: 1.0 means perfectly consistent)
  // In a real app, you'd fetch the latest videos and check intervals.
  const uploadConsistency = 0.95;

  // Base computation formula
  // Score = (Subs * 0.4) + (Views * 0.01) + (Videos * 100) * Consistency
  const rawScore = (smoothedStats.subscribers * 0.4) + (smoothedStats.totalViews * 0.01) + (smoothedStats.videoCount * 100);
  const computedScore = rawScore * uploadConsistency;

  // Save the new fact
  const scoreRecord = await prisma.creatorScore.create({
    data: {
      creatorId,
      subscribers: BigInt(smoothedStats.subscribers),
      totalViews: BigInt(smoothedStats.totalViews),
      totalLikes: BigInt(0), // Requires full video scraping, skipping for v1
      totalComments: BigInt(0), // Requires full video scraping, skipping for v1
      videoCount: Number(smoothedStats.videoCount),
      uploadConsistency: uploadConsistency,
      computedScore: computedScore,
    }
  });

  return scoreRecord;
}
