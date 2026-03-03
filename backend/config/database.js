const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

module.exports = { pool, testConnection: async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Database connection test successful');
    client.release();
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
  }
}};
