# 🔧 Quick Patch - Apply New QR System

This patch updates your existing installation without re-downloading everything.

---

## 📋 Step 1: Run Database Migration

Open Command Prompt/PowerShell in your project folder:

```bash
cd C:\Users\ATOMASHOFF\Downloads\atom-fitness

# Run migration
psql -U postgres -d atom_fitness
```

Paste this SQL:

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

-- Add gym_qr_id to attendance
ALTER TABLE attendance_logs 
ADD COLUMN IF NOT EXISTS gym_qr_id UUID REFERENCES gym_qr_codes(id) ON DELETE SET NULL;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_gym_qr_token ON gym_qr_codes(token);
CREATE INDEX IF NOT EXISTS idx_gym_qr_active ON gym_qr_codes(is_active);

-- Exit
\q
```

---

## 📋 Step 2: Copy New Files

From this patch folder, copy these files to your project:

### Backend Files (Copy to `backend/`):

1. **controllers/gymQRController.js** → `backend/controllers/`
2. **controllers/attendanceController.js** → `backend/controllers/` (REPLACE existing)
3. **routes/gymQR.js** → `backend/routes/`
4. **routes/attendance.js** → `backend/routes/` (REPLACE existing)

### Frontend Files (Copy to `frontend/src/`):

5. **pages/admin/GymQRPage.js** → `frontend/src/pages/admin/`
6. **pages/member/CheckInPage.js** → `frontend/src/pages/member/`
7. **components/shared/Sidebar.js** → `frontend/src/components/shared/` (REPLACE)
8. **App.js** → `frontend/src/` (REPLACE)
9. **pages/member/MemberDashboard.js** → `frontend/src/pages/member/` (REPLACE)
10. **pages/admin/Dashboard.js** → `frontend/src/pages/admin/` (REPLACE)

---

## 📋 Step 3: Update server.js

Open `backend/server.js` in VS Code and add these lines:

**After line 6** (after other route imports):
```javascript
const gymQRRoutes = require('./routes/gymQR');
```

**After line 23** (after other app.use statements):
```javascript
app.use('/api/gym-qr', gymQRRoutes);
```

Your server.js should look like:
```javascript
const authRoutes = require('./routes/auth');
const memberRoutes = require('./routes/members');
const subscriptionRoutes = require('./routes/subscriptions');
const attendanceRoutes = require('./routes/attendance');
const gymQRRoutes = require('./routes/gymQR');  // ← ADD THIS

// ... middleware ...

app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/gym-qr', gymQRRoutes);  // ← ADD THIS
```

---

## 📋 Step 4: Restart Servers

### In VS Code Terminal 1 (Backend):
```bash
# Stop server (Ctrl+C)
# Restart
npm start
```

### In VS Code Terminal 2 (Frontend):
```bash
# Stop server (Ctrl+C)
# Restart
npm start
```

---

## ✅ Step 5: Verify It Works

1. Open http://localhost:3000
2. Login as admin
3. Go to **Attendance** menu
4. You should see **"Gym QR Code"** option
5. Click it → You'll see the gym's QR code!

---

## 🎯 What Changed

### Removed:
- ❌ `/admin/scanner` page (old QR scanner)
- ❌ `/member/qr` page (member personal QR)

### Added:
- ✅ `/admin/gym-qr` page (gym's static QR code)
- ✅ `/member/checkin` page (member scans gym QR)

### Updated:
- Navigation menus
- Dashboard links
- API endpoints

---

## 🆘 If Something Breaks

**Backend won't start:**
- Check you added both lines to server.js
- Verify all new files are copied to correct folders
- Run `npm install` in backend folder

**Frontend won't start:**
- Clear browser cache (Ctrl+Shift+Delete)
- Delete `node_modules` and run `npm install` again
- Check console for errors (F12)

**"Table gym_qr_codes doesn't exist":**
- You didn't run the SQL migration
- Go back to Step 1

---

## 📦 Files in This Patch

```
patch/
├── APPLY-PATCH.md (this file)
├── backend/
│   ├── controllers/
│   │   ├── gymQRController.js (NEW)
│   │   └── attendanceController.js (UPDATED)
│   └── routes/
│       ├── gymQR.js (NEW)
│       └── attendance.js (UPDATED)
└── frontend/src/
    ├── pages/
    │   ├── admin/
    │   │   ├── GymQRPage.js (NEW)
    │   │   └── Dashboard.js (UPDATED)
    │   └── member/
    │       ├── CheckInPage.js (NEW)
    │       └── MemberDashboard.js (UPDATED)
    ├── components/shared/
    │   └── Sidebar.js (UPDATED)
    └── App.js (UPDATED)
```

Total files to copy: **10 files**

Much easier than re-installing everything! 🚀
