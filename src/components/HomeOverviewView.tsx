import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Fuel,
  TreePine,
  Leaf,
  Cigarette,
  Wine,
  Beer,
  UtensilsCrossed,
  Database,
  ShieldCheck,
  Zap,
  ArrowRight,
  Clock,
  MapPin,
  AlertTriangle,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Transaction } from '../types/finance';
import { TursoStatus } from '../services/api';
import { triggerHaptic } from '../services/geolocation';
import { sound } from '../services/sound';
import { getLocalDateString } from '../services/storage';

interface HomeOverviewViewProps {
  transactions: Transaction[];
  currency: string;
  tursoStatus: TursoStatus | null;
  onGoToPad: (type?: 'income' | 'expense') => void;
  onGoToReports: () => void;
  onOpenStudio?: () => void;
}

export const HomeOverviewView: React.FC<HomeOverviewViewProps> = ({
  transactions,
  currency,
  tursoStatus,
  onGoToPad,
  onGoToReports,
  onOpenStudio,
}) => {
  const todayStr = getLocalDateString();

  // Computations
  let totalIncome = 0;
  let totalExpense = 0;
  let totalGasolina = 0;
  let totalLeña = 0;
  let totalOtrosIngresos = 0;

  let totalBolo = 0;
  let totalCigarro = 0;
  let totalAlcohol = 0;
  let totalComida = 0;
  let totalOtrosGastos = 0;

  let todayIncome = 0;
  let todayExpense = 0;

  for (const t of transactions) {
    if (t.type === 'income') {
      totalIncome += t.amount;
      if (t.category === 'gasolina') totalGasolina += t.amount;
      else if (t.category === 'leña') totalLeña += t.amount;
      else totalOtrosIngresos += t.amount;

      if (t.date === todayStr) todayIncome += t.amount;
    } else {
      totalExpense += t.amount;
      if (t.category === 'bolo') totalBolo += t.amount;
      else if (t.category === 'cigarro') totalCigarro += t.amount;
      else if (['trago', 'cerveza'].includes(t.category)) totalAlcohol += t.amount;
      else if (t.category === 'comida') totalComida += t.amount;
      else totalOtrosGastos += t.amount;

      if (t.date === todayStr) todayExpense += t.amount;
    }
  }

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;
  const vicesTotal = totalBolo + totalCigarro + totalAlcohol;
  const vicesRate = totalIncome > 0 ? Math.round((vicesTotal / totalIncome) * 100) : 0;

  const todayNet = todayIncome - todayExpense;

  const recentTransactions = [...transactions]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);

  return (
    <div className="w-full max-w-lg mx-auto pb-10 px-3 sm:px-4">
      {/* Turso Database Badge */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 mb-3 flex items-center justify-between shadow-sm text-xs">
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center ${
              tursoStatus?.connected
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
            }`}
          >
            <Database className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-white text-[11px]">
              <span>Base de Datos Turso + Drizzle</span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase ${
                  tursoStatus?.connected
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                }`}
              >
                {tursoStatus?.connected ? 'Conectado AWS SA-East' : 'Turso Configurado'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono truncate max-w-[190px] sm:max-w-xs">
              gestion-de-vicios-maus279555-ui.aws-sa-east-1.turso.io
            </p>
          </div>
        </div>

        {onOpenStudio && (
          <button
            onClick={() => {
              triggerHaptic('light');
              sound.playClick();
              onOpenStudio();
            }}
            className="text-[10px] text-emerald-300 font-bold bg-emerald-950/80 hover:bg-emerald-900/80 px-2 py-1 rounded-lg border border-emerald-800/80 flex items-center gap-1 transition-all active:scale-95"
            title="Abrir inspector Drizzle Studio"
          >
            <Database className="w-3 h-3 text-emerald-400" />
            <span>Ver Tabla</span>
          </button>
        )}
      </div>

      {/* Panorama Hero Card */}
      <div className="bg-gradient-to-br from-slate-900 via-emerald-950/30 to-slate-950 border border-emerald-500/40 rounded-3xl p-5 mb-4 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span className="font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <PiggyBank className="w-4 h-4 text-emerald-400" /> Panorama Global de Finanzas
          </span>
          <span className="bg-emerald-500/20 text-emerald-300 font-black px-2 py-0.5 rounded-full border border-emerald-500/30 text-[11px]">
            {savingsRate}% Ganancia Neta
          </span>
        </div>

        <div className="py-2">
          <span className="text-xs text-slate-400 block font-medium">Ahorros / Saldo Total Acumulado:</span>
          <p className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white mt-0.5">
            {currency} {netSavings.toFixed(2)}
          </p>
        </div>

        {/* Global Split (Ingresos vs Gastos) */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/80 text-xs">
          <div className="bg-slate-950/60 rounded-xl p-2.5 border border-emerald-500/20">
            <span className="text-slate-400 flex items-center gap-1 font-medium text-[11px]">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Total Ingresos:
            </span>
            <p className="text-base sm:text-lg font-black font-mono text-emerald-300 mt-0.5">
              +{currency} {totalIncome.toFixed(2)}
            </p>
          </div>

          <div className="bg-slate-950/60 rounded-xl p-2.5 border border-rose-500/20">
            <span className="text-slate-400 flex items-center gap-1 font-medium text-[11px]">
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" /> Total Gastado:
            </span>
            <p className="text-base sm:text-lg font-black font-mono text-rose-300 mt-0.5">
              -{currency} {totalExpense.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Resumen Rápido de Hoy */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 mb-4 shadow-md flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-emerald-400" /> Resumen del Día de Hoy
          </span>
          <div className="flex items-center gap-3 mt-1 text-xs">
            <span className="text-emerald-400 font-bold font-mono">
              Ventas: +{currency} {todayIncome.toFixed(0)}
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-rose-400 font-bold font-mono">
              Gastos: -{currency} {todayExpense.toFixed(0)}
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 block">Saldo Hoy:</span>
          <span
            className={`font-mono font-black text-sm px-2 py-0.5 rounded-lg border ${
              todayNet >= 0
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
            }`}
          >
            {todayNet >= 0 ? '+' : ''}
            {currency} {todayNet.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Vices Habit Audit Bar */}
      {vicesTotal > 0 && (
        <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-3.5 mb-4 shadow-md text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-amber-300 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Impacto de Vicios (Bolo, Cigarro, Trago):
            </span>
            <span className="font-mono font-extrabold text-amber-200">
              {currency} {vicesTotal.toFixed(2)} ({vicesRate}% de ventas)
            </span>
          </div>

          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full rounded-full transition-all ${
                vicesRate > 35 ? 'bg-rose-500' : vicesRate > 20 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(vicesRate, 100)}%` }}
            ></div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-[11px] pt-1">
            <div className="bg-slate-950/60 p-1.5 rounded-lg text-center">
              <span className="text-slate-400 block text-[10px]">🍃 Bolo</span>
              <span className="font-mono font-bold text-lime-400">
                {currency} {totalBolo.toFixed(0)}
              </span>
            </div>
            <div className="bg-slate-950/60 p-1.5 rounded-lg text-center">
              <span className="text-slate-400 block text-[10px]">🚬 Cigarro</span>
              <span className="font-mono font-bold text-stone-300">
                {currency} {totalCigarro.toFixed(0)}
              </span>
            </div>
            <div className="bg-slate-950/60 p-1.5 rounded-lg text-center">
              <span className="text-slate-400 block text-[10px]">🍻 Trago/Cerv.</span>
              <span className="font-mono font-bold text-rose-400">
                {currency} {totalAlcohol.toFixed(0)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Ingresos Principales (Gasolina y Leña) */}
      <div className="mb-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Fuel className="w-4 h-4 text-amber-400" /> Fuentes de Ingreso Principales
          </span>
          <button
            onClick={onGoToReports}
            className="text-emerald-400 hover:text-emerald-300 text-[11px] flex items-center gap-1 font-semibold"
          >
            Ver Reportes <ArrowRight className="w-3 h-3" />
          </button>
        </h4>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Gasolina */}
          <div className="bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-950 border border-amber-500/40 rounded-2xl p-3.5 shadow-md">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <Fuel className="w-4 h-4" />
              </div>
              <div>
                <h5 className="font-bold text-xs text-amber-300 leading-tight">Venta Gasolina</h5>
                <span className="text-[10px] text-slate-400">Principal</span>
              </div>
            </div>
            <p className="text-xl font-black font-mono text-white mt-1">
              {currency} {totalGasolina.toFixed(2)}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {totalIncome > 0 ? `${Math.round((totalGasolina / totalIncome) * 100)}% de los ingresos` : '0%'}
            </p>
          </div>

          {/* Leña */}
          <div className="bg-gradient-to-br from-emerald-950/30 via-slate-900 to-slate-950 border border-emerald-500/40 rounded-2xl p-3.5 shadow-md">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <TreePine className="w-4 h-4" />
              </div>
              <div>
                <h5 className="font-bold text-xs text-emerald-300 leading-tight">Venta de Leña</h5>
                <span className="text-[10px] text-slate-400">Principal</span>
              </div>
            </div>
            <p className="text-xl font-black font-mono text-white mt-1">
              {currency} {totalLeña.toFixed(2)}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {totalIncome > 0 ? `${Math.round((totalLeña / totalIncome) * 100)}% de los ingresos` : '0%'}
            </p>
          </div>
        </div>
      </div>

      {/* Botones de Acción Rápida (Atajos al teclado de registro) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 mb-4 shadow-md">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-amber-400" /> Registro Rápido
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              triggerHaptic('light');
              sound.playClick();
              onGoToPad('income');
            }}
            className="py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-700/30 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <span>+ Registrar Venta</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              sound.playClick();
              onGoToPad('expense');
            }}
            className="py-2.5 px-3 bg-gradient-to-r from-rose-600 to-amber-700 hover:from-rose-500 hover:to-amber-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-700/30 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <span>- Registrar Gasto</span>
          </button>
        </div>
      </div>

      {/* Últimos Movimientos Registrados */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" /> Últimos Movimientos Registrados
          </h4>
          <span className="text-[11px] text-slate-400">Total: {transactions.length}</span>
        </div>

        <div className="space-y-2">
          {recentTransactions.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-center">
              <span className="text-2xl mb-1 block">✨</span>
              <p className="text-xs font-bold text-slate-200">
                Base de datos 100% limpia y en Cero (0)
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Toca los botones de arriba para realizar tu primer registro real de venta o gasto.
              </p>
            </div>
          ) : (
            recentTransactions.map((tx) => (
            <div
              key={tx.id}
              className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-sm"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    tx.type === 'income'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {tx.category === 'gasolina' ? '⛽' : tx.category === 'leña' ? '🪵' : tx.category === 'bolo' ? '🍃' : tx.category === 'cigarro' ? '🚬' : tx.category === 'comida' ? '🍲' : '💰'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{tx.categoryName}</p>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1">
                    <span>{tx.date}</span> • <span>{tx.time}</span>
                    {tx.location && (
                      <span className="text-emerald-400 flex items-center gap-0.5">
                        <MapPin className="w-2.5 h-2.5" /> GPS
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <span
                  className={`text-xs sm:text-sm font-extrabold font-mono ${
                    tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {tx.type === 'income' ? '+' : '-'}
                  {currency} {tx.amount.toFixed(2)}
                </span>
              </div>
            </div>
          )))}
        </div>
      </div>
    </div>
  );
};
