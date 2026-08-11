import { test, expect } from '@playwright/test';

test.describe('Trading Platform Secondary Market Flow', () => {
  test('Investor A buys from Creator, then sells to Investor B', async ({ request }) => {
    const uniqueId = Date.now();
    
    // ==========================================
    // STEP 1: CREATOR LAUNCHES IPO
    // ==========================================
    const creatorSignup = await request.post('http://localhost:3000/api/auth/signup', {
      data: { email: `creator_${uniqueId}@test.com`, password: 'password', role: 'CREATOR' }
    });
    expect(creatorSignup.ok(), 'Creator signup failed').toBeTruthy();
    
    const ipoResponse = await request.post('http://localhost:3000/api/creators/ipo', {
      data: { youtubeChannelId: `test_channel_${uniqueId}`, channelName: `Test Channel ${uniqueId}`, valuation: 100000, totalShares: 10000, floatPercent: 30 } // Using exact IPO params
    });
    expect(ipoResponse.ok(), `IPO failed: ${await ipoResponse.text()}`).toBeTruthy();
    
    const ipoData = await ipoResponse.json();
    const creatorId = ipoData.creator.id;

    const sellOrderCreator1 = await request.post('http://localhost:3000/api/orders', {
      data: { creatorId: creatorId, side: 'SELL', type: 'LIMIT', price: 1.00, quantity: 100 }
    });
    const sellDataCreator1 = await sellOrderCreator1.json();
    expect(sellDataCreator1.executedTrades).toBe(0);

    const sellOrderCreator2 = await request.post('http://localhost:3000/api/orders', {
      data: { creatorId: creatorId, side: 'SELL', type: 'LIMIT', price: 10.00, quantity: 10 }
    });
    const sellDataCreator2 = await sellOrderCreator2.json();
    expect(sellDataCreator2.executedTrades).toBe(0);


    const sellOrderCreator3 = await request.post('http://localhost:3000/api/orders', {
      data: { creatorId: creatorId, side: 'SELL', type: 'LIMIT', price: 60.00, quantity: 30 }
    });
    const sellDataCreator3 = await sellOrderCreator3.json();
    expect(sellDataCreator3.executedTrades).toBe(0);

    // const sellOrderCreator4 = await request.post('http://localhost:3000/api/orders', {
    //   data: { creatorId: creatorId, side: 'BUY', type: 'LIMIT', price: 20.00, quantity: 23 }
    // });
    // const sellDataCreator4 = await sellOrderCreator4.json();
    // expect(sellDataCreator4.executedTrades).toBe(0);

    // const sellOrderCreator5 = await request.post('http://localhost:3000/api/orders', {
    //   data: { creatorId: creatorId, side: 'BUY', type: 'LIMIT', price: 1.00, quantity: 52 }
    // });
    // const sellDataCreator5 = await sellOrderCreator5.json();
    // expect(sellDataCreator5.executedTrades).toBe(0);

    // const sellOrderCreator6 = await request.post('http://localhost:3000/api/orders', {
    //   data: { creatorId: creatorId, side: 'BUY', type: 'LIMIT', price: 100.00, quantity: 1 }
    // });
    // const sellDataCreator6 = await sellOrderCreator6.json();
    // expect(sellDataCreator6.executedTrades).toBe(0);

    // ==========================================
    // STEP 2: INVESTOR A BUYS FROM IPO
    // ==========================================
    const investorASignup = await request.post('http://localhost:3000/api/auth/signup', {
      data: { email: `investorA_${uniqueId}@test.com`, password: 'password', role: 'INVESTOR' }
    });
    expect(investorASignup.ok(), 'Investor A signup failed').toBeTruthy();

    const buyOrderA = await request.post('http://localhost:3000/api/orders', {
      data: { creatorId: creatorId, side: 'BUY', type: 'LIMIT', price: 20.00, quantity: 10 }
    });
    const buyDataA = await buyOrderA.json();
    expect(buyDataA.executedTrades).toBeGreaterThan(0); // Successfully bought from Creator
    

    const buyOrderA2 = await request.post('http://localhost:3000/api/orders', {
      data: { creatorId: creatorId, side: 'BUY', type: 'LIMIT', price: 30.00, quantity: 12 }
    });
    const buyDataA2 = await buyOrderA2.json();
    expect(buyDataA2.executedTrades).toBeGreaterThan(0); // Successfully bought from Creator

    // ==========================================
    // STEP 3: INVESTOR A PLACES SELL ORDER
    // ==========================================
    // Investor A wants to flip their shares for a profit at $2.00
    const sellOrderA = await request.post('http://localhost:3000/api/orders', {
      data: { creatorId: creatorId, side: 'SELL', type: 'LIMIT', price: 16.00, quantity: 5 }
    });
    const sellDataA = await sellOrderA.json();
    expect(sellDataA.executedTrades).toBe(0); // It goes into the OrderBook waiting for a buyer

    // ==========================================
    // STEP 4: INVESTOR B BUYS FROM INVESTOR A
    // ==========================================
    // Signing up instantly overwrites the cookie, so we are now Investor B!
    const investorBSignup = await request.post('http://localhost:3000/api/auth/signup', {
      data: { email: `investorB_${uniqueId}@test.com`, password: 'password', role: 'INVESTOR' }
    });
    expect(investorBSignup.ok(), 'Investor B signup failed').toBeTruthy();

    // Investor B buys the shares at $2.00
    const buyOrderB = await request.post('http://localhost:3000/api/orders', {
      data: { creatorId: creatorId, side: 'BUY', type: 'LIMIT', price: 2.00, quantity: 5 }
    });
    
    // ==========================================
    // STEP 5: VERIFY THE TRADE HAPPENED!
    // ==========================================
    expect(buyOrderB.status()).toBe(201);
    const buyDataB = await buyOrderB.json();
    expect(buyDataB.executedTrades).toBeGreaterThan(0); // Successfully matched with Investor A!
  });
});
