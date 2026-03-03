# ⚡ ATOM FITNESS — Gym Management System

**NEW: Members scan gym's QR code to check in** (much more practical!)

A complete, locally-hosted gym management web application with **reversed QR attendance** - the gym displays one QR code, members scan it with their phones.

---

## 🎯 How The New System Works

### Old System (Complicated):
- ❌ Each member had their own QR code
- ❌ Admin needed to scan every member at entrance
- ❌ Required webcam at reception

### New System (Better!):
- ✅ **Gym has ONE QR code** displayed at entrance
- ✅ **Members scan it with their phones** to check in
- ✅ Instant validation & attendance logging
- ✅ No admin scanning needed!

---

## 🚀 Quick Start

Same setup process, with database schema update:

**1. Create database:**
```bash
psql -U postgres -c "CREATE DATABASE atom_fitness;"
psql -U postgres -d atom_fitness -f atom-fitness/backend/config/schema.sql
```

**2. Configure backend:**
```bash
cd atom-fitness/backend
cp .env.example .env
# Edit .env → set your DB_PASSWORD
```

**3. Install & start backend:**
```bash
npm install
npm run seed
npm start
```

**4. Install & start frontend:**
```bash
cd atom-fitness/frontend
npm install
npm start
```

**5. Login:** `admin@atomfitness.com` / `Admin@123`

---

## 📱 New Workflow

### Admin Setup (One-Time):

1. **Login as admin**
2. Go to **Attendance → Gym QR Code**
3. **Download/Print** the gym's QR code
4. **Display it** at gym entrance
5. Done!

### Member Check-In (Daily):

1. **Login to member app** on phone
2. Tap **"Check In"**
3. **Scan the gym's QR code** at entrance
4. ✅ Instant confirmation!

---

## 🔄 Updating From Old Version

If you already have the old system:

```bash
psql -U postgres -d atom_fitness

CREATE TABLE IF NOT EXISTS gym_qr_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token VARCHAR(255) UNIQUE NOT NULL,
    qr_image_data TEXT NOT NULL,
    location VARCHAR(100) DEFAULT 'Main Entrance',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS gym_qr_id UUID REFERENCES gym_qr_codes(id) ON DELETE SET NULL;

\q
```

Then replace code files and restart servers.

---

## 🎯 Benefits

| Old System | New System |
|-----------|------------|
| Complex setup | Simple |
| Webcam required | Member's phone |
| Admin scans each | Self-service |
| Bottleneck at entrance | No bottleneck |
| One QR per member | One QR for gym |

---

Built for ATOM FITNESS • Production-Ready
