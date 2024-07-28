import { createPool, Pool, RowDataPacket } from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

let pool: Pool;

export const initDatabase = async () => {
  pool = await createPool({
    host: 'roundhouse.proxy.rlwy.net',  
    user: 'root',
    password: 'OXhKSPlISeQkFbHEYhQlXxKPugTZnxia',
    database: 'railway',
    port: 50560,
    waitForConnections: true,
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

export const getLatestRate = async () => {
  const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM rates ORDER BY date DESC LIMIT 1');
  return rows.length ? rows[0] : null;
};

export const exportRatesToJSON = async () => {
  const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM rates');
  
  // Usuwanie duplikatów po dacie
  const uniqueRows = Array.from(new Map(rows.map((item) => [item.date, item])).values());

  // Sortowanie od najstarszych do najnowszych
  uniqueRows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const filePath = path.join(__dirname, 'rates.json');
  fs.writeFileSync(filePath, JSON.stringify(uniqueRows, null, 2), 'utf-8');
  return filePath;
};