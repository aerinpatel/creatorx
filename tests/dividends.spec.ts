import { test, expect } from '@playwright/test';

test.describe('Dividend Distribution Flow', () => {
  test('Creator successfully issues a dividend to shareholders', async ({ request }) => {
    const uniqueId = Date.now();
    
    // ==========================================
    // STEP 1: CREATOR LAUNCHES IPO
    // ==========================================
    const creatorSignup = await request.post('http://localhost:3000/api/auth/signup', {
      data: { email: `creator_div_${uniqueId}@test.com`, password: 'password', role: 'CREATOR' }
    });
    expect(creatorSignup.ok(), 'Creator signup failed').toBeTruthy();
    
    const ipoResponse = await request.post('http://localhost:3000/api/creators/ipo', {
      data: { 
        youtubeChannelId: `test_div_channel_${uniqueId}`, 
        channelName: `Div Channel ${uniqueId}`, 
        valuation: 100000, 
        totalShares: 10000, 
        floatPercent: 30 
      }
    });
    expect(ipoResponse.ok(), `IPO failed: ${await ipoResponse.text()}`).toBeTruthy();
    
    const ipoData = await ipoResponse.json();
    const creatorId = ipoData.creator.id;

    // ==========================================
    // STEP 2: INVESTOR BUYS SHARES
    // ==========================================
    // We need an investor to hold shares so they actually receive the dividend payouts!
    const investorSignup = await request.post('http://localhost:3000/api/auth/signup', {
      data: { email: `investor_div_${uniqueId}@test.com`, password: 'password', role: 'INVESTOR' }
    });
    expect(investorSignup.ok(), 'Investor signup failed').toBeTruthy();

    const buyOrder = await request.post('http://localhost:3000/api/orders', {
      data: { creatorId: creatorId, side: 'BUY', type: 'LIMIT', price: 10.00, quantity: 10 }
    });
    const buyData = await buyOrder.json();
    expect(buyData.executedTrades).toBeGreaterThan(0); // Make sure they actually got the shares

    // ==========================================
    // STEP 3: CREATOR PAYS DIVIDEND
    // ==========================================
    // Log back in as Creator
    const creatorLogin = await request.post('http://localhost:3000/api/auth/signin', {
      data: { email: `creator_div_${uniqueId}@test.com`, password: 'password' }
    });
    expect(creatorLogin.ok(), 'Creator login failed').toBeTruthy();

    // Issue a $500 dividend
    const dividendResponse = await request.post('http://localhost:3000/api/creators/dividend', {
      data: { creatorId: creatorId, totalAmount: 500 }
    });
    
    expect(dividendResponse.status()).toBe(200);
    const dividendData = await dividendResponse.json();
    expect(dividendData.message).toBe('Dividend distributed successfully');
  });
});
