import { createClient } from '@libsql/client';

// Configura tu conexión utilizando las variables de entorno de SQLite Cloud o Turso
export const db = createClient({
  url: process.env.DATABASE_URL || '',
  authToken: process.env.DATABASE_AUTH_TOKEN || '',
});
