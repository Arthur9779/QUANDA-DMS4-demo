const mysql = require("mysql2/promise");

function createPool(config) {
  return mysql.createPool({
    ...config,
    charset: "utf8mb4",
    timezone: "Z",
    connectionLimit: 8,
    maxIdle: 4,
    idleTimeout: 60_000,
    queueLimit: 50,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    decimalNumbers: true,
  });
}

async function withTransaction(pool, operation) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await operation(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { createPool, withTransaction };
