# 🚚 LoadGo Arunachal — Full-Stack Logistics Platform (Startup MVP)

> A production-grade, on-demand logistics booking platform built for Arunachal Pradesh — connecting customers with drivers for goods transport, with real-time tracking, dynamic pricing, and full ride lifecycle management.

---

## 📱 What Is LoadGo?

LoadGo Arunachal is a **full-stack logistics startup MVP** built entirely solo by Raja Babu Sahani. It is inspired by the need for organized, tech-driven goods transport in Northeast India — where logistics is largely unorganized.

The platform consists of **4 fully functional apps** in a single monorepo:

| App | Tech | Description |
|-----|------|-------------|
| 🧑 Customer Mobile App | React Native (Expo) | Book rides, track drivers, view history |
| 🚗 Driver Mobile App | React Native (Expo) | Accept jobs, update GPS, manage earnings |
| 🖥️ Admin Web Panel | HTML/CSS/JS | Manage bookings, drivers, pricing |
| ⚙️ Backend API | Node.js + Express | All business logic, auth, matching, pricing |

---

## ✅ Features Built

### Backend (Node.js / Express / MongoDB)
- JWT Auth Middleware
- Firebase OTP Authentication
- Booking Flow APIs (create, update, complete, cancel)
- Driver Matching Algorithm
- Dynamic Pricing Engine
- Google Places & Quote Endpoints
- Razorpay Payments Scaffolding
- Firebase Realtime Database write support
- Admin APIs (approvals, pricing controls, dashboard)
- Cloudinary integration (document/image uploads)

### Customer App
- Firebase OTP Login
- Fare Estimation
- Full Booking Flow
- Real-time Driver GPS Tracking
- Booking History

### Driver App
- OTP Login
- Online / Offline Toggle
- Accept / Reject Ride
- Full Ride Lifecycle (pickup → delivery → complete)
- Live GPS Location Updates
- Earnings Dashboard
- KYC & Profile Setup

### Admin Panel
- Live Dashboard
- Booking Management
- Pricing Controls
- Driver Approval Workflows

---

## 🛠️ Tech Stack

```
Frontend/Mobile  → React Native (Expo), EAS Build
Backend          → Node.js, Express.js
Database         → MongoDB Atlas, Firebase Firestore
Realtime         → Firebase Realtime Database
Auth             → Firebase OTP, JWT
Maps             → Google Maps API, Google Places API
Payments         → Razorpay
Media            → Cloudinary
Deployment       → Render (backend), EAS (Android APKs)
AI Dev Tools     → Claude AI, GitHub Copilot
```

---

## 📁 Monorepo Structure

```
loadgo-arunachal/
├── apps/
│   ├── api/               # Node.js backend
│   ├── customer-mobile/   # Customer React Native app
│   ├── driver-mobile/     # Driver React Native app
│   └── admin-web/         # Admin panel
├── packages/
│   └── shared/            # Shared utilities & types
└── README.md
```

---

## 🚀 Project Status

| Area | Status |
|------|--------|
| Code / Product Build | ✅ 8/10 Complete |
| Live Production Readiness | 🔄 5.5/10 (Integrating credentials) |
| Android APK Builds | 🔄 In Progress |
| End-to-End Testing | 🔜 Pending live services |

**Overall: ~80% complete — moving to pilot launch.**

---

## 🔧 What's Left
- Connect live MongoDB Atlas, Google Maps, Razorpay, Cloudinary
- Deploy backend on Render publicly
- Build production Android APKs via EAS
- Full end-to-end testing on real devices
- Harden admin auth & tighten CORS for production

---

## 👤 Built By

**Raja Babu Sahani**
Full-Stack Developer | B.Tech Electrical Engineering | Smart India Hackathon Finalist

- 📧 rahulsahani0@gmail.com
- 💼 [linkedin.com/in/raja-babu-sahani](https://www.linkedin.com/in/raja-babu-sahani/)

---

## ⚡ Note
This project was built using AI-assisted development tools (Claude AI, GitHub Copilot) to accelerate development — all architecture, logic, and product decisions were made by the developer.

---

> *"Built for Northeast India. Designed to scale."*
