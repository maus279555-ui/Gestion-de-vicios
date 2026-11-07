export type TransactionType = 'income' | 'expense';

export type IncomeCategory = 'gasolina' | 'leña' | 'otro_ingreso';
export type ExpenseCategory = 'bolo' | 'cigarro' | 'trago' | 'cerveza' | 'comida' | 'otro_gasto';

export type CategoryId = IncomeCategory | ExpenseCategory;

export interface CategoryConfig {
  id: CategoryId;
  name: string;
  type: TransactionType;
  iconName: string;
  color: string;
  bgLight: string;
  borderColor: string;
  isMain?: boolean;
  description?: string;
}

export interface GeoLocationInfo {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
  address?: string;
  error?: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  category: CategoryId;
  categoryName: string;
  amount: number;
  note?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm:ss
  timestamp: number; // unix ms
  location?: GeoLocationInfo | null;
  paymentMethod?: 'efectivo' | 'qr_transferencia';
}

export interface DailySummary {
  date: string;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  incomeCount: number;
  expenseCount: number;
  gasolinaIncome: number;
  leñaIncome: number;
  otherIncome: number;
  vicesExpense: number; // bolo + cigarro + trago + cerveza
  foodExpense: number;
  otherExpense: number;
}
