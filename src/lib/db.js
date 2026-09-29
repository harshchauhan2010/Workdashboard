import { Pool } from "pg";

// 1. Create a connection pool using the DATABASE_URL from .env.local
function createPool() {
  const p = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  // Force search_path=workdash on EVERY new client that the pool creates.
  // This is more reliable than the `options` string because it runs
  // even when a cached global pool is reused after hot-reload.
  p.on("connect", (client) => {
    client.query("SET search_path TO workdash");
  });

  return p;
}

// 2. In development, save the pool globally to prevent duplicate connections on hot-reload.
//    But if db.js changes (e.g. you update this file), we reset the pool so the
//    new `connect` handler is registered correctly.
if (!global._pgPool) {
  global._pgPool = createPool();
}

const pool = global._pgPool;

// 3. Export the pool so other files can use: await pool.query(...)
export default pool;
