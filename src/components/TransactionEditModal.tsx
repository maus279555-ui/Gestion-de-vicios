import React, { useState } from 'react';
import { X, Trash2, Save, MapPin, Clock } from 'lucide-react';
import { CategoryId, Transaction } from '../types/finance';
import { CATEGORIES } from '../data/categories';
import { sound } from '../services/sound';
import { triggerHaptic } from '../services/geolocation';

interface TransactionEditModalProps {
  transaction: Transaction;
  currency: string;
  onSave: (updated: Transaction) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export const TransactionEditModal: React.FC<TransactionEditModalProps> = ({
  transaction,
  currency,
  onSave,
  onDelete,
  onClose,
}) => {
  const [amount, setAmount] = useState<string>(transaction.amount.toString());
  const [category, setCategory] = useState<CategoryId>(transaction.category);
  const [note, setNote] = useState<string>(transaction.note || '');
  const [date, setDate] = useState<string>(transaction.date);
  const [time, setTime] = useState<string>(transaction.time);

  const availableCategories = Object.values(CATEGORIES).filter(
    (c) => c.type === transaction.type
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      alert('Ingresa un monto válido');
      return;
    }

    const catConfig = CATEGORIES[category];
    const updated: Transaction = {
      ...transaction,
      amount: num,
      category,
      categoryName: catConfig.name,
      note: note.trim() || undefined,
      date,
      time,
    };

    triggerHaptic('success');
    sound.playClick();
    onSave(updated);
    onClose();
  };

  const handleDelete = () => {
    if (confirm('¿Seguro que deseas eliminar este registro?')) {
      triggerHaptic('warning');
      onDelete(transaction.id);
      onClose();
    }
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

        <h3 className="text-base font-bold text-white mb-1">
          Editar {transaction.type === 'income' ? 'Ingreso' : 'Gasto'}
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Modifica el monto, categoría o notas del registro
        </p>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Monto */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Monto ({currency})
            </label>
            <input
              type="number"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-white font-mono text-xl font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Categoría
            </label>
            <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
              {availableCategories.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold text-left border transition-all truncate ${
                    category === c.id
                      ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                      : 'bg-slate-800 border-slate-700/80 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Nota */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Nota / Detalle
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej. Venta a camionero, 2 cajetillas, etc."
              className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Fecha y Hora */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Fecha
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-2 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Hora
              </label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-2 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* GPS Info badge */}
          {transaction.location && (
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span className="truncate">
                GPS: {transaction.location.latitude.toFixed(4)},{' '}
                {transaction.location.longitude.toFixed(4)}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleDelete}
              className="py-2.5 px-3 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span>Eliminar</span>
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/30 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Cambios</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
