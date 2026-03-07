const { pool } = require('./config/database');
const bcrypt = require('bcryptjs');

const seedData = async () => {
  try {
    console.log('🌱 Starting multi-gym seed...');

    // ==========================================
    // 1. CREATE 5 GYMS
    // ==========================================
    console.log('\n📍 Creating 5 gyms...');
    
    const gyms = [
      {
        name: 'ATOM Fitness',
        slug: 'atom-fitness',
        owner_name: 'Rajesh Kumar',
        owner_email: 'rajesh@atomfitness.com',
        owner_phone: '9876543210',
        address: 'Connaught Place, New Delhi, Delhi 110001'
      },
      {
        name: 'PowerHouse Gym',
        slug: 'powerhouse-gym',
        owner_name: 'Vikram Malhotra',
        owner_email: 'vikram@powerhouse.com',
        owner_phone: '9876543211',
        address: 'Bandra West, Mumbai, Maharashtra 400050'
      },
      {
        name: 'Yoga Studio Zen',
        slug: 'yoga-studio-zen',
        owner_name: 'Priya Sharma',
        owner_email: 'priya@yogazen.com',
        owner_phone: '9876543212',
        address: 'Koramangala, Bangalore, Karnataka 560034'
      },
      {
        name: 'CrossFit Arena',
        slug: 'crossfit-arena',
        owner_name: 'Arjun Desai',
        owner_email: 'arjun@crossfitarena.com',
        owner_phone: '9876543213',
        address: 'Viman Nagar, Pune, Maharashtra 411014'
      },
      {
        name: 'Ladies Fitness Hub',
        slug: 'ladies-fitness-hub',
        owner_name: 'Sneha Reddy',
        owner_email: 'sneha@ladiesfitness.com',
        owner_phone: '9876543214',
        address: 'Banjara Hills, Hyderabad, Telangana 500034'
      }
    ];

    const gymIds = {};
    for (const gym of gyms) {
      const result = await pool.query(
        `INSERT INTO gyms (name, slug, owner_name, owner_email, owner_phone, address, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, true)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
         RETURNING id, name, slug`,
        [gym.name, gym.slug, gym.owner_name, gym.owner_email, gym.owner_phone, gym.address]
      );
      gymIds[gym.slug] = result.rows[0].id;
      console.log(`✅ ${gym.name} - ${result.rows[0].id}`);
    }

    // ==========================================
    // 2. CREATE MEMBERSHIP PLANS FOR EACH GYM
    // ==========================================
    console.log('\n💳 Creating membership plans...');
    
    const plans = {
      'atom-fitness': [
        { name: 'Monthly Basic', duration: 30, price: 1500 },
        { name: 'Quarterly Pro', duration: 90, price: 4000 },
        { name: 'Yearly Premium', duration: 365, price: 15000 }
      ],
      'powerhouse-gym': [
        { name: 'Monthly Muscle', duration: 30, price: 2000 },
        { name: 'Quarterly Beast', duration: 90, price: 5500 },
        { name: 'Yearly Champion', duration: 365, price: 20000 }
      ],
      'yoga-studio-zen': [
        { name: 'Monthly Zen', duration: 30, price: 1200 },
        { name: 'Quarterly Peace', duration: 90, price: 3200 },
        { name: 'Yearly Harmony', duration: 365, price: 12000 }
      ],
      'crossfit-arena': [
        { name: 'Monthly WOD', duration: 30, price: 2500 },
        { name: 'Quarterly Elite', duration: 90, price: 6500 },
        { name: 'Yearly Beast Mode', duration: 365, price: 24000 }
      ],
      'ladies-fitness-hub': [
        { name: 'Monthly Fit', duration: 30, price: 1800 },
        { name: 'Quarterly Glow', duration: 90, price: 4800 },
        { name: 'Yearly Transform', duration: 365, price: 18000 }
      ]
    };

    const planIds = {};
    for (const [slug, gymPlans] of Object.entries(plans)) {
      planIds[slug] = [];
      for (const plan of gymPlans) {
        const result = await pool.query(
          `INSERT INTO membership_plans (name, duration_days, price, gym_id, is_active)
           VALUES ($1, $2, $3, $4, true)
           RETURNING id, name`,
          [plan.name, plan.duration, plan.price, gymIds[slug]]
        );
        planIds[slug].push(result.rows[0].id);
        console.log(`  ✅ ${gyms.find(g => g.slug === slug).name} - ${plan.name}`);
      }
    }

    // ==========================================
    // 3. CREATE ADMINS FOR EACH GYM
    // ==========================================
    console.log('\n👑 Creating admin accounts...');
    
    const adminPassword = await bcrypt.hash('Admin@123', 12);
    const admins = [
      { name: 'Rajesh Kumar', email: 'admin@atomfitness.com', gym_slug: 'atom-fitness' },
      { name: 'Vikram Malhotra', email: 'admin@powerhouse.com', gym_slug: 'powerhouse-gym' },
      { name: 'Priya Sharma', email: 'admin@yogazen.com', gym_slug: 'yoga-studio-zen' },
      { name: 'Arjun Desai', email: 'admin@crossfitarena.com', gym_slug: 'crossfit-arena' },
      { name: 'Sneha Reddy', email: 'admin@ladiesfitness.com', gym_slug: 'ladies-fitness-hub' }
    ];

    for (const admin of admins) {
      await pool.query(
        `INSERT INTO members (name, email, password_hash, role, gym_id, is_active)
         VALUES ($1, $2, $3, 'admin', $4, true)
         ON CONFLICT (email, gym_id) DO NOTHING`,
        [admin.name, admin.email, adminPassword, gymIds[admin.gym_slug]]
      );
      console.log(`✅ ${admin.email} - Password: Admin@123`);
    }

    // ==========================================
    // 4. CREATE STAFF FOR EACH GYM
    // ==========================================
    console.log('\n👔 Creating staff accounts...');
    
    const staffPassword = await bcrypt.hash('Staff@123', 12);
    const staffMembers = [
      // ATOM Fitness
      { name: 'Amit Sharma', email: 'amit@atomfitness.com', phone: '9876000001', gym_slug: 'atom-fitness' },
      { name: 'Neha Gupta', email: 'neha@atomfitness.com', phone: '9876000002', gym_slug: 'atom-fitness' },
      { name: 'Rahul Singh', email: 'rahul@atomfitness.com', phone: '9876000003', gym_slug: 'atom-fitness' },
      
      // PowerHouse
      { name: 'Ravi Patel', email: 'ravi@powerhouse.com', phone: '9876000004', gym_slug: 'powerhouse-gym' },
      { name: 'Karan Mehta', email: 'karan@powerhouse.com', phone: '9876000005', gym_slug: 'powerhouse-gym' },
      
      // Yoga Zen
      { name: 'Ananya Iyer', email: 'ananya@yogazen.com', phone: '9876000006', gym_slug: 'yoga-studio-zen' },
      { name: 'Kavya Nair', email: 'kavya@yogazen.com', phone: '9876000007', gym_slug: 'yoga-studio-zen' },
      
      // CrossFit
      { name: 'Rohan Das', email: 'rohan@crossfitarena.com', phone: '9876000008', gym_slug: 'crossfit-arena' },
      { name: 'Aman Joshi', email: 'aman@crossfitarena.com', phone: '9876000009', gym_slug: 'crossfit-arena' },
      { name: 'Vishal Kumar', email: 'vishal@crossfitarena.com', phone: '9876000010', gym_slug: 'crossfit-arena' },
      
      // Ladies Hub
      { name: 'Pooja Verma', email: 'pooja@ladiesfitness.com', phone: '9876000011', gym_slug: 'ladies-fitness-hub' },
      { name: 'Ritu Singh', email: 'ritu@ladiesfitness.com', phone: '9876000012', gym_slug: 'ladies-fitness-hub' }
    ];

    for (const staff of staffMembers) {
      const result = await pool.query(
        `INSERT INTO members (name, email, phone, password_hash, role, gym_id, is_active)
         VALUES ($1, $2, $3, $4, 'staff', $5, true)
         ON CONFLICT (email, gym_id) DO NOTHING
         RETURNING id`,
        [staff.name, staff.email, staff.phone, staffPassword, gymIds[staff.gym_slug]]
      );
      
      if (result.rows.length > 0) {
        // Create permissions
        await pool.query(
          `INSERT INTO staff_permissions (
            staff_id, gym_id, can_scan_attendance, can_view_members,
            can_add_members, can_edit_members, can_delete_members,
            can_view_subscriptions, can_add_subscriptions, can_view_attendance,
            can_view_reports, can_view_financial
          ) VALUES ($1, $2, true, true, true, false, false, true, true, true, false, false)
          ON CONFLICT (staff_id, gym_id) DO NOTHING`,
          [result.rows[0].id, gymIds[staff.gym_slug]]
        );
        console.log(`✅ ${staff.name} (${staff.email}) - Password: Staff@123`);
      }
    }

    // ==========================================
    // 5. CREATE MEMBERS FOR EACH GYM
    // ==========================================
    console.log('\n👥 Creating member accounts...');
    
    const memberPassword = await bcrypt.hash('Member@123', 12);
    
    const firstNames = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Arnav', 'Ayaan', 'Krishna', 'Ishaan',
                        'Ananya', 'Diya', 'Aaradhya', 'Navya', 'Pari', 'Sara', 'Myra', 'Aanya', 'Saanvi', 'Kiara'];
    const lastNames = ['Sharma', 'Verma', 'Kumar', 'Singh', 'Patel', 'Gupta', 'Reddy', 'Iyer', 'Joshi', 'Mehta'];

    let memberCounter = 1;
    const memberIds = {};

    for (const [slug, gymId] of Object.entries(gymIds)) {
      memberIds[slug] = [];
      const memberCount = slug === 'atom-fitness' ? 20 : 
                         slug === 'powerhouse-gym' ? 15 : 
                         slug === 'yoga-studio-zen' ? 12 : 
                         slug === 'crossfit-arena' ? 18 : 10;

      for (let i = 0; i < memberCount; i++) {
        const firstName = firstNames[i % firstNames.length];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const name = `${firstName} ${lastName}`;
        const email = `member${memberCounter}@${slug}.com`;
        const phone = `98765${String(memberCounter).padStart(5, '0')}`;

        const result = await pool.query(
          `INSERT INTO members (name, email, phone, password_hash, role, gym_id, gender, is_active)
           VALUES ($1, $2, $3, $4, 'member', $5, $6, true)
           ON CONFLICT (email, gym_id) DO NOTHING
           RETURNING id`,
          [name, email, phone, memberPassword, gymId, i % 2 === 0 ? 'Male' : 'Female']
        );

        if (result.rows.length > 0) {
          memberIds[slug].push(result.rows[0].id);
        }
        memberCounter++;
      }
      console.log(`✅ ${gyms.find(g => g.slug === slug).name} - ${memberCount} members`);
    }

    // ==========================================
    // 6. CREATE SUBSCRIPTIONS
    // ==========================================
    console.log('\n💰 Creating subscriptions...');
    
    for (const [slug, gymMemberIds] of Object.entries(memberIds)) {
      const gymPlanIds = planIds[slug];
      
      for (let i = 0; i < gymMemberIds.length; i++) {
        const memberId = gymMemberIds[i];
        const planId = gymPlanIds[i % gymPlanIds.length];
        
        // Get plan details
        const planResult = await pool.query(
          'SELECT duration_days, price FROM membership_plans WHERE id = $1',
          [planId]
        );
        const plan = planResult.rows[0];
        
        // Random start date in last 60 days
        const daysAgo = Math.floor(Math.random() * 60);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysAgo);
        
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + plan.duration_days);
        
        const status = endDate > new Date() ? 'active' : 'expired';
        
        await pool.query(
          `INSERT INTO subscriptions (
            member_id, plan_id, gym_id, start_date, end_date,
            status, payment_method, amount_paid
          ) VALUES ($1, $2, $3, $4, $5, $6, 'cash', $7)`,
          [
            memberId, planId, gymIds[slug],
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0],
            status, plan.price
          ]
        );
      }
      console.log(`✅ ${gyms.find(g => g.slug === slug).name} - Subscriptions created`);
    }

    // ==========================================
    // 7. CREATE ATTENDANCE LOGS (LAST 30 DAYS)
    // ==========================================
    console.log('\n📅 Creating attendance logs...');
    
    for (const [slug, gymMemberIds] of Object.entries(memberIds)) {
      let totalAttendance = 0;
      
      for (const memberId of gymMemberIds) {
        // Random attendance - 10 to 25 days in last 30 days
        const attendanceDays = Math.floor(Math.random() * 15) + 10;
        
        for (let i = 0; i < attendanceDays; i++) {
          const daysAgo = Math.floor(Math.random() * 30);
          const checkInDate = new Date();
          checkInDate.setDate(checkInDate.getDate() - daysAgo);
          
          // Random time between 6 AM and 10 PM
          const hour = Math.floor(Math.random() * 16) + 6;
          const minute = Math.floor(Math.random() * 60);
          checkInDate.setHours(hour, minute, 0, 0);
          
          await pool.query(
            `INSERT INTO attendance_logs (
              member_id, gym_id, check_in_time, check_in_date, scan_method
            ) VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT DO NOTHING`,
            [
              memberId, gymIds[slug], checkInDate,
              checkInDate.toISOString().split('T')[0],
              Math.random() > 0.3 ? 'qr' : 'manual'
            ]
          );
          totalAttendance++;
        }
      }
      console.log(`✅ ${gyms.find(g => g.slug === slug).name} - ${totalAttendance} check-ins`);
    }

    // ==========================================
    // 8. CREATE GYM QR CODES
    // ==========================================
    console.log('\n🎯 Creating gym QR codes...');
    
    const QRCode = require('qrcode');
    const crypto = require('crypto');
    
    for (const [slug, gymId] of Object.entries(gymIds)) {
      const token = crypto.randomBytes(32).toString('hex');
      const gymName = gyms.find(g => g.slug === slug).name;
      
      const qrData = JSON.stringify({
        type: 'GYM_CHECKIN',
        token: token,
        gym_id: gymId,
        gym: gymName
      });

      const qrImageData = await QRCode.toDataURL(qrData, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 400,
        color: { dark: '#ff3d00', light: '#ffffff' }
      });

      await pool.query(
        `INSERT INTO gym_qr_codes (token, qr_image_data, gym_id, location, is_active)
         VALUES ($1, $2, $3, 'Main Entrance', true)
         ON CONFLICT DO NOTHING`,
        [token, qrImageData, gymId]
      );
      console.log(`✅ ${gymName} - QR Code created`);
    }

    // ==========================================
    // SUMMARY
    // ==========================================
    console.log('\n' + '='.repeat(50));
    console.log('🎉 SEED COMPLETE!');
    console.log('='.repeat(50));
    
    for (const gym of gyms) {
      console.log(`\n📍 ${gym.name.toUpperCase()}`);
      console.log(`   Admin: ${gym.owner_email} / Admin@123`);
      console.log(`   Staff: staff@${gym.slug}.com / Staff@123`);
      console.log(`   Members: member1@${gym.slug}.com to memberN@${gym.slug}.com / Member@123`);
      console.log(`   Plans: ${plans[gym.slug].length}`);
      console.log(`   Address: ${gym.address}`);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 TOTAL STATS:');
    console.log('   Gyms: 5');
    console.log('   Admins: 5');
    console.log('   Staff: 12');
    console.log('   Members: 75');
    console.log('   Plans: 15');
    console.log('   Active Subscriptions: ~60');
    console.log('   Attendance Records: ~1000+');
    console.log('='.repeat(50));

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
};

seedData();