import { Database } from '@sqlitecloud/drivers';

// Inicializar la conexión usando SQLite Cloud con la variable de entorno
const connectionString = process.env.DATABASE_URL || '';

if (!connectionString) {
  console.error('ADVERTENCIA: La variable de entorno DATABASE_URL no está configurada.');
}

export const db = new Database(connectionString);
