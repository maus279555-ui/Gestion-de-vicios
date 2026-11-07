import React from 'react';
import { MapPin, ExternalLink, X, Navigation, Copy, Check } from 'lucide-react';
import { GeoLocationInfo } from '../types/finance';

interface LocationModalProps {
  location: GeoLocationInfo | null;
  title: string;
  onClose: () => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({ location, title, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!location) return null;

  const lat = location.latitude;
  const lng = location.longitude;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Geolocalización</h3>
            <p className="text-xs text-slate-400 truncate max-w-[200px]">{title}</p>
          </div>
        </div>

        {/* Coords details */}
        <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 mb-4 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Latitud:</span>
            <span className="font-mono text-white font-medium">{lat.toFixed(6)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">Longitud:</span>
            <span className="font-mono text-white font-medium">{lng.toFixed(6)}</span>
          </div>
          {location.accuracy && (
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Precisión GPS:</span>
              <span className="text-emerald-400 font-medium">±{location.accuracy} metros</span>
            </div>
          )}
          {location.address && (
            <div className="pt-2 border-t border-slate-800 text-xs">
              <span className="text-slate-400 block mb-0.5">Referencia:</span>
              <span className="text-slate-200">{location.address}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/30 transition-all"
          >
            <Navigation className="w-4 h-4" />
            <span>Abrir en Google Maps</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={handleCopy}
            className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Coordenadas copiadas</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copiar coordenadas</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
