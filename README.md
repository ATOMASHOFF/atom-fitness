# Gym Management SaaS MVP

A simple and scalable **Gym Management SaaS application** built to help gym owners manage members, track attendance through QR scanning, and monitor memberships.

This MVP is designed to work for a **single gym initially but supports multi-gym architecture**, allowing the system to scale to thousands of gyms in the future.

---

## Features

### Authentication

* Secure login using Supabase Auth
* Role-based access: **Admin** and **Member**

### Admin Features

* Add and manage gym members
* View members list
* Track membership expiry
* View today's attendance
* Dashboard with basic statistics

### Member Features

* View membership status
* See membership expiry date
* Scan QR code to mark attendance
* View attendance history

### QR Attendance System

* Each gym has a **universal QR code**
* Members scan the QR to mark their check-in
* Attendance can be marked **once per day**

---

## Tech Stack

Frontend

* Next.js
* TypeScript
* Tailwind CSS

Backend

* Supabase (PostgreSQL database, authentication, API)

Hosting

* Vercel (Frontend)
* Supabase (Backend)

---

## Project Structure

/app
/components
/lib
/pages
/styles

---

## Database Tables

### gyms

Stores gym information.

Fields:

* id
* gym_name
* owner_name
* email
* phone
* created_at

### members

Stores member information.

Fields:

* id
* gym_id
* name
* phone
* email
* membership_start_date
* membership_end_date
* membership_status
* created_at

### attendance

Stores attendance records.

Fields:

* id
* gym_id
* member_id
* check_in_time
* date

---

## Core Workflow

1. Admin creates gym account
2. Admin adds members
3. Gym displays universal QR code
4. Member logs in and scans QR
5. Attendance is recorded in database
6. Admin dashboard shows attendance data

---

## Security

Supabase Row Level Security ensures:

* Admins access only their gym data
* Members access only their own data

---

## Future Features

Planned upgrades:

* Payment integration
* Membership renewal reminders
* Trainer management
* Gym revenue analytics
* Multi-gym SaaS dashboard
* Mobile app

---

## Goal

The goal of this project is to create a **lightweight MVP that solves real gym management problems while remaining scalable for SaaS growth.**

---

## License

MIT License
