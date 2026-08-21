import { Database } from '@sqlitecloud/drivers';

export const connectionString = process.env.DATABASE_URL || '';

if (!connectionString) {
  console.error('ADVERTENCIA: La variable de entorno DATABASE_URL no está configurada.');
}

// Instancia global de compatibilidad para rutas antiguas que usan { db }
export const db = new Database(connectionString);

/**
 * Función recomendada para abrir, ejecutar y cerrar la conexión automáticamente 
 * por cada petición, evitando saturar SQLite Cloud.
 */
export async function runQuery(queryCallback: (database: InstanceType<typeof Database>) => Promise<any>) {
  if (!connectionString) {
    throw new Error('DATABASE_URL no está configurada.');
  }

  const client = new Database(connectionString);

  try {
    return await queryCallback(client);
  } finally {
    try {
      client.close();
    } catch (closeError) {
      console.error("Error al cerrar la conexión con SQLite Cloud:", closeError);
    }
  }
}
