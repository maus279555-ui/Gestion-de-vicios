import React, { useState } from 'react';
import {
  PiggyBank,
  TrendingUp,
  TrendingDown,
  Calendar,
  Flame,
  Award,
  Download,
  Upload,
  RefreshCw,
  Fuel,
  TreePine,
  Leaf,
  Target,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import { Transaction } from '../types/finance';
import { CATEGORIES } from '../data/categories';
import { exportToCSV, getLocalDateString } from '../services/storage';
import { triggerHaptic } from '../services/geolocation';
import { sound } from '../services/sound';

interface HistorySavingsViewProps {
  transactions: Transaction[];
  currency: string;
  onRestoreTransactions: (txs: Transaction[]) => void;
  onClearAll: () => void;
}

export const HistorySavingsView: React.FC<HistorySavingsViewProps> = ({
  transactions,
  currency,
  onRestoreTransactions,
  onClearAll,
}) => {
  const [targetDaily, setTargetDaily] = useState<number>(200);
  const [editingTarget, setEditingTarget] = useState<boolean>(false);

  // Group transactions by date
  const dateMap: Record<string, { income: number; expense: number; net: number }> = {};

  let totalIncomeAll = 0;
  let totalExpenseAll = 0;
  let totalGasolina = 0;
  let totalLeña = 0;
  let totalBolo = 0;
  let totalCigarro = 0;
  let totalAlcohol = 0;
  let totalComida = 0;

  for (const t of transactions) {
    if (!dateMap[t.date]) {
      dateMap[t.date] = { income: 0, expense: 0, net: 0 };
    }

    if (t.type === 'income') {
      totalIncomeAll += t.amount;
      dateMap[t.date].income += t.amount;
      dateMap[t.date].net += t.amount;
      if (t.category === 'gasolina') totalGasolina += t.amount;
      if (t.category === 'leña') totalLeña += t.amount;
    } else {
      totalExpenseAll += t.amount;
      dateMap[t.date].expense += t.amount;
      dateMap[t.date].net -= t.amount;
      if (t.category === 'bolo') totalBolo += t.amount;
      if (t.category === 'cigarro') totalCigarro += t.amount;
      if (['trago', 'cerveza'].includes(t.category)) totalAlcohol += t.amount;
      if (t.category === 'comida') totalComida += t.amount;
    }
  }

  const totalSavingsAll = totalIncomeAll - totalExpenseAll;
  const globalSavingsRate =
    totalIncomeAll > 0 ? Math.round((totalSavingsAll / totalIncomeAll) * 100) : 0;

  // Last 7 days chart data
  const today = new Date();
  const last7Days: { dateStr: string; label: string; net: number; income: number; expense: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 24 * 3600 * 1000);
    const dateStr = getLocalDateString(d);
    const label = d.toLocaleDateString('es-BO', { weekday: 'narrow', day: 'numeric' });
    const dayData = dateMap[dateStr] || { income: 0, expense: 0, net: 0 };
    last7Days.push({
      dateStr,
      label,
      net: dayData.net,
      income: dayData.income,
      expense: dayData.expense,
    });
  }

  const maxAbsNet = Math.max(...last7Days.map((d) => Math.abs(d.net)), 100);

  // JSON backup export & import
  const handleExportJSON = () => {
    triggerHaptic('success');
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(transactions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `copia_seguridad_control_diario_${getLocalDateString()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onRestoreTransactions(parsed);
          triggerHaptic('success');
          sound.playCashRegister();
          alert(`¡Copia restaurada con éxito! Se cargaron ${parsed.length} movimientos.`);
        } else {
          alert('El archivo no contiene un formato de transacciones válido.');
        }
      } catch (err) {
        alert('Error al leer el archivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="w-full max-w-lg mx-auto pb-10 px-3 sm:px-4">
      {/* Big Savings Hero Card */}
      <div className="bg-gradient-to-br from-slate-900 via-emerald-950/40 to-slate-950 border border-emerald-500/40 rounded-3xl p-5 mb-4 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex items-center justify-between text-xs text-emerald-400 mb-2">
          <span className="font-extrabold flex items-center gap-1.5 uppercase tracking-wider">
            <PiggyBank className="w-4 h-4 text-emerald-400" /> Ahorros Totales Acumulados
          </span>
          <span className="bg-emerald-500/20 text-emerald-300 font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/30">
            {globalSavingsRate}% Retenido
          </span>
        </div>

        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
            {currency} {totalSavingsAll.toFixed(2)}
          </span>
        </div>

        {/* Global Income vs Expense bar */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/80 text-xs">
          <div>
            <span className="text-slate-400 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Total Ventas:
            </span>
            <p className="text-base font-extrabold font-mono text-emerald-300 mt-0.5">
              +{currency} {totalIncomeAll.toFixed(2)}
            </p>
          </div>
          <div>
            <span className="text-slate-400 flex items-center gap-1 font-medium">
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" /> Total Gastado:
            </span>
            <p className="text-base font-extrabold font-mono text-rose-300 mt-0.5">
              -{currency} {totalExpenseAll.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Main Income Sources: Gasolina vs Leña */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4 shadow-md">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
          <Fuel className="w-4 h-4 text-amber-400" /> Ingresos Principales Acumulados
        </h4>

        <div className="grid grid-cols-2 gap-3">
          {/* Gasolina */}
          <div className="bg-slate-950/70 border border-amber-500/30 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Fuel className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-amber-300">Gasolina</span>
            </div>
            <p className="text-lg font-black font-mono text-white">
              {currency} {totalGasolina.toFixed(2)}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {totalIncomeAll > 0 ? `${Math.round((totalGasolina / totalIncomeAll) * 100)}% de ventas` : '0%'}
            </p>
          </div>

          {/* Leña */}
          <div className="bg-slate-950/70 border border-emerald-500/30 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <TreePine className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-emerald-300">Leña</span>
            </div>
            <p className="text-lg font-black font-mono text-white">
              {currency} {totalLeña.toFixed(2)}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {totalIncomeAll > 0 ? `${Math.round((totalLeña / totalIncomeAll) * 100)}% de ventas` : '0%'}
            </p>
          </div>
        </div>
      </div>

      {/* Expenses Habit Audit: Bolo, Cigarro, Alcohol, Comida */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4 shadow-md">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
          <Leaf className="w-4 h-4 text-lime-400" /> Control de Gastos Personales y Vicios
        </h4>

        <div className="space-y-2.5 text-xs">
          {/* Bolo */}
          <div>
            <div className="flex justify-between font-medium mb-1">
              <span className="text-slate-300 flex items-center gap-1">
                <span>🍃</span> Bolo / Coca:
              </span>
              <span className="font-mono font-bold text-lime-400">
                {currency} {totalBolo.toFixed(2)}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
              <div
                className="h-full bg-lime-500 rounded-full"
                style={{
                  width: `${totalExpenseAll > 0 ? (totalBolo / totalExpenseAll) * 100 : 0}%`,
                }}
              ></div>
            </div>
          </div>

          {/* Cigarro */}
          <div>
            <div className="flex justify-between font-medium mb-1">
              <span className="text-slate-300 flex items-center gap-1">
                <span>🚬</span> Cigarro:
              </span>
              <span className="font-mono font-bold text-stone-300">
                {currency} {totalCigarro.toFixed(2)}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
              <div
                className="h-full bg-stone-400 rounded-full"
                style={{
                  width: `${totalExpenseAll > 0 ? (totalCigarro / totalExpenseAll) * 100 : 0}%`,
                }}
              ></div>
            </div>
          </div>

          {/* Trago y Cerveza */}
          <div>
            <div className="flex justify-between font-medium mb-1">
              <span className="text-slate-300 flex items-center gap-1">
                <span>🍻</span> Trago y Cerveza:
              </span>
              <span className="font-mono font-bold text-rose-400">
                {currency} {totalAlcohol.toFixed(2)}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-500 rounded-full"
                style={{
                  width: `${totalExpenseAll > 0 ? (totalAlcohol / totalExpenseAll) * 100 : 0}%`,
                }}
              ></div>
            </div>
          </div>

          {/* Comida */}
          <div>
            <div className="flex justify-between font-medium mb-1">
              <span className="text-slate-300 flex items-center gap-1">
                <span>🍲</span> Comida y Almuerzo:
              </span>
              <span className="font-mono font-bold text-orange-400">
                {currency} {totalComida.toFixed(2)}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 rounded-full"
                style={{
                  width: `${totalExpenseAll > 0 ? (totalComida / totalExpenseAll) * 100 : 0}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* 7-Day Savings Trend Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4 shadow-md">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center justify-between">
          <span>Ahorro Diario (Últimos 7 Días)</span>
          <span className="text-[10px] text-slate-400">Ganancia neta</span>
        </h4>

        <div className="flex items-end justify-between h-32 gap-1.5 pt-4 pb-2 border-b border-slate-800">
          {last7Days.map((d) => {
            const heightPercent = Math.max((Math.abs(d.net) / maxAbsNet) * 100, 10);
            const isPositive = d.net >= 0;

            return (
              <div key={d.dateStr} className="flex-1 flex flex-col items-center h-full justify-end group">
                <span className="text-[9px] font-mono font-bold text-slate-400 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {d.net.toFixed(0)}
                </span>
                <div
                  className={`w-full max-w-[28px] rounded-t-md transition-all ${
                    isPositive
                      ? 'bg-gradient-to-t from-emerald-600 to-teal-400'
                      : 'bg-gradient-to-t from-rose-600 to-amber-600'
                  }`}
                  style={{ height: `${heightPercent}%` }}
                ></div>
                <span className="text-[10px] text-slate-400 mt-2 font-medium capitalize">
                  {d.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Backup and Data Safety */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
          Copia de Seguridad y Datos
        </h4>
        <p className="text-xs text-slate-400 mb-3">
          Tus datos se guardan automáticamente en este dispositivo. Puedes descargar una copia de
          seguridad o transferirla a otro teléfono.
        </p>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            onClick={handleExportJSON}
            className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition-all"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Descargar Copia</span>
          </button>

          <label className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer">
            <Upload className="w-4 h-4 text-cyan-400" />
            <span>Restaurar Copia</span>
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>
        </div>

        <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-400">Total movimientos: {transactions.length}</span>
          <button
            onClick={() => {
              if (
                confirm(
                  '¿Estás seguro de que deseas borrar TODOS los registros? Esta acción no se puede deshacer.'
                )
              ) {
                onClearAll();
              }
            }}
            className="text-rose-400 hover:text-rose-300 font-semibold"
          >
            Reiniciar Todo
          </button>
        </div>
      </div>
    </div>
  );
};
