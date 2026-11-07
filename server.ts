import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, client, initDatabase, updateTursoAuth } from './src/db/index';
import { transactionsTable } from './src/db/schema';
import { eq, desc } from 'drizzle-orm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize Turso DB on startup
let isTursoConnected = false;
let tursoInitError: string | null = null;

initDatabase()
  .then((res) => {
    isTursoConnected = res.connected;
    if (!res.connected) tursoInitError = res.error || null;
  })
  .catch((err) => {
    isTursoConnected = false;
    tursoInitError = err?.message || String(err);
  });

// API Routes
app.get('/api/status', async (_req, res) => {
  try {
    const testResult = await client.execute('SELECT 1 as alive;');
    isTursoConnected = true;
    res.json({
      status: 'ok',
      database: 'turso',
      connected: true,
      url: process.env.TURSO_DATABASE_URL || 'libsql://gestion-de-vicios-maus279555-ui.aws-sa-east-1.turso.io',
      engine: 'drizzle-orm',
      test: testResult.rows[0],
    });
  } catch (err: any) {
    res.json({
      status: 'offline_mode',
      database: 'turso',
      connected: false,
      url: process.env.TURSO_DATABASE_URL || 'libsql://gestion-de-vicios-maus279555-ui.aws-sa-east-1.turso.io',
      engine: 'drizzle-orm',
      error: err?.message || tursoInitError || 'Requiere token de autenticación de Turso o conexión activa',
    });
  }
});

// POST /api/turso-token
app.post('/api/turso-token', async (req, res) => {
  try {
    const { token } = req.body;
    updateTursoAuth(token || '');
    const initRes = await initDatabase();
    if (initRes.connected) {
      res.json({ success: true, message: '¡Conectado a Turso exitosamente!' });
    } else {
      res.json({ success: false, error: initRes.error });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// GET /api/transactions
app.get('/api/transactions', async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(transactionsTable)
      .orderBy(desc(transactionsTable.timestamp));

    const formatted = rows.map((r) => ({
      id: r.id,
      type: r.type,
      category: r.category,
      categoryName: r.categoryName,
      amount: r.amount,
      note: r.note || undefined,
      date: r.date,
      time: r.time,
      timestamp: r.timestamp,
      location:
        r.latitude !== null && r.longitude !== null
          ? {
              latitude: r.latitude,
              longitude: r.longitude,
              accuracy: r.accuracy || undefined,
              timestamp: r.timestamp,
              address: r.locationAddress || undefined,
            }
          : null,
      paymentMethod: r.paymentMethod || 'efectivo',
    }));

    res.json({ success: true, data: formatted, source: 'turso' });
  } catch (err: any) {
    console.warn('Error reading from Turso, falling back to local client sync:', err?.message);
    res.status(500).json({ success: false, error: err?.message });
  }
});

// POST /api/transactions
app.post('/api/transactions', async (req, res) => {
  try {
    const t = req.body;
    if (!t.id || !t.amount || !t.category || !t.type) {
      return res.status(400).json({ error: 'Campos obligatorios faltantes' });
    }

    await db
      .insert(transactionsTable)
      .values({
        id: t.id,
        type: t.type,
        category: t.category,
        categoryName: t.categoryName,
        amount: Number(t.amount),
        note: t.note || null,
        date: t.date,
        time: t.time,
        timestamp: Number(t.timestamp) || Date.now(),
        latitude: t.location?.latitude || null,
        longitude: t.location?.longitude || null,
        accuracy: t.location?.accuracy || null,
        locationAddress: t.location?.address || null,
        paymentMethod: t.paymentMethod || 'efectivo',
        createdAt: Date.now(),
      })
      .onConflictDoUpdate({
        target: transactionsTable.id,
        set: {
          type: t.type,
          category: t.category,
          categoryName: t.categoryName,
          amount: Number(t.amount),
          note: t.note || null,
          date: t.date,
          time: t.time,
          paymentMethod: t.paymentMethod || 'efectivo',
        },
      });

    res.status(201).json({ success: true, message: 'Guardado en Turso exitosamente' });
  } catch (err: any) {
    console.error('Error inserting transaction into Turso:', err);
    res.status(500).json({ success: false, error: err?.message });
  }
});

// PUT /api/transactions/:id
app.put('/api/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const t = req.body;

    await db
      .update(transactionsTable)
      .set({
        type: t.type,
        category: t.category,
        categoryName: t.categoryName,
        amount: Number(t.amount),
        note: t.note || null,
        date: t.date,
        time: t.time,
        paymentMethod: t.paymentMethod || 'efectivo',
      })
      .where(eq(transactionsTable.id, id));

    res.json({ success: true, message: 'Actualizado en Turso' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// DELETE /api/transactions/:id
app.delete('/api/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(transactionsTable).where(eq(transactionsTable.id, id));
    res.json({ success: true, message: 'Eliminado de Turso' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// POST /api/transactions/clear-all
app.post('/api/transactions/clear-all', async (_req, res) => {
  try {
    await db.delete(transactionsTable);
    res.json({ success: true, message: 'Todos los registros fueron eliminados de Turso' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// POST /api/transactions/sync
app.post('/api/transactions/sync', async (req, res) => {
  try {
    const { transactions } = req.body;
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.json({ success: true, count: 0 });
    }

    let inserted = 0;
    for (const t of transactions) {
      try {
        await db
          .insert(transactionsTable)
          .values({
            id: t.id,
            type: t.type,
            category: t.category,
            categoryName: t.categoryName,
            amount: Number(t.amount),
            note: t.note || null,
            date: t.date,
            time: t.time,
            timestamp: Number(t.timestamp) || Date.now(),
            latitude: t.location?.latitude || null,
            longitude: t.location?.longitude || null,
            accuracy: t.location?.accuracy || null,
            locationAddress: t.location?.address || null,
            paymentMethod: t.paymentMethod || 'efectivo',
            createdAt: Date.now(),
          })
          .onConflictDoNothing();
        inserted++;
      } catch (itemErr) {
        // Continue with rest
      }
    }

    res.json({ success: true, inserted });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// Vite middleware or static dist
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor Gestión de Vicios ejecutándose en http://0.0.0.0:${PORT}`);
  });
}

startServer();
