import React from 'react';
import { useOnlineStatus } from '../hooks/usePWAInstall';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 mx-auto max-w-sm flex items-center justify-between gap-2.5 rounded-2xl bg-amber-500/95 px-3.5 py-2 text-xs font-semibold text-slate-950 shadow-xl backdrop-blur-md animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 text-slate-950 shrink-0 animate-pulse" />
        <span>Modo Sin Conexión activo — Datos guardados en tu celular</span>
      </div>
      <span className="h-2 w-2 rounded-full bg-slate-950 animate-ping shrink-0" />
    </div>
  );
};
