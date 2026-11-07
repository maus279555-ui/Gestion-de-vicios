import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'turso',
  dbCredentials: {
    url:
      process.env.TURSO_DATABASE_URL ||
      'libsql://gestion-de-vicios-maus279555-ui.aws-sa-east-1.turso.io',
    authToken: process.env.TURSO_AUTH_TOKEN || undefined,
  },
});
