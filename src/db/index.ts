import { drizzle } from 'drizzle-orm/sqlite-proxy';
import { SQLiteCloudClient } from '@sqlitecloud/drivers';

const connectionString = process.env.DATABASE_URL || "sqlitecloud://cza41vhuvk.g5.sqlite.cloud:8860/pos_db?apikey=fHKwclvJoINckgr9aCbyR44haillDrm60hQibbXb4Zg";

const client = new SQLiteCloudClient(connectionString);

export const db = drizzle(async (sql, params, method) => {
  try {
    const response = await client.sql(sql);
    return { rows: response || [] };
  } catch (error) {
    console.error('Error al ejecutar la consulta:', error);
    return { rows: [] };
  }
});
