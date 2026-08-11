"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Bell, 
  CheckCircle2, 
  ArrowUpRight, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Sparkles, 
  DollarSign, 
  Zap, 
  Megaphone,
  Filter,
  Check,
  Trash2,
  ExternalLink
} from "lucide-react";

export interface NotificationItem {
  id: string;
  type: 'TRADE_FILL' | 'DIVIDEND' | 'PRICE_IMPROVEMENT' | 'ANNOUNCEMENT' | 'SYSTEM';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  link?: string;
  badge?: string;
  badgeColor?: 'emerald' | 'rose' | 'indigo' | 'amber';
}

export default function NotificationsClient({ initialNotifications }: { initialNotifications: NotificationItem[] }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [filter, setFilter] = useState<'ALL' | 'TRADE_FILL' | 'DIVIDEND' | 'ANNOUNCEMENT'>('ALL');

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const toggleRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: !n.read } : n));
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'ALL') return true;
    return n.type === filter;
  });

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#101014] border border-white/[0.06] shadow-lg">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer whitespace-nowrap ${
              filter === 'ALL'
                ? 'bg-white text-black font-semibold shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            All Activity ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('TRADE_FILL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer whitespace-nowrap ${
              filter === 'TRADE_FILL'
                ? 'bg-white text-black font-semibold shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            Trades & Fills
          </button>
          <button
            onClick={() => setFilter('DIVIDEND')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer whitespace-nowrap ${
              filter === 'DIVIDEND'
                ? 'bg-white text-black font-semibold shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            Dividends & Escrow
          </button>
          <button
            onClick={() => setFilter('ANNOUNCEMENT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer whitespace-nowrap ${
              filter === 'ANNOUNCEMENT'
                ? 'bg-white text-black font-semibold shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            Creator Announcements
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-300 hover:text-white text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check size={13} className="text-emerald-400" />
              Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="px-3 py-1.5 rounded-xl bg-white/[0.02] hover:bg-rose-500/10 border border-white/[0.06] hover:border-rose-500/20 text-zinc-400 hover:text-rose-400 text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 size={13} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#101014] border border-white/[0.06] shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto text-zinc-500 mb-3">
              <Bell size={20} />
            </div>
            <h3 className="text-sm font-semibold text-white">No notifications in this category</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto font-sans">
              Trade executions, dividend distributions, price improvement refunds, and creator announcements will appear here in real-time.
            </p>
          </div>
        ) : (
          filteredNotifications.map((n) => (
            <div
              key={n.id}
              onClick={() => toggleRead(n.id)}
              className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden group ${
                n.read
                  ? 'bg-[#101014]/60 border-white/[0.04] hover:border-white/[0.08] opacity-80'
                  : 'bg-[#101014] border-white/[0.1] hover:border-white/[0.18] shadow-lg'
              }`}
            >
              {/* Unread Glow Indicator */}
              {!n.read && (
                <div className="absolute top-0 left-0 bottom-0 w-1 bg-emerald-500" />
              )}

              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  {/* Icon Container */}
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${
                    n.type === 'TRADE_FILL'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : n.type === 'DIVIDEND'
                      ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                      : n.type === 'PRICE_IMPROVEMENT'
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                      : 'bg-white/[0.04] border-white/[0.08] text-zinc-300'
                  }`}>
                    {n.type === 'TRADE_FILL' && <Zap size={18} />}
                    {n.type === 'DIVIDEND' && <DollarSign size={18} />}
                    {n.type === 'PRICE_IMPROVEMENT' && <Sparkles size={18} />}
                    {n.type === 'ANNOUNCEMENT' && <Megaphone size={18} />}
                    {n.type === 'SYSTEM' && <Bell size={18} />}
                  </div>

                  {/* Body */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold text-white tracking-tight">
                        {n.title}
                      </h4>
                      {n.badge && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                          n.badgeColor === 'emerald'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : n.badgeColor === 'rose'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : n.badgeColor === 'amber'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        }`}>
                          {n.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                      {n.description}
                    </p>
                    <div className="flex items-center gap-3 pt-1 text-[11px] font-mono text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {n.timestamp}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Action */}
                {n.link && (
                  <Link
                    href={n.link}
                    onClick={(e) => e.stopPropagation()}
                    className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white hover:text-emerald-400 text-xs font-mono transition-colors shrink-0 flex items-center gap-1"
                  >
                    View <ArrowUpRight size={12} />
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
