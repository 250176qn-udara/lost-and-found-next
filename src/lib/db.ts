import 'server-only';
import mysql, { type Pool, type PoolConnection, type ResultSetHeader, type RowDataPacket } from 'mysql2/promise';

type Param = string | number | boolean | null;
type Runner = Pool | PoolConnection;

// Reuse one pool across hot reloads in development.
const g = globalThis as unknown as { lfPool?: Pool };

export const pool: Pool =
  g.lfPool ??
  mysql.createPool({
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 3306),
    database: process.env.DB_NAME ?? 'lost_and_found',
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    charset: 'utf8mb4',
    dateStrings: true, // keep DATE / TIMESTAMP as strings, like PDO did
    connectionLimit: 10,
  });
if (process.env.NODE_ENV !== 'production') g.lfPool = pool;

export async function all<T>(sql: string, params: Param[] = [], db: Runner = pool): Promise<T[]> {
  const [rows] = await db.execute<RowDataPacket[]>(sql, params);
  return rows as T[];
}

export async function one<T>(sql: string, params: Param[] = [], db: Runner = pool): Promise<T | null> {
  return (await all<T>(sql, params, db))[0] ?? null;
}

export async function exec(sql: string, params: Param[] = [], db: Runner = pool): Promise<ResultSetHeader> {
  const [res] = await db.execute<ResultSetHeader>(sql, params);
  return res;
}

/** Runs fn inside a transaction; rolls back if it throws. */
export async function transaction<T>(fn: (conn: PoolConnection) => Promise<T>): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}
