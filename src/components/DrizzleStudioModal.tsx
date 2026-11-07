import React, { useState } from 'react';
import {
  Database,
  Table,
  Layers,
  Terminal,
  Trash2,
  RefreshCw,
  X,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
  Search,
  ExternalLink,
} from 'lucide-react';
import { Transaction } from '../types/finance';
import { triggerHaptic } from '../services/geolocation';
import { sound } from '../services/sound';

interface DrizzleStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  currency: string;
  onClearAll: () => void;
  onRefresh: () => void;
  isClearing?: boolean;
}

export const DrizzleStudioModal: React.FC<DrizzleStudioModalProps> = ({
  isOpen,
  onClose,
  transactions,
  currency,
  onClearAll,
  onRefresh,
  isClearing = false,
}) => {
  const [activeTab, setActiveTab] = useState<'rows' | 'schema' | 'cli'>('rows');
  const [copiedCli, setCopiedCli] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  if (!isOpen) return null;

  const schemaColumns = [
    { name: 'id', type: 'TEXT', isPrimary: true, notNull: true },
    { name: 'type', type: 'TEXT', isPrimary: false, notNull: true, desc: "'income' | 'expense'" },
    { name: 'category', type: 'TEXT', isPrimary: false, notNull: true, desc: 'gasolina, leña, bolo...' },
    { name: 'category_name', type: 'TEXT', isPrimary: false, notNull: true },
    { name: 'amount', type: 'REAL', isPrimary: false, notNull: true, desc: 'Monto numérico' },
    { name: 'note', type: 'TEXT', isPrimary: false, notNull: false, desc: 'Detalle opcional' },
    { name: 'date', type: 'TEXT', isPrimary: false, notNull: true, desc: 'YYYY-MM-DD' },
    { name: 'time', type: 'TEXT', isPrimary: false, notNull: true, desc: 'HH:mm:ss' },
    { name: 'timestamp', type: 'INTEGER', isPrimary: false, notNull: true, desc: 'Unix ms' },
    { name: 'latitude', type: 'REAL', isPrimary: false, notNull: false, desc: 'GPS Latitud' },
    { name: 'longitude', type: 'REAL', isPrimary: false, notNull: false, desc: 'GPS Longitud' },
    { name: 'accuracy', type: 'REAL', isPrimary: false, notNull: false, desc: 'Precisión en metros' },
    { name: 'location_address', type: 'TEXT', isPrimary: false, notNull: false },
    { name: 'payment_method', type: 'TEXT', isPrimary: false, notNull: false, desc: 'efectivo / qr' },
    { name: 'created_at', type: 'INTEGER', isPrimary: false, notNull: true },
  ];

  const filteredTransactions = transactions.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.id.toLowerCase().includes(q) ||
      t.categoryName.toLowerCase().includes(q) ||
      t.amount.toString().includes(q) ||
      t.date.includes(q) ||
      t.note?.toLowerCase().includes(q)
    );
  });

  const handleCopyCli = () => {
    navigator.clipboard.writeText('npx drizzle-kit studio');
    setCopiedCli(true);
    triggerHaptic('light');
    setTimeout(() => setCopiedCli(false), 2000);
  };

  const executeClearAll = () => {
    triggerHaptic('warning');
    sound.playExpenseTone();
    onClearAll();
    setConfirmClear(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Studio Top Header */}
        <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-1.5">
                  <span>Drizzle Studio</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Turso SQLite
                  </span>
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 font-mono truncate max-w-[280px] sm:max-w-md">
                libsql://gestion-de-vicios-maus279555-ui.aws-sa-east-1.turso.io
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                triggerHaptic('light');
                onRefresh();
              }}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-xs flex items-center gap-1"
              title="Recargar tabla"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab switcher & Table toolbar */}
        <div className="bg-slate-900/90 px-4 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('rows')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'rows'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Tabla: transactions ({transactions.length} filas)</span>
            </button>

            <button
              onClick={() => setActiveTab('schema')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'schema'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Esquema ({schemaColumns.length} columnas)</span>
            </button>

            <button
              onClick={() => setActiveTab('cli')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'cli'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>CLI Studio</span>
            </button>
          </div>

          {/* Clean everything to 0 button */}
          <div className="flex items-center gap-2">
            {confirmClear ? (
              <div className="flex items-center gap-1.5 bg-rose-950/80 p-1 rounded-xl border border-rose-500/50 animate-pulse">
                <span className="text-[11px] font-bold text-rose-300 pl-1">¿Poner todo a CERO?</span>
                <button
                  onClick={executeClearAll}
                  disabled={isClearing}
                  className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg shadow"
                >
                  {isClearing ? 'Borrando...' : 'Sí, Limpiar'}
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded-lg"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClear(true)}
                className="py-1.5 px-3 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                title="Elimina todos los datos ficticios y deja la base de datos limpia en cero"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Limpiar Todo a Cero (0)</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: Live Rows Table */}
        {activeTab === 'rows' && (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-950">
            {/* Search filter in table */}
            <div className="p-3 border-b border-slate-800 flex items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filtrar filas por ID, categoría, monto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-xs text-white rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <span className="text-xs text-slate-400 font-mono">
                {transactions.length === 0 ? (
                  <span className="text-emerald-400 font-bold">✨ 0 registros (Limpio)</span>
                ) : (
                  `${filteredTransactions.length} de ${transactions.length} registros`
                )}
              </span>
            </div>

            {/* Table data view */}
            <div className="flex-1 overflow-auto">
              {transactions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 shadow-lg shadow-emerald-500/5">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-bold text-white mb-1">
                    Tabla transactions 100% limpia en Cero (0)
                  </h4>
                  <p className="text-xs text-slate-400 max-w-md mb-4">
                    No hay ningún dato ficticio. La base de datos en Turso y el almacenamiento local
                    están totalmente limpios y listos para que ingreses tus registros reales de venta
                    de gasolina, venta de leña y gastos diarios.
                  </p>
                  <button
                    onClick={onClose}
                    className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
                  >
                    Empezar a Registrar en Vivo
                  </button>
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 sticky top-0 z-10 text-[11px]">
                      <th className="p-2.5 font-bold">id</th>
                      <th className="p-2.5 font-bold">type</th>
                      <th className="p-2.5 font-bold">category</th>
                      <th className="p-2.5 font-bold">category_name</th>
                      <th className="p-2.5 font-bold text-right">amount ({currency})</th>
                      <th className="p-2.5 font-bold">note</th>
                      <th className="p-2.5 font-bold">date</th>
                      <th className="p-2.5 font-bold">time</th>
                      <th className="p-2.5 font-bold">location</th>
                      <th className="p-2.5 font-bold">payment_method</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredTransactions.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="p-2.5 text-slate-400 truncate max-w-[100px]">{row.id}</td>
                        <td className="p-2.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              row.type === 'income'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {row.type}
                          </span>
                        </td>
                        <td className="p-2.5 text-white">{row.category}</td>
                        <td className="p-2.5 text-slate-200">{row.categoryName}</td>
                        <td
                          className={`p-2.5 text-right font-bold ${
                            row.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {row.amount.toFixed(2)}
                        </td>
                        <td className="p-2.5 text-slate-400 max-w-[150px] truncate">
                          {row.note || '-'}
                        </td>
                        <td className="p-2.5 text-slate-300">{row.date}</td>
                        <td className="p-2.5 text-slate-400">{row.time}</td>
                        <td className="p-2.5 text-slate-400 text-[10px] max-w-[120px] truncate">
                          {row.location
                            ? `${row.location.latitude.toFixed(4)}, ${row.location.longitude.toFixed(4)}`
                            : 'null'}
                        </td>
                        <td className="p-2.5 text-slate-400">{row.paymentMethod || 'efectivo'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Schema Columns */}
        {activeTab === 'schema' && (
          <div className="flex-1 overflow-auto p-4 bg-slate-950">
            <div className="max-w-2xl mx-auto">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1">
                  Definición Drizzle ORM (schema.ts)
                </h4>
                <p className="text-xs text-slate-400 mb-3">
                  Tabla: <code className="text-emerald-400 font-mono font-bold">transactions</code>{' '}
                  en la base de datos Turso SQLite
                </p>

                <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden font-mono text-xs">
                  {schemaColumns.map((col) => (
                    <div
                      key={col.name}
                      className="p-2.5 flex items-center justify-between bg-slate-950/60 hover:bg-slate-950"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{col.name}</span>
                        {col.isPrimary && (
                          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-extrabold px-1.5 py-0.2 rounded">
                            PK
                          </span>
                        )}
                        {col.notNull && (
                          <span className="bg-slate-800 text-slate-400 text-[9px] px-1.5 py-0.2 rounded">
                            NOT NULL
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {col.desc && <span className="text-[10px] text-slate-400">{col.desc}</span>}
                        <span className="text-emerald-400 font-bold">{col.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: CLI Studio instructions */}
        {activeTab === 'cli' && (
          <div className="flex-1 overflow-auto p-4 bg-slate-950 flex flex-col items-center justify-center text-center">
            <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl text-left">
              <div className="flex items-center gap-2 mb-2">
                <Terminal className="w-5 h-5 text-emerald-400" />
                <h4 className="text-sm font-bold text-white">Ejecutar Drizzle Studio localmente</h4>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Hemos configurado <code className="text-emerald-400">drizzle.config.ts</code> con
                tu base de datos Turso. Puedes ejecutar Drizzle Studio en tu terminal con:
              </p>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between font-mono text-xs text-emerald-400 mb-3">
                <code>npx drizzle-kit studio</code>
                <button
                  onClick={handleCopyCli}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 text-[11px]"
                >
                  {copiedCli ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCli ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-400">
                O también mediante el script de npm:
                <code className="text-white ml-1 bg-slate-800 px-1.5 py-0.5 rounded">npm run studio</code>
              </p>
            </div>
          </div>
        )}

        {/* Studio Footer */}
        <div className="bg-slate-950 px-4 py-2.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 flex-shrink-0">
          <span className="font-mono text-[11px]">
            Dialect: <span className="text-white font-bold">turso</span> • Table:{' '}
            <span className="text-white font-bold">transactions</span>
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold text-xs transition-colors"
          >
            Cerrar Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
