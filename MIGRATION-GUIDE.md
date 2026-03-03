# 🔄 Migration Guide - Updating to New QR System

## If You're Getting UUID Error

The error "No function matches uuid_generate_v4()" means the PostgreSQL UUID extension isn't enabled.

### Fix It:

**Option 1: Run Migration Script (Easiest)**

```bash
# From your project root
psql -U postgres -d atom_fitness -f backend/config/migrate.sql
```

**Option 2: Manual Steps**

Open psql and run:

```bash
psql -U postgres -d atom_fitness
```

Then paste these commands:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create gym QR table
CREATE TABLE IF NOT EXISTS gym_qr_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token VARCHAR(255) UNIQUE NOT NULL,
    qr_image_data TEXT NOT NULL,
    location VARCHAR(100) DEFAULT 'Main Entrance',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add new column to attendance_logs
ALTER TABLE attendance_logs 
ADD COLUMN IF NOT EXISTS gym_qr_id UUID REFERENCES gym_qr_codes(id) ON DELETE SET NULL;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_gym_qr_token ON gym_qr_codes(token);

-- Exit
\q
```

---

## Starting Fresh? (No Existing Data)

If you're starting from scratch:

**Option 1: Drop and Recreate (DELETES ALL DATA)**

```bash
# Drop database
psql -U postgres -c "DROP DATABASE IF EXISTS atom_fitness;"

# Create fresh
psql -U postgres -c "CREATE DATABASE atom_fitness;"

# Run schema
psql -U postgres -d atom_fitness -f backend/config/schema.sql

# Seed admin
cd backend
node utils/seed.js
```

**Option 2: Just Enable Extension**

```bash
psql -U postgres -d atom_fitness -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
```

Then restart your backend server.

---

## Verify It Worked

```bash
psql -U postgres -d atom_fitness

# Check if extension is enabled
\dx

# Should see "uuid-ossp" in the list

# Check if table exists
\dt gym_qr_codes

# Exit
\q
```

---

## Common Issues

**"database atom_fitness does not exist"**
```bash
psql -U postgres -c "CREATE DATABASE atom_fitness;"
psql -U postgres -d atom_fitness -f backend/config/schema.sql
```

**"permission denied"**
```bash
# Try with sudo (Linux/Mac)
sudo -u postgres psql -d atom_fitness -f backend/config/schema.sql

# Or login as superuser
psql -U postgres
CREATE EXTENSION "uuid-ossp";
```

**Still not working?**

Check PostgreSQL version:
```bash
psql --version
```

Need PostgreSQL 9.1+ for uuid-ossp extension.

---

## After Migration

1. Restart backend server (Ctrl+C, then `npm start`)
2. Login as admin
3. Go to **Attendance → Gym QR Code**
4. You should see the gym QR code page!

---

Need help? The UUID extension is standard in PostgreSQL but needs to be enabled per database.
