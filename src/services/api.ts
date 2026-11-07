import { Transaction } from '../types/finance';

export interface TursoStatus {
  connected: boolean;
  database: string;
  url: string;
  engine: string;
  error?: string;
  status: string;
}

export const checkTursoStatus = async (): Promise<TursoStatus> => {
  try {
    const res = await fetch('/api/status');
    if (!res.ok) {
      return {
        connected: false,
        database: 'turso',
        url: 'libsql://gestion-de-vicios-maus279555-ui.aws-sa-east-1.turso.io',
        engine: 'drizzle-orm',
        status: 'error',
        error: `HTTP ${res.status}`,
      };
    }
    return await res.json();
  } catch (err: any) {
    return {
      connected: false,
      database: 'turso',
      url: 'libsql://gestion-de-vicios-maus279555-ui.aws-sa-east-1.turso.io',
      engine: 'drizzle-orm',
      status: 'offline',
      error: err?.message || 'Modo local offline activo',
    };
  }
};

export const fetchTursoTransactions = async (): Promise<Transaction[] | null> => {
  try {
    const res = await fetch('/api/transactions');
    if (!res.ok) return null;
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      return json.data;
    }
    return null;
  } catch {
    return null;
  }
};

export const saveTursoTransaction = async (t: Transaction): Promise<boolean> => {
  try {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(t),
    });
    return res.ok;
  } catch {
    return false;
  }
};

export const updateTursoTransaction = async (t: Transaction): Promise<boolean> => {
  try {
    const res = await fetch(`/api/transactions/${t.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(t),
    });
    return res.ok;
  } catch {
    return false;
  }
};

export const deleteTursoTransaction = async (id: string): Promise<boolean> => {
  try {
    const res = await fetch(`/api/transactions/${id}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch {
    return false;
  }
};

export const syncAllToTurso = async (transactions: Transaction[]): Promise<number> => {
  try {
    const res = await fetch('/api/transactions/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactions }),
    });
    if (!res.ok) return 0;
    const json = await res.json();
    return json.inserted || 0;
  } catch {
    return 0;
  }
};

export const updateServerTursoToken = async (
  token: string
): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const res = await fetch('/api/turso-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error de red' };
  }
};

export const clearAllTursoTransactions = async (): Promise<boolean> => {
  try {
    const res = await fetch('/api/transactions/clear-all', {
      method: 'POST',
    });
    return res.ok;
  } catch {
    return false;
  }
};
