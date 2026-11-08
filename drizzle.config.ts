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
    authToken:
      process.env.TURSO_AUTH_TOKEN ||
      'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTQwNzk1NjAsImlkIjoiMDFhMWI3NzktNDkwMS03YTcwLTg2YzAtMTQ0ZjQ4ODg5ZmE1Iiwia2lkIjoiR2xvcVBodDMyWkxJd09LR2tUY3RJMjhHWC1DcDFZT0tqTmpocHN0Y3l1OCIsInJpZCI6ImFjNzJlYjViLTg3MzQtNDAzNy1hZjA3LTI2NTU5NWQxYzZjYSJ9.CdF0MUz0UM8jjGjX_ycRnDZrtiZDDAVcVqFCjHXVlkAmL65b7Zx5x1PJOYLrFtbMDnjs0BKVROqAJEkqQp_aBw',
  },
});
