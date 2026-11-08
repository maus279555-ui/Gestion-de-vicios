import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Sparkles, RefreshCw, DollarSign, ShieldCheck } from 'lucide-react';
import { GeoLocationInfo } from '../types/finance';
import { sound } from '../services/sound';
import { triggerHaptic } from '../services/geolocation';
import { PWAInstallButton } from './PWAInstallButton';

interface MobileHeaderProps {
  currentLocation: GeoLocationInfo | null;
  isLocating: boolean;
  onRefreshLocation: () => void;
  currency: string;
  onChangeCurrency: (c: string) => void;
  onLoadDemoData: () => void;
  todaySavings: number;
  hasData: boolean;
  onOpenExpoModal?: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  currentLocation,
  isLocating,
  onRefreshLocation,
  currency,
  onChangeCurrency,
  onLoadDemoData,
  todaySavings,
  hasData,
  onOpenExpoModal,
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('es-BO', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setDateStr(
        now.toLocaleDateString('es-BO', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const currencies = ['Bs.', '$', 'S/.', 'MXN', 'ARS', '€'];

  return (
    <>
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-30 px-3.5 py-2.5 shadow-lg safe-top">
        <div className="flex items-center justify-between gap-2 max-w-lg mx-auto">
          {/* Brand & Date */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-amber-500 p-0.5 shadow-md shadow-emerald-500/20 flex-shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-emerald-400 font-extrabold text-lg">
                💰
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-black text-white tracking-tight leading-none">
                  Gestión de Vicios
                </h1>
                <span className="text-[10px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Turso DB
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium capitalize mt-0.5">
                {dateStr} • <span className="font-mono text-slate-300">{timeStr}</span>
              </p>
            </div>
          </div>

          {/* Quick Actions (Install PWA / Expo Hub + Currency) */}
          <div className="flex items-center gap-1.5">
            <PWAInstallButton variant="header" onOpenExpoHub={onOpenExpoModal} />
            <button
              onClick={() => {
                triggerHaptic('light');
                sound.playClick();
                setShowCurrencyModal(true);
              }}
              title="Cambiar moneda"
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700/80 flex items-center gap-1 transition-all"
            >
              <DollarSign className="w-3 h-3 text-amber-400" />
              <span>{currency}</span>
            </button>
          </div>
        </div>

        {/* Live GPS & Quick Net Status bar */}
        <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs max-w-lg mx-auto">
          {/* GPS Status */}
          <button
            onClick={() => {
              triggerHaptic('light');
              onRefreshLocation();
            }}
            disabled={isLocating}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors py-0.5 px-1 rounded active:bg-slate-800/50"
            title="Toca para actualizar geolocalización"
          >
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  currentLocation ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              ></span>
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  currentLocation ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              ></span>
            </span>
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] truncate max-w-[170px] sm:max-w-[220px]">
              {isLocating ? (
                'Obteniendo GPS...'
              ) : currentLocation ? (
                <span className="text-emerald-400 font-medium">
                  {currentLocation.address ||
                    `${currentLocation.latitude.toFixed(3)}, ${currentLocation.longitude.toFixed(3)}`}
                </span>
              ) : (
                'GPS no detectado (toca reintentar)'
              )}
            </span>
            <RefreshCw
              className={`w-3 h-3 text-slate-400 ${isLocating ? 'animate-spin' : ''}`}
            />
          </button>

          {/* Today's Net Indicator */}
          <div className="flex items-center gap-1 font-mono text-[11px]">
            <span className="text-slate-400">Hoy:</span>
            <span
              className={`font-bold px-1.5 py-0.5 rounded ${
                todaySavings >= 0
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              {todaySavings >= 0 ? '+' : ''}
              {currency} {todaySavings.toFixed(2)}
            </span>
          </div>
        </div>
      </header>

      {/* Currency Modal */}
      {showCurrencyModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-xs w-full shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Seleccionar Moneda</h3>
            <p className="text-xs text-slate-400 mb-4">
              Elige el símbolo de moneda para tus registros y reportes
            </p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {currencies.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    onChangeCurrency(c);
                    setShowCurrencyModal(false);
                  }}
                  className={`py-2 px-3 rounded-xl font-bold text-sm border transition-all ${
                    currency === c
                      ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-600/30'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowCurrencyModal(false)}
              className="w-full py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
};
