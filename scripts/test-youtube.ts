import { google } from 'googleapis';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables manually for the script
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY,
});

async function testHandle(handle: string) {
  console.log(`Testing handle: ${handle}`);
  try {
    const res = await youtube.channels.list({
      part: ['snippet', 'statistics'],
      forHandle: handle.replace(/^@/, ''),
    });
    console.log('Result forHandle without @:', res.data.items?.map(i => ({
      id: i.id,
      title: i.snippet?.title,
      customUrl: i.snippet?.customUrl,
      subscribers: i.statistics?.subscriberCount
    })));
  } catch (err: any) {
    console.error('Error without @:', err.message);
  }

  try {
    const res2 = await youtube.channels.list({
      part: ['snippet', 'statistics'],
      forHandle: handle.startsWith('@') ? handle : `@${handle}`,
    });
    console.log('Result forHandle with @:', res2.data.items?.map(i => ({
      id: i.id,
      title: i.snippet?.title,
      customUrl: i.snippet?.customUrl,
      subscribers: i.statistics?.subscriberCount
    })));
  } catch (err: any) {
    console.error('Error with @:', err.message);
  }
}

async function run() {
  await testHandle('@MrBeast');
  await testHandle('veritasium');
}

run();

