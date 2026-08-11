import { google } from 'googleapis';

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
});

export interface YouTubeStats {
  subscribers: number;
  totalViews: number;
  videoCount: number;
}

export async function getChannelStats(channelId: string): Promise<YouTubeStats | null> {
  try {
    const res = await youtube.channels.list({
      part: ['statistics'],
      id: [channelId],
    });

    const items = res.data.items;
    if (!items || items.length === 0) return null;

    const stats = items[0].statistics;
    
    return {
      subscribers: Number(stats?.subscriberCount || 0),
      totalViews: Number(stats?.viewCount || 0),
      videoCount: Number(stats?.videoCount || 0),
    };
  } catch (error) {
    console.error(`Error fetching YouTube stats for ${channelId}:`, error);
    return null;
  }
}
