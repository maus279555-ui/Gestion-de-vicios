import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Smartphone, Download, Share, X, CheckCircle2, QrCode } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'header' | 'card' | 'settings';
  onOpenExpoHub?: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'card', onOpenExpoHub }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    } catch {
      // ignore
    }
  };

  const handleTriggerInstall = async () => {
    if (isInstallable) {
      const ok = await install();
      if (ok) setShowModal(false);
    } else {
      setShowModal(true);
    }
  };

  if (isInstalled && variant !== 'settings') {
    return null;
  }

  // Header quick pill
  if (variant === 'header') {
    return (
      <>
        <button
          onClick={handleTriggerInstall}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition active:scale-95 shadow-sm"
          title="Instalar en el celular o abrir en Expo Go"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden xs:inline">Instalar App</span>
        </button>

        {showModal && (
          <InstallHelpModal
            onClose={() => setShowModal(false)}
            isIOS={isIOS}
            isInstallable={isInstallable}
            onInstall={install}
            currentUrl={currentUrl}
            copiedUrl={copiedUrl}
            onCopyUrl={handleCopyUrl}
            onOpenExpoHub={onOpenExpoHub}
          />
        )}
      </>
    );
  }

  // Settings button
  if (variant === 'settings') {
    return (
      <>
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Instalar en tu Celular</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isInstalled
                    ? '✅ Aplicación ya instalada en tu dispositivo'
                    : 'Instalable en Android, iPhone y compatible con Expo Go'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-3 pt-3 border-t border-slate-800/80">
            <button
              onClick={handleTriggerInstall}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition active:scale-98 shadow-lg shadow-emerald-950/40"
            >
              <Download className="w-3.5 h-3.5" />
              {isInstalled ? 'Ver Guía de Instalación' : 'Instalar en Teléfono'}
            </button>
            {onOpenExpoHub && (
              <button
                onClick={onOpenExpoHub}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
              >
                <span>📱 Código Expo Go</span>
              </button>
            )}
          </div>
        </div>

        {showModal && (
          <InstallHelpModal
            onClose={() => setShowModal(false)}
            isIOS={isIOS}
            isInstallable={isInstallable}
            onInstall={install}
            currentUrl={currentUrl}
            copiedUrl={copiedUrl}
            onCopyUrl={handleCopyUrl}
            onOpenExpoHub={onOpenExpoHub}
          />
        )}
      </>
    );
  }

  // Card variant (for Home screen banner)
  return (
    <>
      <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-3.5 shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Móvil Listo</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Expo & PWA
                </span>
              </div>
              <p className="text-xs text-slate-200 font-semibold mt-0.5">Instala la App en tu Celular</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleTriggerInstall}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition shadow active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Instalar</span>
            </button>
            {onOpenExpoHub && (
              <button
                onClick={onOpenExpoHub}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                title="Ver versión Expo Go"
              >
                <QrCode className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <InstallHelpModal
          onClose={() => setShowModal(false)}
          isIOS={isIOS}
          isInstallable={isInstallable}
          onInstall={install}
          currentUrl={currentUrl}
          copiedUrl={copiedUrl}
          onCopyUrl={handleCopyUrl}
          onOpenExpoHub={onOpenExpoHub}
        />
      )}
    </>
  );
};

interface InstallHelpModalProps {
  onClose: () => void;
  isIOS: boolean;
  isInstallable: boolean;
  onInstall: () => Promise<boolean>;
  currentUrl: string;
  copiedUrl: boolean;
  onCopyUrl: () => void;
  onOpenExpoHub?: () => void;
}

const InstallHelpModal: React.FC<InstallHelpModalProps> = ({
  onClose,
  isIOS,
  isInstallable,
  onInstall,
  currentUrl,
  copiedUrl,
  onCopyUrl,
  onOpenExpoHub,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-lg shadow-emerald-950">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Instalar en tu Celular</h3>
            <p className="text-xs text-emerald-400 font-medium">Control de Vicios Móvil</p>
          </div>
        </div>

        {/* Chromium / Android direct install button */}
        {isInstallable && (
          <div className="mb-4">
            <button
              onClick={async () => {
                await onInstall();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-emerald-500/20 active:scale-98"
            >
              <Download className="w-4 h-4" />
              Instalar Ahora en este Dispositivo
            </button>
          </div>
        )}

        {/* Instructions by Platform */}
        <div className="space-y-3 mb-4 text-xs">
          {/* Android */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80">
            <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1.5">
              <span>🤖 En Celular Android (Google Chrome)</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-300 leading-relaxed">
              <li>Abre esta URL en Chrome desde tu teléfono.</li>
              <li>Toca los tres puntos <strong className="text-white">⋮</strong> (arriba a la derecha).</li>
              <li>Selecciona <strong className="text-emerald-300">"Instalar aplicación"</strong> o "Agregar a la pantalla principal".</li>
              <li>Aparecerá el ícono en tu menú de aplicaciones listo para usar sin conexión.</li>
            </ol>
          </div>

          {/* iPhone / iOS */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80">
            <div className="flex items-center gap-2 text-sky-400 font-bold mb-1.5">
              <Share className="w-3.5 h-3.5" />
              <span>🍎 En iPhone / iPad (Safari)</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-300 leading-relaxed">
              <li>Abre esta URL en el navegador <strong className="text-white">Safari</strong>.</li>
              <li>Toca el botón <strong className="text-white">Compartir</strong> (ícono de cuadro con flecha arriba).</li>
              <li>Baja y pulsa <strong className="text-sky-300">"Añadir a pantalla de inicio"</strong>.</li>
              <li>Toca "Añadir" y tendrás la app a pantalla completa sin barra de navegación.</li>
            </ol>
          </div>
        </div>

        {/* Copy URL / Open on phone */}
        <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 mb-4">
          <p className="text-[11px] text-slate-400 mb-2">Para abrir en tu celular, copia el link o compártelo:</p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={currentUrl}
              className="flex-1 bg-slate-950 text-slate-300 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 select-all font-mono"
            />
            <button
              onClick={onCopyUrl}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition flex items-center gap-1 shrink-0"
            >
              {copiedUrl ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : null}
              <span>{copiedUrl ? '¡Copiado!' : 'Copiar'}</span>
            </button>
          </div>
        </div>

        {/* Expo Go button */}
        {onOpenExpoHub && (
          <button
            onClick={() => {
              onClose();
              onOpenExpoHub();
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <span>📱 Ver proyecto y código para Expo Go</span>
          </button>
        )}
      </div>
    </div>
  );
};
