import { Database } from '@sqlitecloud/drivers';

export const connectionString = process.env.DATABASE_URL || '';

if (!connectionString) {
  console.error('ADVERTENCIA: La variable de entorno DATABASE_URL no está configurada.');
}

// Función auxiliar recomendada para ejecutar consultas abriendo y cerrando la conexión de forma segura
export async function runQuery(queryCallback: (db: InstanceType<typeof Database>) => Promise<any>) {
  if (!connectionString) {
    throw new Error('DATABASE_URL no está configurada.');
  }

  const db = new Database(connectionString);

  try {
    return await queryCallback(db);
  } finally {
    // Cerramos la conexión de manera segura para liberar el slot inmediatamente
    try {
      db.close();
    } catch (closeError) {
      console.error("Error al cerrar la conexión con SQLite Cloud:", closeError);
    }
  }
}
