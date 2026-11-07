import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  AlertTriangle,
  Download,
  Filter,
  MapPin,
  Clock,
  Edit2,
  FileSpreadsheet,
  Printer,
  Sparkles,
  Info,
  CheckCircle,
} from 'lucide-react';
import { DailySummary, GeoLocationInfo, Transaction } from '../types/finance';
import { CATEGORIES } from '../data/categories';
import { CategoryIcon } from './CategoryIcon';
import { exportToCSV, getLocalDateString } from '../services/storage';
import { triggerHaptic } from '../services/geolocation';
import { sound } from '../services/sound';
import { LocationModal } from './LocationModal';
import { TransactionEditModal } from './TransactionEditModal';

interface DailyReportViewProps {
  transactions: Transaction[];
  selectedDate: string;
  onSelectDate: (d: string) => void;
  currency: string;
  summary: DailySummary;
  onUpdateTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export const DailyReportView: React.FC<DailyReportViewProps> = ({
  transactions,
  selectedDate,
  onSelectDate,
  currency,
  summary,
  onUpdateTransaction,
  onDeleteTransaction,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedLocation, setSelectedLocation] = useState<{
    location: GeoLocationInfo;
    title: string;
  } | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Day navigation helpers
  const handlePrevDay = () => {
    triggerHaptic('light');
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() - 1);
    onSelectDate(getLocalDateString(date));
  };

