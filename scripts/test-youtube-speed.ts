import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const apiKey = process.env.YOUTUBE_API_KEY;

async function testDirectFetch(handle: string) {
  const start = Date.now();
  const cleanHandle = handle.replace(/^@/, '');
  console.log(`[Direct Fetch] Starting for ${handle}...`);

  try {
    const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&forHandle=${encodeURIComponent(cleanHandle)}&key=${apiKey}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    const duration = Date.now() - start;
    console.log(`[Direct Fetch] Finished in ${duration}ms! Found items:`, data.items?.length || 0);
  } catch (err: any) {
    console.error(`[Direct Fetch] Failed in ${Date.now() - start}ms:`, err.message);
  }
}

async function run() {
  console.log(`API Key present: ${Boolean(apiKey)}`);
  await testDirectFetch('MrBeast');
  await testDirectFetch('veritasium');
}

run();
