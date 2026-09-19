# Praxis Backend Service

Production-ready backend API service for **Praxis 2026**, powering event registrations, server-authoritative Razorpay payments, database persistence, email confirmations, and webhook handling.

---

## Architecture & Features

- **Runtime & Framework:** Node.js + Express with TypeScript (ES2022 / NodeNext modules)
- **Payment Gateway:** Razorpay Node.js SDK with server-authoritative pricing (client amounts are rejected)
- **HMAC Signature Verification:** Cryptographic SHA-256 validation for both checkout callbacks and webhooks
- **Storage Layer:** Atomic, fail-safe JSON store in `data/praxis_store.json` (also includes `supabase_schema.sql` for PostgreSQL/Supabase production deployment)
- **Idempotency & Fraud Prevention:** Duplicate email checks for registered events, safe fallback order generation for dev/mock environments
- **Email Notifications:** Asynchronous confirmation receipt dispatch

---

## Directory Structure

```
backend/
├── data/
│   └── praxis_store.json       # Persistent JSON store for registrations & payments
├── src/
│   ├── config/
│   │   ├── events.ts           # Central event registry & server-authoritative pricing
│   │   └── razorpay.ts         # Razorpay SDK initialization & cryptographic utils
│   ├── controllers/
│   │   └── payment.controller.ts # Handlers for createOrder, verify, webhook, registration
│   ├── routes/
│   │   └── payment.routes.ts   # Express routes (/create-order, /verify, /webhook, etc.)
│   ├── services/
│   │   ├── db.service.ts       # Database operations with atomic write locks
│   │   └── email.service.ts    # Participant email notification dispatcher
│   ├── types/
│   │   └── payment.types.ts    # TypeScript interface definitions
│   └── server.ts               # Express entry point with CORS, logging & health check
├── supabase_schema.sql         # Production relational SQL schema with RLS policies
├── package.json
├── tsconfig.json
└── .env
```

---

## Getting Started

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

```env
PORT=5000
FRONTEND_URL=http://localhost:3000
RAZORPAY_KEY_ID=rzp_test_YourKeyIdHere
RAZORPAY_KEY_SECRET=YourRazorpayKeySecretHere
RAZORPAY_WEBHOOK_SECRET=YourWebhookSecretHere
NODE_ENV=development
```

### 3. Run Development Server

```bash
npm run dev
```

The backend will start at `http://localhost:5000`.

### 4. Build for Production

```bash
npm run build
npm start
```

---

## API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Health check and uptime status |
| `POST` | `/api/payments/create-order` | Validate participant info & create Razorpay order |
| `POST` | `/api/payments/verify` | Verify payment HMAC SHA-256 signature and confirm |
| `POST` | `/api/payments/webhook` | Asynchronous Razorpay webhook processing |
| `GET` | `/api/payments/registration/:id` | Fetch confirmed registration & payment record |