  const handleNextDay = () => {
    triggerHaptic('light');
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + 1);
    onSelectDate(getLocalDateString(date));
  };

  const handleGoToday = () => {
    triggerHaptic('light');
    onSelectDate(getLocalDateString());
  };

  const todayStr = getLocalDateString();
  const isToday = selectedDate === todayStr;

  // Format date readable
  const [year, month, day] = selectedDate.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const formattedDateTitle = dateObj.toLocaleDateString('es-BO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Filter transactions of this day
  const dayTransactions = transactions
    .filter((t) => t.date === selectedDate)
    .sort((a, b) => b.timestamp - a.timestamp);

  const filteredTransactions = dayTransactions.filter((t) => {
    if (filterType === 'all') return true;
    return t.type === filterType;
  });

  // Compute metrics
  const savingsRate =
    summary.totalIncome > 0
      ? Math.round(((summary.totalIncome - summary.totalExpense) / summary.totalIncome) * 100)
      : summary.totalExpense > 0
      ? -100
      : 0;

  const vicesRate =
    summary.totalIncome > 0
      ? Math.round((summary.vicesExpense / summary.totalIncome) * 100)
      : 0;

  // Category sum mapping for this day
  const categoryTotals: Record<string, { amount: number; count: number }> = {};
  for (const t of dayTransactions) {
    if (!categoryTotals[t.category]) {
      categoryTotals[t.category] = { amount: 0, count: 0 };
    }
    categoryTotals[t.category].amount += t.amount;
    categoryTotals[t.category].count += 1;
  }

  return (
    <div className="w-full max-w-lg mx-auto pb-8 px-3 sm:px-4">
      {/* Date Header & Navigator */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 mb-3 shadow-md flex items-center justify-between">
        <button
          onClick={handlePrevDay}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white transition-all"
          title="Día anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center flex-1 mx-2">
          <div className="flex items-center justify-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onSelectDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-300 cursor-pointer focus:outline-none"
            />
            {isToday && (
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Hoy
              </span>
            )}
          </div>
          <h2 className="text-xs sm:text-sm font-extrabold text-white capitalize truncate mt-0.5">
            {formattedDateTitle}
          </h2>
        </div>

        <div className="flex items-center gap-1">
          {!isToday && (
            <button
              onClick={handleGoToday}
              className="text-[11px] font-bold px-2 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl"
              title="Volver a hoy"
            >
              Hoy
            </button>
          )}
          <button
            onClick={handleNextDay}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white transition-all"
            title="Día siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main KPI Triple Cards */}
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        {/* Total Ingresos */}
        <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/30 rounded-2xl p-3 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-emerald-400 mb-1">
            <span className="font-bold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Ingresos
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 font-bold">
              {summary.incomeCount} ventas
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-emerald-300 font-mono">
            {currency} {summary.totalIncome.toFixed(2)}
          </p>

          {/* Quick breakdown preview */}
          <div className="mt-2 pt-2 border-t border-emerald-500/20 space-y-0.5 text-[11px]">
            <div className="flex justify-between text-slate-300">
              <span className="flex items-center gap-1">
                <span>⛽</span> Gasolina:
              </span>
              <span className="font-mono font-bold text-amber-300">
                {currency} {summary.gasolinaIncome.toFixed(0)}
              </span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="flex items-center gap-1">
                <span>🪵</span> Leña:
              </span>
              <span className="font-mono font-bold text-emerald-300">
                {currency} {summary.leñaIncome.toFixed(0)}
              </span>
            </div>
            {summary.otherIncome > 0 && (
              <div className="flex justify-between text-slate-400 text-[10px]">
                <span>Otros:</span>
                <span className="font-mono font-semibold">
                  {currency} {summary.otherIncome.toFixed(0)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Total Gastos */}
        <div className="bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-950 border border-rose-500/30 rounded-2xl p-3 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-rose-400 mb-1">
            <span className="font-bold flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" /> Gastos
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/20 font-bold">
              {summary.expenseCount} reg.
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-rose-300 font-mono">
            {currency} {summary.totalExpense.toFixed(2)}
          </p>

          {/* Quick breakdown preview */}
          <div className="mt-2 pt-2 border-t border-rose-500/20 space-y-0.5 text-[11px]">
            <div className="flex justify-between text-slate-300">
              <span className="flex items-center gap-1">
                <span>🍃</span> Bolo/Vicios:
              </span>
              <span className="font-mono font-bold text-rose-300">
                {currency} {summary.vicesExpense.toFixed(0)}
              </span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="flex items-center gap-1">
                <span>🍲</span> Comida:
              </span>
              <span className="font-mono font-bold text-orange-300">
                {currency} {summary.foodExpense.toFixed(0)}
              </span>
            </div>
            {summary.otherExpense > 0 && (
              <div className="flex justify-between text-slate-400 text-[10px]">
                <span>Otros:</span>
                <span className="font-mono font-semibold">
                  {currency} {summary.otherExpense.toFixed(0)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Net Balance & Savings Card */}
      <div
        className={`rounded-2xl p-3.5 mb-3 border shadow-xl flex items-center justify-between ${
          summary.netSavings >= 0
            ? 'bg-gradient-to-r from-emerald-950/60 to-slate-900 border-emerald-500/40'
            : 'bg-gradient-to-r from-rose-950/60 to-slate-900 border-rose-500/40'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 ${
              summary.netSavings >= 0
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}
          >
            <PiggyBank className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Ahorro Neto del Día
            </span>
            <div className="flex items-baseline gap-2">
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
        </div>

        <div className="text-right">
          <span
            className={`inline-block text-xs font-extrabold px-2 py-0.5 rounded-full ${
              summary.netSavings >= 0
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            }`}
          >
            {savingsRate}% Retenido
          </span>
          <p className="text-[10px] text-slate-400 mt-1">
            {summary.netSavings >= 0 ? 'Ganancia libre' : 'Déficit diario'}
          </p>
        </div>
      </div>

      {/* Expense Control Indicator: Bolo/Cigarro/Alcohol vs Ventas */}
      {summary.vicesExpense > 0 && summary.totalIncome > 0 && (
        <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-3 mb-3 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold text-amber-300 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Gasto en Vicios (Bolo, Cigarro, Bebidas):
            </span>
            <span className="font-mono font-bold text-amber-200">
              {currency} {summary.vicesExpense.toFixed(2)} ({vicesRate}% de las ventas)
            </span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                vicesRate > 30 ? 'bg-rose-500' : vicesRate > 15 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(vicesRate, 100)}%` }}
            ></div>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            {vicesRate > 25
              ? '⚠️ Cuidado: Los consumos personales se están llevando más del 25% de los ingresos de hoy.'
              : '👍 Buen control: Mantienes tus gastos personales en un nivel saludable respecto a las ventas.'}
          </p>
        </div>
      )}

      {/* Category Breakdown Chips */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3 mb-3">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
          Desglose por Categoría Hoy
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(CATEGORIES).map(([catId, config]) => {
            const data = categoryTotals[catId];
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
                  <p className="text-[11px] font-semibold text-slate-300 truncate">
                    {config.name}
                  </p>
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

      {/* Transactions List Toolbar: Filter & Export */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-2 py-1 rounded-lg font-bold transition-all ${
              filterType === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos ({dayTransactions.length})
          </button>
          <button
            onClick={() => setFilterType('income')}
            className={`px-2 py-1 rounded-lg font-bold transition-all ${
              filterType === 'income'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Ingresos
          </button>
          <button
            onClick={() => setFilterType('expense')}
            className={`px-2 py-1 rounded-lg font-bold transition-all ${
              filterType === 'expense' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Gastos
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              triggerHaptic('light');
              setShowPrintModal(true);
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs flex items-center gap-1 font-semibold"
            title="Ver recibo de cierre de caja"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Cierre</span>
          </button>
          <button
            onClick={() => {
              triggerHaptic('success');
              exportToCSV(dayTransactions, currency);
            }}
            className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs flex items-center gap-1 font-semibold"
            title="Exportar a archivo Excel / CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Excel</span>
          </button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-2">
        {filteredTransactions.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 text-center">
            <Info className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-300">
              No hay movimientos registrados para este día
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Usa la pestaña &quot;Registrar Rápido&quot; para añadir ventas o gastos.
            </p>
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const cat = CATEGORIES[tx.category] || {
              name: tx.categoryName,
              type: tx.type,
              color: 'text-slate-300',
              bgLight: 'bg-slate-800',
            };

            return (
              <div
                key={tx.id}
                className="bg-slate-900/90 hover:bg-slate-850 border border-slate-800/90 rounded-2xl p-3 shadow-md flex items-center justify-between gap-2.5 transition-all"
              >
                {/* Category Icon */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    tx.type === 'income'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  <CategoryIcon id={tx.category} className="w-5 h-5" />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h5 className="font-bold text-xs sm:text-sm text-white truncate">
                      {tx.categoryName}
                    </h5>
                    <span className="text-[10px] font-mono text-slate-400 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {tx.time}
                    </span>
                  </div>

                  {/* Note / Comment */}
                  {tx.note && (
                    <p className="text-[11px] text-slate-300 truncate mt-0.5 italic">
                      &quot;{tx.note}&quot;
                    </p>
                  )}

                  {/* Location badge & payment */}
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
                        title="Ver mapa y coordenadas"
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

                {/* Amount & Actions */}
                <div className="text-right flex-shrink-0 flex items-center gap-2">
                  <div>
                    <span
                      className={`text-sm sm:text-base font-extrabold font-mono block ${
                        tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {currency} {tx.amount.toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={() => setEditingTransaction(tx)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
                    title="Editar registro"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
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

      {/* Daily Cash Close Receipt Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative font-mono text-xs">
            <div className="text-center border-b pb-3 mb-3">
              <h3 className="font-extrabold text-base uppercase tracking-tight">
                COMPROBANTE DE CIERRE DIARIO
              </h3>
              <p className="text-[11px] text-slate-600">Control Financiero Móvil</p>
              <p className="text-[10px] text-slate-500 mt-1">{formattedDateTitle}</p>
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
              {summary.otherIncome > 0 && (
                <div className="flex justify-between text-slate-600 pl-2 text-[10px]">
                  <span>- Otros Ingresos:</span>
                  <span>
                    {currency} {summary.otherIncome.toFixed(2)}
                  </span>
                </div>
              )}

              <div className="flex justify-between font-bold text-rose-700 pt-1.5">
                <span>TOTAL GASTOS DEL DÍA:</span>
                <span>
                  -{currency} {summary.totalExpense.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 pl-2 text-[10px]">
                <span>- Vicios (Bolo, Cigarro, Bebidas):</span>
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

            {/* Final Cash / Savings */}
            <div className="bg-slate-100 p-3 rounded-xl mb-4 border border-slate-300">
              <div className="flex justify-between items-center text-sm font-black">
                <span>AHORRO / GANANCIA NETA:</span>
                <span
                  className={summary.netSavings >= 0 ? 'text-emerald-700' : 'text-rose-700'}
                >
                  {summary.netSavings >= 0 ? '+' : ''}
                  {currency} {summary.netSavings.toFixed(2)}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5 text-right">
                Margen retenido: {savingsRate}%
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
