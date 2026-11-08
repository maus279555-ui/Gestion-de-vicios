import { createClient } from '@libsql/client/web';
import { CategoryId, Transaction } from '../types/finance';

const TURSO_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TURSO_DATABASE_URL) ||
  'libsql://gestion-de-vicios-maus279555-ui.aws-sa-east-1.turso.io';

const TURSO_AUTH_TOKEN =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TURSO_AUTH_TOKEN) ||
  'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTQwNzk1NjAsImlkIjoiMDFhMWI3NzktNDkwMS03YTcwLTg2YzAtMTQ0ZjQ4ODg5ZmE1Iiwia2lkIjoiR2xvcVBodDMyWkxJd09LR2tUY3RJMjhHWC1DcDFZT0tqTmpocHN0Y3l1OCIsInJpZCI6ImFjNzJlYjViLTg3MzQtNDAzNy1hZjA3LTI2NTU5NWQxYzZjYSJ9.CdF0MUz0UM8jjGjX_ycRnDZrtiZDDAVcVqFCjHXVlkAmL65b7Zx5x1PJOYLrFtbMDnjs0BKVROqAJEkqQp_aBw';

let client = createClient({
  url: TURSO_URL,
  authToken: TURSO_AUTH_TOKEN,
});

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
    await client.execute('SELECT 1 as alive;');
    return {
      connected: true,
      database: 'turso',
      url: TURSO_URL,
      engine: 'turso-libsql-direct',
      status: 'ok',
    };
  } catch (err: any) {
    return {
      connected: false,
      database: 'turso',
      url: TURSO_URL,
      engine: 'turso-libsql-direct',
      status: 'offline',
      error: err?.message || 'Modo local offline activo',
    };
  }
};

export const fetchTursoTransactions = async (): Promise<Transaction[] | null> => {
  try {
    const res = await client.execute(`
      SELECT * FROM transactions ORDER BY timestamp DESC;
    `);

    const formatted: Transaction[] = res.rows.map((r: any) => ({
      id: String(r.id),
      type: r.type as 'income' | 'expense',
      category: r.category as CategoryId,
      categoryName: String(r.category_name),
      amount: Number(r.amount),
      note: r.note ? String(r.note) : undefined,
      date: String(r.date),
      time: String(r.time),
      timestamp: Number(r.timestamp),
      location:
        r.latitude !== null && r.longitude !== null
          ? {
              latitude: Number(r.latitude),
              longitude: Number(r.longitude),
              accuracy: r.accuracy ? Number(r.accuracy) : undefined,
              timestamp: Number(r.timestamp),
              address: r.location_address ? String(r.location_address) : undefined,
            }
          : null,
      paymentMethod: (r.payment_method as any) || 'efectivo',
    }));

    return formatted;
  } catch (err) {
    console.warn('Error fetching directly from Turso:', err);
    return null;
  }
};

export const saveTursoTransaction = async (t: Transaction): Promise<boolean> => {
  try {
    await client.execute({
      sql: `
        INSERT INTO transactions (
          id, type, category, category_name, amount, note, date, time, timestamp,
          latitude, longitude, accuracy, location_address, payment_method, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          type = excluded.type,
          category = excluded.category,
          category_name = excluded.category_name,
          amount = excluded.amount,
          note = excluded.note,
          date = excluded.date,
          time = excluded.time,
          payment_method = excluded.payment_method;
      `,
      args: [
        t.id,
        t.type,
        t.category,
        t.categoryName,
        t.amount,
        t.note || null,
        t.date,
        t.time,
        t.timestamp || Date.now(),
        t.location?.latitude || null,
        t.location?.longitude || null,
        t.location?.accuracy || null,
        t.location?.address || null,
        t.paymentMethod || 'efectivo',
        Date.now(),
      ],
    });
    return true;
  } catch (err) {
    console.error('Error saving directly to Turso:', err);
    return false;
  }
};

export const updateTursoTransaction = async (t: Transaction): Promise<boolean> => {
  try {
    await client.execute({
      sql: `
        UPDATE transactions
        SET type = ?, category = ?, category_name = ?, amount = ?, note = ?, date = ?, time = ?, payment_method = ?
        WHERE id = ?;
      `,
      args: [
        t.type,
        t.category,
        t.categoryName,
        t.amount,
        t.note || null,
        t.date,
        t.time,
        t.paymentMethod || 'efectivo',
        t.id,
      ],
    });
    return true;
  } catch (err) {
    console.error('Error updating directly in Turso:', err);
    return false;
  }
};

export const deleteTursoTransaction = async (id: string): Promise<boolean> => {
  try {
    await client.execute({
      sql: 'DELETE FROM transactions WHERE id = ?;',
      args: [id],
    });
    return true;
  } catch (err) {
    console.error('Error deleting directly in Turso:', err);
    return false;
  }
};

export const syncAllToTurso = async (transactions: Transaction[]): Promise<number> => {
  let count = 0;
  for (const t of transactions) {
    const ok = await saveTursoTransaction(t);
    if (ok) count++;
  }
  return count;
};

export const clearAllTursoTransactions = async (): Promise<boolean> => {
  try {
    await client.execute('DELETE FROM transactions;');
    return true;
  } catch (err) {
    console.error('Error clearing Turso:', err);
    return false;
  }
};

export const updateServerTursoToken = async (
  token: string
): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    client = createClient({
      url: TURSO_URL,
      authToken: token,
    });
    await client.execute('SELECT 1;');
    return { success: true, message: '¡Conexión con Turso verificada con éxito!' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Token inválido' };
  }
};
