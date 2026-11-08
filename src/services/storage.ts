import { DailySummary, Transaction } from '../types/finance';
import { CATEGORIES } from '../data/categories';

const STORAGE_KEY = 'control_diario_transacciones_v1';
const CURRENCY_KEY = 'control_diario_moneda_v1';
const SETTINGS_KEY = 'control_diario_config_v1';

export interface AppSettings {
  currency: string;
  enableVibration: boolean;
  enableAudio: boolean;
  dailySavingsTarget: number;
  userName: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  currency: 'Bs.',
  enableVibration: true,
  enableAudio: true,
  dailySavingsTarget: 200,
  userName: 'Mi Negocio',
};

// Formats today as YYYY-MM-DD in local time
export const getLocalDateString = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getLocalTimeString = (d: Date = new Date()): string => {
  return d.toLocaleTimeString('es-BO', {
    hour12: true,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const getStoredTransactions = (): Transaction[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading transactions from storage', e);
    return [];
  }
};

export const saveTransactions = (transactions: Transaction[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (e) {
    console.error('Error saving transactions', e);
  }
};

export const getStoredSettings = (): AppSettings => {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings: AppSettings) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings', e);
  }
};

export const calculateDailySummary = (dateStr: string, transactions: Transaction[]): DailySummary => {
  const dayItems = transactions.filter((t) => t.date === dateStr);

  let totalIncome = 0;
  let totalExpense = 0;
  let incomeCount = 0;
  let expenseCount = 0;
  let gasolinaIncome = 0;
  let leñaIncome = 0;
  let otherIncome = 0;
  let vicesExpense = 0;
  let foodExpense = 0;
  let otherExpense = 0;

  for (const item of dayItems) {
    if (item.type === 'income') {
      totalIncome += item.amount;
      incomeCount++;
      if (item.category === 'gasolina') gasolinaIncome += item.amount;
      else if (item.category === 'leña') leñaIncome += item.amount;
      else otherIncome += item.amount;
    } else {
      totalExpense += item.amount;
      expenseCount++;
      if (['bolo', 'cigarro', 'trago', 'cerveza', 'trago_cerveza'].includes(item.category)) {
        vicesExpense += item.amount;
      }
      if (item.category === 'comida') foodExpense += item.amount;
      if (item.category === 'otro_gasto' || item.category === 'pesca') otherExpense += item.amount;
    }
  }

  return {
    date: dateStr,
    totalIncome,
    totalExpense,
    netSavings: totalIncome - totalExpense,
    incomeCount,
    expenseCount,
    gasolinaIncome,
    leñaIncome,
    otherIncome,
    vicesExpense,
    foodExpense,
    otherExpense,
  };
};

export const generateSampleData = (): Transaction[] => {
  const today = new Date();
  const todayStr = getLocalDateString(today);

  const yesterday = new Date(today.getTime() - 24 * 3600 * 1000);
  const yesterdayStr = getLocalDateString(yesterday);

  const samples: Transaction[] = [
    // Hoy
    {
      id: 'samp-1',
      type: 'income',
      category: 'gasolina',
      categoryName: CATEGORIES.gasolina.name,
      amount: 120,
      note: 'Venta combustible camioneta azul',
      date: todayStr,
      time: '08:15:20 AM',
      timestamp: Date.now() - 3 * 3600 * 1000,
      location: {
        latitude: -17.3935,
        longitude: -66.157,
        accuracy: 12,
        timestamp: Date.now() - 3 * 3600 * 1000,
        address: 'Puesto de Venta - Km 14',
      },
      paymentMethod: 'efectivo',
    },
    {
      id: 'samp-2',
      type: 'expense',
      category: 'bolo',
      categoryName: CATEGORIES.bolo.name,
      amount: 15,
      note: 'Bolo especial y lejía',
      date: todayStr,
      time: '08:45:10 AM',
      timestamp: Date.now() - 2.5 * 3600 * 1000,
      location: {
        latitude: -17.3938,
        longitude: -66.1572,
        accuracy: 15,
        timestamp: Date.now() - 2.5 * 3600 * 1000,
        address: 'Tienda de la Esquina',
      },
      paymentMethod: 'efectivo',
    },
    {
      id: 'samp-3',
      type: 'income',
      category: 'leña',
      categoryName: CATEGORIES.leña.name,
      amount: 180,
      note: '3 atados de leña dura de quebracho',
      date: todayStr,
      time: '10:30:00 AM',
      timestamp: Date.now() - 2 * 3600 * 1000,
      location: {
        latitude: -17.3941,
        longitude: -66.1565,
        accuracy: 10,
        timestamp: Date.now() - 2 * 3600 * 1000,
        address: 'Depósito de Leña',
      },
      paymentMethod: 'efectivo',
    },
    {
      id: 'samp-4',
      type: 'expense',
      category: 'cigarro',
      categoryName: CATEGORIES.cigarro.name,
      amount: 10,
      note: 'Media cajetilla',
      date: todayStr,
      time: '11:15:40 AM',
      timestamp: Date.now() - 1.5 * 3600 * 1000,
      location: {
        latitude: -17.3936,
        longitude: -66.1569,
        accuracy: 14,
        timestamp: Date.now() - 1.5 * 3600 * 1000,
        address: 'Kiosco',
      },
      paymentMethod: 'efectivo',
    },
    {
      id: 'samp-5',
      type: 'expense',
      category: 'comida',
      categoryName: CATEGORIES.comida.name,
      amount: 25,
      note: 'Almuerzo completo + refresco',
      date: todayStr,
      time: '12:40:15 PM',
      timestamp: Date.now() - 1 * 3600 * 1000,
      location: {
        latitude: -17.395,
        longitude: -66.158,
        accuracy: 18,
        timestamp: Date.now() - 1 * 3600 * 1000,
        address: 'Comedor Doña María',
      },
      paymentMethod: 'efectivo',
    },
    {
      id: 'samp-6',
      type: 'income',
      category: 'gasolina',
      categoryName: CATEGORIES.gasolina.name,
      amount: 250,
      note: 'Carga completa bidones tractor',
      date: todayStr,
      time: '01:20:00 PM',
      timestamp: Date.now() - 0.5 * 3600 * 1000,
      location: {
        latitude: -17.3935,
        longitude: -66.157,
        accuracy: 8,
        timestamp: Date.now() - 0.5 * 3600 * 1000,
        address: 'Puesto de Venta - Km 14',
      },
      paymentMethod: 'efectivo',
    },
    // Ayer
    {
      id: 'samp-7',
      type: 'income',
      category: 'gasolina',
      categoryName: CATEGORIES.gasolina.name,
      amount: 320,
      note: 'Venta de la tarde',
      date: yesterdayStr,
      time: '03:10:00 PM',
      timestamp: yesterday.getTime() + 15 * 3600 * 1000,
      location: {
        latitude: -17.3935,
        longitude: -66.157,
        accuracy: 9,
        timestamp: yesterday.getTime() + 15 * 3600 * 1000,
        address: 'Puesto Central',
      },
      paymentMethod: 'efectivo',
    },
    {
      id: 'samp-8',
      type: 'income',
      category: 'leña',
      categoryName: CATEGORIES.leña.name,
      amount: 140,
      note: 'Venta leña seca para horno',
      date: yesterdayStr,
      time: '05:30:00 PM',
      timestamp: yesterday.getTime() + 17 * 3600 * 1000,
      location: {
        latitude: -17.3941,
        longitude: -66.1565,
        accuracy: 11,
        timestamp: yesterday.getTime() + 17 * 3600 * 1000,
        address: 'Depósito de Leña',
      },
      paymentMethod: 'efectivo',
    },
    {
      id: 'samp-9',
      type: 'expense',
      category: 'cerveza',
      categoryName: CATEGORIES.cerveza.name,
      amount: 40,
      note: '2 cervezas al final de jornada',
      date: yesterdayStr,
      time: '07:20:00 PM',
      timestamp: yesterday.getTime() + 19 * 3600 * 1000,
      location: {
        latitude: -17.396,
        longitude: -66.159,
        accuracy: 20,
        timestamp: yesterday.getTime() + 19 * 3600 * 1000,
        address: 'Tienda Central',
      },
      paymentMethod: 'efectivo',
    },
  ];

  return samples;
};

export const exportToCSV = (transactions: Transaction[], currency: string = 'Bs.'): void => {
  const headers = [
    'ID',
    'Tipo',
    'Categoría',
    `Monto (${currency})`,
    'Nota',
    'Fecha',
    'Hora',
    'Latitud',
    'Longitud',
    'Ubicación / Referencia',
    'Método Pago',
  ];

  const rows = transactions.map((t) => [
    t.id,
    t.type === 'income' ? 'Ingreso' : 'Gasto',
    t.categoryName,
    t.amount.toFixed(2),
    `"${(t.note || '').replace(/"/g, '""')}"`,
    t.date,
    t.time,
    t.location?.latitude?.toFixed(6) || '',
    t.location?.longitude?.toFixed(6) || '',
    `"${(t.location?.address || '').replace(/"/g, '""')}"`,
    t.paymentMethod || 'efectivo',
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `reporte_financiero_${getLocalDateString()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
