"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Video, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  Sliders
} from "lucide-react";

export default function CreatorOptionsClient({ creatorProfile }: { creatorProfile: any }) {
  const router = useRouter();
  
  // IPO Form State
  const [channelName, setChannelName] = useState(creatorProfile?.channelName || "");
  const [youtubeChannelId, setYoutubeChannelId] = useState(creatorProfile?.youtubeChannelId || "");
  const [valuation, setValuation] = useState("100000");
  const [totalShares, setTotalShares] = useState("10000");
  const [floatPercent, setFloatPercent] = useState("20");
  const [ipoLoading, setIpoLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const numValuation = Number(valuation) || 1;
  const numTotalShares = Number(totalShares) || 1;
  const numFloatPct = Number(floatPercent) || 20;
  const calculatedSharePrice = (numValuation / numTotalShares);
  const calculatedFloatShares = Math.floor(numTotalShares * (numFloatPct / 100));

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
      
      setMsg({ type: 'success', text: "IPO launched successfully! Your channel shares are now trading." });
      setTimeout(() => router.refresh(), 1200);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || "Failed to launch IPO" });
    } finally {
      setIpoLoading(false);
    }
  };

  // State 1: Creator has NOT yet launched an IPO (or is PENDING)
  if (!creatorProfile || creatorProfile.ipoStatus === 'PENDING') {
    return (
      <div className="flex flex-col h-full bg-[#08080a] text-zinc-100 p-8 overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full space-y-6">
          
          {/* Header */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono mb-2">
              <Sliders size={13} />
              Creator Options • Launch IPO
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Launch Channel IPO
            </h1>
            <p className="text-zinc-400 text-xs mt-1">
              Tokenize your YouTube channel equity and list shares on the exchange.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#101014] border border-white/[0.08] shadow-xl">
            <form onSubmit={handleLaunchIpo} className="space-y-4">
              
              {msg && (
                <div className={`p-3 rounded-xl text-xs font-mono flex items-center gap-2 ${
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
                  value={channelName} 
                  onChange={e => setChannelName(e.target.value)} 
                  className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-white/20 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none transition-all font-mono" 
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                    YouTube Channel ID
                  </label>
                  {youtubeChannelId && (
                    <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 size={11} /> Verified
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Video size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-500" />
                  <input 
                    type="text" 
                    required 
                    value={youtubeChannelId} 
                    onChange={e => setYoutubeChannelId(e.target.value)} 
                    className="w-full bg-white/[0.03] border border-white/[0.08] focus:border-white/20 rounded-xl py-2.5 pl-10 pr-4 text-xs font-mono text-white focus:outline-none transition-all" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">
                    Target Valuation (USD)
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
                    Total Shares
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
                  <span className="text-emerald-400 font-bold">{floatPercent}% Offered</span>
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
              </div>

              {/* Summary Pill */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-zinc-500 block">Calculated IPO Price</span>
                  <span className="font-bold text-emerald-400">${calculatedSharePrice.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 block">Public Float Shares</span>
                  <span className="font-semibold text-white">{calculatedFloatShares.toLocaleString()}</span>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={ipoLoading}
                className="w-full mt-2 py-3 rounded-xl bg-white text-black font-semibold text-xs tracking-wide hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
              >
                {ipoLoading ? "Minting Shares & Launching..." : "Mint Shares & Launch IPO"}
                <ArrowRight size={14} />
              </button>
            </form>
          </div>

        </div>
      </div>
    );
  }

  // State 2: Creator HAS an active IPO
  return (
    <div className="flex flex-col h-full bg-[#08080a] text-zinc-100 p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        
        {/* Active Dashboard Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-2">
              <Sliders size={13} />
              Creator Options
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {creatorProfile.channelName}
            </h1>
            <p className="text-xs font-mono text-zinc-500 mt-0.5">
              Channel ID: {creatorProfile.youtubeChannelId}
            </p>
          </div>

          <button 
            onClick={() => router.push(`/creator/${creatorProfile.id}`)}
            className="px-4 py-2 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-all flex items-center gap-2"
          >
            Open Trading Terminal
            <ExternalLink size={13} />
          </button>
        </header>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#101014] border border-white/[0.06]">
            <span className="text-[10px] font-mono text-zinc-500 uppercase">IPO Price</span>
            <p className="text-xl font-mono font-bold text-white mt-1">${creatorProfile.ipoPrice.toFixed(2)}</p>
          </div>

          <div className="p-4 rounded-xl bg-[#101014] border border-white/[0.06]">
            <span className="text-[10px] font-mono text-zinc-500 uppercase">Total Shares</span>
            <p className="text-xl font-mono font-bold text-white mt-1">{Number(creatorProfile.totalShares).toLocaleString()}</p>
          </div>

          <div className="p-4 rounded-xl bg-[#101014] border border-white/[0.06]">
            <span className="text-[10px] font-mono text-zinc-500 uppercase">Public Float</span>
            <p className="text-xl font-mono font-bold text-emerald-400 mt-1">{Number(creatorProfile.floatShares).toLocaleString()}</p>
          </div>
        </div>

      </div>
    </div>
  );
}
