import { drizzle } from 'drizzle-orm/sqlite-cloud';
import { SQLiteCloudClient } from '@sqlitecloud/drivers';

const connectionString = process.env.DATABASE_URL || "sqlitecloud://cza41vhuvk.g5.sqlite.cloud:8860/pos_db?apikey=fhKwclvjolNckgr9aCbyR44haiLLdrm6OhQibbXb4Zg";

const client = new SQLiteCloudClient(connectionString);
export const db = drizzle(client);
