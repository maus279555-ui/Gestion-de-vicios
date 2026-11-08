import React, { useState } from 'react';
import {
  Fuel,
  TreePine,
  PlusCircle,
  Leaf,
  Cigarette,
  Wine,
  Beer,
  Fish,
  UtensilsCrossed,
  ShoppingBag,
  Delete,
  CheckCircle2,
  FileText,
  MapPin,
  Clock,
  Sparkles,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CategoryId, GeoLocationInfo, Transaction, TransactionType } from '../types/finance';
import { CATEGORIES } from '../data/categories';
import { sound } from '../services/sound';
import { triggerHaptic } from '../services/geolocation';
import { getLocalDateString, getLocalTimeString } from '../services/storage';

interface QuickEntryPadProps {
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'timestamp'>) => void;
  currency: string;
  currentLocation: GeoLocationInfo | null;
  defaultType?: TransactionType;
}

export const QuickEntryPad: React.FC<QuickEntryPadProps> = ({
  onAddTransaction,
  currency,
  currentLocation,
  defaultType = 'income',
}) => {
  const [activeType, setActiveType] = useState<TransactionType>(defaultType);

  React.useEffect(() => {
    if (defaultType) setActiveType(defaultType);
  }, [defaultType]);
  const [amountStr, setAmountStr] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [showNoteInput, setShowNoteInput] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'qr_transferencia'>('efectivo');
  const [lastRegistered, setLastRegistered] = useState<{
    category: string;
    amount: number;
    type: TransactionType;
  } | null>(null);

  // Numeric pad handler
  const handleDigit = (digit: string) => {
    triggerHaptic('light');
    sound.playClick();

    if (digit === '.') {
      if (amountStr.includes('.')) return;
      if (amountStr === '') {
        setAmountStr('0.');
        return;
      }
    }

    // Limit length to avoid overflow
    if (amountStr.replace('.', '').length >= 7) return;

    // Prevent leading double zeros
    if (amountStr === '0' && digit !== '.') {
      setAmountStr(digit);
      return;
    }

    setAmountStr((prev) => prev + digit);
  };

  const handleBackspace = () => {
    triggerHaptic('light');
    sound.playClick();
    setAmountStr((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    triggerHaptic('light');
    sound.playClick();
    setAmountStr('');
    setNote('');
  };

  // Instant 1-tap category submit
  const handleSelectCategory = (categoryId: CategoryId) => {
    const numericAmount = parseFloat(amountStr);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      triggerHaptic('warning');
      alert('Ingresa primero el monto (ej. 20, 50, 100) y luego toca la categoría');
      return;
    }

    const catConfig = CATEGORIES[categoryId];
    const now = new Date();
    const dateStr = getLocalDateString(now);
    const timeStr = getLocalTimeString(now);

    const newTx: Omit<Transaction, 'id' | 'timestamp'> = {
      type: catConfig.type,
      category: categoryId,
      categoryName: catConfig.name,
      amount: numericAmount,
      note: note.trim() || undefined,
      date: dateStr,
      time: timeStr,
      location: currentLocation ? { ...currentLocation } : null,
      paymentMethod,
    };

    onAddTransaction(newTx);

    // Feedback
    if (catConfig.type === 'income') {
      sound.playCashRegister();
      triggerHaptic('success');
      try {
        confetti({
          particleCount: 25,
          spread: 45,
          origin: { y: 0.8 },
          colors: ['#10b981', '#34d399', '#f59e0b'],
        });
      } catch {
        // Confetti fallback
      }
    } else {
      sound.playExpenseTone();
      triggerHaptic('light');
    }

    setLastRegistered({
      category: catConfig.name,
      amount: numericAmount,
      type: catConfig.type,
    });

    // Reset input for next entry
    setAmountStr('');
    setNote('');
    setShowNoteInput(false);

    // Auto-clear last registered banner after 4 seconds
    setTimeout(() => {
      setLastRegistered(null);
    }, 4000);
  };

  const currentAmount = parseFloat(amountStr) || 0;

  return (
    <div className="w-full max-w-lg mx-auto pb-4 px-3 sm:px-4">
      {/* Type Toggle: Ingresos vs Gastos */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900 border border-slate-800 rounded-2xl mb-3 shadow-inner">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            sound.playClick();
            setActiveType('income');
          }}
          className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
            activeType === 'income'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-700/40 ring-1 ring-emerald-400/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>+ INGRESO (Venta)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            sound.playClick();
            setActiveType('expense');
          }}
          className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
            activeType === 'expense'
              ? 'bg-gradient-to-r from-rose-600 to-amber-700 text-white shadow-lg shadow-rose-700/40 ring-1 ring-rose-400/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
          <span>- GASTO DIARIO</span>
        </button>
      </div>

      {/* Screen Display for Amount */}
      <div className="relative bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 rounded-2xl p-4 mb-3 shadow-xl">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span className="flex items-center gap-1 font-medium">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            {activeType === 'income' ? 'Ingreso a registrar' : 'Gasto a registrar'}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                triggerHaptic('light');
                setPaymentMethod((prev) => (prev === 'efectivo' ? 'qr_transferencia' : 'efectivo'));
              }}
              className="text-[11px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 hover:text-white"
            >
              {paymentMethod === 'efectivo' ? '💵 Efectivo' : '📱 QR / Transf.'}
            </button>
            {amountStr && (
              <button
                onClick={handleClear}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Large Amount Numbers */}
        <div className="flex items-baseline justify-end gap-2 py-1">
          <span className="text-xl font-bold text-slate-400 font-mono">{currency}</span>
          <span
            className={`text-4xl sm:text-5xl font-extrabold tracking-tight font-mono truncate ${
              amountStr
                ? activeType === 'income'
                  ? 'text-emerald-400'
                  : 'text-rose-400'
                : 'text-slate-600'
            }`}
          >
            {amountStr || '0'}
          </span>
        </div>

        {/* Note / Detail line if enabled or button to toggle */}
        <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2">
          {showNoteInput ? (
            <input
              type="text"
              placeholder="Detalle o nota opcional (ej. 15L gasolina, atado leña)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full text-xs bg-slate-800/80 border border-slate-700 text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              autoFocus
            />
          ) : (
            <button
              onClick={() => {
                triggerHaptic('light');
                setShowNoteInput(true);
              }}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 py-1 px-1"
            >
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>{note ? `Nota: "${note}"` : '+ Agregar nota o detalle (opcional)'}</span>
            </button>
          )}

          {showNoteInput && (
            <button
              onClick={() => setShowNoteInput(false)}
              className="text-[11px] text-slate-400 hover:text-white px-2 py-1"
            >
              OK
            </button>
          )}
        </div>
      </div>

      {/* Primary Category Buttons (1-Tap Registration) */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Toca una Categoría para Registrar:
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            {currentAmount > 0 ? `Se guardará ${currency} ${currentAmount}` : 'Escribe el monto'}
          </span>
        </div>

        {activeType === 'income' ? (
          /* INCOME CATEGORIES */
          <div className="grid grid-cols-2 gap-2.5">
            {/* Venta Gasolina (Main highlight) */}
            <button
              onClick={() => handleSelectCategory('gasolina')}
              className="relative p-3.5 rounded-2xl bg-gradient-to-br from-amber-600/25 via-amber-700/20 to-slate-900 border-2 border-amber-500/50 hover:border-amber-400 active:scale-95 transition-all text-left shadow-lg group overflow-hidden"
            >
              <div className="absolute top-2 right-2 text-[10px] font-bold bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded shadow">
                PRINCIPAL
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform border border-amber-500/30">
                <Fuel className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-sm sm:text-base text-amber-300 leading-tight">
                Venta Gasolina
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Combustible / diésel</p>
            </button>

            {/* Venta de Leña (Main highlight) */}
            <button
              onClick={() => handleSelectCategory('leña')}
              className="relative p-3.5 rounded-2xl bg-gradient-to-br from-emerald-600/25 via-emerald-700/20 to-slate-900 border-2 border-emerald-500/50 hover:border-emerald-400 active:scale-95 transition-all text-left shadow-lg group overflow-hidden"
            >
              <div className="absolute top-2 right-2 text-[10px] font-bold bg-emerald-500 text-slate-950 px-1.5 py-0.5 rounded shadow">
                PRINCIPAL
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform border border-emerald-500/30">
                <TreePine className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-sm sm:text-base text-emerald-300 leading-tight">
                Venta de Leña
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Atados y cargas de leña</p>
            </button>

            {/* Otro Ingreso (Irregular) */}
            <button
              onClick={() => handleSelectCategory('otro_ingreso')}
              className="col-span-2 p-3 rounded-xl bg-slate-900 border border-cyan-500/40 hover:border-cyan-400 active:scale-95 transition-all text-left flex items-center gap-3 shadow group"
            >
              <div className="w-9 h-9 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0 border border-cyan-500/30">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-xs sm:text-sm text-cyan-300">Otro Ingreso</h4>
                <p className="text-[11px] text-slate-400">Ventas varias o no regulares</p>
              </div>
              <span className="text-xs text-cyan-400 font-semibold px-2 py-1 rounded bg-cyan-950/60 border border-cyan-800">
                Registrar
              </span>
            </button>
          </div>
        ) : (
          /* EXPENSE CATEGORIES: 6 balanced buttons */
          <div className="grid grid-cols-3 gap-2">
            {/* Bolo / Coca */}
            <button
              onClick={() => handleSelectCategory('bolo')}
              className="p-2.5 rounded-xl bg-lime-950/40 border border-lime-500/40 hover:border-lime-400 active:scale-95 transition-all text-center flex flex-col items-center shadow group"
            >
              <div className="w-9 h-9 rounded-lg bg-lime-500/20 text-lime-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform border border-lime-500/30">
                <Leaf className="w-5 h-5" />
              </div>
              <span className="font-bold text-xs text-lime-300">Bolo / Coca</span>
              <span className="text-[10px] text-slate-400">Acullico</span>
            </button>

            {/* Cigarro */}
            <button
              onClick={() => handleSelectCategory('cigarro')}
              className="p-2.5 rounded-xl bg-stone-900/60 border border-stone-500/40 hover:border-stone-400 active:scale-95 transition-all text-center flex flex-col items-center shadow group"
            >
              <div className="w-9 h-9 rounded-lg bg-stone-500/20 text-stone-300 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform border border-stone-500/30">
                <Cigarette className="w-5 h-5" />
              </div>
              <span className="font-bold text-xs text-stone-300">Cigarro</span>
              <span className="text-[10px] text-slate-400">Cajetilla/suelto</span>
            </button>

            {/* Trago y Cerveza (Combined) */}
            <button
              onClick={() => handleSelectCategory('trago_cerveza')}
              className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 hover:border-amber-400 active:scale-95 transition-all text-center flex flex-col items-center shadow group"
            >
              <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform border border-amber-500/30">
                <Beer className="w-5 h-5" />
              </div>
              <span className="font-bold text-xs text-amber-300 truncate max-w-full">Trago y Cerveza</span>
              <span className="text-[10px] text-slate-400">Bebidas / alcohol</span>
            </button>

            {/* Pesca (New category) */}
            <button
              onClick={() => handleSelectCategory('pesca')}
              className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 hover:border-cyan-400 active:scale-95 transition-all text-center flex flex-col items-center shadow group"
            >
              <div className="w-9 h-9 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform border border-cyan-500/30">
                <Fish className="w-5 h-5" />
              </div>
              <span className="font-bold text-xs text-cyan-300">Pesca</span>
              <span className="text-[10px] text-slate-400">Carnada / salida</span>
            </button>

            {/* Comida */}
            <button
              onClick={() => handleSelectCategory('comida')}
              className="p-2.5 rounded-xl bg-orange-950/40 border border-orange-500/40 hover:border-orange-400 active:scale-95 transition-all text-center flex flex-col items-center shadow group"
            >
              <div className="w-9 h-9 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform border border-orange-500/30">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <span className="font-bold text-xs text-orange-300">Comida</span>
              <span className="text-[10px] text-slate-400">Almuerzos</span>
            </button>

            {/* Otros Gastos */}
            <button
              onClick={() => handleSelectCategory('otro_gasto')}
              className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/40 hover:border-purple-400 active:scale-95 transition-all text-center flex flex-col items-center shadow group"
            >
              <div className="w-9 h-9 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform border border-purple-500/30">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <span className="font-bold text-xs text-purple-300">Otros</span>
              <span className="text-[10px] text-slate-400">Imprevistos</span>
            </button>
          </div>
        )}
      </div>

      {/* Numeric Keypad Grid */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-2.5 shadow-lg">
        <div className="grid grid-cols-3 gap-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-12 sm:h-14 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 active:scale-95 rounded-xl font-mono text-xl sm:text-2xl font-bold text-white shadow-sm flex items-center justify-center transition-all"
            >
              {digit}
            </button>
          ))}

          {/* Backspace Button */}
          <button
            type="button"
            onClick={handleBackspace}
            className="h-12 sm:h-14 bg-slate-800/80 hover:bg-rose-950/40 active:scale-95 border border-slate-700/80 rounded-xl font-bold text-rose-400 flex items-center justify-center transition-all"
            title="Borrar dígito"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Live Auto-Registration Info Note */}
      <div className="mt-2 text-center flex items-center justify-center gap-3 text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-400" /> Hora y fecha auto
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <MapPin className="w-3 h-3 text-emerald-400" /> GPS automático
        </span>
      </div>

      {/* Instant Notification Toast */}
      {lastRegistered && (
        <div className="fixed bottom-20 left-4 right-4 z-40 max-w-sm mx-auto bg-slate-900 border-2 border-emerald-500/80 rounded-2xl p-3.5 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-emerald-400">¡Registrado con éxito!</p>
            <p className="text-sm font-extrabold text-white truncate">
              {lastRegistered.category}: {currency} {lastRegistered.amount.toFixed(2)}
            </p>
            <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-emerald-400" /> Con fecha, hora y ubicación
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
