import { getChannelStats } from '../lib/youtube';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables manually for the script
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function run() {
  console.log('Testing YouTube API Key...');
  // MrBeast Channel ID
  const channelId = 'UCX6OQ3DkcsbYNE6H8uQQuVA';
  
  console.log(`Fetching stats for channel ID: ${channelId}`);
  const stats = await getChannelStats(channelId);
  
  if (stats) {
    console.log('Success! Fetched stats:');
    console.log(`Subscribers: ${stats.subscribers.toLocaleString()}`);
    console.log(`Total Views: ${stats.totalViews.toLocaleString()}`);
    console.log(`Video Count: ${stats.videoCount.toLocaleString()}`);
  } else {
    console.log('Failed to fetch stats. Please check your YOUTUBE_API_KEY in .env');
  }
}

run();
