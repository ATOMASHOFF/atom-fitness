const bcrypt = require('bcryptjs');
const { pool, testConnection } = require('../config/database');
require('dotenv').config();

const seed = async () => {
  console.log('\n🌱 ATOM FITNESS - Database Seeder\n');
  
  await testConnection();

  try {
    // Check if admin exists
    const existing = await pool.query(
      "SELECT id FROM members WHERE email = $1 AND role = 'admin'",
      [process.env.ADMIN_EMAIL || 'admin@atomfitness.com']
    );

    if (existing.rows.length > 0) {
      console.log('✅ Admin account already exists:', process.env.ADMIN_EMAIL);
    } else {
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123', 12);
      
      await pool.query(
        `INSERT INTO members (name, email, password_hash, role) VALUES ($1, $2, $3, 'admin')`,
        [
          process.env.ADMIN_NAME || 'Super Admin',
          process.env.ADMIN_EMAIL || 'admin@atomfitness.com',
          hashedPassword
        ]
      );
      console.log('✅ Admin account created:');
      console.log('   Email:', process.env.ADMIN_EMAIL || 'admin@atomfitness.com');
      console.log('   Password:', process.env.ADMIN_PASSWORD || 'Admin@123');
    }

    // Check membership plans
    const plans = await pool.query('SELECT COUNT(*) FROM membership_plans');
    console.log(`✅ Membership plans: ${plans.rows[0].count} plans found`);

    console.log('\n🎉 Seed complete! You can now start the server.\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
};

seed();
