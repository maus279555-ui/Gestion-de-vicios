import React, { useState, useMemo } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  AlertTriangle,
  Printer,
  FileSpreadsheet,
  Clock,
  MapPin,
  Edit2,
  Info,
  CalendarDays,
  CalendarRange,
  Search,
  Filter,
} from 'lucide-react';
import { GeoLocationInfo, Transaction } from '../types/finance';
import { CATEGORIES } from '../data/categories';
import { CategoryIcon } from './CategoryIcon';
import { exportToCSV, getLocalDateString } from '../services/storage';
import { triggerHaptic } from '../services/geolocation';
import { LocationModal } from './LocationModal';
import { TransactionEditModal } from './TransactionEditModal';

export type ReportPeriodType = 'day' | 'week' | 'month' | 'range';

interface ReportViewProps {
  transactions: Transaction[];
  currency: string;
  onUpdateTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export const ReportView: React.FC<ReportViewProps> = ({
  transactions,
  currency,
  onUpdateTransaction,
  onDeleteTransaction,
}) => {
  const todayStr = getLocalDateString();
  const [periodType, setPeriodType] = useState<ReportPeriodType>('day');
  const [selectedDay, setSelectedDay] = useState<string>(todayStr);

  // Month state (YYYY-MM)
  const currentMonthStr = todayStr.substring(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);

  // Week offset (0 = current week, -1 = last week, etc.)
  const [weekOffset, setWeekOffset] = useState<number>(0);

  // Custom range state
  const [startDate, setStartDate] = useState<string>(
    getLocalDateString(new Date(Date.now() - 7 * 24 * 3600 * 1000))
  );
  const [endDate, setEndDate] = useState<string>(todayStr);

  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<{
    location: GeoLocationInfo;
    title: string;
  } | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // Helper to compute week range from offset
  const weekRange = useMemo(() => {
    const now = new Date();
    // Monday as start of week
    const currentDay = now.getDay();
    const distanceToMonday = (currentDay + 6) % 7;
    const monday = new Date(now.getTime() - (distanceToMonday - weekOffset * 7) * 24 * 3600 * 1000);
    const sunday = new Date(monday.getTime() + 6 * 24 * 3600 * 1000);

    return {
      startStr: getLocalDateString(monday),
      endStr: getLocalDateString(sunday),
      startLabel: monday.toLocaleDateString('es-BO', { day: 'numeric', month: 'short' }),
      endLabel: sunday.toLocaleDateString('es-BO', { day: 'numeric', month: 'short', year: 'numeric' }),
    };
  }, [weekOffset]);

  // Compute title for the active period
  const periodTitle = useMemo(() => {
    if (periodType === 'day') {
      const [y, m, d] = selectedDay.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString('es-BO', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }

    if (periodType === 'week') {
      return weekOffset === 0
        ? `Esta Semana (${weekRange.startLabel} al ${weekRange.endLabel})`
        : `Semana: ${weekRange.startLabel} al ${weekRange.endLabel}`;
    }

    if (periodType === 'month') {
      const [y, m] = selectedMonth.split('-').map(Number);
      const dateObj = new Date(y, m - 1, 1);
      return dateObj.toLocaleDateString('es-BO', { month: 'long', year: 'numeric' });
    }

    return `Del ${startDate} al ${endDate}`;
  }, [periodType, selectedDay, periodType, weekOffset, weekRange, selectedMonth, startDate, endDate]);

  // Filter transactions according to selected period
  const periodTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (periodType === 'day') {
        return t.date === selectedDay;
      }
      if (periodType === 'week') {
        return t.date >= weekRange.startStr && t.date <= weekRange.endStr;
      }
      if (periodType === 'month') {
        return t.date.startsWith(selectedMonth);
      }
      if (periodType === 'range') {
        return t.date >= startDate && t.date <= endDate;
      }
      return true;
    });
  }, [transactions, periodType, selectedDay, weekRange, selectedMonth, startDate, endDate]);

  // Period summary metrics
  const summary = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    let gasolinaIncome = 0;
    let leñaIncome = 0;
    let otherIncome = 0;
    let vicesExpense = 0;
    let foodExpense = 0;
    let otherExpense = 0;

    const categoryTotals: Record<string, { amount: number; count: number }> = {};

    for (const t of periodTransactions) {
      if (!categoryTotals[t.category]) {
        categoryTotals[t.category] = { amount: 0, count: 0 };
      }
      categoryTotals[t.category].amount += t.amount;
      categoryTotals[t.category].count += 1;

      if (t.type === 'income') {
        totalIncome += t.amount;
        if (t.category === 'gasolina') gasolinaIncome += t.amount;
        else if (t.category === 'leña') leñaIncome += t.amount;
        else otherIncome += t.amount;
      } else {
        totalExpense += t.amount;
        if (['bolo', 'cigarro', 'trago', 'cerveza'].includes(t.category)) {
          vicesExpense += t.amount;
        }
        if (t.category === 'comida') foodExpense += t.amount;
        if (t.category === 'otro_gasto') otherExpense += t.amount;
      }
    }

    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;
    const vicesRate = totalIncome > 0 ? Math.round((vicesExpense / totalIncome) * 100) : 0;

    return {
      totalIncome,
      totalExpense,
      netSavings,
      savingsRate,
      gasolinaIncome,
      leñaIncome,
      otherIncome,
      vicesExpense,
      vicesRate,
      foodExpense,
      otherExpense,
      categoryTotals,
      totalCount: periodTransactions.length,
    };
  }, [periodTransactions]);

  // Filtered by text search & type
  const displayedTransactions = useMemo(() => {
    return periodTransactions
      .filter((t) => {
        if (filterType !== 'all' && t.type !== filterType) return false;
        if (searchTerm.trim()) {
          const s = searchTerm.toLowerCase();
          const matchCat = t.categoryName.toLowerCase().includes(s);
          const matchNote = t.note?.toLowerCase().includes(s);
          const matchAmount = t.amount.toString().includes(s);
          if (!matchCat && !matchNote && !matchAmount) return false;
        }
        return true;
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [periodTransactions, filterType, searchTerm]);

  // Day step helpers
  const handleDayStep = (delta: number) => {
    triggerHaptic('light');
    const [y, m, d] = selectedDay.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + delta);
    setSelectedDay(getLocalDateString(dateObj));
  };

  return (
    <div className="w-full max-w-lg mx-auto pb-12 px-3 sm:px-4">
      {/* Period Type Selector Tabs */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-slate-900 border border-slate-800 rounded-2xl mb-3 shadow-inner text-xs">
        <button
          onClick={() => {
            triggerHaptic('light');
            setPeriodType('day');
          }}
          className={`py-2 px-1 rounded-xl font-bold flex items-center justify-center gap-1 transition-all ${
            periodType === 'day'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Día</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic('light');
            setPeriodType('week');
          }}
          className={`py-2 px-1 rounded-xl font-bold flex items-center justify-center gap-1 transition-all ${
            periodType === 'week'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          <span>Semana</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic('light');
            setPeriodType('month');
          }}
          className={`py-2 px-1 rounded-xl font-bold flex items-center justify-center gap-1 transition-all ${
            periodType === 'month'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <CalendarRange className="w-3.5 h-3.5" />
          <span>Mes</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic('light');
            setPeriodType('range');
          }}
          className={`py-2 px-1 rounded-xl font-bold flex items-center justify-center gap-1 transition-all ${
            periodType === 'range'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>Rango</span>
        </button>
      </div>

      {/* Period Controls Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 mb-3 shadow-md">
        {periodType === 'day' && (
          <div className="flex items-center justify-between">
            <button
              onClick={() => handleDayStep(-1)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300"
              title="Día anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="text-center flex-1 mx-2">
              <input
                type="date"
                value={selectedDay}
                onChange={(e) => setSelectedDay(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-300 cursor-pointer focus:outline-none"
              />
              <p className="text-xs sm:text-sm font-extrabold text-white capitalize mt-0.5 truncate">
                {periodTitle}
              </p>
            </div>

            <div className="flex items-center gap-1">
              {selectedDay !== todayStr && (
                <button
                  onClick={() => setSelectedDay(todayStr)}
                  className="text-[11px] font-bold px-2 py-1.5 bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 rounded-xl"
                >
                  Hoy
                </button>
              )}
              <button
                onClick={() => handleDayStep(1)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300"
                title="Día siguiente"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {periodType === 'week' && (
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                triggerHaptic('light');
                setWeekOffset((w) => w - 1);
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300"
              title="Semana anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="text-center flex-1 mx-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Reporte Semanal
              </span>
              <p className="text-xs sm:text-sm font-extrabold text-white mt-0.5">{periodTitle}</p>
            </div>

            <div className="flex items-center gap-1">
              {weekOffset !== 0 && (
                <button
                  onClick={() => setWeekOffset(0)}
                  className="text-[11px] font-bold px-2 py-1.5 bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 rounded-xl"
                >
                  Actual
                </button>
              )}
              <button
                onClick={() => {
                  triggerHaptic('light');
                  setWeekOffset((w) => w + 1);
                }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300"
                title="Semana siguiente"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {periodType === 'month' && (
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Seleccionar Mes del Reporte
              </span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white font-bold text-xs rounded-xl px-3 py-2"
              />
            </div>
            <div className="text-right pt-4">
              <span className="text-xs font-black text-emerald-400 uppercase">{periodTitle}</span>
            </div>
          </div>
        )}

        {periodType === 'range' && (
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Rango de Fechas Personalizado
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block">Desde:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs font-bold rounded-xl px-2 py-1.5"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block">Hasta:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs font-bold rounded-xl px-2 py-1.5"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* KPI Cards for the selected period */}
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        {/* Total Ingresos */}
        <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/30 rounded-2xl p-3 shadow-lg">
          <div className="flex items-center justify-between text-xs text-emerald-400 mb-1">
            <span className="font-bold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Ingresos
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20">
              Ventas
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-300 font-mono">
            {currency} {summary.totalIncome.toFixed(2)}
          </p>

          <div className="mt-2 pt-2 border-t border-emerald-500/20 space-y-0.5 text-[11px]">
            <div className="flex justify-between text-slate-300">
              <span>⛽ Gasolina:</span>
              <span className="font-mono font-bold text-amber-300">
                {currency} {summary.gasolinaIncome.toFixed(0)}
              </span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>🪵 Leña:</span>
              <span className="font-mono font-bold text-emerald-300">
                {currency} {summary.leñaIncome.toFixed(0)}
              </span>
            </div>
          </div>
        </div>

        {/* Total Gastos */}
        <div className="bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-950 border border-rose-500/30 rounded-2xl p-3 shadow-lg">
          <div className="flex items-center justify-between text-xs text-rose-400 mb-1">
            <span className="font-bold flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" /> Gastos
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-500/20">
              Salidas
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-rose-300 font-mono">
            {currency} {summary.totalExpense.toFixed(2)}
          </p>

          <div className="mt-2 pt-2 border-t border-rose-500/20 space-y-0.5 text-[11px]">
            <div className="flex justify-between text-slate-300">
              <span>🍃 Vicios:</span>
              <span className="font-mono font-bold text-rose-300">
                {currency} {summary.vicesExpense.toFixed(0)}
              </span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>🍲 Comida:</span>
              <span className="font-mono font-bold text-orange-300">
                {currency} {summary.foodExpense.toFixed(0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Net Balance & Margin */}
      <div
        className={`rounded-2xl p-3.5 mb-3 border shadow-xl flex items-center justify-between ${
          summary.netSavings >= 0
            ? 'bg-gradient-to-r from-emerald-950/60 to-slate-900 border-emerald-500/40'
            : 'bg-gradient-to-r from-rose-950/60 to-slate-900 border-rose-500/40'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 ${
              summary.netSavings >= 0
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}
          >
            <PiggyBank className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Ganancia Neta del Periodo
            </span>
            <p
              className={`text-2xl font-black font-mono tracking-tight ${
                summary.netSavings >= 0 ? 'text-emerald-300' : 'text-rose-300'
              }`}
            >
              {summary.netSavings >= 0 ? '+' : ''}
              {currency} {summary.netSavings.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span
            className={`text-xs font-black px-2 py-0.5 rounded-full ${
              summary.netSavings >= 0
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            }`}
          >
            {summary.savingsRate}% Retenido
          </span>
          <p className="text-[10px] text-slate-400 mt-1">
            {summary.totalCount} movimientos
          </p>
        </div>
      </div>

      {/* Vices Audit in Period */}
      {summary.vicesExpense > 0 && summary.totalIncome > 0 && (
        <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-3 mb-3 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold text-amber-300 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Gasto en Vicios en este periodo:
            </span>
            <span className="font-mono font-bold text-amber-200">
              {currency} {summary.vicesExpense.toFixed(2)} ({summary.vicesRate}%)
            </span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                summary.vicesRate > 30 ? 'bg-rose-500' : summary.vicesRate > 15 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(summary.vicesRate, 100)}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Category Breakdown for Period */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3 mb-3">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
          Desglose de Categorías en el Periodo
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(CATEGORIES).map(([catId, config]) => {
            const data = summary.categoryTotals[catId];
            if (!data || data.amount === 0) return null;
            return (
              <div
                key={catId}
                className="bg-slate-950/70 border border-slate-800 rounded-xl p-2 flex items-center gap-2"
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    config.type === 'income'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  <CategoryIcon id={catId} className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-slate-300 truncate">{config.name}</p>
                  <p
                    className={`text-xs font-bold font-mono ${
                      config.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {config.type === 'income' ? '+' : '-'}
                    {currency} {data.amount.toFixed(0)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="flex flex-col gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por categoría, nota o monto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-xs text-white rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <button
            onClick={() => {
              triggerHaptic('light');
              setShowPrintModal(true);
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs flex items-center gap-1 font-semibold"
            title="Ver recibo imprimible de cierre"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden xs:inline">Cierre</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('success');
              exportToCSV(periodTransactions, currency);
            }}
            className="p-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs flex items-center gap-1 font-semibold"
            title="Exportar registros del periodo a Excel / CSV"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden xs:inline">Excel</span>
          </button>
        </div>

        {/* Filter chips: Todos / Ingresos / Gastos */}
        <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-xl border border-slate-800 text-xs self-start">
          <button
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              filterType === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos ({periodTransactions.length})
          </button>
          <button
            onClick={() => setFilterType('income')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              filterType === 'income' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Ingresos
          </button>
          <button
            onClick={() => setFilterType('expense')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
              filterType === 'expense' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Gastos
          </button>
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-2">
        {displayedTransactions.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 text-center">
            <Info className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-300">
              No hay movimientos en este periodo seleccionado
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Prueba cambiando la fecha, la semana o usa la pestaña &quot;Registrar&quot;.
            </p>
          </div>
        ) : (
          displayedTransactions.map((tx) => (
            <div
              key={tx.id}
              className="bg-slate-900/90 hover:bg-slate-850 border border-slate-800 rounded-2xl p-3 shadow-md flex items-center justify-between gap-2.5 transition-all"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  tx.type === 'income'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                <CategoryIcon id={tx.category} className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h5 className="font-bold text-xs sm:text-sm text-white truncate">
                    {tx.categoryName}
                  </h5>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {tx.date} • {tx.time}
                  </span>
                </div>

                {tx.note && (
                  <p className="text-[11px] text-slate-300 truncate mt-0.5 italic">
                    &quot;{tx.note}&quot;
                  </p>
                )}

                <div className="flex items-center gap-2 mt-1">
                  {tx.location ? (
                    <button
                      onClick={() =>
                        setSelectedLocation({
                          location: tx.location!,
                          title: `${tx.categoryName} (${currency} ${tx.amount.toFixed(2)})`,
                        })
                      }
                      className="text-[10px] text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-0.5 bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-800/50"
                    >
                      <MapPin className="w-2.5 h-2.5" />
                      <span>
                        {tx.location.address ||
                          `${tx.location.latitude.toFixed(3)}, ${tx.location.longitude.toFixed(3)}`}
                      </span>
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-500">Sin GPS</span>
                  )}
                  <span className="text-[10px] text-slate-400">
                    {tx.paymentMethod === 'qr_transferencia' ? '📱 QR' : '💵 Efec.'}
                  </span>
                </div>
              </div>

              <div className="text-right flex-shrink-0 flex items-center gap-2">
                <span
                  className={`text-sm sm:text-base font-extrabold font-mono ${
                    tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {tx.type === 'income' ? '+' : '-'}
                  {currency} {tx.amount.toFixed(2)}
                </span>
                <button
                  onClick={() => setEditingTransaction(tx)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
                  title="Editar registro"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Location Modal */}
      {selectedLocation && (
        <LocationModal
          location={selectedLocation.location}
          title={selectedLocation.title}
          onClose={() => setSelectedLocation(null)}
        />
      )}

      {/* Edit Modal */}
      {editingTransaction && (
        <TransactionEditModal
          transaction={editingTransaction}
          currency={currency}
          onSave={onUpdateTransaction}
          onDelete={onDeleteTransaction}
          onClose={() => setEditingTransaction(null)}
        />
      )}

      {/* Printable Receipt Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative font-mono text-xs max-h-[90vh] overflow-y-auto">
            <div className="text-center border-b pb-3 mb-3">
              <h3 className="font-extrabold text-base uppercase tracking-tight">
                GESTIÓN DE VICIOS
              </h3>
              <p className="text-[11px] text-slate-600">Comprobante de Cierre de Periodo</p>
              <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase">{periodTitle}</p>
            </div>

            <div className="space-y-1.5 border-b pb-3 mb-3">
              <div className="flex justify-between font-bold text-emerald-700">
                <span>TOTAL VENTAS / INGRESOS:</span>
                <span>
                  {currency} {summary.totalIncome.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 pl-2 text-[10px]">
                <span>- Venta Gasolina:</span>
                <span>
                  {currency} {summary.gasolinaIncome.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 pl-2 text-[10px]">
                <span>- Venta Leña:</span>
                <span>
                  {currency} {summary.leñaIncome.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between font-bold text-rose-700 pt-1.5">
                <span>TOTAL GASTOS DEL PERIODO:</span>
                <span>
                  -{currency} {summary.totalExpense.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 pl-2 text-[10px]">
                <span>- Vicios (Bolo, Cigarro, Trago):</span>
                <span>
                  {currency} {summary.vicesExpense.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 pl-2 text-[10px]">
                <span>- Comida y Almuerzo:</span>
                <span>
                  {currency} {summary.foodExpense.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="bg-slate-100 p-3 rounded-xl mb-4 border border-slate-300">
              <div className="flex justify-between items-center text-sm font-black">
                <span>GANANCIA NETA DEL PERIODO:</span>
                <span className={summary.netSavings >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                  {summary.netSavings >= 0 ? '+' : ''}
                  {currency} {summary.netSavings.toFixed(2)}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5 text-right">
                Margen retenido: {summary.savingsRate}%
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-center hover:bg-slate-800 transition-all"
              >
                Imprimir Recibo
              </button>
              <button
                onClick={() => setShowPrintModal(false)}
                className="py-2.5 px-4 bg-slate-200 text-slate-800 font-bold rounded-xl hover:bg-slate-300 transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
