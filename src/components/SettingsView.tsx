import React from 'react';
import {
  Settings,
  Volume2,
  VolumeX,
  Smartphone,
  Shield,
  HelpCircle,
  Fuel,
  TreePine,
  Leaf,
  MapPin,
  Clock,
  Sparkles,
} from 'lucide-react';
import { AppSettings } from '../services/storage';
import { sound } from '../services/sound';
import { triggerHaptic } from '../services/geolocation';

import { TursoStatus, updateServerTursoToken } from '../services/api';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (s: AppSettings) => void;
  onLoadDemoData: () => void;
  tursoStatus: TursoStatus | null;
  onSyncTurso: () => void;
  isSyncing: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onLoadDemoData,
  tursoStatus,
  onSyncTurso,
  isSyncing,
}) => {
  const [tokenInput, setTokenInput] = React.useState('');
  const [isSavingToken, setIsSavingToken] = React.useState(false);
  const [tokenMessage, setTokenMessage] = React.useState<string | null>(null);

  const handleSaveToken = async () => {
    setIsSavingToken(true);
    setTokenMessage(null);
    try {
      const res = await updateServerTursoToken(tokenInput.trim());
      if (res.success) {
        setTokenMessage('✅ ¡Conexión con Turso verificada con éxito!');
        onSyncTurso();
      } else {
        setTokenMessage(`⚠️ ${res.error || 'Token inválido o error de conexión'}`);
      }
    } catch (e: any) {
      setTokenMessage(`Error: ${e?.message}`);
    } finally {
      setIsSavingToken(false);
    }
  };

  const currencies = ['Bs.', '$', 'S/.', 'MXN', 'ARS', '€', 'CLP'];

  const toggleVibration = () => {
    const next = !settings.enableVibration;
    if (next) triggerHaptic('success');
    onUpdateSettings({ ...settings, enableVibration: next });
  };

  const toggleAudio = () => {
    const next = !settings.enableAudio;
    if (next) sound.playClick();
    onUpdateSettings({ ...settings, enableAudio: next });
  };

  return (
    <div className="w-full max-w-lg mx-auto pb-12 px-3 sm:px-4">
      {/* Title */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4 shadow-md">
        <div className="flex items-center gap-2.5 mb-1">
          <Settings className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-bold text-white">Configuración y Ayuda</h3>
        </div>
        <p className="text-xs text-slate-400">
          Personaliza la moneda, sonidos, vibración táctil y consulta cómo usar la app.
        </p>
      </div>

      {/* Moneda y Preferencias */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4 shadow-md space-y-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
            Símbolo de Moneda
          </label>
          <div className="grid grid-cols-4 gap-2">
            {currencies.map((c) => (
              <button
                key={c}
                onClick={() => {
                  triggerHaptic('light');
                  onUpdateSettings({ ...settings, currency: c });
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                  settings.currency === c
                    ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-700/30'
                    : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="pt-2 border-t border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="font-bold text-slate-200">Vibración Táctil (Haptic)</p>
                <p className="text-[11px] text-slate-400">Respuesta al tocar teclas en el móvil</p>
              </div>
            </div>
            <button
              onClick={toggleVibration}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                settings.enableVibration ? 'bg-emerald-600' : 'bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  settings.enableVibration ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              {settings.enableAudio ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-500" />
              )}
              <div>
                <p className="font-bold text-slate-200">Sonido de Caja Registradora</p>
                <p className="text-[11px] text-slate-400">Campanilla al registrar ventas</p>
              </div>
            </div>
            <button
              onClick={toggleAudio}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                settings.enableAudio ? 'bg-emerald-600' : 'bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  settings.enableAudio ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Base de Datos Turso + Drizzle */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            Base de Datos Turso (libSQL)
          </h4>
          <span
            className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
              tursoStatus?.connected
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
            }`}
          >
            {tursoStatus?.connected ? 'Conectado AWS SA-East' : 'Listo / Turso Configurado'}
          </span>
        </div>

        <p className="text-xs text-slate-400 mb-2 font-mono break-all bg-slate-950 p-2 rounded-xl border border-slate-800">
          libsql://gestion-de-vicios-maus279555-ui.aws-sa-east-1.turso.io
        </p>

        <p className="text-[11px] text-slate-400 mb-3">
          Tus ventas de gasolina, leña y gastos se sincronizan con la base de datos de Turso en la nube usando el ORM Drizzle. Si estás sin señal o en una ruta rural, la app guarda en modo offline y sincroniza automáticamente.
        </p>

        {/* Token input */}
        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 mb-3">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Token de Autenticación Turso (Opcional):
          </label>
          <div className="flex gap-1.5">
            <input
              type="password"
              placeholder="Pega aquí tu turso auth token..."
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
            />
            <button
              onClick={handleSaveToken}
              disabled={isSavingToken}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-all"
            >
              {isSavingToken ? 'Probando...' : 'Conectar'}
            </button>
          </div>
          {tokenMessage && (
            <p className="text-[10px] mt-1.5 text-emerald-400 font-medium">{tokenMessage}</p>
          )}
        </div>

        <button
          onClick={onSyncTurso}
          disabled={isSyncing}
          className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <span>{isSyncing ? 'Sincronizando con Turso...' : '🔄 Sincronizar Registros con Turso Ahora'}</span>
        </button>
      </div>

      {/* Guía Rápida de Uso */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4 shadow-md">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-cyan-400" /> Guía Rápida de Funcionamiento
        </h4>

        <div className="space-y-3 text-xs text-slate-300">
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
              1
            </span>
            <div>
              <p className="font-bold text-white">Ingresa el Monto:</p>
              <p className="text-slate-400 text-[11px]">
                Escribe en el teclado numérico o usa los botones rápidos (+10, +20, +50, +100).
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
              2
            </span>
            <div>
              <p className="font-bold text-white">1 Toque en la Categoría:</p>
              <p className="text-slate-400 text-[11px]">
                Toca <span className="text-amber-400 font-semibold">Venta Gasolina</span> o{' '}
                <span className="text-emerald-400 font-semibold">Venta de Leña</span> para registrar
                ingreso, o toca <span className="text-lime-400 font-semibold">Bolo</span>,{' '}
                <span className="text-stone-300 font-semibold">Cigarro</span>,{' '}
                <span className="text-orange-400 font-semibold">Comida</span> o{' '}
                <span className="text-rose-400 font-semibold">Trago</span> para registrar gasto.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
              3
            </span>
            <div>
              <p className="font-bold text-white">Automático e Inmediato:</p>
              <p className="text-slate-400 text-[11px]">
                La fecha, hora exacta y coordenadas GPS se graban solas sin que tengas que escribir
                nada más.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cargar datos demo de prueba */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md text-center">
        <Sparkles className="w-6 h-6 text-amber-400 mx-auto mb-1.5" />
        <h4 className="text-xs font-bold text-white">¿Quieres probar con datos reales de ejemplo?</h4>
        <p className="text-[11px] text-slate-400 mb-3">
          Carga un conjunto de ventas de gasolina, leña y gastos de bolo/cigarro/comida para ver
          cómo se ven los reportes.
        </p>
        <button
          onClick={() => {
            triggerHaptic('success');
            onLoadDemoData();
            alert('¡Datos de ejemplo cargados!');
          }}
          className="py-2 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
        >
          Cargar Datos de Demostración
        </button>
      </div>
    </div>
  );
};
