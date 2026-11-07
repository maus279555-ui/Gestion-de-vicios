import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

const tursoUrl =
  process.env.TURSO_DATABASE_URL ||
  'libsql://gestion-de-vicios-maus279555-ui.aws-sa-east-1.turso.io';
let currentAuthToken = process.env.TURSO_AUTH_TOKEN || '';

export let client = createClient({
  url: tursoUrl,
  authToken: currentAuthToken || undefined,
});

export let db = drizzle(client, { schema });

export function updateTursoAuth(newAuthToken: string) {
  currentAuthToken = newAuthToken;
  client = createClient({
    url: tursoUrl,
    authToken: currentAuthToken || undefined,
  });
  db = drizzle(client, { schema });
}

// Auto-initialize SQLite/Turso table if it doesn't exist
export async function initDatabase() {
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        category TEXT NOT NULL,
        category_name TEXT NOT NULL,
        amount REAL NOT NULL,
        note TEXT,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        latitude REAL,
        longitude REAL,
        accuracy REAL,
        location_address TEXT,
        payment_method TEXT DEFAULT 'efectivo',
        created_at INTEGER NOT NULL
      );
    `);
    console.log('✅ Base de datos Turso conectada y tabla transactions lista.');
    return { success: true, connected: true };
  } catch (error: any) {
    console.warn('⚠️ Nota de conexión a Turso:', error?.message || error);
    return { success: false, connected: false, error: error?.message || String(error) };
  }
}
