import dotenv from 'dotenv';
import path from 'path';

// Load environment variables manually for the script
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { getChannelByHandle } from '../lib/youtube';
import { computeValuationFromStats } from '../lib/scoreEngine';

async function testChannel(input: string) {
  console.log(`\n========================================`);
  console.log(`Testing Input: "${input}"`);
  console.log(`========================================`);
  const channel = await getChannelByHandle(input);
  if (!channel) {
    console.error(`Failed to fetch channel for input: ${input}`);
    return;
  }

  console.log(`Channel Title:     ${channel.channelName}`);
  console.log(`Channel ID:        ${channel.channelId}`);
  console.log(`Subscribers:       ${channel.subscribers.toLocaleString()}`);
  console.log(`Total Views:       ${channel.totalViews.toLocaleString()}`);
  console.log(`Video Count:       ${channel.videoCount}`);
  console.log(`Avatar URL:        ${channel.avatarUrl || 'N/A'}`);

  const valuation = computeValuationFromStats(channel);
  console.log(`----------------------------------------`);
  console.log(`Base Score:           ${valuation.computedScore.toLocaleString()}`);
  console.log(`Suggested Valuation:  $${valuation.suggestedValuation.toLocaleString()}`);
  console.log(`Default Shares:       ${valuation.defaultShares.toLocaleString()}`);
  console.log(`Suggested IPO Price:  $${valuation.suggestedPrice.toFixed(2)} / share`);
  console.log(`Default Public Float: ${valuation.defaultFloatPercent}%`);
}

async function run() {
  await testChannel('@MrBeast');
  await testChannel('veritasium');
  await testChannel('https://www.youtube.com/@mkbhd');
  await testChannel('UCX6OQ3DkcsbYNE6H8uQQuVA');
  await testChannel('test_mock_channel');
}

run();
