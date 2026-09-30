import React, { useState } from 'react';
import { Radio, Users, Copy, Check, ExternalLink, Zap, LayoutGrid } from 'lucide-react';

interface FiveMStatusBarProps {
  onNavigateToSquad?: () => void;
}

export const FiveMStatusBar: React.FC<FiveMStatusBarProps> = ({ onNavigateToSquad }) => {
  const [copied, setCopied] = useState(false);
  const serverCode = 'cfx.re/join/pioneer-rp';
  const fivemDeepLink = `fivem://connect/${serverCode}`;

  const handleCopyIp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(`connect ${serverCode}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside aria-label="Server status and connection details" className="w-full bg-neutral-950/95 border-b border-white/[0.08] text-xs font-mono select-none backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Server Status & Dynamic Player Count */}
        <div className="flex items-center gap-3.5 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-extrabold text-neutral-200 tracking-wider">PIONEER RP</span>
          </div>

          <span className="hidden sm:inline text-neutral-600">|</span>

          {/* Players in Los Santos */}
          <div className="flex items-center gap-1.5 text-neutral-300">
            <Users className="h-3 w-3 text-purple-400" />
            <span>128 / 128 in Los Santos</span>
            <span className="text-[10px] text-amber-400/90 font-bold">(Queue: 14)</span>
          </div>

          <span className="hidden sm:inline text-neutral-600">|</span>

          {/* Server Ping */}
          <div className="hidden md:flex items-center gap-1 text-[11px] text-neutral-400">
            <Zap className="h-3 w-3 text-emerald-400" />
            <span>22ms · NA East</span>
          </div>
        </div>

        {/* Right: Quick Launch & Squad Mode */}
        <div className="flex items-center gap-2">
          {onNavigateToSquad && (
            <button
              onClick={onNavigateToSquad}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-950/70 hover:bg-purple-900/90 text-purple-300 hover:text-white border border-purple-500/30 text-[11px] font-bold tracking-wider transition-colors shadow-sm"
              title="Watch multiple Pioneer RP streamers at once"
            >
              <LayoutGrid className="h-3 w-3 text-purple-400" />
              <span>SQUAD VIEW (2-4)</span>
            </button>
          )}

          {/* Copy Direct Console IP */}
          <button
            onClick={handleCopyIp}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-white/10 text-[11px] transition-colors"
            title="Copy F8 console connect command"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-emerald-400" />
                <span className="text-emerald-300">Copied F8!</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 text-neutral-400" />
                <span className="hidden sm:inline">Copy F8 Connect</span>
                <span className="sm:hidden">F8</span>
              </>
            )}
          </button>

          {/* Direct One-Click Launch */}
          <a
            href={fivemDeepLink}
            aria-label="Join Pioneer RP server in FiveM"
            className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-bold text-[11px] transition-all shadow-md shadow-emerald-950/40"
            title="Launch FiveM and connect automatically"
          >
            <Radio className="h-3 w-3 text-neutral-950" />
            <span className="hidden sm:inline">JOIN SERVER</span>
          </a>
        </div>
      </div>
    </aside>
  );
};
