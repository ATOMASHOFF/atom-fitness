const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
require('dotenv').config();

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting seed process...');
    
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database');

    // Check if admin already exists
    const existingAdmin = await client.query(
      'SELECT * FROM members WHERE email = $1',
      [process.env.ADMIN_EMAIL || 'admin@atomfitness.com']
    );

    if (existingAdmin.rows.length > 0) {
      console.log('⚠️  Admin account already exists:', existingAdmin.rows[0].email);
    } else {
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

      console.log('✅ Admin account created:', process.env.ADMIN_EMAIL || 'admin@atomfitness.com');
    }

    // Check membership plans
    const plans = await client.query('SELECT * FROM membership_plans');
    console.log(`✅ Membership plans: ${plans.rows.length} plans found`);

    if (plans.rows.length === 0) {
      console.log('⚠️  No membership plans found. Creating default plans...');
      
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
      
      console.log('✅ Created 4 default membership plans');
    }

    client.release();
    console.log('🎉 Seed complete! Starting server...');
    // Don't exit - let the script continue to server.js

  } catch (err) {
    console.error('❌ Seed error:', err);
    console.log('⚠️  Continuing to start server anyway...');
    // Don't exit on error - server can still start
  }
};

// Run seed and export
seedDatabase();