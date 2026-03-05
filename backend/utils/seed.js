const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
require('dotenv').config();

const seedDatabase = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting seed process...');

    // Check if admin already exists
    const existingAdmin = await client.query(
      'SELECT * FROM members WHERE email = $1',
      [process.env.ADMIN_EMAIL || 'admin@atomfitness.com']
    );

    if (existingAdmin.rows.length > 0) {
      console.log('⚠️  Admin account already exists');
      client.release();
      await pool.end(); // Close pool
      process.exit(0); // Exit cleanly
      return;
    }

    // Hash admin password
    const hashedPassword = await bcrypt.hash(
      process.env.ADMIN_PASSWORD || 'Admin@123',
      12
    );

    // Create admin account
    await client.query(
      `INSERT INTO members (name, email, password_hash, role, is_active)
       VALUES ($1, $2, $3, 'admin', true)`,
      [
        process.env.ADMIN_NAME || 'Super Admin',
        process.env.ADMIN_EMAIL || 'admin@atomfitness.com',
        hashedPassword
      ]
    );

    console.log('✅ Admin account created');

    // Check and create plans if needed
    const plans = await client.query('SELECT * FROM membership_plans');
    
    if (plans.rows.length === 0) {
      const defaultPlans = [
        { name: 'Monthly', duration: 30, price: 2000, description: 'Perfect for trying out the gym' },
        { name: 'Quarterly', duration: 90, price: 5500, description: 'Save 8% with quarterly plan' },
        { name: 'Half Yearly', duration: 180, price: 10000, description: 'Save 17% with half-yearly plan' },
        { name: 'Annual', duration: 365, price: 18000, description: 'Best value - Save 25%' }
      ];

      for (const plan of defaultPlans) {
        await client.query(
          `INSERT INTO membership_plans (name, duration_days, price, description)
           VALUES ($1, $2, $3, $4)`,
          [plan.name, plan.duration, plan.price, plan.description]
        );
      }
      console.log('✅ Created default plans');
    }

    client.release();
    await pool.end(); // Important: Close pool connection
    console.log('🎉 Seed complete!');
    process.exit(0); // Exit cleanly

  } catch (err) {
    console.error('❌ Seed error:', err);
    client.release();
    await pool.end();
    process.exit(1); // Exit with error
  }
};

seedDatabase();