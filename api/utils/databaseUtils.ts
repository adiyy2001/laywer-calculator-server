import { createPool, Pool } from 'mysql2/promise';

let pool: Pool;

export const initDatabase = async () => {
  pool = await createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'rootpassword',
    database: process.env.DB_NAME || 'wibor',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0

  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS rates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      date DATE NOT NULL,
      wibor3m text,
      wibor6m text
    )
  `);
};

export const saveRatesToDatabase = async (rates: { date: string; wibor3m: string; wibor6m: string }[]) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (const rate of rates) {
      await connection.query(
        'INSERT INTO rates (date, wibor3m, wibor6m) VALUES (?, ?, ?)',
        [rate.date, rate.wibor3m, rate.wibor6m]
      );
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const getAllRates = async () => {
  const [rows] = await pool.query('SELECT * FROM rates');
  return rows;
};
