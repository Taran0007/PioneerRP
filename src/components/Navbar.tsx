import React, { useState } from 'react';
import { Menu, X, Radio, ShoppingBag, Shield, ExternalLink, Palette, UserPlus } from 'lucide-react';
import { SiteSettings } from '../types/index.js';
import { useTheme } from '../context/ThemeContext.js';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  settings: SiteSettings | null;
  adminUser: any;
  liveCount: number;
  onOpenJoinModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPath,
  onNavigate,
  settings,
  adminUser,
  liveCount,
  onOpenJoinModal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, cycleTheme } = useTheme();

  const navLinks = [
    { label: 'LIVE', path: '/live', badge: liveCount > 0 ? liveCount : null },
    { label: 'SQUAD', path: '/squad' },
    { label: 'MAP', path: '/map' },
    { label: 'EVENTS', path: '/events' },
    { label: 'CLIPS', path: '/clips' },
    { label: 'STREAMERS', path: '/streamers' },
    { label: 'VODS', path: '/vods' },
    { label: 'FEATURED', path: '/featured' },
    { label: 'ABOUT', path: '/about' },
  ];

  const handleLinkClick = (path: string) => {
    onNavigate(path);
    setMobileMenuOpen(false);
  };

  const storeUrl = settings?.storeUrl || 'https://pioneer-rp-18.tebex.io/';
  const joinUrl = settings?.serverJoinUrl || 'fivem://connect/cfx.re/join/pioneer-rp';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-neutral-950/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleLinkClick('/')}
            className="flex items-center gap-2.5 text-left focus:outline-none group"
            aria-label="Pioneer RP Live Home"
          >
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 via-purple-600/20 to-neutral-900 border border-amber-500/30 p-1 group-hover:border-amber-400/60 shadow-lg shadow-amber-950/30 transition-all">
              <img
                src="/pioneer-logo.png"
                alt="Pioneer RP Emblem"
                className="h-full w-full object-contain drop-shadow group-hover:scale-110 transition-transform duration-200"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <span className="font-display text-lg font-bold tracking-wider text-white group-hover:text-purple-300 transition-colors">
              PIONEER<span className="text-amber-400">RP</span>
              <span className="ml-1 text-xs tracking-widest text-neutral-400 font-sans font-semibold">LIVE</span>
            </span>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold tracking-wider text-neutral-300">
          {navLinks.map(link => {
            const isActive = currentPath === link.path;
            return (
              <button
                key={link.path}
                onClick={() => handleLinkClick(link.path)}
                className={`relative py-1 transition-colors flex items-center gap-1.5 focus:outline-none ${
                  isActive ? 'text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <span>{link.label}</span>
                {typeof link.badge === 'number' && link.badge > 0 && (
                  <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-red-600 text-white animate-pulse">
                    {link.badge}
                  </span>
                )}
                {isActive && (
                  <span className="absolute -bottom-[21px] left-0 right-0 h-[2px] bg-purple-500 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Actions */}
        <div className="hidden lg:flex items-center gap-2.5">
          {/* Theme Switcher Button */}
          <button
            onClick={cycleTheme}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-neutral-300 hover:text-white transition-colors text-xs font-mono"
            title="Cycle theme (Purple / Cyan / Emerald)"
          >
            <Palette className="h-3.5 w-3.5 text-purple-400" />
            <span className="text-[11px] font-bold">{theme}</span>
          </button>

          {adminUser && (
            <button
              onClick={() => handleLinkClick('/admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${
                currentPath.startsWith('/admin')
                  ? 'bg-purple-950/60 border-purple-500 text-purple-200'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              <Shield className="h-3.5 w-3.5 text-purple-400" />
              <span>Admin</span>
            </button>
          )}

          {onOpenJoinModal && (
            <button
              onClick={onOpenJoinModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30 transition-all hover:scale-105"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Join Streamers</span>
            </button>
          )}

          <a
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-neutral-900/90 hover:bg-neutral-800 border border-white/10 text-neutral-200 hover:text-white transition-colors"
          >
            <ShoppingBag className="h-3.5 w-3.5 text-purple-400" />
            <span>Store</span>
          </a>

          <a
            href={joinUrl}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/25 transition-all hover:shadow-purple-600/40"
          >
            <span>Join Pioneer</span>
            <ExternalLink className="h-3 w-3 opacity-80" />
          </a>
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-2">
          {liveCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-red-400 bg-red-950/40 border border-red-500/30 rounded-md">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
              {liveCount} LIVE
            </span>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-neutral-400 hover:text-white rounded-lg bg-neutral-900/60 border border-white/5"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-neutral-800 bg-neutral-950/95 px-4 pt-3 pb-6 space-y-3">
          <div className="grid gap-1">
            {navLinks.map(link => {
              const isActive = currentPath === link.path;
              return (
                <button
                  key={link.path}
                  onClick={() => handleLinkClick(link.path)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold tracking-wide text-left ${
                    isActive ? 'bg-purple-900/20 text-purple-300' : 'text-neutral-300 hover:bg-neutral-900'
                  }`}
                >
                  <span>{link.label}</span>
                  {typeof link.badge === 'number' && link.badge > 0 && (
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-red-600 text-white">
                      {link.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-neutral-850 flex flex-col gap-2">
            <a
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg bg-neutral-900 border border-white/10 text-white"
            >
              <ShoppingBag className="h-4 w-4 text-purple-400" />
              <span>Pioneer Tebex Store</span>
            </a>
            <a
              href={joinUrl}
              className="flex items-center justify-center gap-2 py-2.5 text-xs font-semibold rounded-lg bg-purple-600 text-white"
            >
              <span>Join Pioneer Server</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            {adminUser ? (
              <button
                onClick={() => handleLinkClick('/admin')}
                className="flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg bg-neutral-900 text-purple-300 border border-purple-900"
              >
                <Shield className="h-3.5 w-3.5" />
                <span>Admin Dashboard</span>
              </button>
            ) : (
              <button
                onClick={() => handleLinkClick('/admin/login')}
                className="text-center py-2 text-xs text-neutral-500 hover:text-neutral-400"
              >
                Admin Access
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
