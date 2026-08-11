import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { redirect } from 'next/navigation';
import TopNav from '@/components/TopNav';
import NotificationsClient, { NotificationItem } from './NotificationsClient';
import { Bell, ShieldCheck, Zap } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    redirect('/login');
  }

  const payload = verifyToken(token);
  if (!payload) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: {
      ordersPlaced: {
        orderBy: { createdAt: 'desc' },
        take: 15,
        include: {
          creator: true,
          buyTrades: {
            include: { creator: true },
            orderBy: { executedAt: 'desc' }
          },
          sellTrades: {
            include: { creator: true },
            orderBy: { executedAt: 'desc' }
          }
        }
      },
      realizedPnls: {
        orderBy: { realizedAt: 'desc' },
        take: 10,
        include: { creator: true }
      },
      holdings: {
        where: { quantity: { gt: 0 } },
        include: {
          creator: {
            include: {
              dividends: {
                orderBy: { createdAt: 'desc' },
                take: 3
              },
              announcements: {
                orderBy: { createdAt: 'desc' },
                take: 3
              }
            }
          }
        }
      }
    }
  });

  if (!user) {
    redirect('/login');
  }

  // Fetch recent platform-wide creator announcements and IPO listings
  const recentAnnouncements = await prisma.announcement.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { creator: true }
  });

  const notifications: NotificationItem[] = [];

  // 1. Convert Filled Trades into Notifications
  for (const order of user.ordersPlaced) {
    const isBuy = order.side === 'BUY';
    const trades = isBuy ? order.buyTrades : order.sellTrades;

    for (const trade of trades) {
      notifications.push({
        id: `trade-${trade.id}`,
        type: 'TRADE_FILL',
        title: `${order.side === 'BUY' ? 'Limit Buy' : 'Limit Sell'} Order Filled`,
        description: `Successfully executed ${Number(trade.quantity)} shares of ${trade.creator.channelName} at $${Number(trade.price).toFixed(2)} per share.`,
        timestamp: new Date(trade.executedAt).toLocaleString(),
        read: false,
        link: `/creator/${trade.creatorId}`,
        badge: `${order.side} FILLED`,
        badgeColor: order.side === 'BUY' ? 'emerald' : 'rose'
      });
    }

    // If order is active/resting in escrow
    if (order.status === 'OPEN' || order.status === 'PARTIAL') {
      notifications.push({
        id: `order-${order.id}`,
        type: 'SYSTEM',
        title: `${order.side} Order Active in Book`,
        description: `Your ${order.side} limit order for ${Number(order.remainingQuantity)} shares of ${order.creator.channelName} is resting at $${Number(order.price).toFixed(2)}.`,
        timestamp: new Date(order.createdAt).toLocaleString(),
        read: false,
        link: `/portfolio`,
        badge: 'RESTING',
        badgeColor: 'amber'
      });
    }
  }

  // 2. Realized PnL Gains
  for (const pnl of user.realizedPnls) {
    const pnlAmount = Number(pnl.pnl);
    notifications.push({
      id: `pnl-${pnl.id}`,
      type: 'TRADE_FILL',
      title: `Position Closed: ${pnl.creator.channelName}`,
      description: `Sold ${Number(pnl.quantity)} shares at $${Number(pnl.sellPrice).toFixed(2)}. Realized ${pnlAmount >= 0 ? 'profit' : 'loss'} of $${Math.abs(pnlAmount).toFixed(2)}.`,
      timestamp: new Date(pnl.realizedAt).toLocaleString(),
      read: true,
      link: `/portfolio`,
      badge: pnlAmount >= 0 ? `+${pnlAmount.toFixed(2)} P&L` : `${pnlAmount.toFixed(2)} P&L`,
      badgeColor: pnlAmount >= 0 ? 'emerald' : 'rose'
    });
  }

  // 3. Dividends from Held Creators
  for (const h of user.holdings) {
    for (const div of h.creator.dividends) {
      const payout = Number(div.perShareAmount) * Number(h.quantity);
      notifications.push({
        id: `div-${div.id}`,
        type: 'DIVIDEND',
        title: `Dividend Payout: ${h.creator.channelName}`,
        description: `Received $${payout.toFixed(2)} ($${Number(div.perShareAmount).toFixed(4)}/share for your ${Number(h.quantity)} shares).`,
        timestamp: new Date(div.createdAt).toLocaleString(),
        read: false,
        link: `/portfolio`,
        badge: 'DIVIDEND',
        badgeColor: 'indigo'
      });
    }
  }

  // 4. Platform Announcements & IPOs
  for (const ann of recentAnnouncements) {
    notifications.push({
      id: `ann-${ann.id}`,
      type: 'ANNOUNCEMENT',
      title: `Channel Announcement: ${ann.creator.channelName}`,
      description: ann.message,
      timestamp: new Date(ann.createdAt).toLocaleString(),
      read: false,
      link: `/creator/${ann.creatorId}`,
      badge: ann.type,
      badgeColor: 'indigo'
    });
  }

  // Sort by latest timestamp
  notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="flex flex-col h-full bg-[#08080a] text-zinc-100 overflow-hidden">
      <TopNav />

      <div className="flex-1 overflow-y-auto p-8 space-y-8 max-w-5xl mx-auto w-full">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 uppercase tracking-wider mb-1">
              <Bell size={13} className="text-emerald-400" />
              <span>Real-Time Activity Center</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Notifications & Alerts</h1>
            <p className="text-xs font-mono text-zinc-500 mt-1">Live order execution feeds, dividend disbursements, and corporate announcements.</p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
            <Zap size={13} />
            Sub-millisecond Event Bridge
          </div>
        </div>

        {/* Client Interactive Feed */}
        <NotificationsClient initialNotifications={notifications} />

      </div>
    </div>
  );
}
