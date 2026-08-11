"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Video, 
  Sparkles, 
  DollarSign, 
  PieChart, 
  Coins, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Layers
} from "lucide-react";

export default function CreatorStudioClient({ creatorProfile }: { creatorProfile: any }) {
  const router = useRouter();
  
  // IPO Form State
  const [channelName, setChannelName] = useState("");
  const [youtubeChannelId, setYoutubeChannelId] = useState("");
  const [valuation, setValuation] = useState("100000");
  const [totalShares, setTotalShares] = useState("100000");
  const [floatPercent, setFloatPercent] = useState("20");
  const [ipoLoading, setIpoLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Dividend State
  const [dividendAmount, setDividendAmount] = useState("");
  const [dividendLoading, setDividendLoading] = useState(false);
  const [dividendMsg, setDividendMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Dynamic calculations for the IPO Simulator
  const numValuation = Number(valuation) || 1;
  const numTotalShares = Number(totalShares) || 1;
  const numFloatPct = Number(floatPercent) || 20;

  const calculatedSharePrice = (numValuation / numTotalShares);
  const calculatedFloatShares = Math.floor(numTotalShares * (numFloatPct / 100));
  const calculatedOwnerShares = numTotalShares - calculatedFloatShares;
  const publicFloatValue = calculatedFloatShares * calculatedSharePrice;
  const retainedEquityValue = calculatedOwnerShares * calculatedSharePrice;

  const handleLaunchIpo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIpoLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/creators/ipo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelName,
          youtubeChannelId,
          valuation: Number(valuation),
          totalShares: Number(totalShares),
          floatPercent: Number(floatPercent)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setMsg({ type: 'success', text: "IPO launched successfully! Public float order is active in the order book." });
      setTimeout(() => router.refresh(), 1200);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || "Failed to launch IPO" });
    } finally {
      setIpoLoading(false);
    }
  };

  const handleIssueDividend = async (e: React.FormEvent) => {
    e.preventDefault();
    setDividendLoading(true);
    setDividendMsg(null);
    try {
      const res = await fetch("/api/creators/dividend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId: creatorProfile.id,
          totalAmount: Number(dividendAmount)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setDividendMsg({ type: 'success', text: "Dividend distributed proportionally to all shareholders!" });
      setDividendAmount("");
    } catch (err: any) {
      setDividendMsg({ type: 'error', text: err.message || "Dividend failed" });
    } finally {
      setDividendLoading(false);
    }
  };

  // State 1: Creator has NOT yet IPO'd
  if (!creatorProfile) {
    return (
      <div className="flex flex-col h-full bg-[#08080a] text-zinc-100 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto w-full space-y-8">
          
          {/* Header */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono mb-3">
              <Sparkles size={13} />
              Creator Studio • Primary Market
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Launch Channel Initial Public Offering (IPO)
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              Tokenize your YouTube channel equity, raise non-dilutive liquidity, and distribute automated revenue dividends.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left: Interactive IPO Form */}
            <div className="lg:col-span-7 p-6 rounded-2xl bg-[#101014] border border-white/[0.08] shadow-xl">
              <form onSubmit={handleLaunchIpo} className="space-y-4">
                
                {msg && (
                  <div className={`p-3.5 rounded-xl text-xs font-mono flex items-center gap-2 ${
                    msg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                  }`}>
                    {msg.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                    <span>{msg.text}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                    Channel Display Name
                  </label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Veritasium" 
                    value={channelName} 
                    onChange={e => setChannelName(e.target.value)} 
                    className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-white/20 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none transition-all" 
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                    YouTube Channel ID
                  </label>
                  <div className="relative">
                    <Video size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-500" />
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. UCHnyfMqiRRG1u-2MsSQLbXA" 
                      value={youtubeChannelId} 
                      onChange={e => setYoutubeChannelId(e.target.value)} 
                      className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-white/20 rounded-xl py-2.5 pl-10 pr-4 text-xs font-mono text-white focus:outline-none transition-all" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                      Target Valuation (USDT)
                    </label>
                    <input 
                      type="number" 
                      required 
                      min="1000"
                      value={valuation} 
                      onChange={e => setValuation(e.target.value)} 
                      className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-white/20 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none transition-all" 
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                      Total Shares to Mint
                    </label>
                    <input 
                      type="number" 
                      required 
                      min="100"
                      value={totalShares} 
                      onChange={e => setTotalShares(e.target.value)} 
                      className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-white/20 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none transition-all" 
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-mono text-zinc-400 mb-1">
                    <span className="uppercase tracking-wider">Public Float Percentage</span>
                    <span className="text-emerald-400 font-bold">{floatPercent}% Offered to Public</span>
                  </div>
                  <input 
                    type="range" 
                    min="5" 
                    max="80" 
                    step="1"
                    value={floatPercent} 
                    onChange={e => setFloatPercent(e.target.value)} 
                    className="w-full accent-emerald-500 cursor-pointer" 
                  />
                  <div className="flex justify-between text-[10px] font-mono text-zinc-600 mt-1">
                    <span>5% (Conservative)</span>
                    <span>80% (High Liquidity)</span>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={ipoLoading}
                  className="w-full mt-4 py-3 rounded-xl bg-white text-black font-semibold text-xs tracking-wide hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  {ipoLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      Minting Equity & Seeding Engine...
                    </span>
                  ) : (
                    <>
                      Mint Shares & Launch IPO
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Right: Dynamic Valuation Breakdown Visualizer */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-6 rounded-2xl bg-[#101014] border border-white/[0.08] shadow-xl space-y-5">
                <h3 className="text-xs font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                  <PieChart size={14} className="text-indigo-400" />
                  IPO Term Sheet Simulation
                </h3>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-3 font-mono text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">Calculated IPO Price</span>
                    <span className="text-base font-bold text-emerald-400">${calculatedSharePrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">Public Float Shares</span>
                    <span className="text-white font-medium">{calculatedFloatShares.toLocaleString()} sh</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">Public Liquidity Raised</span>
                    <span className="text-white font-medium">${publicFloatValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">Creator Retained Equity</span>
                    <span className="text-indigo-300 font-medium">${retainedEquityValue.toLocaleString()}</span>
                  </div>
                </div>

                {/* Visual Cap Table Progress Bar */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">Cap Table Allocation</span>
                  <div className="h-3 w-full rounded-full bg-white/[0.04] overflow-hidden flex">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${numFloatPct}%` }}
                      title="Public Float"
                    />
                    <div 
                      className="h-full bg-indigo-500 transition-all duration-300"
                      style={{ width: `${100 - numFloatPct}%` }}
                      title="Creator Retained"
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Public ({numFloatPct}%)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" /> Creator ({100 - numFloatPct}%)
                    </span>
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>
      </div>
    );
  }

  // State 2: Creator HAS an active IPO
  return (
    <div className="flex flex-col h-full bg-[#08080a] text-zinc-100 p-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto w-full space-y-8">
        
        {/* Active Dashboard Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-2">
              <Video size={13} />
              Creator Management Console
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {creatorProfile.channelName}
            </h1>
            <p className="text-xs font-mono text-zinc-500 mt-0.5">
              Protocol ID: {creatorProfile.id}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push(`/creator/${creatorProfile.id}`)}
              className="px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-all flex items-center gap-2"
            >
              Open Trading Terminal
              <ExternalLink size={13} />
            </button>
          </div>
        </header>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-5 rounded-2xl bg-[#101014] border border-white/[0.06]">
            <span className="text-[10px] font-mono text-zinc-500 uppercase">IPO Price</span>
            <p className="text-2xl font-mono font-bold text-white mt-1">${creatorProfile.ipoPrice.toFixed(2)}</p>
            <p className="text-[11px] font-mono text-zinc-500 mt-1">Listing baseline value</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#101014] border border-white/[0.06]">
            <span className="text-[10px] font-mono text-zinc-500 uppercase">Total Minted Equity</span>
            <p className="text-2xl font-mono font-bold text-white mt-1">{Number(creatorProfile.totalShares).toLocaleString()}</p>
            <p className="text-[11px] font-mono text-zinc-500 mt-1">Shares minted at contract creation</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#101014] border border-white/[0.06]">
            <span className="text-[10px] font-mono text-zinc-500 uppercase">Public Float In Circulation</span>
            <p className="text-2xl font-mono font-bold text-emerald-400 mt-1">{Number(creatorProfile.floatShares).toLocaleString()}</p>
            <p className="text-[11px] font-mono text-zinc-500 mt-1">Shares held by secondary market</p>
          </div>
        </div>

        {/* Action Center: Dividends & Buybacks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Dividend Distribution Card */}
          <div className="p-6 rounded-2xl bg-[#101014] border border-white/[0.06] shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Coins size={16} className="text-amber-400" />
                <h3 className="text-sm font-semibold text-white">Issue Revenue Dividend</h3>
              </div>
              <p className="text-xs text-zinc-400 mb-5">
                Automatically split cash among all active channel shareholders based on their pro-rata ownership.
              </p>

              <form onSubmit={handleIssueDividend} className="space-y-4">
                {dividendMsg && (
                  <div className={`p-3 rounded-xl text-xs font-mono flex items-center gap-2 ${
                    dividendMsg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                  }`}>
                    {dividendMsg.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                    <span>{dividendMsg.text}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                    Total Dividend Payout (USDT)
                  </label>
                  <input 
                    type="number" 
                    required 
                    min="1" 
                    step="0.01"
                    placeholder="e.g. 500" 
                    value={dividendAmount} 
                    onChange={e => setDividendAmount(e.target.value)} 
                    className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-white/20 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none transition-all" 
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={dividendLoading}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs tracking-wide transition-all shadow-lg shadow-emerald-500/10 disabled:opacity-50 cursor-pointer"
                >
                  {dividendLoading ? "Distributing to Wallets..." : "Distribute Dividend Now"}
                </button>
              </form>
            </div>

            <div className="pt-4 mt-6 border-t border-white/[0.04] text-[10px] font-mono text-zinc-500 flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-emerald-400" />
              Calculates pro-rata fractional payout per share atomically.
            </div>
          </div>

          {/* Buybacks & Liquidations Info Card */}
          <div className="p-6 rounded-2xl bg-[#101014] border border-white/[0.06] shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">Share Buybacks & Liquidity</h3>
              </div>
              <p className="text-xs text-zinc-400 mb-4">
                As the channel creator, you can buy back shares from the public order book or liquidate retained equity.
              </p>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-2 text-xs font-mono text-zinc-300">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Corporate Action Tag:</span>
                  <span className="text-emerald-400 font-semibold">Automatic Announcement</span>
                </div>
                <p className="text-[11px] text-zinc-500 pt-2 border-t border-white/[0.04]">
                  When you trade your own token in the terminal, orders are tagged with <span className="text-zinc-300 font-mono">isCreatorAction: true</span> and announced to all subscribers in real-time.
                </p>
              </div>
            </div>

            <button 
              onClick={() => router.push(`/creator/${creatorProfile.id}`)}
              className="w-full mt-6 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white text-xs font-semibold transition-all"
            >
              Go to Trading Terminal →
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
