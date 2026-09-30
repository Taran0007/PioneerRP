import React from 'react';
import { Radio, ExternalLink, Shield } from 'lucide-react';
import { SiteSettings } from '../types/index.js';

interface FooterProps {
  onNavigate: (path: string) => void;
  settings: SiteSettings | null;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, settings }) => {
  const storeUrl = settings?.storeUrl || 'https://pioneer-rp-18.tebex.io/';
  const discordUrl = settings?.discordUrl || 'https://discord.gg/pioneerrp';

  return (
    <footer className="w-full border-t border-white/[0.06] bg-neutral-950 text-neutral-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600/20 border border-purple-500/40 text-purple-400">
                <Radio className="h-4 w-4" />
              </div>
              <span className="font-display text-base font-bold tracking-wider text-white">
                PIONEER<span className="text-purple-400">RP</span> LIVE
              </span>
            </div>
            <p className="text-xs text-neutral-400 max-w-md leading-relaxed">
              The premier broadcasting and creator discovery hub for the Pioneer RP FiveM server.
              Real-time Twitch telemetry, featured roleplay storylines, and community creator attribution.
            </p>
            <div className="text-[11px] text-neutral-500 leading-normal">
              Pioneer RP Live is a dedicated community hub. Grand Theft Auto and FiveM are registered trademarks of their respective owners.
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-neutral-200 mb-3">
              Navigation
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('/')}
                  className="hover:text-white transition-colors"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/live')}
                  className="hover:text-white transition-colors"
                >
                  Live Now
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/streamers')}
                  className="hover:text-white transition-colors"
                >
                  All Streamers
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/featured')}
                  className="hover:text-white transition-colors"
                >
                  Featured Creators
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/about')}
                  className="hover:text-white transition-colors"
                >
                  About Hub
                </button>
              </li>
            </ul>
          </div>

          {/* Community & Store */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-neutral-200 mb-3">
              Community & Store
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href={storeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-white transition-colors"
                >
                  <span>Pioneer Tebex Store</span>
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </a>
              </li>
              <li>
                <a
                  href={discordUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-white transition-colors"
                >
                  <span>Official Discord</span>
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </a>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/admin')}
                  className="flex items-center gap-1.5 text-neutral-500 hover:text-neutral-300 transition-colors pt-2"
                >
                  <Shield className="h-3 w-3" />
                  <span>Admin Portal</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-white/[0.05] flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-4">
          <div>
            &copy; {new Date().getFullYear()} Pioneer RP Live. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Twitch Helix Integration</span>
            <span>·</span>
            <span>FiveM Roleplay</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
