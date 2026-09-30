import React, { useEffect, useState } from 'react';
import { Server, Users, ExternalLink, RefreshCw } from 'lucide-react';
import { ServerStatusResponse, SiteSettings } from '../types/index.js';
import { api } from '../services/apiClient.js';

interface ServerStatusWidgetProps {
  settings: SiteSettings | null;
}

export const ServerStatusWidget: React.FC<ServerStatusWidgetProps> = ({ settings }) => {
  const [status, setStatus] = useState<ServerStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await api.getServerStatus();
      setStatus(res.data);
    } catch {
      setStatus({
        available: false,
        online: false,
        message: 'SERVER STATUS UNAVAILABLE',
        checkedAt: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const joinUrl = settings?.serverJoinUrl || 'fivem://connect/cfx.re/join/pioneer-rp';

  return (
    <div className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-neutral-900/60 p-4 sm:p-5 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-800 border border-white/5 text-purple-400 shrink-0">
          <Server className="h-5 w-5" />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-sm text-white tracking-wide">
              PIONEER RP FIVEM SERVER
            </span>
            {status?.available && status.online ? (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 uppercase tracking-wider">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ONLINE
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-neutral-800 text-neutral-400 border border-white/5 uppercase tracking-wider">
                STATUS UNAVAILABLE
              </span>
            )}
          </div>

          <div className="text-xs text-neutral-400 mt-0.5 flex items-center gap-3 font-mono">
            {status?.available && status.online && typeof status.playerCount === 'number' ? (
              <span className="flex items-center gap-1 text-neutral-200">
                <Users className="h-3.5 w-3.5 text-purple-400" />
                <strong>{status.playerCount}</strong> / {status.maxPlayers || 128} PLAYERS
              </span>
            ) : (
              <span>Direct FiveM connect link configured for official roleplay server.</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        <a
          href={joinUrl}
          className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all"
        >
          <span>JOIN SERVER</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
};
